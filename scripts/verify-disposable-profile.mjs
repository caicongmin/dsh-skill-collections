/** Real install/cold-start/remove verification. Never launches the user's profile. */
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { homedir, tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { gunzipSync } from 'node:zlib'
import { parse as parseYaml } from 'yaml'

const { values } = parseArgs({ options: {
  checkout: { type: 'string' }, archive: { type: 'string', multiple: true },
  evidence: { type: 'string' }, offline: { type: 'boolean', default: false },
  help: { type: 'boolean', default: false },
} })
if (values.help) {
  console.log('node scripts/verify-disposable-profile.mjs --checkout <DSH checkout> --archive <tgz> [--archive <tgz>] [--evidence <new JSON file>] [--offline]')
  process.exit(0)
}
assert.ok(values.checkout && values.archive?.length, '--checkout and at least one --archive are required')
const checkout = resolve(values.checkout)
const cli = join(checkout, 'apps/cli/lib/bin.js')
const cliManifest = JSON.parse(await readFile(join(checkout, 'apps/cli/package.json'), 'utf8'))
await access(cli)
const allowedNames = new Set(['@dsh-external/dsh-skill-collections', 'dsh-skill-collections'])
const expectedTools = ['skill_collection_list', 'skill_collection_manage']
const owned = await mkdtemp(join(tmpdir(), 'dsh-skill-profile-'))
const children = new Map()
const report = { schemaVersion: 1, ok: false, node: process.version, platform: process.platform,
  arch: process.arch, dsh: cliManifest.version, startup: 'official exported @deepseek-ai/dsh/profile-boot.runProfile in a fresh child',
  installation: 'official dsh plugin CLI', lifecycleScripts: false, offline: values.offline, variants: [] }
const cleanLog = value => String(value).replace(/https?:\/\/[^\s"'<>]+/g, value => {
  try { const url = new URL(value); url.username = ''; url.password = ''; url.search = ''; url.hash = ''; return url.href } catch { return '<URL>' }
}).replaceAll(owned, '<disposable>').replaceAll(checkout, '<dsh-checkout>').replaceAll(homedir(), '<user-home>')

function packedManifest(bytes) {
  const tar = gunzipSync(bytes, { maxOutputLength: 64 * 1024 * 1024 })
  for (let at = 0; at + 512 <= tar.length;) {
    const header = tar.subarray(at, at + 512)
    const name = header.subarray(0, 100).toString().replace(/\0.*$/, '')
    if (!name) break
    const size = Number.parseInt(header.subarray(124, 136).toString().replace(/\0.*$/, '').trim(), 8)
    assert.ok(Number.isSafeInteger(size) && size >= 0 && at + 512 + size <= tar.length, 'Invalid archive header')
    if (name === 'package/package.json') return JSON.parse(tar.subarray(at + 512, at + 512 + size).toString())
    at += 512 + Math.ceil(size / 512) * 512
  }
  throw new Error('Archive has no package/package.json')
}

function isolatedEnvironment(root) {
  const env = {}
  for (const key of ['PATH', 'Path', 'SystemRoot', 'WINDIR', 'COMSPEC', 'PATHEXT', 'LANG', 'LC_ALL']) {
    if (process.env[key] !== undefined) env[key] = process.env[key]
  }
  Object.assign(env, { HOME: join(root, 'home'), USERPROFILE: join(root, 'home'),
    DSH_HOME: join(root, 'dsh'), DSH_TELEMETRY_DISABLED: '1', NO_COLOR: '1', CI: '1',
    XDG_CONFIG_HOME: join(root, 'config'), XDG_DATA_HOME: join(root, 'data'),
    XDG_CACHE_HOME: join(root, 'cache'), XDG_STATE_HOME: join(root, 'state'),
    APPDATA: join(root, 'appdata'), LOCALAPPDATA: join(root, 'localappdata'),
    TMPDIR: join(root, 'tmp'), TEMP: join(root, 'tmp'), TMP: join(root, 'tmp'),
    npm_config_cache: join(root, 'npm-cache'), npm_config_userconfig: join(root, 'empty-npmrc'),
    NPM_CONFIG_USERCONFIG: join(root, 'empty-npmrc'), npm_config_ignore_scripts: 'true',
    npm_config_registry: 'https://registry.npmjs.org/',
  })
  return env
}

function start(args, env, cwd, ipc = false) {
  const child = spawn(process.execPath, args, { env, cwd,
    detached: process.platform !== 'win32', stdio: ipc ? ['ignore', 'pipe', 'pipe', 'ipc'] : ['ignore', 'pipe', 'pipe'] })
  let output = ''
  const capture = chunk => { output = (output + chunk.toString()).slice(-32_768) }
  child.stdout.on('data', capture); child.stderr.on('data', capture)
  const done = new Promise((resolveDone, reject) => {
    child.once('error', reject)
    child.once('close', (code, signal) => { children.delete(child); resolveDone({ code, signal }) })
  })
  // Claim failures immediately; the operation or bounded cleanup observes them.
  void done.catch(() => {})
  const run = { child, done, output: () => cleanLog(output) }
  children.set(child, run)
  return run
}

function signalOwned(run, signal) {
  if (!run.child.pid || run.child.exitCode !== null || run.child.signalCode !== null) return
  try {
    if (process.platform !== 'win32') process.kill(-run.child.pid, signal)
    else run.child.kill(signal)
  } catch (error) { if (error.code !== 'ESRCH') throw error }
}

async function stop(run) {
  signalOwned(run, 'SIGTERM')
  let timer
  try {
    return await Promise.race([run.done, new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('Graceful process shutdown exceeded 8 seconds')), 8000)
    })])
  } catch (error) {
    signalOwned(run, 'SIGKILL')
    await run.done
    throw error
  } finally { clearTimeout(timer) }
}

async function command(args, env, cwd) {
  // Public dependency fetches may require the operator's transport proxy. Never
  // forward model credentials or use this network environment for profile boot.
  const network = {}
  for (const key of ['HTTP_PROXY', 'HTTPS_PROXY', 'ALL_PROXY', 'NO_PROXY', 'http_proxy', 'https_proxy',
    'all_proxy', 'no_proxy', 'npm_config_proxy', 'npm_config_https_proxy', 'NODE_EXTRA_CA_CERTS', 'SSL_CERT_FILE', 'SSL_CERT_DIR']) {
    if (process.env[key] !== undefined) network[key] = process.env[key]
  }
  const run = start([cli, ...args], { ...env, ...network }, cwd)
  let timer
  try {
    const result = await Promise.race([run.done, new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('CLI operation exceeded 120 seconds')), 120_000)
    })])
    assert.equal(result.code, 0, `Official CLI failed: ${run.output()}`)
    return result
  } finally { clearTimeout(timer); if (children.has(run.child)) await stop(run) }
}

const bootstrap = join(owned, 'boot.mjs')
await writeFile(bootstrap, `import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {join} from 'node:path';
const require=createRequire(join(process.argv[2],'apps/cli/package.json'));
const {runProfile}=await import(pathToFileURL(require.resolve('@deepseek-ai/dsh/profile-boot')).href);
const {loadLayeredEnv}=await import(pathToFileURL(require.resolve('@deepseek-ai/dsh-app-boot')).href);
const {ctx}=await runProfile({environment:loadLayeredEnv('dsh'),profile:'web',patchFiles:[],args:['--host','127.0.0.1','--port','0','--no-open']});
const origin=ctx.get('webServer').getOrigin();
process.send({kind:'ready',origin,authUrl:ctx.get('connection').authenticatedUrl(origin+'/'),
tools:ctx.get('tools').schemas().map(value=>value.name).filter(name=>name.startsWith('skill_collection_'))});
`)

async function boot(env, cwd) {
  const run = start([bootstrap, checkout], env, cwd, true)
  let timer
  try {
    const message = await Promise.race([
      new Promise(resolveReady => run.child.on('message', value => { if (value?.kind === 'ready') resolveReady(value) })),
      run.done.then(() => { throw new Error(`Cold start exited before ready: ${run.output()}`) }),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`Cold start exceeded 45 seconds: ${run.output()}`)), 45_000) }),
    ])
    const url = new URL(message.origin)
    assert.equal(url.hostname, '127.0.0.1')
    assert.notEqual(url.port, '3080', 'Refusing to inspect the existing GUI')
    assert.ok(Number(url.port) > 0)
    return { run, ...message }
  } catch (error) { await stop(run); throw error } finally { clearTimeout(timer) }
}

async function exchangeOwner(authUrl) {
  const response = await fetch(authUrl, { redirect: 'manual', signal: AbortSignal.timeout(10_000) })
  assert.equal(response.status, 303, 'Fresh-process owner URL must exchange for a cookie')
  const cookie = response.headers.getSetCookie().map(value => value.split(';', 1)[0]).join('; ')
  assert.ok(cookie, 'No owner cookie was issued')
  await response.body?.cancel()
  return cookie
}

async function snapshot(origin, headers = {}, body = '{}') {
  return fetch(origin + '/dsh-skill-collections-api/snapshot', { method: 'POST',
    headers: { 'content-type': 'application/json', ...headers }, body, signal: AbortSignal.timeout(10_000) })
}

async function inspectServer(server, name, installed, env) {
  const cookie = await exchangeOwner(server.authUrl)
  const index = await fetch(server.origin + '/', { headers: { cookie }, signal: AbortSignal.timeout(10_000) })
  assert.equal(index.status, 200)
  const html = await index.text()
  assert.equal(html.includes(name + '/client.js'), installed, 'Browser module identity differs from installation state')
  assert.deepEqual(server.tools.sort(), installed ? expectedTools : [])
  if (!installed) {
    const response = await snapshot(server.origin, { cookie, origin: server.origin })
    assert.ok([404, 405].includes(response.status), `Removed API is still available: ${response.status}`)
    await response.body?.cancel()
    return { freshProcess: true, ephemeralPort: true, clientAbsent: true, toolsAbsent: true, apiStatus: response.status }
  }
  const anonymous = await snapshot(server.origin, {}, '{')
  assert.equal(anonymous.status, 401, 'Anonymous input must be rejected before body parsing')
  await anonymous.body?.cancel()
  const untrusted = await snapshot(server.origin, { cookie, origin: 'https://untrusted.invalid' })
  assert.equal(untrusted.status, 403)
  await untrusted.body?.cancel()
  const owner = await snapshot(server.origin, { cookie, origin: server.origin })
  assert.equal(owner.status, 200)
  const body = await owner.json()
  assert.equal(body.ok, true)
  assert.equal(body.value.paths.dshHome, env.DSH_HOME)
  assert.equal(body.value.paths.globalSkills, join(env.DSH_HOME, 'skills'))
  assert.equal(body.value.library.length, 0)
  assert.equal(body.value.globalSkills.length, 0)
  return { freshProcess: true, ephemeralPort: true, clientPresent: true, tools: server.tools,
    api: { anonymous: anonymous.status, untrusted: untrusted.status, owner: owner.status },
    isolatedPaths: true, libraryCount: 0, globalSkillCount: 0 }
}

try {
  for (const [index, input] of values.archive.entries()) {
    const archive = resolve(input), bytes = await readFile(archive), manifest = packedManifest(bytes)
    assert.ok(allowedNames.has(manifest.name), 'Refusing an unrelated package')
    const root = join(owned, String(index)), env = isolatedEnvironment(root), cwd = join(root, 'work')
    await Promise.all([...new Set([...Object.values(env).filter(value => value.startsWith(root) && !value.endsWith('empty-npmrc')), cwd])]
      .map(value => mkdir(value, { recursive: true })))
    await writeFile(env.npm_config_userconfig, '')
    const entry = { package: manifest.name, version: manifest.version, archiveSha256: createHash('sha256').update(bytes).digest('hex'),
      engines: manifest.engines ?? null }
    report.variants.push(entry)
    const flags = ['--ignore-scripts', '--reporter=ndjson', '--config.engine-strict=true', '--config.registry=https://registry.npmjs.org/',
      '--config.fetch-retries=0', `--config.store-dir=${join(root, 'store')}`,
      ...values.offline ? ['--offline'] : []]
    await command(['plugin', '--profile', 'web', 'add', archive, ...flags], env, cwd)
    const profileDir = join(env.DSH_HOME, 'profiles/web')
    const saved = JSON.parse(await readFile(join(profileDir, 'package.json'), 'utf8'))
    assert.ok(saved.dependencies?.[manifest.name])
    assert.equal(saved.dsh.profile.bundles.filter(value => value === manifest.name).length, 1)
    const savedPatch = await readFile(join(profileDir, 'cordis.patch.yml'), 'utf8')
    assert.deepEqual(parseYaml(savedPatch), [], 'A fresh official installation must not create disabled overrides')
    entry.install = { exitCode: 0, dependencySaved: true, bundleCount: 1, disabledOverride: false, engineStrict: true }
    const server = await boot(env, cwd)
    try { entry.coldStart = await inspectServer(server, manifest.name, true, env) }
    finally { entry.coldStartShutdown = await stop(server.run); assert.equal(entry.coldStartShutdown.code, 0) }
    // pnpm remove does not accept add's --ignore-scripts/--offline flags; the
    // environment and generic configuration retain the no-lifecycle policy.
    await command(['plugin', '--profile', 'web', 'remove', manifest.name,
      ...flags.filter(flag => flag !== '--ignore-scripts' && flag !== '--offline'), '--config.ignore-scripts=true'], env, cwd)
    const removed = JSON.parse(await readFile(join(profileDir, 'package.json'), 'utf8'))
    assert.equal(removed.dependencies?.[manifest.name], undefined)
    assert.ok(!removed.dsh.profile.bundles.includes(manifest.name))
    assert.equal(await readFile(join(profileDir, 'cordis.patch.yml'), 'utf8'), savedPatch)
    entry.remove = { exitCode: 0, dependencyAbsent: true, bundleAbsent: true, userPatchUnchanged: true }
    const absent = await boot(env, cwd)
    try { entry.afterRemovalColdStart = await inspectServer(absent, manifest.name, false, env) }
    finally { entry.afterRemovalShutdown = await stop(absent.run); assert.equal(entry.afterRemovalShutdown.code, 0) }
  }
  report.ok = true
} catch (error) {
  report.error = cleanLog(error.message)
  process.exitCode = 1
} finally {
  for (const run of children.values()) { try { await stop(run) } catch {} }
  await rm(owned, { recursive: true, force: true })
}
const output = JSON.stringify(report, null, 2) + '\n'
if (values.evidence) {
  const target = resolve(values.evidence)
  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, output, { flag: 'wx' })
}
process.stdout.write(output)
