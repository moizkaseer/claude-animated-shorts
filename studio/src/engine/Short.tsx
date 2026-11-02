// Turns a ShortDef into a Remotion component: one three.js World per crossfade layer, posed per frame, then the post
// chain InkPass (world ink lines, own pass) -> lens blur pre + main (thin-lens DOF per shot from dofAt) -> bloom
// (emissive only) -> NEUTRAL tone mapping -> colour grade, MSAA 4.
// Ink runs before the DOF so lines blur with what they belong to; bloom after the DOF so glows defocus with their
// source; the grade is display-referred, so it comes after tone mapping. Every pixel-sized parameter is specified at
// 1080x1920 and scaled with the output size, so stills at --scale 0.5 and the 1440x2560 final match.
// Place changes crossfade by stacking a second canvas for the fade frames; the hook can end on a 4-frame white flash.
import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { AbsoluteFill, continueRender, delayRender, getInputProps, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { World } from "./world";
import { loadKit } from "./kit";
import { InkPass, noInkFallback } from "./ink";
import { LensBlur, GrainEffect } from "./lensblur";
import { GradeEffect, GRADES, gradeFor } from "./grade";
import { Kit } from "./build";
import { ShortDef, layersAt } from "./short";
import { Captions } from "./Captions";

/** A/B switches for test stills only (Remotion inputProps `{ post: { ink: false, ... } }`); everything is on by default. */
type PostToggles = { ink: boolean; lens: boolean; pre: boolean; bloom: boolean; grade: boolean; grain: boolean };
const toggles = (): PostToggles => ({ ink: true, lens: true, pre: true, bloom: true, grade: true, grain: false, ...((getInputProps() as { post?: Partial<PostToggles> }).post ?? {}) });

/** Bloom for emissive sources only (depth.md 6.4). Its MIP chain always starts at 540x960 (half of 1080x1920),
 *  whatever the output size, so the glow keeps the same size relative to the frame (e-fold ~30 px at 1080p,
 *  ~1.5 % of the frame height) at 540, 1080 and 1440 widths. ADD blend: HDR-safe (SCREEN darkens values > 1). */
const makeBloom = () => {
  const b = new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.5, luminanceThreshold: 1.0, luminanceSmoothing: 0.2, mipmapBlur: true, levels: 6, radius: 0.6 });
  const mip = b.mipmapBlurPass;
  const setSize = mip.setSize.bind(mip);
  mip.setSize = (w: number, h: number) => setSize(Math.round((1920 * w) / Math.max(h, 1)), 1920);
  return b;
};

const fwd = new THREE.Vector3(), fpt = new THREE.Vector3();

const useKit = (def: ShortDef) => {
  const [kit, setKit] = useState<Kit | null>(null);
  const [handle] = useState(() => delayRender(`${def.id} kit`));
  useEffect(() => { loadKit(def.kit).then((k) => { setKit(k); continueRender(handle); }); }, [handle, def]);
  return kit;
};

const Inner: React.FC<{ def: ShortDef; id: number; kit: Kit }> = ({ def, id, kit }) => {
  const f = useCurrentFrame();
  const { camera, scene } = useThree();
  const world = useMemo(() => new World(def, kit), [def, kit]);
  const on = useMemo(toggles, []);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera),
    lens: new LensBlur({ maxCoC: 24, nearScale: 1.2 }),
    bloom: makeBloom(),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.day, 1),
    grain: new GrainEffect({ amount: 0.025, cellPx: 1.5 }), // film grain, OFF by default (inputProps post.grain): the reference measures no grain and it quadruples the file size
  }), [camera, scene]);
  useEffect(() => () => fx.ink.dispose(), [fx]);
  const post = useMemo(() => {
    // only the enabled effects, in chain order (a null child breaks EffectComposer's typing)
    const chain: [boolean, THREE.Object3D | object, string][] = [
      [on.ink, fx.ink, "ink"], [on.lens && on.pre, fx.lens.pre, "pre"], [on.lens, fx.lens.main, "lens"], [on.bloom, fx.bloom, "bloom"],
      [true, fx.tone, "tone"], [on.grade, fx.grade, "grade"], [on.grain, fx.grain, "grain"],
    ];
    return (
      <EffectComposer multisampling={4}>
        {chain.filter((c) => c[0]).map(([, o, k]) => <primitive key={k} object={o} dispose={null} />)}
      </EffectComposer>
    );
  }, [fx, on]);
  const cam = camera as THREE.PerspectiveCamera;
  const target = world.update(id, f, cam, scene);
  noInkFallback(world.root);
  // thin-lens focus: distance along the view axis to the shot's focus point (default: the camera's look target)
  const d = def.dofAt(f);
  cam.getWorldDirection(fwd);
  if (d.focus) fpt.set(...d.focus(f)); else fpt.copy(target);
  fx.lens.focus = Math.max(0.3, fpt.sub(cam.position).dot(fwd));
  fx.lens.cInf = d.cInf;
  gradeFor(fx.grade, def.shots[id - 1].light);
  fx.grain.seed = f; // deterministic per frame
  return (
    <>
      <primitive object={world.root} dispose={null} />
      {post}
    </>
  );
};

/** test stills only: inputProps `{ post: { dpr: 0.5 } }` forces the WebGL buffer size (R3F clamps dpr to >= 1 by default) */
const dprOverride = () => (getInputProps() as { post?: { dpr?: number } }).post?.dpr;
const ShotView: React.FC<{ def: ShortDef; id: number; kit: Kit; alpha: number }> = ({ def, id, kit, alpha }) => (
  <AbsoluteFill style={{ opacity: alpha }}>
    <ThreeCanvas width={1080} height={1920} {...(dprOverride() ? { dpr: dprOverride() } : {})} shadows gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }}
      camera={{ fov: 40, near: 0.2, far: 1500 }}>
      <Inner def={def} id={id} kit={kit} />
    </ThreeCanvas>
  </AbsoluteFill>
);

/** the Remotion component of a short (create once per ShortDef, at module level) */
export const makeShort = (def: ShortDef): React.FC => {
  const C: React.FC = () => {
    const f = useCurrentFrame();
    const kit = useKit(def);
    if (!kit) return null;
    const flash = def.flashAt !== undefined && f >= def.flashAt && f < def.flashAt + 4 ? [1, 0.75, 0.45, 0.2][f - def.flashAt] : 0;
    return (
      <AbsoluteFill style={{ background: def.background ?? "#cfe3f2" }}>
        {layersAt(def, f).map((l, i) => <ShotView key={i ? "over" : "base"} def={def} id={l.id} kit={kit} alpha={l.alpha} />)}
        {flash > 0 && <AbsoluteFill style={{ background: "#ffffff", opacity: flash }} />}
        {def.captions && <Captions words={def.captions.words} style={def.captions.style} />}
      </AbsoluteFill>
    );
  };
  C.displayName = def.id;
  return C;
};
