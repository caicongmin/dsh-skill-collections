import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import vm from 'node:vm'
import { parse } from 'yaml'
import { projectRuntimeLock, validateRuntimeArtifacts } from './distribution-validation.mjs'

const run = promisify(execFile)
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const original = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
const archive = resolve(process.argv[2] || join(root, 'release', `dsh-skill-collections-${original.version}.tgz`))
const extracted = await mkdtemp(join(tmpdir(), 'dsh-skill-npm-check-'))
try {
  const { stdout } = await run('tar', ['-tzf', archive])
  const files = stdout.trim().split(/\r?\n/)
  for (const file of files) {
    assert.ok(file.startsWith('package/') && !file.includes('\\') && !file.split('/').includes('..'), `Invalid archive path: ${file}`)
    assert.doesNotMatch(file, /(?:^|\/)(?:node_modules|src|scripts|tests|\.git|\.env|\.npmrc)(?:\/|$)/)
  }
  const listing = await run('tar', ['-tvzf', archive])
  assert.ok(listing.stdout.trim().split(/\r?\n/).every(line => /^[d-]/.test(line)), 'Archive must not contain symlinks or special files')
  for (const file of ['package.json', 'cordis.patch.yml', 'lib/index.js', 'lib/client.js', 'lib/types/index.d.ts', 'lib/types/client/index.d.ts', 'README.md', 'README.en.md', 'SECURITY.md', 'docs/store-review.md', 'docs/screenshots/skill-library.png', 'docs/screenshots/collections.png', 'docs/screenshots/quick-picker.png', 'LICENSE']) {
    assert.ok(files.includes(`package/${file}`), `Missing runtime file: ${file}`)
  }
  await run('tar', ['-xzf', archive, '-C', extracted])
  const base = join(extracted, 'package')
  const pkg = JSON.parse(await readFile(join(base, 'package.json'), 'utf8'))
  const isPublic = pkg.name === 'dsh-skill-collections'
  assert.ok(isPublic || pkg.name === original.name, 'Unexpected source/public package identity')
  assert.equal(pkg.version, original.version)
  if (isPublic) {
    assert.notEqual(pkg.private, true)
    assert.equal(pkg.publishConfig.access, 'public')
    assert.equal(pkg.scripts, undefined, 'Public consumer installs must not build')
    assert.equal(pkg.devDependencies, undefined)
  } else assert.equal(pkg.private, true, 'Preserve the source installation identity')
  for (const hook of ['preinstall', 'install', 'postinstall', 'prepare']) assert.equal(pkg.scripts?.[hook], undefined, `Unexpected consumer lifecycle hook ${hook}`)
  assert.equal(pkg.dependencies.yaml, original.dependencies.yaml)
  assert.equal(pkg.peerDependencies.yaml, undefined)
  assert.equal(pkg.dependencies['@deepseek-ai/cordis'], undefined, 'Share the Host SDK')
  assert.equal(pkg.dsh.client.platform, 'web')
  assert.deepEqual(pkg.dsh.client.inject, original.dsh.client.inject)
  assert.deepEqual(pkg.engines, original.engines, 'Distribution compatibility must match the source manifest')
  assert.match(pkg.engines?.dsh ?? '', /\d/, 'Missing DSH engine requirement')
  assert.match(pkg.engines?.node ?? '', /\d/, 'Missing Node engine requirement')
  for (const values of [pkg.dependencies, pkg.peerDependencies, pkg.devDependencies]) {
    for (const [name, version] of Object.entries(values ?? {})) assert.doesNotMatch(version, /^(?:file:|link:|workspace:|[A-Za-z]:[\\/]|\/)/, `Local dependency ${name}`)
  }
  const archived = new Map()
  for (const path of files.filter(file => !file.endsWith('/'))) archived.set(path.slice('package/'.length), await readFile(join(extracted, path)))
  const externals = validateRuntimeArtifacts(archived, pkg)
  const sourceLock = JSON.parse(await readFile(join(root, 'package-lock.json'), 'utf8'))
  const runtimeLock = projectRuntimeLock(sourceLock, pkg)
  const locks = [...archived.keys()].filter(file => /(?:^|\/)(?:package-lock\.json|npm-shrinkwrap\.json|pnpm-lock\.yaml|yarn\.lock)$/.test(file))
  if (isPublic) {
    assert.deepEqual(locks, ['npm-shrinkwrap.json'], 'Public distribution requires one runtime-only npm lock')
    assert.deepEqual(JSON.parse(String(archived.get(locks[0]))), runtimeLock, 'Public runtime lock graph or identity is stale')
  } else assert.equal(locks.length, 0, 'npm excludes the source package-lock; do not ship a competing lock')
  const patch = parse(await readFile(join(base, pkg.dsh.bundle.patch), 'utf8'))
  const entries = patch.flatMap(operation => operation.insert ?? [])
  assert.equal(entries.length, 1)
  assert.equal(entries[0].id, 'dsh-skill-collections')
  assert.equal(entries[0].name, pkg.name)

  const require = createRequire(import.meta.url)
  const registered = []
  vm.runInNewContext(await readFile(join(base, 'lib/client.js'), 'utf8'), {
    window: { __ModuleLoader__: { load({ id, factory }) {
      registered.push(id)
      const plugin = factory(name => name === '@deepseek-ai/dsh-client-ui-primitives' ? {} : require(name))
      assert.equal(typeof plugin.apply, 'function')
    } } },
  })
  assert.deepEqual(registered, [pkg.name], 'Browser and package identity must match')
  console.log(`Verified ${pkg.name}@${pkg.version}: complete runtime import closure, inlined CSS, shared externals, compatibility, lock identity, loader/browser identity, no install hooks`)
  console.log(JSON.stringify({ externals, lock: isPublic ? 'npm-shrinkwrap.json (runtime only)' : 'source package-lock.json (repository)' }))
} finally {
  await rm(extracted, { recursive: true, force: true })
}
