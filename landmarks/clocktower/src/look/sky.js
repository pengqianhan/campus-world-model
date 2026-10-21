// Sky, sun and the light they give: a clear Auckland winter morning (July 2024, about 09:15 NZST),
// the low sun in the north-east, behind the building, so the street front stands in open shade.
import * as THREE from "three";

// The view frame on the compass: x runs at bearing 199° (x = -u, u at 19°), z (toward the street) at 289°.
const X_EN = [-0.32563, -0.94550], Z_EN = [-0.94550, 0.32563];

/** A unit vector in the view frame toward a compass bearing (degrees from north) and elevation. */
export function frameDir(bearing, elevation) {
  const b = THREE.MathUtils.degToRad(bearing), e = THREE.MathUtils.degToRad(elevation);
  const E = Math.sin(b), N = Math.cos(b), c = Math.cos(e);
  return new THREE.Vector3(c * (X_EN[0] * E + X_EN[1] * N), Math.sin(e), c * (Z_EN[0] * E + Z_EN[1] * N)).normalize();
}

/**
 * The sun's place for Auckland (-36.85°, 174.77°) on a July day, from the hour (NZST). Declination
 * +21.4°, solar noon ~12:27 NZST (longitude and equation of time). 09:15 gives bearing ~46°, elevation
 * ~16°, which is where the sun stands in the backlit views (hyoe8..., aOMM...).
 */
export function sunPosition(hour = 9.25) {
  const lat = THREE.MathUtils.degToRad(-36.85), dec = THREE.MathUtils.degToRad(21.4);
  const H = THREE.MathUtils.degToRad((hour - 12.45) * 15);
  const sinE = Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(H);
  const e = Math.asin(sinE);
  let A = Math.acos((Math.sin(dec) - sinE * Math.sin(lat)) / (Math.cos(e) * Math.cos(lat)));
  if (H > 0) A = 2 * Math.PI - A;
  return { bearing: THREE.MathUtils.radToDeg(A), elevation: THREE.MathUtils.radToDeg(e) };
}

const skyGLSL = /* glsl */ `
uniform vec3 zenith; uniform vec3 horizon; uniform vec3 sunDir; uniform vec3 sunColor;
uniform float gain; uniform float envMode; uniform float envSat; uniform vec3 groundColor; uniform vec3 treeColor;
float h1(float n) { return fract(sin(n) * 43758.5453); }
float vnoise(float x) { float i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(h1(i), h1(i + 1.0), f); }
vec3 skyColor(vec3 d) {
  float el = d.y;
  float h = clamp(el, 0.0, 1.0);
  float mu = dot(d, sunDir);
  // blue overhead fading to a pale, slightly hazy band at the horizon
  vec3 c = mix(horizon, zenith, pow(h, 0.55));
  // brighter, whiter sky toward the sun (forward scattering), and the haze round it
  float toward = 0.5 + 0.5 * mu;
  c = mix(c, horizon * 1.25, (1.0 - pow(h, 0.35)) * pow(toward, 2.0) * 0.95);
  // a deeper blue overhead and away from the sun
  c *= mix(1.0, 0.85, h * (1.0 - toward));
  c += sunColor * (0.30 * pow(max(mu, 0.0), 4.0) + 0.7 * pow(max(mu, 0.0), 24.0) + 1.2 * pow(max(mu, 0.0), 300.0));
  if (envMode < 0.5) c += sunColor * 40.0 * smoothstep(0.99996, 0.99999, mu);
  if (el < 0.0) c = groundColor;
  if (envMode > 0.5) {
    // the camera white-balances the open shade: the light on the stone is far less blue than the sky looks
    c = mix(vec3(dot(c, vec3(0.2126, 0.7152, 0.0722))), c, envSat);
    // a ring of trees round the horizon (for the reflections and the light on the stone)
    float az = atan(d.z, d.x);
    float tl = 0.10 + 0.10 * vnoise(az * 9.0) + 0.06 * vnoise(az * 23.0 + 3.0);
    if (el > -0.02 && el < tl) c = treeColor * (0.6 + 0.8 * el / tl) * (0.5 + 2.0 * pow(1.0 - toward, 1.5)); // trees facing the sun are lit
  }
  return c * gain;
}`;

/** The visible sky dome, and an environment for image-based light built from the same sky. */
export function makeSky(renderer, scene, { sunDir, envIntensity = 1, envSat = 0.5, quality = "high" }) {
  const uniforms = () => ({
    zenith: { value: new THREE.Color(0.18, 0.40, 0.86) },
    horizon: { value: new THREE.Color(0.84, 0.84, 0.86) },
    sunDir: { value: sunDir.clone() },
    sunColor: { value: new THREE.Color(1.0, 0.93, 0.82) },
    gain: { value: 1 },
    envMode: { value: 0 },
    envSat: { value: 0.5 },
    groundColor: { value: new THREE.Color(0.075, 0.075, 0.07) },
    treeColor: { value: new THREE.Color(0.06, 0.08, 0.045) },
  });
  const mat = (u) => new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, uniforms: u,
    vertexShader: "varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }",
    fragmentShader: skyGLSL + "\nvarying vec3 vDir; void main(){ gl_FragColor = vec4(skyColor(normalize(vDir)), 1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}",
  });
  const skyU = uniforms();
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1000, 48, 24), mat(skyU));
  sky.frustumCulled = false; sky.renderOrder = -1; sky.name = "sky";
  sky.onBeforeRender = (r, s, camera) => sky.position.copy(camera.position);
  scene.add(sky);

  const envU = uniforms(); envU.envMode.value = 1; envU.envSat.value = envSat; envU.gain.value = 1;
  const envScene = new THREE.Scene();
  envScene.add(new THREE.Mesh(new THREE.SphereGeometry(50, 64, 32), mat(envU)));
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(envScene, 0.0, 0.1, 100, { size: quality === "low" ? 128 : 256 }).texture;
  scene.environment = env;
  scene.environmentIntensity = envIntensity;
  pmrem.dispose();
  return { sky, env, skyUniforms: skyU };
}
