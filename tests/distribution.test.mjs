import test from 'node:test'
import assert from 'node:assert/strict'
import { inspectRuntime, projectRuntimeLock, validateRuntimeArtifacts } from '../scripts/distribution-validation.mjs'

const pkg = { name: 'dsh-skill-collections', version: '0.1.4', dependencies: { yaml: '2.9.0' },
  peerDependencies: { react: '^18.3.0', '@deepseek-ai/dsh-client-ui-primitives': '>=0.0.1-rc <2' },
  dsh: { client: { inject: ['@deepseek-ai/dsh-client-ui-primitives'] } } }
const client = 'const react=require("react"); const css=".test{color:var(--dsw-alias-label-primary)}"; function install(){const tag=document.createElement("style");tag.textContent=css;return()=>tag.remove()}'
const artifacts = () => new Map([['lib/index.js', 'import {parse}from"yaml";import fs from"node:fs";'], ['lib/client.js', client]])
const entry = dependencies => ({ version: '1.0.0', resolved: 'https://registry.npmjs.org/example/-/example-1.0.0.tgz', integrity: 'sha512-AAAA', ...(dependencies ? { dependencies } : {}) })
const sourceLock = () => ({ name: '@dsh-external/dsh-skill-collections', version: pkg.version, lockfileVersion: 3,
  packages: { '': { name: '@dsh-external/dsh-skill-collections', version: pkg.version, dependencies: pkg.dependencies, peerDependencies: pkg.peerDependencies },
    'node_modules/yaml': { ...entry(), version: '2.9.0' }, 'node_modules/typescript': { ...entry(), dev: true } } })

test('AST inspection finds static imports, reexports, dynamic imports and require, not comments or CSS strings', () => {
  const code = `import x from"yaml";export{x}from"./next.js";import("./lazy.js");require("react");const css='require("./fake.css")';/* import("./fake.js") */`
  assert.deepEqual(inspectRuntime(code, 'test.js').references.map(value => value.specifier), ['react', './lazy.js', './next.js', 'yaml'])
  assert.throws(() => inspectRuntime('import(name)', 'test.js'), /computed import/)
  assert.throws(() => inspectRuntime('require(name)', 'test.js'), /computed require/)
})

test('all archived runtime modules must be closed bundles with inline CSS and shared externals', () => {
  assert.deepEqual(validateRuntimeArtifacts(artifacts(), pkg)['lib/client.js'], ['react'])
  for (const [file, code] of [
    ['lib/client/AvailableSkills.js', 'import css from "./skill-collections.module.css"'],
    ['lib/client/SkillCollectionsPanel.js', 'import css from "./skill-collections"'],
    ['lib/core.js', 'export const unused = true'],
  ]) {
    const files = artifacts(); files.set(file, code)
    assert.throws(() => validateRuntimeArtifacts(files, pkg), /Only bundled runtime entries/)
  }
})

test('entry-local missing CSS, undeclared externals, Node browser imports and missing inline CSS fail validation', () => {
  for (const [file, code, message] of [
    ['lib/client.js', 'require("./skill-collections.module.css")', /missing local runtime import/],
    ['lib/index.js', 'export{x}from"./missing.js"', /missing local runtime import/],
    ['lib/index.js', 'import("private-dependency")', /undeclared external/],
    ['lib/client.js', 'require("node:fs")', /Node builtin/],
    ['lib/client.js', 'require("react")', /contain its CSS/],
  ]) {
    const files = artifacts(); files.set(file, code)
    assert.throws(() => validateRuntimeArtifacts(files, pkg), message)
  }
  assert.throws(() => validateRuntimeArtifacts(artifacts(), { ...pkg, dependencies: { ...pkg.dependencies, react: '^18.3.0' } }), /shared peer/)
})

test('public lock projects runtime closure and public identity, excluding development packages and local metadata', () => {
  const original = sourceLock(), before = JSON.stringify(original)
  original.packages['node_modules/yaml'].dependencies = { leaf: '^1' }
  original.packages['node_modules/leaf'] = entry()
  original.packages['node_modules/leaf'].devOptional = true
  const lock = projectRuntimeLock(original, pkg)
  assert.equal(lock.name, pkg.name)
  assert.equal(lock.packages[''].name, pkg.name)
  assert.deepEqual(Object.keys(lock.packages), ['', 'node_modules/yaml', 'node_modules/leaf'])
  assert.equal(lock.packages['node_modules/leaf'].devOptional, undefined)
  assert.equal(lock.packages[''].devDependencies, undefined)
  assert.equal(sourceLock().name, JSON.parse(before).name)
  assert.equal(original.packages['node_modules/leaf'].devOptional, true)
})

test('runtime lock rejects stale manifest metadata, missing closure, local tarballs and install hooks', () => {
  for (const [mutate, pattern] of [
    [lock => { lock.version = '0.0.0' }, /version is stale/],
    [lock => { lock.packages[''].dependencies = {} }, /dependency lock is stale/],
    [lock => { delete lock.packages['node_modules/yaml'] }, /missing yaml/],
    [lock => { lock.packages['node_modules/yaml'].resolved = 'file:/private/yaml' }, /Non-registry/],
    [lock => { lock.packages['node_modules/yaml'].hasInstallScript = true }, /Non-distributable/],
    [lock => { delete lock.packages['node_modules/yaml'].integrity }, /integrity/],
  ]) {
    const lock = sourceLock(); mutate(lock)
    assert.throws(() => projectRuntimeLock(lock, pkg), pattern)
  }
})

test('runtime lock resolves nested dependency versions without copying unrelated root nodes', () => {
  const lock = sourceLock()
  lock.packages['node_modules/yaml'].dependencies = { leaf: '^1' }
  lock.packages['node_modules/yaml/node_modules/leaf'] = entry()
  lock.packages['node_modules/leaf'] = { ...entry(), dev: true, version: '2.0.0' }
  const projected = projectRuntimeLock(lock, pkg)
  assert.ok(projected.packages['node_modules/yaml/node_modules/leaf'])
  assert.equal(projected.packages['node_modules/leaf'], undefined)
})
