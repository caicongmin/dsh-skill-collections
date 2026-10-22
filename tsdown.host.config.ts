import { defineConfig } from 'tsdown'

// Loader hot reload refreshes the entry URL, not every transitive ESM import.
// Keep plugin-local Host logic in that one generation; shared dependencies stay external.
export default defineConfig({
  entry: { index: 'src/index.ts' },
  outDir: 'lib',
  format: 'esm',
  platform: 'node',
  dts: false,
  sourcemap: true,
  clean: false,
  external: ['yaml'],
  outputOptions: { entryFileNames: 'index.js', codeSplitting: false },
})
