// vite.config.mts
import vue from "file:///E:/Projects/MAA/maa-support/node_modules/.pnpm/@vitejs+plugin-vue@5.0.4_vite@5.2.4_vue@3.4.21/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import vueJsx from "file:///E:/Projects/MAA/maa-support/node_modules/.pnpm/@vitejs+plugin-vue-jsx@3.1.0_vite@5.2.4_vue@3.4.21/node_modules/@vitejs/plugin-vue-jsx/dist/index.mjs";
import path from "path";
import { defineConfig } from "file:///E:/Projects/MAA/maa-support/node_modules/.pnpm/vite@5.2.4_@types+node@18.19.14/node_modules/vite/dist/node/index.js";
var __vite_injected_original_dirname = "E:\\Projects\\MAA\\maa-support\\pkgs\\web";
var vite_config_default = defineConfig({
  root: __vite_injected_original_dirname,
  base: "/maa-support",
  server: {
    host: "127.0.0.1",
    port: 9877
  },
  build: {
    outDir: "../../dist",
    emptyOutDir: true,
    sourcemap: true
  },
  resolve: {
    alias: {
      "@": path.join(__vite_injected_original_dirname, "src")
      // 'vue-i18n': 'vue-i18n/dist/vue-i18n.runtime.esm-bundler.js'
    }
  },
  plugins: [
    vue(),
    vueJsx()
    // VueI18nPlugin({
    //   include: [path.resolve(__dirname, './src/i18n/locales/*.json')],
    //   strictMessage: false
    // })
  ]
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcubXRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRTpcXFxcUHJvamVjdHNcXFxcTUFBXFxcXG1hYS1zdXBwb3J0XFxcXHBrZ3NcXFxcd2ViXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJFOlxcXFxQcm9qZWN0c1xcXFxNQUFcXFxcbWFhLXN1cHBvcnRcXFxccGtnc1xcXFx3ZWJcXFxcdml0ZS5jb25maWcubXRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9FOi9Qcm9qZWN0cy9NQUEvbWFhLXN1cHBvcnQvcGtncy93ZWIvdml0ZS5jb25maWcubXRzXCI7Ly8gaW1wb3J0IFZ1ZUkxOG5QbHVnaW4gZnJvbSAnQGludGxpZnkvdW5wbHVnaW4tdnVlLWkxOG4vdml0ZSdcbmltcG9ydCB2dWUgZnJvbSAnQHZpdGVqcy9wbHVnaW4tdnVlJ1xuaW1wb3J0IHZ1ZUpzeCBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUtanN4J1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnXG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWdcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHJvb3Q6IF9fZGlybmFtZSxcbiAgYmFzZTogJy9tYWEtc3VwcG9ydCcsXG4gIHNlcnZlcjoge1xuICAgIGhvc3Q6ICcxMjcuMC4wLjEnLFxuICAgIHBvcnQ6IDk4NzdcbiAgfSxcbiAgYnVpbGQ6IHtcbiAgICBvdXREaXI6ICcuLi8uLi9kaXN0JyxcbiAgICBlbXB0eU91dERpcjogdHJ1ZSxcbiAgICBzb3VyY2VtYXA6IHRydWVcbiAgfSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICAnQCc6IHBhdGguam9pbihfX2Rpcm5hbWUsICdzcmMnKVxuICAgICAgLy8gJ3Z1ZS1pMThuJzogJ3Z1ZS1pMThuL2Rpc3QvdnVlLWkxOG4ucnVudGltZS5lc20tYnVuZGxlci5qcydcbiAgICB9XG4gIH0sXG4gIHBsdWdpbnM6IFtcbiAgICB2dWUoKSxcbiAgICB2dWVKc3goKVxuICAgIC8vIFZ1ZUkxOG5QbHVnaW4oe1xuICAgIC8vICAgaW5jbHVkZTogW3BhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYy9pMThuL2xvY2FsZXMvKi5qc29uJyldLFxuICAgIC8vICAgc3RyaWN0TWVzc2FnZTogZmFsc2VcbiAgICAvLyB9KVxuICBdXG59KVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUNBLE9BQU8sU0FBUztBQUNoQixPQUFPLFlBQVk7QUFDbkIsT0FBTyxVQUFVO0FBQ2pCLFNBQVMsb0JBQW9CO0FBSjdCLElBQU0sbUNBQW1DO0FBT3pDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLE1BQU07QUFBQSxFQUNOLE1BQU07QUFBQSxFQUNOLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxFQUNSO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsSUFDUixhQUFhO0FBQUEsSUFDYixXQUFXO0FBQUEsRUFDYjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLEtBQUssa0NBQVcsS0FBSztBQUFBO0FBQUEsSUFFakM7QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxJQUFJO0FBQUEsSUFDSixPQUFPO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtUO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
