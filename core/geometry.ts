import {
  BufferGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Shape,
  Vector2,
} from 'three';
import type { WorldBuilding, WorldLine, WorldPoly } from './types';

export function buildingExtrude(b: WorldBuilding): ExtrudeGeometry {
  const shape = new Shape(b.footprint.map(([x, z]) => new Vector2(x, z)));
  for (const hole of b.holes ?? []) {
    shape.holes.push(new Shape(hole.map(([x, z]) => new Vector2(x, z))));
  }
  const geo = new ExtrudeGeometry(shape, {
    depth: Math.max(b.height, 1),
    bevelEnabled: false,
  });
  // Extrude in +Z of shape space; rotate so Y is up and footprint is XZ
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, b.groundZ, 0);
  return geo;
}

export function mergeGeometries(geos: BufferGeometry[]): BufferGeometry {
  let vertexCount = 0;
  let indexCount = 0;
  for (const g of geos) {
    const pos = g.getAttribute('position');
    vertexCount += pos.count;
    indexCount += g.index ? g.index.count : pos.count;
  }
  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);
  const indices: number[] = [];
  let vOffset = 0;
  let pWrite = 0;
  let nWrite = 0;
  for (const g of geos) {
    g.computeVertexNormals();
    const pos = g.getAttribute('position');
    const nor = g.getAttribute('normal');
    for (let i = 0; i < pos.count; i++) {
      positions[pWrite++] = pos.getX(i);
      positions[pWrite++] = pos.getY(i);
      positions[pWrite++] = pos.getZ(i);
      normals[nWrite++] = nor ? nor.getX(i) : 0;
      normals[nWrite++] = nor ? nor.getY(i) : 1;
      normals[nWrite++] = nor ? nor.getZ(i) : 0;
    }
    if (g.index) {
      for (let i = 0; i < g.index.count; i++) indices.push(g.index.getX(i) + vOffset);
    } else {
      for (let i = 0; i < pos.count; i++) indices.push(vOffset + i);
    }
    vOffset += pos.count;
    g.dispose();
  }
  const out = new BufferGeometry();
  out.setAttribute('position', new Float32BufferAttribute(positions, 3));
  out.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  out.setIndex(indices);
  return out;
}

/** Flat polygon on ground (XZ). */
export function polyGeometry(poly: WorldPoly, y = 0.05): BufferGeometry {
  const shape = new Shape(poly.ring.map(([x, z]) => new Vector2(x, z)));
  const geo = new ExtrudeGeometry(shape, { depth: 0.2, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, y, 0);
  return geo;
}

/** Simple ribbon for roads. */
export function roadGeometry(road: WorldLine, y = 0.08): BufferGeometry | null {
  if (road.points.length < 2) return null;
  const half = road.width / 2;
  const left: [number, number][] = [];
  const right: [number, number][] = [];
  for (let i = 0; i < road.points.length; i++) {
    const [x, z] = road.points[i];
    const prev = road.points[Math.max(0, i - 1)];
    const next = road.points[Math.min(road.points.length - 1, i + 1)];
    let dx = next[0] - prev[0];
    let dz = next[1] - prev[1];
    const len = Math.hypot(dx, dz) || 1;
    dx /= len;
    dz /= len;
    const px = -dz;
    const pz = dx;
    left.push([x + px * half, z + pz * half]);
    right.push([x - px * half, z - pz * half]);
  }
  const ring = [...left, ...right.reverse()];
  return polyGeometry({ id: road.id, ring }, y);
}
