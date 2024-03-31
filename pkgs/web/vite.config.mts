// import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import path from 'path'
import { defineConfig } from 'vite'
import { transform } from 'esbuild'

// https://vitejs.dev/config
export default defineConfig({
  root: __dirname,
  base: '/maa-support',
  server: {
    host: '127.0.0.1',
    port: 9877
  },
  build: {
    outDir: '../../dist',
    emptyOutDir: true,
    sourcemap: true
  },
  resolve: {
    alias: {
      '@': path.join(__dirname, 'src')
      // 'vue-i18n': 'vue-i18n/dist/vue-i18n.runtime.esm-bundler.js'
    }
  },
  plugins: [
    vue(),
    vueJsx(),
    // VueI18nPlugin({
    //   include: [path.resolve(__dirname, './src/i18n/locales/*.json')],
    //   strictMessage: false
    // })
    {
      name: 'fix-explicit-resource-management',

      async transform(code, id, options) {
        if (id.endsWith('.ts') || id.endsWith('.vue')) {
          const result = await transform(code, {
            sourcefile: id,
            target: 'es2022',
            sourcemap: true
          })
          return {
            code: result.code,
            map: result.map
          }
        }
        return code
      }
    }
  ],
  esbuild: {
    target: 'es2022'
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2022'
    }
  }
})
