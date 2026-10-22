import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'
import vm from 'node:vm'
import { inject } from '../lib/index.js'

const require = createRequire(import.meta.url)
const checkout = process.env.DSH_CHECKOUT || join(homedir(), 'deepseek-harness')
const { evaluatePluginCompatibility, getDshRuntimeVersion } = await import(pathToFileURL(join(checkout, 'packages/boot/app-boot/lib/index.js')))

test('manifest passes the actual DSH gate and declares its persistent browser contracts', async () => {
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
  assert.equal(evaluatePluginCompatibility(pkg, {}, getDshRuntimeVersion()), undefined)
  assert.equal(pkg.dsh.bundle.patch, './cordis.patch.yml')
  assert.ok(pkg.files.includes('cordis.patch.yml'))
  assert.equal(pkg.dsh.client.platform, 'web')
  assert.ok(pkg.dsh.client.inject.includes('@deepseek-ai/dsh-client-ui-workspace'))
  assert.match(await readFile(new URL('../cordis.patch.yml', import.meta.url), 'utf8'), /id: dsh-skill-collections/)
  assert.ok(!inject.includes('agent') && !inject.includes('session'))
})

test('Host entry bundles plugin-local logic into one hot-reload generation', async () => {
  const source = await readFile(new URL('../lib/index.js', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /(?:from\s*|import\s*\()["']\.\.?\//)
  assert.match(source, /enable_global/)
  assert.match(source, /global-links\.manifest\.json/)
})

test('actual client bundle removes all four UI entries, CSS and remote closures on disposal', async () => {
  const source = await readFile(new URL('../lib/client.js', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /Icon(?:ChevronDown|Refresh)Outline14|IconSearchOutline16/)
  const tags = new Set()
  const document = { head: { appendChild(tag) { tags.add(tag) } }, createElement() { const tag = { dataset: {}, remove() { tags.delete(tag) } }; return tag } }
  for (let generation = 0; generation < 2; generation++) {
    let plugin
    vm.runInNewContext(source, { document, window: { __ModuleLoader__: { load({ factory }) { plugin = factory(id => id === '@deepseek-ai/dsh-client-ui-primitives' ? {} : require(id)) } } } })
    assert.equal(tags.size, 0)
    const entries = new Map()
    const effects = []
    const opened = []
    const catalog = [{ name: 'preset-only', description: 'Not in the managed library', modelInvocable: true }, { name: 'manual-only', description: 'User invocation only', modelInvocable: false }]
    let mode = 'success'
    let references = 0
    let catalogCalls = 0
    const events = new Map()
    const projectionListeners = new Set()
    const projectionState = { projectionsBySession: { 'test-session': { values: { workingDirectory: '/initial' } } } }
    const subscribe = (name, callback) => { events.set(name, callback); return () => events.delete(name) }
    const ctx = {
      effect(setup) { const dispose = setup(); effects.push(dispose); return dispose },
      on: subscribe,
      slots: { inject(_name, setup) { return setup() }, register(options, component) { assert.equal(typeof component, 'function'); entries.set(options.id, options); return () => entries.delete(options.id) } },
      sessions: { list: {
        getSnapshot() { return projectionState },
        subscribe(listener) { projectionListeners.add(listener); return () => projectionListeners.delete(listener) },
      }, async using(id, options, operation) {
        assert.equal(id, 'test-session')
        assert.equal(options.source, 'skillCollectionsCatalog')
        references++
        try { return await operation({ binding: { session: { getSnapshot() { return { openState: mode === 'closed' ? 'closed' : 'open' } } } } }) }
        finally { references-- }
      } },
      remote: {
        $on: subscribe,
        session: { async openWorkspacePath({ path }) { opened.push(path); return { ok: true } } },
        skills: { async list({ sessionId }, signal) {
          assert.equal(sessionId, 'test-session')
          assert.ok(signal instanceof AbortSignal)
          catalogCalls++
          return mode === 'error' ? { ok: false, error: { message: 'native failure' } } : { ok: true, value: { skills: catalog } }
        } },
      },
    }
    plugin.apply(ctx)
    assert.equal(tags.size, 1)
    assert.deepEqual([...entries.keys()], ['skill-collections-management-entry', 'skill-collections-picker', 'skill-collections-management-overlay', 'skill-collections'])
    await plugin.openPath('/test/path')
    assert.deepEqual(opened, ['/test/path'])
    assert.deepEqual(await plugin.listAvailableSkills('test-session', new AbortController().signal), catalog)
    assert.equal(references, 0)
    const invalidated = []
    const stopWatching = plugin.subscribeCatalogChanges(id => invalidated.push(id))
    events.get('agent-preset/selected')('test-session', 'another-preset')
    events.get('plugin-manager/changed')({ reason: 'plugin' })
    events.get('connection/reset')()
    assert.deepEqual(invalidated, ['test-session', undefined, undefined])
    stopWatching()
    const directoriesChanged = []
    const stopDirectory = plugin.subscribeCatalogChanges(id => directoriesChanged.push(id), 'test-session')
    projectionState.projectionsBySession['test-session'].values.workingDirectory = '/changed'
    for (const listener of projectionListeners) listener()
    assert.deepEqual(directoriesChanged, ['test-session'])
    delete projectionState.projectionsBySession['test-session']
    for (const listener of projectionListeners) listener()
    projectionState.projectionsBySession['test-session'] = { values: { workingDirectory: '/changed' } }
    for (const listener of projectionListeners) listener()
    assert.deepEqual(directoriesChanged, ['test-session'])
    stopDirectory()
    assert.equal(projectionListeners.size, 0)
    mode = 'error'
    await assert.rejects(plugin.listAvailableSkills('test-session', new AbortController().signal), /native failure/)
    assert.equal(references, 0)
    mode = 'closed'
    await assert.rejects(plugin.listAvailableSkills('test-session', new AbortController().signal), /会话尚未打开/)
    assert.equal(catalogCalls, 2)
    mode = 'success'
    const aborted = new AbortController()
    aborted.abort()
    await assert.rejects(plugin.listAvailableSkills('test-session', aborted.signal), { name: 'AbortError' })
    assert.equal(catalogCalls, 2)
    assert.equal(references, 0)
    effects.reverse().forEach(dispose => dispose())
    assert.equal(entries.size, 0)
    assert.equal(tags.size, 0)
    assert.equal(events.size, 0)
    await assert.rejects(plugin.openPath('/after-dispose'), /不可用/)
    await assert.rejects(plugin.listAvailableSkills('test-session', new AbortController().signal), /不可用/)
  }
})
