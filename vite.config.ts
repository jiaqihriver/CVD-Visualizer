import { defineConfig, type PluginOption } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig(({ mode }) => {
  const single = mode === 'single';
  const plugins: PluginOption[] = [];

  if (single) {
    plugins.push(viteSingleFile({ removeViteModuleLoader: true }));
  }

  return {
    base: './',
    plugins,
    server: {
      port: 5173,
      host: true,
    },
    build: {
      target: 'es2022',
      outDir: single ? 'dist-single' : 'dist',
      assetsInlineLimit: single ? 100_000_000 : 4096,
      cssCodeSplit: !single,
      chunkSizeWarningLimit: 2000,
    },
  };
});
