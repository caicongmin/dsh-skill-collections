import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, mkdir, writeFile, readFile, lstat, readlink, unlink, symlink, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  GLOBAL_MANIFEST_FILE, resolvePaths, setGlobalSkill, listGlobalSkills,
  effectiveSkills, deleteLibrarySkill, adoptGlobalSkill,
  syncWorkspace, updateWorkspaceSkill, scanSkills,
} from '../lib/core.js'
import { apply, _internals } from '../lib/index.js'

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'dsh-skill-globals-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const paths = resolvePaths(join(root, 'home'))
  const workspace = join(root, 'workspace')
  await mkdir(workspace, { recursive: true })
  async function skill(name, { dir = paths.library, flat = false, description = name } = {}) {
    const path = join(dir, flat ? `${name}.md` : name)
    await mkdir(flat ? dir : path, { recursive: true })
    await writeFile(flat ? path : join(path, 'SKILL.md'), `---\nname: ${name}\ndescription: ${description}\n---\n\n# ${name}\n`)
    return path
  }
  async function snapshot() {
    return {
      paths, library: await scanSkills(paths.library), globalSkills: await listGlobalSkills(paths),
      collections: [], workspaces: [],
      workspace: { effective: await effectiveSkills(paths, workspace) },
    }
  }
  return { root, paths, workspace, skill, snapshot }
}

for (const flat of [false, true]) test(`global ${flat ? 'Markdown file' : 'directory'} enable/cancel preserves content and workspace binding`, async t => {
  const { paths, workspace, skill, snapshot } = await fixture(t)
  const source = await skill('sample', { flat })
  const target = join(paths.globalSkills, flat ? 'sample.md' : 'sample')
  await updateWorkspaceSkill(workspace, 'sample', 'enable')
  await syncWorkspace(paths, workspace)
  await setGlobalSkill(paths, 'sample', true)
  assert.equal(await readlink(target), source)
  assert.equal((await listGlobalSkills(paths))[0].globalManaged, true)
  assert.equal((await snapshot()).workspace.effective.filter(s => s.name === 'sample').length, 1)
  assert.equal((await effectiveSkills(paths, workspace))[0].status, 'linked')
  await setGlobalSkill(paths, 'sample', true) // Idempotent.
  await setGlobalSkill(paths, 'sample', false)
  await assert.rejects(lstat(target), { code: 'ENOENT' })
  assert.equal((await effectiveSkills(paths, workspace))[0].status, 'linked')
  assert.ok(await lstat(source))
  assert.equal((await listGlobalSkills(paths)).length, 0)
})

test('external globals appear in binding diagnostics without being adopted or linked into workspace', async t => {
  const { paths, workspace, skill, snapshot } = await fixture(t)
  const source = await skill('external', { dir: paths.globalSkills, description: 'External description' })
  const rows = await effectiveSkills(paths, workspace)
  assert.deepEqual(rows.map(s => [s.name, s.status, s.sources]), [['external', 'global', ['global']]])
  assert.equal((await snapshot()).workspace.effective[0].description, 'External description')
  assert.deepEqual((await syncWorkspace(paths, workspace)).created, [])
  assert.equal((await listGlobalSkills(paths))[0].globalManaged, false)
  await assert.rejects(setGlobalSkill(paths, 'external', false), /只能取消/)
  assert.ok(await lstat(source))
})

test('workspace disable does not hide global skill and cancel restores the workspace-only state', async t => {
  const { paths, workspace, skill } = await fixture(t)
  await skill('sample')
  await setGlobalSkill(paths, 'sample', true)
  await updateWorkspaceSkill(workspace, 'sample', 'disable')
  await syncWorkspace(paths, workspace)
  assert.equal((await effectiveSkills(paths, workspace))[0].status, 'global')
  await setGlobalSkill(paths, 'sample', false)
  assert.deepEqual(await effectiveSkills(paths, workspace), [])
})

test('local same-name winner is deduplicated in binding diagnostics', async t => {
  const { paths, workspace, skill, snapshot } = await fixture(t)
  await skill('sample', { dir: paths.globalSkills, description: 'Global content' })
  await skill('sample', { dir: join(workspace, '.dsh', 'skills'), description: 'Local winner' })
  assert.deepEqual((await snapshot()).workspace.effective.map(s => [s.name, s.description, s.status]), [['sample', 'Local winner', 'linked']])
})

test('project .agents skill overrides a global, while project .dsh skill wins both', async t => {
  const { paths, workspace, skill, snapshot } = await fixture(t)
  await skill('sample', { dir: paths.globalSkills, description: 'Global content' })
  await skill('sample', { dir: join(workspace, '.agents', 'skills'), description: 'Agents winner' })
  assert.equal((await snapshot()).workspace.effective[0].description, 'Agents winner')
  await skill('sample', { dir: join(workspace, '.dsh', 'skills'), description: 'DSH winner' })
  assert.equal((await snapshot()).workspace.effective[0].description, 'DSH winner')
})

test('valid name constructor never inherits an ownership entry from Object.prototype', async t => {
  const { paths, skill } = await fixture(t)
  await skill('constructor')
  await setGlobalSkill(paths, 'constructor', true)
  assert.equal((await listGlobalSkills(paths))[0].globalManaged, true)
  await setGlobalSkill(paths, 'constructor', false)
  await deleteLibrarySkill(paths, 'constructor')
  await skill('constructor', { dir: paths.globalSkills })
  assert.equal((await listGlobalSkills(paths))[0].globalManaged, false)
  await assert.rejects(setGlobalSkill(paths, 'constructor', false), /只能取消/)
  await adoptGlobalSkill(paths, 'constructor')
  assert.equal((await scanSkills(paths.library))[0].name, 'constructor')
})

test('failed local managed binding falls back to available global without losing its diagnostic', async t => {
  const { paths, workspace, skill, snapshot } = await fixture(t)
  await skill('sample', { dir: paths.globalSkills, description: 'Available global' })
  await updateWorkspaceSkill(workspace, 'sample', 'enable') // Missing library source.
  const state = await snapshot()
  assert.equal(state.workspace.effective[0].status, 'global')
  assert.match(state.workspace.effective[0].detail, /missing/)
  assert.equal(state.workspace.effective[0].description, 'Available global')
})

for (const kind of ['directory', 'file', 'alternate-layout', 'symlink', 'dangling-symlink']) test(`enable refuses unmanaged ${kind} collision`, async t => {
  const { paths, skill, root } = await fixture(t)
  const source = await skill('sample')
  await mkdir(paths.globalSkills, { recursive: true })
  const target = join(paths.globalSkills, kind === 'alternate-layout' ? 'sample.md' : 'sample')
  if (kind === 'directory') await mkdir(target)
  else if (kind === 'symlink') await symlink(source, target, 'dir')
  else if (kind === 'dangling-symlink') await symlink(join(root, 'missing'), target, 'dir')
  else await writeFile(target, 'user content')
  await assert.rejects(setGlobalSkill(paths, 'sample', true), /未覆盖/)
  assert.ok(await lstat(target))
})

test('cancellation fails closed for a replaced target and never removes user content', async t => {
  const { paths, skill } = await fixture(t)
  await skill('sample')
  await setGlobalSkill(paths, 'sample', true)
  const target = join(paths.globalSkills, 'sample')
  await unlink(target)
  await writeFile(target, 'replacement')
  await assert.rejects(setGlobalSkill(paths, 'sample', false), /外部修改/)
  assert.equal(await readFile(target, 'utf8'), 'replacement')
})

test('cancellation cleans dangling or missing links, and enable repairs a missing link', async t => {
  const { paths, skill } = await fixture(t)
  const source = await skill('sample')
  const target = join(paths.globalSkills, 'sample')
  await setGlobalSkill(paths, 'sample', true)
  await unlink(target)
  await setGlobalSkill(paths, 'sample', true)
  assert.equal(await readlink(target), source)
  await rm(source, { recursive: true })
  await setGlobalSkill(paths, 'sample', false)
  await assert.rejects(lstat(target), { code: 'ENOENT' })
  await skill('sample')
  await setGlobalSkill(paths, 'sample', true)
  await unlink(target)
  await setGlobalSkill(paths, 'sample', false)
})

test('active global link blocks library deletion and adoption; cancel then delete succeeds', async t => {
  const { paths, skill } = await fixture(t)
  const source = await skill('sample')
  await setGlobalSkill(paths, 'sample', true)
  await assert.rejects(deleteLibrarySkill(paths, 'sample'), /先取消全局/)
  await assert.rejects(adoptGlobalSkill(paths, 'sample'), /取消全局/)
  await setGlobalSkill(paths, 'sample', false)
  await deleteLibrarySkill(paths, 'sample')
  await assert.rejects(lstat(source), { code: 'ENOENT' })
})

test('malformed or escaped global manifest fails closed', async t => {
  const { paths, skill, root } = await fixture(t)
  await skill('sample')
  const manifest = join(paths.root, GLOBAL_MANIFEST_FILE)
  await writeFile(manifest, '{broken')
  await assert.rejects(setGlobalSkill(paths, 'sample', true), /cannot safely read/)
  await assert.rejects(listGlobalSkills(paths), /cannot safely read/)
  const outside = join(root, 'user-content')
  await writeFile(outside, 'protected')
  await writeFile(manifest, JSON.stringify({ version: 1, links: { sample: { source: join(paths.library, 'sample'), target: outside } } }))
  await assert.rejects(setGlobalSkill(paths, 'sample', false), /escapes/)
  assert.equal(await readFile(outside, 'utf8'), 'protected')
})

test('concurrent global mutations retain every manifest entry and serialize deletion against enable', async t => {
  const { paths, skill } = await fixture(t)
  for (const name of ['one', 'two', 'three']) await skill(name)
  await Promise.all(['one', 'two', 'three'].map(name => setGlobalSkill(paths, name, true)))
  assert.equal((await listGlobalSkills(paths)).length, 3)
  await Promise.all(['one', 'two'].map(name => setGlobalSkill(paths, name, false)))
  assert.deepEqual((await listGlobalSkills(paths)).map(s => s.name), ['three'])
  await skill('four')
  const outcomes = await Promise.allSettled([setGlobalSkill(paths, 'four', true), deleteLibrarySkill(paths, 'four')])
  assert.equal(outcomes[0].status, 'fulfilled')
  assert.equal(outcomes[1].status, 'rejected')
})

test('UI endpoint and agent actions share global behavior, including validation and force-delete protection', async t => {
  const { paths, skill, workspace } = await fixture(t)
  await skill('sample')
  const tools = new Map()
  const ctx = {
    get(name) { assert.equal(name, 'connection'); return { admit: () => ({ peer: { principal: { kind: 'owner' } } }) } },
    effect(setup) { return setup() },
    webServer: { register() { return () => {} } },
    workspaceRegistry: { list() { return [{ id: 'test', path: workspace, title: 'Test' }] } },
    tools: { register(tool) { tools.set(tool.name, tool) } },
    logger: { info() {} },
  }
  apply(ctx, { dshHome: paths.dshHome })
  const manage = tools.get('skill_collection_manage')
  assert.ok(manage.parameters.properties.action.enum.includes('enable_global'))
  assert.ok(manage.parameters.properties.action.enum.includes('disable_global'))
  await manage.execute({ action: 'enable_global', name: 'sample' }, {}) // No workspace required.
  assert.equal((await _internals.snapshot(ctx, paths, 'test')).workspace.effective[0].status, 'global')
  await assert.rejects(_internals.handleEndpoint(ctx, paths, 'library-delete', { name: 'sample', force: true }), /先取消全局/)
  await _internals.handleEndpoint(ctx, paths, 'global-skill', { name: 'sample', enabled: false })
  assert.deepEqual(await listGlobalSkills(paths), [])
  await _internals.handleEndpoint(ctx, paths, 'global-skill', { name: 'sample', enabled: true })
  await manage.execute({ action: 'disable_global', name: 'sample' }, {})
  await assert.rejects(_internals.handleEndpoint(ctx, paths, 'global-skill', { name: 'sample', enabled: 'false' }), /boolean/)
})
