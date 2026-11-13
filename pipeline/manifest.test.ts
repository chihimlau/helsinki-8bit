import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

describe('landmarks', () => {
  it('ids are unique and have no area name', () => {
    const path = join('areas', 'helsinki-kruununhaka', 'landmarks.json');
    const data = JSON.parse(readFileSync(path, 'utf8')) as {
      landmarks: Array<{ id: string }>;
    };
    const ids = data.landmarks.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id.startsWith('hel-')).toBe(true);
      expect(id.includes('kruununhaka')).toBe(false);
    }
  });
});

describe('manifest (when present)', () => {
  it('has schemaVersion and buildings have height', () => {
    const path = join('areas', 'helsinki-kruununhaka', 'data', 'manifest.json');
    if (!existsSync(path)) {
      expect(existsSync(path)).toBe(false);
      return;
    }
    const manifest = JSON.parse(readFileSync(path, 'utf8')) as {
      schemaVersion: number;
      chunks: Array<{ file: string }>;
    };
    expect(manifest.schemaVersion).toBeGreaterThanOrEqual(1);
    for (const c of manifest.chunks) {
      const chunk = JSON.parse(
        readFileSync(join('areas', 'helsinki-kruununhaka', 'data', c.file), 'utf8'),
      ) as { buildings: Array<{ height: number }> };
      for (const b of chunk.buildings) {
        expect(b.height).toBeGreaterThan(0);
      }
    }
  });
});
