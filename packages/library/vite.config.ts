import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({ tsconfigPath: './tsconfig.json' }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ChartLib',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      // Keep sibling packages external — they're published as separate npm
      // packages under the same scope. Consumer's bundler handles the import.
      external: ['@tradecanvas/commons', '@tradecanvas/core'],
    },
    sourcemap: true,
    target: 'es2022',
  },
});
