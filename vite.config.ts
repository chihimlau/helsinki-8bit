import { defineConfig, type Plugin } from 'vite';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

function copyAreaData(destRoot: string) {
  const areasRoot = join(process.cwd(), 'areas');
  if (!existsSync(areasRoot)) return;
  for (const name of readdirSync(areasRoot)) {
    const areaDir = join(areasRoot, name);
    if (!statSync(areaDir).isDirectory()) continue;
    const destArea = join(destRoot, 'areas', name);
    mkdirSync(destArea, { recursive: true });
    for (const file of ['area.config.json', 'landmarks.json']) {
      const src = join(areaDir, file);
      if (existsSync(src)) cpSync(src, join(destArea, file));
    }
    const dataDir = join(areaDir, 'data');
    if (existsSync(dataDir) && statSync(dataDir).isDirectory()) {
      cpSync(dataDir, join(destArea, 'data'), { recursive: true });
    }
  }
}

function areaDataPlugin(): Plugin {
  return {
    name: 'area-data-static',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0] ?? '';
        if (!url.startsWith('/areas/') || url.includes('..')) return next();
        const file = join(process.cwd(), url);
        if (existsSync(file) && statSync(file).isFile()) {
          if (file.endsWith('.json')) res.setHeader('Content-Type', 'application/json; charset=utf-8');
          if (file.endsWith('.gz')) {
            res.setHeader('Content-Type', 'application/gzip');
            // Do NOT set Content-Encoding: browser fetch + DecompressionStream handles body
          }
          res.end(readFileSync(file));
          return;
        }
        next();
      });
    },
    closeBundle() {
      copyAreaData(join(process.cwd(), 'dist'));
    },
  };
}

export default defineConfig({
  root: '.',
  publicDir: 'public',
  plugins: [areaDataPlugin()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    fs: { allow: ['.'] },
  },
});
