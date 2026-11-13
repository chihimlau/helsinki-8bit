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
import { attachMapControls } from './controls';
import { createDebugPanel } from './debugPanel';
import { buildingExtrude, mergeGeometries, polyGeometry, roadGeometry } from './geometry';
import {
  applyPaletteToBuildingMaterial,
  createBuildingMaterial,
  createLambert,
} from './materials';
import { PALETTES, resolvePreset, type PresetName } from './palette';
import { createPixelPipeline } from './pixelPipeline';
import type { LoadedArea } from './types';

export type CreateAppOptions = {
  container: HTMLElement;
  hud: HTMLElement;
  debugEl: HTMLElement;
  area: LoadedArea;
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

  const b = opts.area.manifest.bounds;
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

  const parkGeos = opts.area.parks.map((p) => polyGeometry(p, 0.04));
  if (parkGeos.length) scene.add(new Mesh(mergeGeometries(parkGeos), parkMat));

  const waterGeos = opts.area.water.map((w) => polyGeometry(w, 0.02));
  if (waterGeos.length) scene.add(new Mesh(mergeGeometries(waterGeos), waterMat));

  const roadGeos = opts.area.roads
    .map((r) => roadGeometry(r))
    .filter((g): g is NonNullable<typeof g> => !!g);
  if (roadGeos.length) scene.add(new Mesh(mergeGeometries(roadGeos), roadMat));

  const batch = 80;
  for (let i = 0; i < opts.area.buildings.length; i += batch) {
    const slice = opts.area.buildings.slice(i, i + batch);
    scene.add(new Mesh(mergeGeometries(slice.map(buildingExtrude)), buildingMat));
  }

  const pixel = createPixelPipeline(internalW, internalH, palette);

  opts.hud.innerHTML = `${opts.area.manifest.attribution.join(' · ')} · <span id="preset-label">${preset}</span>`;

  let needsRender = true;
  const requestRender = () => {
    needsRender = true;
  };

  const controls = attachMapControls(renderer.domElement, camera, {
    getFrustum: () => frustum,
    setFrustum: (f) => {
      frustum = f;
    },
    getAspect: () => rtAspect,
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

  const debug = createDebugPanel(opts.debugEl, opts.area, opts.debug);
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
      },
    })),
    {
      label: 'Day',
      onClick: () => applyPreset('day'),
    },
    {
      label: 'Dusk',
      onClick: () => applyPreset('dusk'),
    },
  ]);

  // Always-visible preset toggle (even without debug)
  const toggle = document.createElement('button');
  toggle.textContent = 'day / dusk';
  toggle.style.cssText =
    'position:fixed;right:10px;bottom:10px;z-index:4;font:12px ui-monospace,Consolas,monospace;padding:6px 10px;background:#243038;color:#e8eef2;border:1px solid #4a5a64;border-radius:4px;cursor:pointer;';
  toggle.addEventListener('click', () => applyPreset(preset === 'day' ? 'dusk' : 'day'));
  document.body.appendChild(toggle);

  const onResize = () => {
    const w = opts.container.clientWidth;
    const h = opts.container.clientHeight;
    renderer.setSize(w, h, false);
    requestRender();
  };
  window.addEventListener('resize', onResize);

  let frames = 0;
  let lastFps = performance.now();
  const tick = () => {
    requestAnimationFrame(tick);
    frames += 1;
    const now = performance.now();
    if (now - lastFps >= 500) {
      debug.setFps((frames * 1000) / (now - lastFps));
      frames = 0;
      lastFps = now;
    }
    if (!needsRender) return;
    needsRender = false;
    pixel.render(renderer, scene, camera);
    debug.setDrawCalls(renderer.info.render.calls);
  };
  tick();

  controls.setTarget(0, 0);
  controls.setZoom(320);
  applyPreset(preset);

  return {
    dispose: () => {
      controls.dispose();
      window.removeEventListener('resize', onResize);
      toggle.remove();
      pixel.dispose();
      renderer.dispose();
    },
    setPreset: applyPreset,
  };
}

export { resolvePreset };
