import {
  AmbientLight,
  Color,
  DirectionalLight,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  WebGLRenderer,
} from 'three';
import { createChunkManager } from './chunkManager';
import { attachMapControls } from './controls';
import { createDebugPanel } from './debugPanel';
import { createLambert, createBuildingMaterial, applyPaletteToBuildingMaterial } from './materials';
import { PALETTES, resolvePreset, type PresetName } from './palette';
import { createPixelPipeline } from './pixelPipeline';
import type { AreaManifest } from './types';

export type CreateAppOptions = {
  container: HTMLElement;
  hud: HTMLElement;
  debugEl: HTMLElement;
  manifest: AreaManifest;
  dataBaseUrl: string;
  initialBytes: number;
  debug: boolean;
  preset?: PresetName;
  internalWidth?: number;
  internalHeight?: number;
};

export function createApp(opts: CreateAppOptions) {
  let preset: PresetName = opts.preset ?? 'day';
  let palette = PALETTES[preset];

  const internalW = opts.internalWidth ?? 480;
  const internalH = opts.internalHeight ?? 270;
  const rtAspect = internalW / internalH;

  const scene = new Scene();
  scene.background = new Color(palette.sky);

  const renderer = new WebGLRenderer({
    antialias: false,
    powerPreference: 'high-performance',
    alpha: false,
  });
  renderer.setPixelRatio(1);
  renderer.setSize(opts.container.clientWidth, opts.container.clientHeight, false);
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.style.imageRendering = 'pixelated';
  renderer.domElement.style.touchAction = 'none';
  opts.container.appendChild(renderer.domElement);

  let frustum = 320;
  const camera = new OrthographicCamera(
    (-frustum * rtAspect) / 2,
    (frustum * rtAspect) / 2,
    frustum / 2,
    -frustum / 2,
    1,
    5000,
  );

  const ambient = new AmbientLight(palette.ambient, palette.ambientIntensity);
  scene.add(ambient);
  const sun = new DirectionalLight(palette.sun, palette.sunIntensity);
  sun.position.set(80, 120, 40);
  scene.add(sun);

  const b = opts.manifest.bounds;
  const groundW = Math.max(200, b.maxX - b.minX + 80);
  const groundD = Math.max(200, b.maxZ - b.minZ + 80);
  const groundMat = createLambert(palette.ground);
  const ground = new Mesh(new PlaneGeometry(groundW, groundD), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set((b.minX + b.maxX) / 2, 0, (b.minZ + b.maxZ) / 2);
  scene.add(ground);

  const parkMat = createLambert(palette.park);
  const waterMat = createLambert(palette.water);
  const roadMat = createLambert(palette.road);
  const buildingMat = createBuildingMaterial(palette);

  const pixel = createPixelPipeline(internalW, internalH, palette);

  opts.hud.innerHTML = `${opts.manifest.attribution.join(' · ')} · <span id="preset-label">${preset}</span>`;

  let needsRender = true;
  const requestRender = () => {
    needsRender = true;
  };

  const debug = createDebugPanel(opts.debugEl, opts.manifest, opts.debug);
  debug.setLoad(opts.initialBytes, 0, opts.manifest.chunks.length);

  const chunks = createChunkManager({
    scene,
    manifest: opts.manifest,
    dataBaseUrl: opts.dataBaseUrl,
    materials: {
      building: buildingMat,
      park: parkMat,
      water: waterMat,
      road: roadMat,
    },
    initialBytes: opts.initialBytes,
    onChange: () => {
      debug.setLoad(
        chunks.getBytesLoaded(),
        chunks.getLoadedChunkCount(),
        opts.manifest.chunks.length,
      );
      requestRender();
    },
  });

  let syncChunks = () => undefined;
  const controls = attachMapControls(renderer.domElement, camera, {
    getFrustum: () => frustum,
    setFrustum: (f) => {
      frustum = f;
    },
    getAspect: () => rtAspect,
    onChange: () => {
      syncChunks();
      requestRender();
    },
  });

  syncChunks = () => {
    const t = controls.getTarget();
    const viewRadius = frustum * 0.9;
    chunks.sync(t.x, t.z, viewRadius);
  };

  const applyPreset = (next: PresetName) => {
    preset = next;
    palette = PALETTES[preset];
    scene.background = new Color(palette.sky);
    groundMat.color.set(palette.ground);
    parkMat.color.set(palette.park);
    waterMat.color.set(palette.water);
    roadMat.color.set(palette.road);
    ambient.color.set(palette.ambient);
    ambient.intensity = palette.ambientIntensity;
    sun.color.set(palette.sun);
    sun.intensity = palette.sunIntensity;
    applyPaletteToBuildingMaterial(buildingMat, palette);
    pixel.setOutline(palette.outline);
    const label = document.getElementById('preset-label');
    if (label) label.textContent = preset;
    const url = new URL(location.href);
    if (preset === 'day') url.searchParams.delete('preset');
    else url.searchParams.set('preset', preset);
    history.replaceState(null, '', url.toString());
    requestRender();
  };

  const cams = [
    { label: 'Square', x: 0, z: 0, zoom: 280 },
    { label: 'Cathedral', x: -15, z: -55, zoom: 200 },
    { label: 'Harbour', x: 30, z: 220, zoom: 420 },
  ];
  debug.mountCameras([
    ...cams.map((c) => ({
      label: c.label,
      onClick: () => {
        controls.setTarget(c.x, c.z);
        controls.setZoom(c.zoom);
        syncChunks();
      },
    })),
    { label: 'Day', onClick: () => applyPreset('day') },
    { label: 'Dusk', onClick: () => applyPreset('dusk') },
  ]);

  const toggle = document.createElement('button');
  toggle.textContent = 'day / dusk';
  toggle.style.cssText =
    'position:fixed;right:10px;bottom:10px;z-index:4;font:12px ui-monospace,Consolas,monospace;padding:6px 10px;background:#243038;color:#e8eef2;border:1px solid #4a5a64;border-radius:4px;cursor:pointer;';
  toggle.addEventListener('click', () => applyPreset(preset === 'day' ? 'dusk' : 'day'));
  document.body.appendChild(toggle);

  const onResize = () => {
    renderer.setSize(opts.container.clientWidth, opts.container.clientHeight, false);
    requestRender();
  };
  window.addEventListener('resize', onResize);

  let renderedFrames = 0;
  let lastFps = performance.now();
  const tick = () => {
    requestAnimationFrame(tick);
    const now = performance.now();
    if (now - lastFps >= 500) {
      debug.setFps((renderedFrames * 1000) / (now - lastFps));
      renderedFrames = 0;
      lastFps = now;
    }
    if (!needsRender) return;
    needsRender = false;
    renderedFrames += 1;
    pixel.render(renderer, scene, camera);
    debug.setDrawCalls(renderer.info.render.calls);
  };
  tick();

  controls.setTarget(0, 0);
  controls.setZoom(320);
  syncChunks();
  applyPreset(preset);

  return {
    dispose: () => {
      controls.dispose();
      chunks.dispose();
      window.removeEventListener('resize', onResize);
      toggle.remove();
      pixel.dispose();
      renderer.dispose();
    },
    setPreset: applyPreset,
  };
}

export { resolvePreset };
