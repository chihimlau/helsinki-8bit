import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshLambertMaterial,
  SphereGeometry,
  type Material,
  type Object3D,
} from 'three';
import { createIsoCuboidMaterial, createIsoPlazaMaterial } from './isoMaterials';
import type { LandmarkWorld } from './types';

function lambert(color: number) {
  return new MeshLambertMaterial({ color, flatShading: true });
}

function box(w: number, h: number, d: number, material: Material, x: number, y: number, z: number) {
  const m = new Mesh(new BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  return m;
}

/** Slynyrd-style tree: stacked cones then slight sculpt (highlight shell). */
function pineTree(x: number, z: number, scale = 1) {
  const g = new Group();
  g.position.set(x, 0, z);
  g.scale.setScalar(scale);
  const trunk = lambert(0x5a3a22);
  const dark = lambert(0x2a5a38);
  const mid = lambert(0x3d7a48);
  const lit = lambert(0x5a9a58);
  g.add(box(1.8, 6, 1.8, trunk, 0, 3, 0));
  const layers: Array<[number, number, number, MeshLambertMaterial]> = [
    [9, 8, 5, dark],
    [7, 7, 10, mid],
    [5, 6, 15, lit],
  ];
  for (const [r, h, y, mat] of layers) {
    const cone = new Mesh(new ConeGeometry(r, h, 7), mat);
    cone.position.y = y;
    g.add(cone);
  }
  return g;
}

/**
 * Helsinki Cathedral — hero silhouette for M6-look 2A.
 * Stairs face +Z (toward Senate Square). Cuboid top/side shading + green domes.
 */
function buildCathedral() {
  const g = new Group();
  const wall = createIsoCuboidMaterial({
    top: 0xf7f2e8,
    sideLit: 0xefe6d6,
    sideShade: 0xc8bba8,
    dither: 0.06,
  });
  const trim = createIsoCuboidMaterial({
    top: 0xe8e0d0,
    sideLit: 0xdcd2c0,
    sideShade: 0xa89880,
    dither: 0.05,
  });
  const dome = createIsoCuboidMaterial({
    top: 0x3db870,
    sideLit: 0x2f9a58,
    sideShade: 0x1a6a3c,
    dither: 0.1,
  });
  const domeBright = createIsoCuboidMaterial({
    top: 0x55d088,
    sideLit: 0x3db870,
    sideShade: 0x227848,
    dither: 0.08,
  });

  // Terrace platform (raised stone)
  g.add(box(58, 5, 54, trim, 0, 2.5, 4));
  // Cobble rim blocks
  for (let i = -4; i <= 4; i++) {
    g.add(box(5, 2.2, 5, trim, i * 6.5, 5.2, -24));
    g.add(box(5, 2.2, 5, trim, i * 6.5, 5.2, 30));
  }

  // Grand stairs toward square (+Z)
  for (let i = 0; i < 10; i++) {
    g.add(box(40 - i * 1.4, 1.15, 3.4, trim, 0, 0.6 + i * 1.1, 30 + i * 2.9));
  }

  // Cruciform white body
  g.add(box(36, 24, 36, wall, 0, 5 + 12, 0));
  g.add(box(56, 20, 20, wall, 0, 5 + 10, 0));
  g.add(box(20, 20, 56, wall, 0, 5 + 10, 0));

  // South portico + columns
  g.add(box(30, 16, 7, wall, 0, 5 + 12, 24));
  for (const x of [-12, -6, 0, 6, 12]) {
    g.add(box(2.4, 14, 2.4, trim, x, 5 + 11, 27));
  }
  g.add(box(32, 3.5, 8, wall, 0, 5 + 20, 24));
  // Pediment hint
  g.add(box(28, 4, 4, trim, 0, 5 + 24, 26));

  // Central tower
  g.add(box(18, 24, 18, wall, 0, 5 + 24 + 12, 0));
  const drum = new Mesh(new CylinderGeometry(10, 11, 9, 12), wall);
  drum.position.set(0, 5 + 50, 0);
  g.add(drum);
  const mainDome = new Mesh(new SphereGeometry(12, 14, 12), dome);
  mainDome.position.set(0, 5 + 58, 0);
  g.add(mainDome);
  // Copper banding cue
  g.add(box(14, 2, 14, domeBright, 0, 5 + 52, 0));
  g.add(box(3.5, 12, 3.5, wall, 0, 5 + 70, 0));
  const tip = new Mesh(new SphereGeometry(2.6, 10, 8), domeBright);
  tip.position.set(0, 5 + 78, 0);
  g.add(tip);
  g.add(box(1.5, 10, 1.5, trim, 0, 5 + 85, 0));

  // Four corner green domes (Tuomiokirkko cue)
  for (const [cx, cz] of [
    [-20, -20],
    [20, -20],
    [-20, 20],
    [20, 20],
  ] as const) {
    g.add(box(14, 18, 14, wall, cx, 5 + 9, cz));
    const d = new Mesh(new SphereGeometry(6.5, 12, 10), dome);
    d.position.set(cx, 5 + 22, cz);
    g.add(d);
  }

  const shadow = lambert(0x1a1a14);
  shadow.transparent = true;
  shadow.opacity = 0.4;
  const sh = new Mesh(new CylinderGeometry(42, 48, 0.45, 18), shadow);
  sh.position.set(0, 0.2, 8);
  g.add(sh);

  return g;
}

/** Senate Square — cobbled plaza + statue + edge pines (2A hero ground). */
function buildSenateSquare() {
  const g = new Group();
  const plaza = createIsoPlazaMaterial({
    a: 0xc4bdb0,
    b: 0xa8a090,
    shade: 0x6e685c,
  });
  const curb = createIsoCuboidMaterial({
    top: 0xb0a898,
    sideLit: 0x9a9284,
    sideShade: 0x5c564c,
    dither: 0.07,
  });
  const plinth = createIsoCuboidMaterial({
    top: 0xd0c8b8,
    sideLit: 0xb8b0a0,
    sideShade: 0x7a7264,
    dither: 0.05,
  });

  // Main plaza plate
  g.add(box(110, 0.8, 110, plaza, 0, 0.4, 0));
  // Raised cobble strips (tile rhythm)
  for (let i = -5; i <= 5; i++) {
    g.add(box(8, 1.2, 8, curb, i * 10, 1.0, -48));
    g.add(box(8, 1.2, 8, curb, i * 10, 1.0, 48));
    g.add(box(8, 1.2, 8, curb, -48, 1.0, i * 10));
    g.add(box(8, 1.2, 8, curb, 48, 1.0, i * 10));
  }
  // Inner ring of tiles
  for (let i = -3; i <= 3; i++) {
    if (i === 0) continue;
    g.add(box(6, 0.9, 6, curb, i * 12, 0.85, i * 12));
    g.add(box(6, 0.9, 6, curb, i * 12, 0.85, -i * 12));
  }

  // Alexander II statue plinth + figure
  g.add(box(14, 3, 14, plinth, 0, 1.8, 0));
  g.add(box(10, 8, 10, plinth, 0, 7, 0));
  g.add(box(4, 14, 4, plinth, 0, 16, 0));
  const figure = new Mesh(new ConeGeometry(3.2, 8, 6), plinth);
  figure.position.set(0, 26, 0);
  g.add(figure);

  // Edge trees (Slynyrd stacked cones)
  const treeSpots: Array<[number, number, number]> = [
    [-46, -46, 1.1],
    [46, -46, 1.0],
    [-46, 46, 1.15],
    [46, 46, 1.05],
    [-46, 0, 1.2],
    [46, 0, 1.1],
    [0, -46, 0.95],
    [-30, -46, 0.9],
    [30, -46, 1.0],
  ];
  for (const [x, z, s] of treeSpots) {
    g.add(pineTree(x, z, s));
  }

  return g;
}

function buildPalace(wall: MeshLambertMaterial, roof: MeshLambertMaterial, accent: MeshLambertMaterial) {
  const g = new Group();
  g.add(box(56, 26, 22, wall, 0, 13, 0));
  g.add(box(58, 4, 24, roof, 0, 28, 0));
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

function buildSquareSimple(plaza: MeshLambertMaterial, stone: MeshLambertMaterial) {
  const g = new Group();
  g.add(box(70, 0.6, 70, plaza, 0, 0.35, 0));
  g.add(box(8, 6, 8, stone, 0, 3.5, 0));
  return g;
}

function buildStation(wall: MeshLambertMaterial, roof: MeshLambertMaterial, accent: MeshLambertMaterial) {
  const g = new Group();
  g.add(box(70, 28, 30, wall, 0, 14, 0));
  g.add(box(74, 5, 34, roof, 0, 30, 0));
  g.add(box(12, 40, 12, wall, -28, 20, 10));
  g.add(box(12, 40, 12, wall, 28, 20, 10));
  g.add(box(8, 8, 8, accent, -28, 42, 10));
  g.add(box(8, 8, 8, accent, 28, 42, 10));
  return g;
}

/** Extra landmark silhouettes. 2A focuses detail on Cathedral + Senate Square. */
export function addSpecialLandmarks(scene: Object3D, landmarks: LandmarkWorld[]): Group {
  const root = new Group();
  root.name = 'special-landmarks';

  const wallWarm = lambert(0xe4d8c4);
  const domeFlat = lambert(0x1f9a55);
  const roof = lambert(0x6a4e3a);
  const accent = lambert(0xd9d0c0);
  const plazaFlat = lambert(0xb9b3a6);
  const stoneFlat = lambert(0x9a958a);

  for (const lm of landmarks) {
    if (!lm.special) continue;
    const g = new Group();
    g.position.set(lm.x, 0, lm.z);
    g.name = lm.id;

    if (lm.special === 'cathedral') {
      const cat = buildCathedral();
      cat.scale.set(1.45, 1.55, 1.45);
      g.add(cat);
    } else if (lm.special === 'palace') {
      g.add(buildPalace(wallWarm, roof, accent));
    } else if (lm.special === 'university') {
      g.add(buildUniversity(wallWarm, roof, accent));
    } else if (lm.special === 'library') {
      g.add(buildLibrary(wallWarm, roof, domeFlat));
    } else if (lm.special === 'square') {
      // Hero treatment only for Senate Square; other squares stay simple until 2B
      if (lm.id === 'hel-senate-square') g.add(buildSenateSquare());
      else g.add(buildSquareSimple(plazaFlat, stoneFlat));
    } else if (lm.special === 'station') {
      g.add(buildStation(wallWarm, roof, accent));
    }

    root.add(g);
  }

  scene.add(root);
  return root;
}
