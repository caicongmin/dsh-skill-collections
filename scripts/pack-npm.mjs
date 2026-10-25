import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cp, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { parse, stringify } from 'yaml'
import { projectRuntimeLock, RUNTIME_FILES } from './distribution-validation.mjs'

const run = promisify(execFile)
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const publicName = 'dsh-skill-collections'
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
const npmCli = process.env.npm_execpath
if (!npmCli) throw new Error('Run this script with npm run pack:npm')

// Only the developer runs this script. Consumer installs have no build hooks.
await run(process.execPath, [join(root, 'scripts/validate-manifest.mjs')], { cwd: root })
for (const file of ['lib/index.js', 'lib/client.js', 'lib/types/index.d.ts', 'lib/types/client/index.d.ts']) {
  if (!(await stat(join(root, file))).isFile()) throw new Error(`Missing ${file}; build the plugin first`)
}

const staging = await mkdtemp(join(tmpdir(), 'dsh-skill-npm-'))
try {
  // Copy only the manifest's literal distribution allowlist. tsc intermediates
  // remain in Git/lib for development, but never enter either distributable.
  for (const file of [...pkg.files, 'LICENSE']) {
    if (file === 'package-lock.json') continue
    if (file === 'lib' || /[*?\[\]{}]/.test(file) || file.split(/[\\/]/).includes('..') || /^(?:\/|[A-Za-z]:)/.test(file)) {
      throw new Error(`Expected a literal distribution path, not ${file}`)
    }
    const target = join(staging, file)
    await mkdir(dirname(target), { recursive: true })
    await cp(join(root, file), target, { recursive: true })
  }
  for (const file of RUNTIME_FILES) if (!pkg.files.includes(file)) throw new Error(`Missing runtime allowlist entry: ${file}`)

  const manifest = structuredClone(pkg)
  manifest.name = publicName
  delete manifest.private
  delete manifest.scripts
  delete manifest.devDependencies
  manifest.files = [...manifest.files.filter(file => file !== 'package-lock.json'), 'npm-shrinkwrap.json']
  manifest.publishConfig = { access: 'public', registry: 'https://registry.npmjs.org/' }
  await writeFile(join(staging, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  const lock = projectRuntimeLock(JSON.parse(await readFile(join(root, 'package-lock.json'), 'utf8')), manifest)
  await writeFile(join(staging, 'npm-shrinkwrap.json'), `${JSON.stringify(lock, null, 2)}\n`)

  const patch = parse(await readFile(join(root, 'cordis.patch.yml'), 'utf8'))
  const entries = patch.flatMap(operation => operation.insert ?? [])
  const entry = entries.find(item => item.name === pkg.name)
  if (!entry || entries.length !== 1) throw new Error('Expected one Skill Collections loader entry')
  entry.name = publicName
  await writeFile(join(staging, 'cordis.patch.yml'), stringify(patch))

  // A package rename must also change the browser ModuleLoader ID. Never
  // overwrite lib/client.js used by the current private Git installation.
  const build = await run(process.execPath, [join(root, 'node_modules/tsdown/dist/run.mjs')], {
    cwd: root,
    env: { ...process.env, DSH_SKILL_PACKAGE_NAME: publicName, DSH_SKILL_CLIENT_OUT_DIR: join(staging, 'lib') },
    maxBuffer: 8 * 1024 * 1024,
  })
  process.stdout.write(build.stdout)
  process.stderr.write(build.stderr)

  const output = join(root, 'release')
  await mkdir(output, { recursive: true })
  const packed = await run(process.execPath, [npmCli, 'pack', staging, '--ignore-scripts', '--json', '--pack-destination', output], {
    cwd: root,
    maxBuffer: 8 * 1024 * 1024,
  })
  const [result] = JSON.parse(packed.stdout)
  const archive = join(output, result.filename)
  const checked = await run(process.execPath, [join(root, 'scripts/verify-npm-package.mjs'), archive], { cwd: root })
  process.stdout.write(checked.stdout)
  const digest = createHash('sha256').update(await readFile(archive)).digest('hex')
  await writeFile(`${archive}.sha256`, `${digest}  ${result.filename}\n`)
  console.log(`Ready for npm publish: ${archive}`)
  console.log(`SHA256: ${digest}`)
  console.log('This command did not publish, tag, install, or change a DSH profile.')
} finally {
  await rm(staging, { recursive: true, force: true })
}
