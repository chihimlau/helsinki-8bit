import {
  AmbientLight,
  Color,
  DirectionalLight,
  Mesh,
  MeshLambertMaterial,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  WebGLRenderer,
} from 'three';
import { attachMapControls } from './controls';
import { createDebugPanel } from './debugPanel';
import { buildingExtrude, mergeGeometries, polyGeometry, roadGeometry } from './geometry';
import type { LoadedArea } from './types';

export function createApp(opts: {
  container: HTMLElement;
  hud: HTMLElement;
  debugEl: HTMLElement;
  area: LoadedArea;
  debug: boolean;
}) {
  const scene = new Scene();
  scene.background = new Color(0x87a0b0);

  const renderer = new WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(opts.container.clientWidth, opts.container.clientHeight);
  opts.container.appendChild(renderer.domElement);

  let frustum = 420;
  const aspect = opts.container.clientWidth / Math.max(opts.container.clientHeight, 1);
  const camera = new OrthographicCamera(
    (-frustum * aspect) / 2,
    (frustum * aspect) / 2,
    frustum / 2,
    -frustum / 2,
    1,
    5000,
  );

  scene.add(new AmbientLight(0xffffff, 0.55));
  const sun = new DirectionalLight(0xfff2dd, 0.85);
  sun.position.set(80, 120, 40);
  scene.add(sun);

  const b = opts.area.manifest.bounds;
  const groundW = Math.max(200, b.maxX - b.minX + 80);
  const groundD = Math.max(200, b.maxZ - b.minZ + 80);
  const ground = new Mesh(
    new PlaneGeometry(groundW, groundD),
    new MeshLambertMaterial({ color: 0x6f8f6a }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set((b.minX + b.maxX) / 2, 0, (b.minZ + b.maxZ) / 2);
  scene.add(ground);

  const parkMat = new MeshLambertMaterial({ color: 0x4f7a45 });
  const waterMat = new MeshLambertMaterial({ color: 0x3d6f9c });
  const roadMat = new MeshLambertMaterial({ color: 0x5a5a5a });
  const buildingMat = new MeshLambertMaterial({ color: 0xd8d2c4 });

  const parkGeos = opts.area.parks.map((p) => polyGeometry(p, 0.04));
  if (parkGeos.length) scene.add(new Mesh(mergeGeometries(parkGeos), parkMat));

  const waterGeos = opts.area.water.map((w) => polyGeometry(w, 0.02));
  if (waterGeos.length) scene.add(new Mesh(mergeGeometries(waterGeos), waterMat));

  const roadGeos = opts.area.roads
    .map((r) => roadGeometry(r))
    .filter((g): g is NonNullable<typeof g> => !!g);
  if (roadGeos.length) scene.add(new Mesh(mergeGeometries(roadGeos), roadMat));

  // Merge buildings in batches to keep draw calls low
  const batch = 80;
  for (let i = 0; i < opts.area.buildings.length; i += batch) {
    const slice = opts.area.buildings.slice(i, i + batch);
    const geos = slice.map(buildingExtrude);
    scene.add(new Mesh(mergeGeometries(geos), buildingMat));
  }

  opts.hud.textContent = opts.area.manifest.attribution.join(' · ');

  let needsRender = true;
  const requestRender = () => {
    needsRender = true;
  };

  const controls = attachMapControls(renderer.domElement, camera, {
    getFrustum: () => frustum,
    setFrustum: (f) => {
      frustum = f;
    },
    onChange: requestRender,
  });

  const debug = createDebugPanel(opts.debugEl, opts.area, opts.debug);
  const cams = [
    { label: 'Square', x: 0, z: 0, zoom: 280 },
    { label: 'Cathedral', x: -20, z: -40, zoom: 220 },
    { label: 'Harbour', x: 40, z: 180, zoom: 380 },
  ];
  debug.mountCameras(
    cams.map((c) => ({
      label: c.label,
      onClick: () => {
        controls.setTarget(c.x, c.z);
        controls.setZoom(c.zoom);
      },
    })),
  );

  const onResize = () => {
    const w = opts.container.clientWidth;
    const h = opts.container.clientHeight;
    renderer.setSize(w, h);
    const a = w / Math.max(h, 1);
    camera.left = (-frustum * a) / 2;
    camera.right = (frustum * a) / 2;
    camera.top = frustum / 2;
    camera.bottom = -frustum / 2;
    camera.updateProjectionMatrix();
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
    renderer.render(scene, camera);
    debug.setDrawCalls(renderer.info.render.calls);
  };
  tick();
  // Initial camera apply
  controls.setTarget(0, 0);
  controls.setZoom(320);

  return {
    dispose: () => {
      controls.dispose();
      window.removeEventListener('resize', onResize);
      renderer.dispose();
    },
  };
}
