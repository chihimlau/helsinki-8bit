import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshLambertMaterial,
  SphereGeometry,
  type Object3D,
} from 'three';
import type { LandmarkWorld } from './types';

function mat(color: number, opts?: { flat?: boolean }) {
  return new MeshLambertMaterial({ color, flatShading: opts?.flat ?? true });
}

function box(
  w: number,
  h: number,
  d: number,
  material: MeshLambertMaterial,
  x: number,
  y: number,
  z: number,
) {
  const m = new Mesh(new BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  return m;
}

/** Iconic Helsinki Cathedral (Tuomiokirkko) — stairs face +Z (toward Senate Square). */
function buildCathedral(wall: MeshLambertMaterial, dome: MeshLambertMaterial, accent: MeshLambertMaterial) {
  const g = new Group();

  // Raised terrace
  g.add(box(52, 4, 48, accent, 0, 2, 2));
  // Grand stairs toward square (+Z)
  for (let i = 0; i < 8; i++) {
    const t = i / 8;
    g.add(box(36 - i * 1.2, 1.1, 3.2, accent, 0, 0.55 + i * 1.05, 28 + i * 2.8));
  }

  // Cruciform body
  g.add(box(34, 22, 34, wall, 0, 4 + 11, 0));
  g.add(box(52, 18, 18, wall, 0, 4 + 9, 0));
  g.add(box(18, 18, 52, wall, 0, 4 + 9, 0));

  // Portico / columns facing square
  g.add(box(28, 14, 6, wall, 0, 4 + 11, 22));
  for (const x of [-10, -5, 0, 5, 10]) {
    g.add(box(2.2, 12, 2.2, accent, x, 4 + 10, 24));
  }
  g.add(box(30, 3, 7, wall, 0, 4 + 18, 22));

  // Central tower drum + green dome + lantern
  g.add(box(16, 20, 16, wall, 0, 4 + 22 + 10, 0));
  const drum = new Mesh(new CylinderGeometry(9, 10, 8, 12), wall);
  drum.position.set(0, 4 + 42, 0);
  g.add(drum);
  const mainDome = new Mesh(new SphereGeometry(11, 12, 10), dome);
  mainDome.position.set(0, 4 + 50, 0);
  g.add(mainDome);
  g.add(box(3, 10, 3, wall, 0, 4 + 60, 0));
  const tip = new Mesh(new SphereGeometry(2.2, 8, 6), dome);
  tip.position.set(0, 4 + 66, 0);
  g.add(tip);
  g.add(box(1.4, 9, 1.4, accent, 0, 4 + 72, 0));

  // Four corner chapels + small green domes (classic Tuomiokirkko cue)
  for (const [cx, cz] of [
    [-18, -18],
    [18, -18],
    [-18, 18],
    [18, 18],
  ] as const) {
    g.add(box(12, 16, 12, wall, cx, 4 + 8, cz));
    const d = new Mesh(new SphereGeometry(5.5, 10, 8), dome);
    d.position.set(cx, 4 + 20, cz);
    g.add(d);
  }

  // Soft ground shadow blob
  const shadow = mat(0x1a1a14);
  shadow.transparent = true;
  shadow.opacity = 0.35;
  const sh = new Mesh(new CylinderGeometry(38, 42, 0.4, 16), shadow);
  sh.position.set(0, 0.15, 6);
  g.add(sh);

  return g;
}

function buildPalace(wall: MeshLambertMaterial, roof: MeshLambertMaterial, accent: MeshLambertMaterial) {
  const g = new Group();
  g.add(box(56, 26, 22, wall, 0, 13, 0));
  g.add(box(58, 4, 24, roof, 0, 28, 0));
  // Cornice rhythm
  for (let i = -4; i <= 4; i++) {
    g.add(box(4, 10, 3, accent, i * 6, 18, 12));
  }
  g.add(box(20, 8, 8, wall, 0, 34, 0));
  return g;
}

function buildUniversity(wall: MeshLambertMaterial, roof: MeshLambertMaterial, accent: MeshLambertMaterial) {
  const g = new Group();
  g.add(box(64, 24, 22, wall, 0, 12, 0));
  g.add(box(66, 3, 24, roof, 0, 25.5, 0));
  // Colonnade facing square-ish (+Z)
  g.add(box(58, 10, 5, accent, 0, 16, 12));
  for (let i = -5; i <= 5; i++) {
    g.add(box(2, 14, 2, accent, i * 5, 11, 13));
  }
  g.add(box(24, 14, 14, wall, 0, 31, 0));
  return g;
}

function buildLibrary(wall: MeshLambertMaterial, roof: MeshLambertMaterial, dome: MeshLambertMaterial) {
  const g = new Group();
  g.add(box(36, 18, 28, wall, 0, 9, 0));
  const rotunda = new Mesh(new CylinderGeometry(16, 16, 20, 14), wall);
  rotunda.position.set(0, 18, 0);
  g.add(rotunda);
  const lid = new Mesh(new SphereGeometry(15, 12, 10), dome);
  lid.scale.set(1, 0.55, 1);
  lid.position.set(0, 30, 0);
  g.add(lid);
  g.add(box(38, 2.5, 30, roof, 0, 19, 0));
  return g;
}

function buildSquare(plaza: MeshLambertMaterial, stone: MeshLambertMaterial) {
  const g = new Group();
  // Open plaza plate — reads as Senate Square void
  g.add(box(90, 0.6, 90, plaza, 0, 0.35, 0));
  // Alexander statue plinth (center cue)
  g.add(box(8, 6, 8, stone, 0, 3.5, 0));
  g.add(box(3, 10, 3, stone, 0, 11, 0));
  const figure = new Mesh(new ConeGeometry(2.5, 6, 6), stone);
  figure.position.set(0, 18, 0);
  g.add(figure);
  // Edge trees (simple cones)
  const foliage = mat(0x3f7a38);
  const trunk = mat(0x5a3a22);
  for (const [x, z] of [
    [-40, -40],
    [40, -40],
    [-40, 40],
    [40, 40],
    [-40, 0],
    [40, 0],
  ] as const) {
    g.add(box(1.6, 5, 1.6, trunk, x, 2.5, z));
    const leaf = new Mesh(new ConeGeometry(5, 10, 6), foliage);
    leaf.position.set(x, 10, z);
    g.add(leaf);
  }
  return g;
}

function buildStation(wall: MeshLambertMaterial, roof: MeshLambertMaterial, accent: MeshLambertMaterial) {
  const g = new Group();
  g.add(box(70, 28, 30, wall, 0, 14, 0));
  g.add(box(74, 5, 34, roof, 0, 30, 0));
  // Twin stone giants cue as towers
  g.add(box(12, 40, 12, wall, -28, 20, 10));
  g.add(box(12, 40, 12, wall, 28, 20, 10));
  g.add(box(8, 8, 8, accent, -28, 42, 10));
  g.add(box(8, 8, 8, accent, 28, 42, 10));
  return g;
}

/** Extra landmark silhouettes (no CityGML LoD2). Placed at landmark world xz. */
export function addSpecialLandmarks(scene: Object3D, landmarks: LandmarkWorld[]): Group {
  const root = new Group();
  root.name = 'special-landmarks';

  const wall = mat(0xf2eee4);
  const wallWarm = mat(0xe4d8c4);
  const dome = mat(0x1f9a55);
  const roof = mat(0x6a4e3a);
  const accent = mat(0xd9d0c0);
  const plaza = mat(0xb9b3a6);
  const stone = mat(0x9a958a);

  for (const lm of landmarks) {
    if (!lm.special) continue;
    const g = new Group();
    g.position.set(lm.x, 0, lm.z);
    g.name = lm.id;

    if (lm.special === 'cathedral') {
      const cat = buildCathedral(wall, dome, accent);
      cat.scale.set(1.35, 1.45, 1.35);
      g.add(cat);
    } else if (lm.special === 'palace') {
      g.add(buildPalace(wallWarm, roof, accent));
    } else if (lm.special === 'university') {
      g.add(buildUniversity(wallWarm, roof, accent));
    } else if (lm.special === 'library') {
      g.add(buildLibrary(wallWarm, roof, dome));
    } else if (lm.special === 'square') {
      g.add(buildSquare(plaza, stone));
    } else if (lm.special === 'station') {
      g.add(buildStation(wallWarm, roof, accent));
    }

    root.add(g);
  }

  scene.add(root);
  return root;
}
