import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import svgr from 'vite-plugin-svgr'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import path from 'node:path'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

const scssAliases: Record<string, string> = {
  '@styles/': path.resolve(__dirname, 'src/styles/'),
}

const shoelaceAssetsDir = path.resolve(
  __dirname,
  '../node_modules/@shoelace-style/shoelace/dist/assets',
)

function shoelaceAssets(): Plugin {
  return {
    name: 'shoelace-assets',
    configureServer(server) {
      server.middlewares.use('/shoelace/assets', (req, res, next) => {
        const rel = decodeURIComponent((req.url ?? '/').split('?')[0])
        const filePath = path.join(shoelaceAssetsDir, rel)
        if (!filePath.startsWith(shoelaceAssetsDir)) return next()
        fs.stat(filePath, (err, stat) => {
          if (err || !stat.isFile()) return next()
          if (filePath.endsWith('.svg')) res.setHeader('content-type', 'image/svg+xml')
          fs.createReadStream(filePath).pipe(res)
        })
      })
    },
    async writeBundle(opts) {
      const dst = path.resolve(opts.dir ?? 'dist', 'shoelace/assets')
      await fsp.cp(shoelaceAssetsDir, dst, { recursive: true })
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    svgr({
      include: '**/*.svg',
      svgrOptions: {
        exportType: 'named',
        namedExport: 'ReactComponent',
      },
    }),
    nodePolyfills({
      include: ['buffer', 'process', 'events', 'stream', 'util'],
      globals: { Buffer: true, global: true, process: true },
    }),
    shoelaceAssets(),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        importers: [
          {
            findFileUrl(url: string) {
              for (const [prefix, target] of Object.entries(scssAliases)) {
                if (url.startsWith(prefix)) {
                  return pathToFileURL(path.join(target, url.slice(prefix.length)))
                }
              }
              return null
            },
          },
        ],
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
    },
  },
  build: {
    outDir: 'dist',
    minify: false,
  },
})
