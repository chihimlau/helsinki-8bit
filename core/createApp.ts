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
import { createHighlight } from './highlight';
import { createLandmarksUi } from './landmarksUi';
import {
  applyPaletteToBuildingMaterial,
  createBuildingMaterial,
  createLambert,
} from './materials';
import { PALETTES, resolvePreset, type PresetName } from './palette';
import { pickBuilding } from './picking';
import { createPixelPipeline } from './pixelPipeline';
import { addSpecialLandmarks } from './specialBuildings';
import type { AreaManifest, LandmarkWorld } from './types';

export type CreateAppOptions = {
  container: HTMLElement;
  hud: HTMLElement;
  debugEl: HTMLElement;
  manifest: AreaManifest;
  dataBaseUrl: string;
  initialBytes: number;
  landmarks: LandmarkWorld[];
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

  // Only skip footprints that we replace with special landmark meshes
  const skipBuildingIds = new Set(
    opts.landmarks
      .filter((l) => l.special && l.buildingId)
      .map((l) => l.buildingId as string),
  );
  const specialRoot = addSpecialLandmarks(scene, opts.landmarks);

  opts.hud.innerHTML = `${opts.manifest.attribution.join(' · ')} · <span id="preset-label">${preset}</span>`;

  let needsRender = true;
  const requestRender = () => {
    needsRender = true;
  };

  const debug = createDebugPanel(opts.debugEl, opts.manifest, opts.debug);
  debug.setLoad(opts.initialBytes, 0, opts.manifest.chunks.length);

  const highlight = createHighlight(scene, requestRender);

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
    skipBuildingIds,
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
  let landmarksUi: ReturnType<typeof createLandmarksUi> | null = null;

  const controls = attachMapControls(renderer.domElement, camera, {
    getFrustum: () => frustum,
    setFrustum: (f) => {
      frustum = f;
    },
    getAspect: () => rtAspect,
    onChange: () => {
      syncChunks();
      landmarksUi?.update();
      requestRender();
    },
    onTap: (x, y) => {
      const hit = pickBuilding(x, y, renderer.domElement, camera, chunks.getBuildings());
      if (hit) {
        highlight.set(hit);
        const lm = opts.landmarks.find(
          (l) => l.buildingId === hit.id || (l.ratu != null && l.ratu === hit.ratu),
        );
        if (lm) landmarksUi?.showCard(lm.id);
      } else {
        highlight.clear();
      }
      requestRender();
    },
  });

  syncChunks = () => {
    const t = controls.getTarget();
    chunks.sync(t.x, t.z, frustum * 0.9);
  };

  landmarksUi = createLandmarksUi({
    landmarks: opts.landmarks,
    camera,
    canvas: renderer.domElement,
    onJump: (lm) => {
      controls.setTarget(lm.x, lm.z);
      controls.setZoom(Math.min(frustum, 220));
      syncChunks();
      const bld = chunks
        .getBuildings()
        .find((b) => b.id === lm.buildingId || (lm.ratu != null && b.ratu === lm.ratu));
      if (bld) highlight.set(bld);
      else highlight.clear();
      requestRender();
    },
    onChange: requestRender,
  });

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
    { label: 'Cathedral', x: -16, z: -56, zoom: 200 },
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
    landmarksUi.update();
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
    landmarksUi.update();
    debug.setDrawCalls(renderer.info.render.calls);
  };
  tick();

  controls.setTarget(0, 0);
  controls.setZoom(320);
  syncChunks();
  applyPreset(preset);
  landmarksUi.update();

  return {
    dispose: () => {
      controls.dispose();
      chunks.dispose();
      highlight.dispose();
      landmarksUi?.dispose();
      specialRoot.removeFromParent();
      window.removeEventListener('resize', onResize);
      toggle.remove();
      pixel.dispose();
      renderer.dispose();
    },
    setPreset: applyPreset,
  };
}

export { resolvePreset };
