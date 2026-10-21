// Post effects by quality: high = MSAA + ground-truth ambient occlusion (GTAO) for the deep reveals and
// joints; medium = MSAA only; low = straight to the screen. Tone mapping is done in the OutputPass.
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

export function makePost(renderer, scene, camera, quality, ao = {}) {
  if (quality === "low") {
    return { render: () => renderer.render(scene, camera), setSize: (w, h) => renderer.setSize(w, h) };
  }
  const size = renderer.getSize(new THREE.Vector2());
  const target = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  let gtao = null;
  if (quality === "high") {
    gtao = new GTAOPass(scene, camera, size.x, size.y);
    gtao.updateGtaoMaterial({ radius: ao.radius ?? 0.6, distanceExponent: 1.5, thickness: ao.thickness ?? 1.0, scale: 1.0, samples: 16, distanceFallOff: 1.0 });
    gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16 });
    gtao.blendIntensity = ao.intensity ?? 1.0;
    composer.addPass(gtao);
  }
  composer.addPass(new OutputPass());
  return {
    composer, gtao,
    render: () => composer.render(),
    setSize: (w, h) => { renderer.setSize(w, h); composer.setSize(w, h); },
  };
}
