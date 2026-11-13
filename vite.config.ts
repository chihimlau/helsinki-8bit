import { defineConfig, type Plugin } from 'vite';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

function copyAreaData(destRoot: string) {
  const areasRoot = join(process.cwd(), 'areas');
  if (!existsSync(areasRoot)) return;
  for (const name of readdirSync(areasRoot)) {
    const dataDir = join(areasRoot, name, 'data');
    if (!existsSync(dataDir) || !statSync(dataDir).isDirectory()) continue;
    const dest = join(destRoot, 'areas', name, 'data');
    mkdirSync(dest, { recursive: true });
    cpSync(dataDir, dest, { recursive: true });
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
          if (file.endsWith('.json')) res.setHeader('Content-Type', 'application/json');
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
