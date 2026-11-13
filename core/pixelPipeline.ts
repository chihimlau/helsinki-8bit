import {
  Color,
  Mesh,
  NearestFilter,
  OrthographicCamera,
  PlaneGeometry,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  UnsignedByteType,
  WebGLRenderTarget,
  WebGLRenderer,
  type Texture,
} from 'three';
import type { PaletteColors } from './palette';

const upscaleVert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const upscaleFrag = /* glsl */ `
uniform sampler2D tDiffuse;
uniform vec2 uTexel;
uniform vec3 uOutline;
varying vec2 vUv;
void main() {
  vec4 c = texture2D(tDiffuse, vUv);
  float l = dot(c.rgb, vec3(0.299, 0.587, 0.114));
  float lR = dot(texture2D(tDiffuse, vUv + vec2(uTexel.x, 0.0)).rgb, vec3(0.299, 0.587, 0.114));
  float lU = dot(texture2D(tDiffuse, vUv + vec2(0.0, uTexel.y)).rgb, vec3(0.299, 0.587, 0.114));
  float edge = step(0.1, abs(l - lR)) + step(0.1, abs(l - lU));
  vec3 col = mix(c.rgb, uOutline, clamp(edge, 0.0, 1.0) * 0.75);
  col = floor(col * 10.0 + 0.5) / 10.0;
  gl_FragColor = vec4(col, 1.0);
}
`;

export type PixelPipeline = {
  target: WebGLRenderTarget;
  width: number;
  height: number;
  setOutline: (hex: number) => void;
  render: (renderer: WebGLRenderer, worldScene: Scene, worldCamera: OrthographicCamera) => void;
  dispose: () => void;
};

export function createPixelPipeline(
  width: number,
  height: number,
  palette: PaletteColors,
): PixelPipeline {
  const target = new WebGLRenderTarget(width, height, {
    minFilter: NearestFilter,
    magFilter: NearestFilter,
    format: RGBAFormat,
    type: UnsignedByteType,
    depthBuffer: true,
    stencilBuffer: false,
  });
  target.texture.generateMipmaps = false;

  const outline = new Color(palette.outline);
  const mat = new ShaderMaterial({
    uniforms: {
      tDiffuse: { value: target.texture as Texture },
      uTexel: { value: { x: 1 / width, y: 1 / height } },
      uOutline: { value: outline },
    },
    vertexShader: upscaleVert,
    fragmentShader: upscaleFrag,
    depthTest: false,
    depthWrite: false,
  });
  const setOutline = (hex: number) => {
    outline.set(hex);
  };

  const quadScene = new Scene();
  const quadCam = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new Mesh(new PlaneGeometry(2, 2), mat);
  quadScene.add(quad);

  return {
    target,
    width,
    height,
    setOutline,
    render: (renderer, worldScene, worldCamera) => {
      renderer.setRenderTarget(target);
      renderer.clear();
      renderer.render(worldScene, worldCamera);
      renderer.setRenderTarget(null);
      renderer.render(quadScene, quadCam);
    },
    dispose: () => {
      target.dispose();
      mat.dispose();
      quad.geometry.dispose();
    },
  };
}
