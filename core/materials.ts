import {
  Color,
  MeshLambertMaterial,
  ShaderMaterial,
  Vector3,
} from 'three';
import type { PaletteColors } from './palette';

const buildingVert = /* glsl */ `
varying vec3 vWorldPos;
varying vec3 vNormalW;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const buildingFrag = /* glsl */ `
uniform vec3 uWall;
uniform vec3 uRoof;
uniform vec3 uWindowLit;
uniform vec3 uWindowDark;
uniform vec3 uSunDir;
uniform float uSunIntensity;
uniform float uAmbientIntensity;
uniform vec3 uAmbient;
varying vec3 vWorldPos;
varying vec3 vNormalW;
void main() {
  vec3 n = normalize(vNormalW);
  float up = abs(n.y);
  bool isRoof = up > 0.65;
  bool isWall = up < 0.55;

  float wx = fract(vWorldPos.x * 0.35);
  float wy = fract(vWorldPos.y * 0.32);
  float wz = fract(vWorldPos.z * 0.35);
  float cell = (abs(n.x) > abs(n.z)) ? wz : wx;
  float windowMask = step(0.22, cell) * step(cell, 0.78) * step(0.28, wy) * step(wy, 0.82);
  // skip ground-floor strip a bit
  windowMask *= step(1.2, vWorldPos.y);

  vec3 baseCol = isRoof ? uRoof : uWall;
  vec3 winCol = mix(uWindowDark, uWindowLit, 0.85);
  vec3 col = mix(baseCol, winCol, float(isWall) * windowMask);

  float ndl = max(dot(n, normalize(uSunDir)), 0.0);
  vec3 lit = col * (uAmbient * uAmbientIntensity + vec3(1.0) * (uSunIntensity * ndl));
  // cheap self-shadow on northish faces
  lit *= mix(0.75, 1.0, ndl);
  gl_FragColor = vec4(lit, 1.0);
}
`;

export function createBuildingMaterial(p: PaletteColors): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      uWall: { value: new Color(p.building) },
      uRoof: { value: new Color(p.roof) },
      uWindowLit: { value: new Color(p.windowLit) },
      uWindowDark: { value: new Color(p.windowDark) },
      uSunDir: { value: new Vector3(0.4, 0.85, 0.25).normalize() },
      uSunIntensity: { value: p.sunIntensity },
      uAmbientIntensity: { value: p.ambientIntensity },
      uAmbient: { value: new Color(p.ambient) },
    },
    vertexShader: buildingVert,
    fragmentShader: buildingFrag,
  });
}

export function applyPaletteToBuildingMaterial(mat: ShaderMaterial, p: PaletteColors) {
  (mat.uniforms.uWall.value as Color).set(p.building);
  (mat.uniforms.uRoof.value as Color).set(p.roof);
  (mat.uniforms.uWindowLit.value as Color).set(p.windowLit);
  (mat.uniforms.uWindowDark.value as Color).set(p.windowDark);
  (mat.uniforms.uAmbient.value as Color).set(p.ambient);
  mat.uniforms.uSunIntensity.value = p.sunIntensity;
  mat.uniforms.uAmbientIntensity.value = p.ambientIntensity;
}

export function createLambert(color: number): MeshLambertMaterial {
  return new MeshLambertMaterial({ color });
}
