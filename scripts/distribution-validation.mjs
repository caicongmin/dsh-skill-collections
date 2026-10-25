import assert from 'node:assert/strict'
import { isBuiltin, createRequire } from 'node:module'
import { posix } from 'node:path'
import { pathToFileURL } from 'node:url'

// Reuse the parser shipped with the existing build tool; no runtime dependency.
const buildRequire = createRequire(import.meta.resolve('tsdown'))
const { parseSync } = await import(pathToFileURL(buildRequire.resolve('rolldown/utils')).href)
export const RUNTIME_FILES = ['lib/index.js', 'lib/index.js.map', 'lib/client.js', 'lib/client.js.map']
const shared = name => name.startsWith('@deepseek-ai/') || name === 'react' || name === 'react-dom'
const packageName = specifier => specifier.startsWith('@') ? specifier.split('/').slice(0, 2).join('/') : specifier.split('/')[0]

export function inspectRuntime(source, filename) {
  const parsed = parseSync(filename, source)
  assert.equal(parsed.errors.length, 0, `${filename}: invalid JavaScript`)
  const references = [], strings = [], nodes = [parsed.program]
  let inlineStyle = false, textContent = false
  const literal = node => node?.type === 'Literal' && typeof node.value === 'string' ? node.value
    : node?.type === 'TemplateLiteral' && node.expressions.length === 0 ? node.quasis[0].value.cooked : undefined
  const add = (kind, node) => {
    const specifier = literal(node)
    assert.equal(typeof specifier, 'string', `${filename}: cannot verify computed ${kind}`)
    references.push({ kind, specifier })
  }
  while (nodes.length) {
    const node = nodes.pop()
    if (!node || typeof node !== 'object') continue
    if (node.type === 'ImportDeclaration' || node.type === 'ExportAllDeclaration' || node.type === 'ExportNamedDeclaration') {
      if (node.source) add('import', node.source)
    } else if (node.type === 'ImportExpression') add('import', node.source)
    else if (node.type === 'CallExpression') {
      if (node.callee.type === 'Identifier' && /^(?:require|__require\d*)$/.test(node.callee.name)) add('require', node.arguments[0])
      if (node.callee.type === 'MemberExpression' && node.callee.property.name === 'createElement' && literal(node.arguments[0]) === 'style') inlineStyle = true
    }
    if (node.type === 'MemberExpression' && node.property.name === 'textContent') textContent = true
    const value = literal(node)
    if (typeof value === 'string') strings.push(value)
    for (const child of Object.values(node)) {
      if (Array.isArray(child)) nodes.push(...child.filter(value => value && typeof value === 'object'))
      else if (child && typeof child === 'object') nodes.push(child)
    }
  }
  return { references, strings, inlineStyle, textContent }
}

/** Check every archived runtime module, not just the Host entry or its reachable graph. */
export function validateRuntimeArtifacts(files, pkg) {
  const modules = [...files.keys()].filter(file => /\.(?:[cm]?js)$/.test(file))
  assert.deepEqual(modules.sort(), ['lib/client.js', 'lib/index.js'], 'Only bundled runtime entries may ship; exclude tsc intermediates')
  for (const name of Object.keys(pkg.dependencies ?? {})) assert.ok(!shared(name), `${name} must remain a shared peer`)
  const result = {}
  for (const file of modules) {
    const info = inspectRuntime(String(files.get(file)), file)
    for (const { specifier } of info.references) {
      if (specifier.startsWith('.')) {
        const target = posix.normalize(posix.join(posix.dirname(file), specifier))
        assert.ok(files.has(target), `${file}: missing local runtime import ${specifier}`)
        assert.fail(`${file}: local import ${specifier} must be bundled`)
      }
      assert.doesNotMatch(specifier, /^(?:\/|[A-Za-z]:|file:|https?:|data:)/, `${file}: nonportable import ${specifier}`)
      if (isBuiltin(specifier)) {
        assert.equal(file, 'lib/index.js', `Browser entry imports Node builtin ${specifier}`)
        continue
      }
      const name = packageName(specifier)
      assert.ok(pkg.dependencies?.[name] || pkg.peerDependencies?.[name], `${file}: undeclared external ${specifier}`)
      if (shared(name) || file === 'lib/client.js') assert.ok(pkg.peerDependencies?.[name] && !pkg.dependencies?.[name], `${specifier} must remain a shared peer`)
      if (file === 'lib/client.js' && name.startsWith('@deepseek-ai/')) assert.ok(pkg.dsh?.client?.inject?.includes(name), `Missing Client injection for ${name}`)
    }
    result[file] = info.references.map(item => item.specifier)
    if (file === 'lib/client.js') {
      const styles = info.strings.filter(value => value.includes('{') && value.includes('--dsw-'))
      assert.ok(styles.length && info.inlineStyle && info.textContent, 'Client must contain its CSS and style installer')
      for (const css of styles) {
        assert.doesNotMatch(css, /@import\b/i, 'Client CSS must not depend on an external stylesheet')
        for (const match of css.matchAll(/url\(\s*["']?([^\s)"']+)/gi)) assert.match(match[1], /^(?:data:|https?:|\/\/)/, `Missing bundled CSS asset: ${match[1]}`)
      }
    }
  }
  if (pkg.dependencies?.yaml) assert.ok(result['lib/index.js'].includes('yaml'), 'yaml must remain an ordinary external runtime dependency')
  return result
}

function dependencyPath(packages, from, name) {
  for (let parent = from; ; parent = parent.replace(/(?:^|\/)node_modules\/(?:@[^/]+\/)?[^/]+$/, '')) {
    const candidate = `${parent ? `${parent}/` : ''}node_modules/${name}`
    if (packages[candidate]) return candidate
    if (!parent) throw new Error(`Runtime lock is missing ${name} required by ${from || 'root'}`)
    const next = parent.replace(/(?:^|\/)node_modules\/(?:@[^/]+\/)?[^/]+$/, '')
    assert.notEqual(next, parent, `Invalid dependency lock path: ${parent}`)
  }
}

/** Project only ordinary runtime dependencies from the source development lock. */
export function projectRuntimeLock(source, pkg) {
  assert.equal(source.lockfileVersion, 3, 'Expected a v3 source lock')
  assert.equal(source.version, pkg.version, 'Source lock version is stale')
  assert.equal(source.packages?.['']?.version, pkg.version, 'Source root lock version is stale')
  assert.deepEqual(source.packages?.['']?.dependencies ?? {}, pkg.dependencies ?? {}, 'Source runtime dependency lock is stale')
  assert.deepEqual(source.packages?.['']?.optionalDependencies ?? {}, pkg.optionalDependencies ?? {}, 'Source optional dependency lock is stale')
  assert.deepEqual(source.packages?.['']?.peerDependencies ?? {}, pkg.peerDependencies ?? {}, 'Source shared peer lock is stale')
  const root = { name: pkg.name, version: pkg.version }
  for (const key of ['license', 'dependencies', 'optionalDependencies', 'peerDependencies', 'peerDependenciesMeta', 'engines']) if (pkg[key] !== undefined) root[key] = structuredClone(pkg[key])
  const projected = { name: pkg.name, version: pkg.version, lockfileVersion: 3, requires: true, packages: { '': root } }
  const queue = [['', { ...pkg.dependencies, ...pkg.optionalDependencies }]]
  while (queue.length) {
    const [parent, dependencies] = queue.shift()
    for (const name of Object.keys(dependencies)) {
      assert.ok(!shared(name), `${name} must not be copied into the runtime lock`)
      const path = dependencyPath(source.packages, parent, name)
      if (projected.packages[path]) continue
      const entry = structuredClone(source.packages[path])
      assert.ok(!entry.link && !entry.hasInstallScript, `Non-distributable runtime lock entry: ${path}`)
      const resolved = new URL(entry.resolved)
      assert.ok(resolved.protocol === 'https:' && !resolved.username && !resolved.password, `Non-registry runtime dependency: ${path}`)
      assert.match(entry.integrity ?? '', /^sha(?:256|384|512)-[A-Za-z0-9+/=]+$/, `Missing integrity for ${path}`)
      delete entry.dev
      delete entry.devOptional
      projected.packages[path] = entry
      queue.push([path, { ...entry.dependencies, ...entry.optionalDependencies }])
    }
  }
  return projected
}
