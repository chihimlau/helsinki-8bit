import { Color, ShaderMaterial, Vector3 } from 'three';

/**
 * Slynyrd-style cuboid shading: distinct top / lit side / shade side + fine dither.
 * Used for landmark hero meshes (Cathedral, Senate Square) in M6-look 2A.
 */
export function createIsoCuboidMaterial(opts: {
  top: number;
  sideLit: number;
  sideShade: number;
  dither?: number;
}): ShaderMaterial {
  const dither = opts.dither ?? 0.08;
  return new ShaderMaterial({
    uniforms: {
      uTop: { value: new Color(opts.top) },
      uSideLit: { value: new Color(opts.sideLit) },
      uSideShade: { value: new Color(opts.sideShade) },
      uSunDir: { value: new Vector3(0.55, 0.72, 0.4).normalize() },
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
  float up = n.y;
  vec3 base;
  if (up > 0.55) {
    base = uTop;
  } else {
    float lit = max(dot(n, normalize(uSunDir)), 0.0);
    base = mix(uSideShade, uSideLit, lit);
  }
  // Checker dither (tile-art feel at low RT)
  float d = step(0.5, fract(vWorldPos.x * 0.55 + vWorldPos.z * 0.55 + vWorldPos.y * 0.35));
  base = mix(base, base * (1.0 - uDither), d);
  // Soft quantize
  base = floor(base * 12.0 + 0.5) / 12.0;
  gl_FragColor = vec4(base, 1.0);
}
`,
  });
}

/** Ground / plaza plate with stone dither like Slynyrd dirt-cobble tops. */
export function createIsoPlazaMaterial(opts: {
  a: number;
  b: number;
  shade: number;
}): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      uA: { value: new Color(opts.a) },
      uB: { value: new Color(opts.b) },
      uShade: { value: new Color(opts.shade) },
      uSunDir: { value: new Vector3(0.55, 0.72, 0.4).normalize() },
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
uniform vec3 uShade;
uniform vec3 uSunDir;
varying vec3 vWorldPos;
varying vec3 vNormalW;
void main() {
  vec3 n = normalize(vNormalW);
  float cell = step(0.5, fract(vWorldPos.x * 0.22)) * step(0.5, fract(vWorldPos.z * 0.22));
  float fine = step(0.5, fract(vWorldPos.x * 0.9 + vWorldPos.z * 0.9));
  vec3 top = mix(uA, uB, cell * 0.65 + fine * 0.35);
  float lit = max(dot(n, normalize(uSunDir)), 0.0);
  vec3 col = n.y > 0.5 ? top : mix(uShade, top, lit * 0.5);
  col = floor(col * 12.0 + 0.5) / 12.0;
  gl_FragColor = vec4(col, 1.0);
}
`,
  });
}
