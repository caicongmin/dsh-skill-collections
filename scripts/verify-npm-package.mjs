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

const run = promisify(execFile)
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const original = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
const archive = resolve(process.argv[2] || join(root, 'release', `dsh-skill-collections-${original.version}.tgz`))
const extracted = await mkdtemp(join(tmpdir(), 'dsh-skill-npm-check-'))
try {
  const { stdout } = await run('tar', ['-tzf', archive])
  const files = stdout.trim().split(/\r?\n/)
  for (const file of files) {
    assert.ok(file.startsWith('package/') && !file.split('/').includes('..'), `Invalid archive path: ${file}`)
    assert.doesNotMatch(file, /(?:^|\/)(?:node_modules|src|scripts|tests|\.git|\.env|\.npmrc)(?:\/|$)/)
  }
  for (const file of ['package.json', 'cordis.patch.yml', 'lib/index.js', 'lib/client.js', 'lib/types/index.d.ts', 'lib/types/client/index.d.ts', 'README.md', 'README.en.md', 'docs/screenshots/skill-library.png', 'docs/screenshots/collections.png', 'docs/screenshots/quick-picker.png', 'LICENSE']) {
    assert.ok(files.includes(`package/${file}`), `Missing runtime file: ${file}`)
  }
  await run('tar', ['-xzf', archive, '-C', extracted])
  const base = join(extracted, 'package')
  const pkg = JSON.parse(await readFile(join(base, 'package.json'), 'utf8'))
  assert.equal(pkg.name, 'dsh-skill-collections')
  assert.equal(pkg.version, original.version)
  assert.notEqual(pkg.private, true)
  assert.equal(pkg.publishConfig.access, 'public')
  assert.equal(pkg.scripts, undefined, 'Consumer installs must not build')
  assert.equal(pkg.devDependencies, undefined)
  assert.equal(pkg.dependencies.yaml, original.dependencies.yaml)
  assert.equal(pkg.peerDependencies.yaml, undefined)
  assert.equal(pkg.dependencies['@deepseek-ai/cordis'], undefined, 'Share the Host SDK')
  assert.equal(pkg.dsh.client.platform, 'web')
  assert.deepEqual(pkg.dsh.client.inject, original.dsh.client.inject)
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
  assert.doesNotMatch(await readFile(join(base, 'lib/index.js'), 'utf8'), /(?:from\s*|import\s*\()["']\.\.?\//)
  console.log(`Verified ${pkg.name}@${pkg.version}: runtime files, dependencies, loader patch, browser module, no consumer build scripts`)
} finally {
  await rm(extracted, { recursive: true, force: true })
}
