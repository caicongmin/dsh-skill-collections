import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, mkdir, rm, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { effectivePickerSkills } from '../lib/client/picker-skills.js'
import { apply } from '../lib/index.js'

const catalog = [
  { name: 'unmanaged-project', description: 'Unmanaged project winner', path: '/project/.dsh/skills/unmanaged-project/SKILL.md', modelInvocable: true },
  { name: 'shared-user', description: 'Shared .agents user skill', path: '/user/.agents/skills/shared-user/SKILL.md', modelInvocable: true },
  { name: 'preset-only', description: 'Preset skill not stored in our library', modelInvocable: true },
  { name: 'provider-only', description: 'A provider without a filesystem path', modelInvocable: true },
  { name: 'manual-only', description: 'Must remain manually selectable', modelInvocable: false },
]

test('picker preserves every native user-invocable winner regardless of management or filesystem ownership', () => {
  const skills = effectivePickerSkills(catalog)
  assert.deepEqual(skills.map(s => s.name), catalog.map(s => s.name))
  assert.equal(skills.find(s => s.name === 'manual-only').scope, '仅手动')
  assert.equal(skills.find(s => s.name === 'provider-only').description, 'A provider without a filesystem path')
  assert.deepEqual(effectivePickerSkills(null), [])
})

test('picker does not silently cap the native catalog at 80 entries', () => {
  assert.equal(effectivePickerSkills(Array.from({ length: 120 }, (_, i) => ({ name: `skill-${i}`, description: '', modelInvocable: true }))).length, 120)
})

test('current-session catalog is separate from requested workspace binding diagnostics', async t => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-native-catalog-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const workspace = join(root, 'workspace')
  await mkdir(workspace)
  const tools = new Map()
  const queries = []
  const abort = new AbortController()
  const ctx = {
    effect(setup) { return setup() },
    webServer: { register() { return () => {} } },
    workspaceRegistry: { list() { return [{ id: 'workspace', path: workspace, title: 'Workspace', sessionIds: ['current-session', 'other-preset-session'] }] } },
    tools: { register(tool) { tools.set(tool.name, tool) } },
    sessionSkillCatalog: { async list(request, signal) { queries.push(request); assert.equal(signal, abort.signal); return { skills: catalog } } },
    logger: { info() {} },
  }
  apply(ctx, { dshHome: join(root, 'home') })
  const value = await tools.get('skill_collection_list').execute({ workspace_id: 'workspace' }, { agent: { id: 'current-session' }, signal: abort.signal })
  assert.deepEqual(queries, [{ sessionId: 'current-session' }])
  assert.deepEqual(value.currentSessionCatalog, { sessionId: 'current-session', skills: catalog })
  assert.deepEqual(value.workspace.effective, [])
  assert.deepEqual(value.workspaces[0].sessionIds, ['current-session', 'other-preset-session'])
  abort.abort()
  await assert.rejects(tools.get('skill_collection_list').execute({ workspace_id: 'workspace' }, { agent: { id: 'current-session' }, signal: abort.signal }), { name: 'AbortError' })
  assert.equal(queries.length, 1)
})

test('composer passes exact session identity; catalogs never come from managed snapshots or another workspace', async () => {
  const picker = await readFile(new URL('../src/client/SkillQuickPicker.tsx', import.meta.url), 'utf8')
  assert.match(picker, /listAvailableSkills\(String\(props\.sessionId\), abort\.signal\)/)
  assert.doesNotMatch(picker, /rpc<Snapshot>|MAX_RESULTS|\.slice\(0,\s*80\)/)
  const entry = await readFile(new URL('../src/client/SkillManagementEntry.tsx', import.meta.url), 'utf8')
  assert.match(entry, /sessionId: String\(sessionId\)/)
  assert.doesNotMatch(entry, /workspaces\[0\]/)
})
