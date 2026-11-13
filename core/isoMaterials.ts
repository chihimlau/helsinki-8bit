import { Color, ShaderMaterial, Vector3 } from 'three';
import { HELSINKI_PIXEL_STYLE } from './helsinkiPixelStyle';

const sun = HELSINKI_PIXEL_STYLE.lighting.sunDir;

/** Discrete top / lit / shade cuboid shading (no smooth PBR gradients). */
export function createIsoCuboidMaterial(opts: {
  top: number;
  sideLit: number;
  sideShade: number;
  dither?: number;
}): ShaderMaterial {
  const dither = opts.dither ?? 0.012;
  return new ShaderMaterial({
    uniforms: {
      uTop: { value: new Color(opts.top) },
      uSideLit: { value: new Color(opts.sideLit) },
      uSideShade: { value: new Color(opts.sideShade) },
      uSunDir: { value: new Vector3(sun.x, sun.y, sun.z).normalize() },
      uDither: { value: dither },
    },
    vertexShader: /* glsl */ `
varying vec3 vWorldPos;
varying vec3 vNormalW;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`,
    fragmentShader: /* glsl */ `
uniform vec3 uTop;
uniform vec3 uSideLit;
uniform vec3 uSideShade;
uniform vec3 uSunDir;
uniform float uDither;
varying vec3 vWorldPos;
varying vec3 vNormalW;
void main() {
  vec3 n = normalize(vNormalW);
  vec3 base;
  if (n.y > 0.55) {
    base = uTop;
  } else {
    float lit = step(0.42, max(dot(n, normalize(uSunDir)), 0.0));
    base = mix(uSideShade, uSideLit, lit);
  }
  float d = step(0.5, fract(vWorldPos.x * 0.4 + vWorldPos.z * 0.4 + vWorldPos.y * 0.25));
  base = mix(base, base * (1.0 - uDither), d);
  base = floor(base * 9.0 + 0.5) / 9.0;
  gl_FragColor = vec4(base, 1.0);
}
`,
  });
}

/** Plaza paving — large warm-grey tiles, low contrast (must not steal focus). */
export function createIsoPlazaMaterial(): ShaderMaterial {
  const p = HELSINKI_PIXEL_STYLE.palette;
  return new ShaderMaterial({
    uniforms: {
      uA: { value: new Color(p.plazaA) },
      uB: { value: new Color(p.plazaB) },
      uHi: { value: new Color(p.plazaHighlight) },
      uSh: { value: new Color(p.plazaShade) },
      uSunDir: { value: new Vector3(sun.x, sun.y, sun.z).normalize() },
    },
    vertexShader: /* glsl */ `
varying vec3 vWorldPos;
varying vec3 vNormalW;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`,
    fragmentShader: /* glsl */ `
uniform vec3 uA;
uniform vec3 uB;
uniform vec3 uHi;
uniform vec3 uSh;
uniform vec3 uSunDir;
varying vec3 vWorldPos;
varying vec3 vNormalW;
void main() {
  vec3 n = normalize(vNormalW);
  float scale = 0.14;
  float gx = floor(vWorldPos.x * scale);
  float gz = floor(vWorldPos.z * scale);
  float checker = mod(gx + gz, 2.0);
  vec3 top = mix(uA, uB, checker * 0.65);
  float r = fract(sin(gx * 12.9898 + gz * 78.233) * 43758.5453);
  if (r > 0.96) top = uHi;
  float fx = fract(vWorldPos.x * scale);
  float fz = fract(vWorldPos.z * scale);
  float grout = step(fx, 0.035) + step(fz, 0.035);
  top = mix(top, uSh, clamp(grout, 0.0, 1.0) * 0.22);
  float lit = step(0.4, max(dot(n, normalize(uSunDir)), 0.0));
  vec3 col = n.y > 0.5 ? top : mix(uSh, top, 0.45 + lit * 0.3);
  col = floor(col * 9.0 + 0.5) / 9.0;
  gl_FragColor = vec4(col, 1.0);
}
`,
  });
}
