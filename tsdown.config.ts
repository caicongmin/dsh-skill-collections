import { readFile } from 'node:fs/promises'
import { basename, dirname } from 'node:path'
import { defineConfig, type UserConfig } from 'tsdown'
import { transform } from 'lightningcss'

// The private Git package keeps its installed identity. The npm distribution
// builds the same client with its public name into an isolated staging folder.
const PLUGIN_ID = process.env.DSH_SKILL_PACKAGE_NAME || '@dsh-external/dsh-skill-collections'
const CSS_VIRTUAL_PREFIX = '\0dsh-css:'
const CSS_VIRTUAL_SUFFIX = '.mjs'
const CLIENT_EXTERNALS = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-ui-settings',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-ui-slots',
]

const clientBundle: UserConfig = {
  entry: { client: 'src/client/index.ts' },
  outDir: process.env.DSH_SKILL_CLIENT_OUT_DIR || 'lib',
  format: 'cjs',
  platform: 'browser',
  dts: false,
  sourcemap: true,
  clean: false,
  external: CLIENT_EXTERNALS,
  define: { 'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production') },
  noExternal: (id: string) => CLIENT_EXTERNALS.includes(id) ? undefined : true,
  plugins: [{
    name: 'dsh-css-modules-inline',
    resolveId(source: string, importer: string | undefined) {
      if (!source.endsWith('.module.css')) return null
      const absolute = importer === undefined ? source : `${dirname(importer)}/${source}`
      return `${CSS_VIRTUAL_PREFIX}${absolute}${CSS_VIRTUAL_SUFFIX}`
    },
    async load(virtualId: string) {
      if (!virtualId.startsWith(CSS_VIRTUAL_PREFIX)) return null
      const fileId = virtualId.slice(CSS_VIRTUAL_PREFIX.length, -CSS_VIRTUAL_SUFFIX.length)
      this.addWatchFile(fileId)
      const source = await readFile(fileId)
      const output = transform({ filename: fileId, code: source, cssModules: { pattern: '[hash]_[local]' }, minify: true })
      const classMap: Record<string, string> = {}
      for (const [local, value] of Object.entries(output.exports ?? {})) classMap[local] = value.name
      const tagId = `${PLUGIN_ID}/${basename(fileId)}`
      return [
        `const css = ${JSON.stringify(output.code.toString())};`,
        `const tagId = ${JSON.stringify(tagId)};`,
        'export function installStyles() {',
        "  if (typeof document === 'undefined') return () => {};",
        "  const tag = document.createElement('style');",
        `  tag.dataset.plugin = ${JSON.stringify(PLUGIN_ID)};`,
        '  tag.dataset.pluginCss = tagId;',
        '  tag.textContent = css;',
        '  document.head.appendChild(tag);',
        '  return () => tag.remove();',
        '}',
        `export default ${JSON.stringify(classMap)};`,
      ].join('\n')
    },
  }],
  outputOptions: {
    entryFileNames: 'client.js',
    banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(PLUGIN_ID)}, factory: (require) => {`,
    footer: 'return module.exports; } });',
    intro: 'var module = { exports: {} }; var exports = module.exports;',
    codeSplitting: false,
  },
}

export default defineConfig(() => [clientBundle])
