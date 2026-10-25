import assert from 'node:assert/strict'
import { access, readFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const packagePath = resolve(root, 'package.json')
const pkg = JSON.parse(await readFile(packagePath, 'utf8'))
const patchRelative = pkg.dsh?.bundle?.patch

assert.equal(pkg.repository?.url, 'git+https://github.com/caicongmin/dsh-skill-collections.git', 'Keep the canonical HTTPS source identity')
for (const engine of ['node', 'dsh']) {
  assert.ok(typeof pkg.engines?.[engine] === 'string' && /\d/.test(pkg.engines[engine]), `Declare explicit engines.${engine}`)
}
const lockNames = ['package-lock.json', 'npm-shrinkwrap.json', 'pnpm-lock.yaml', 'yarn.lock']
assert.deepEqual((await readdir(root)).filter(name => lockNames.includes(name)), ['package-lock.json'], 'Keep exactly one source dependency lockfile')
const lock = JSON.parse(await readFile(resolve(root, 'package-lock.json'), 'utf8'))
assert.equal(lock.lockfileVersion, 3)
assert.equal(lock.name, pkg.name)
assert.equal(lock.version, pkg.version)
assert.deepEqual(lock.packages[''].dependencies, pkg.dependencies)
assert.deepEqual(lock.packages[''].devDependencies, pkg.devDependencies)
for (const [name, version] of Object.entries(pkg.dependencies ?? {})) {
  assert.match(version, /^\d+\.\d+\.\d+(?:-[\w.-]+)?$/, `Pin runtime dependency ${name}`)
  const dependency = lock.packages[`node_modules/${name}`]
  assert.equal(dependency?.version, version)
  assert.ok(dependency.resolved.startsWith('https://registry.npmjs.org/'), `Use a reviewable registry URL for ${name}`)
  assert.match(dependency.integrity, /^sha512-[A-Za-z0-9+/=]+$/)
  assert.ok(!dependency.link && !dependency.hasInstallScript, `No local links or install scripts for ${name}`)
}

if (typeof patchRelative !== 'string' || patchRelative.length === 0) {
  throw new Error(`${pkg.name ?? 'plugin'}: package.json must declare dsh.bundle.patch`)
}

const patchPath = resolve(root, patchRelative)
await access(patchPath)
const patch = await readFile(patchPath, 'utf8')
const names = [`name: '${pkg.name}'`, `name: "${pkg.name}"`, `name: ${pkg.name}`]
if (!patch.includes('insert:') || !names.some(name => patch.includes(name))) {
  throw new Error(`${pkg.name}: ${patchRelative} must insert a loader entry whose name is the package name`)
}

if (pkg.dsh?.client !== undefined) {
  if (pkg.dsh.client.platform !== 'web') throw new Error(`${pkg.name}: dsh.client.platform must be "web"`)
  if (!Array.isArray(pkg.dsh.client.inject)) throw new Error(`${pkg.name}: dsh.client.inject must be an array`)
}

console.log(`${pkg.name}: bundle manifest OK (${patchRelative})`)
