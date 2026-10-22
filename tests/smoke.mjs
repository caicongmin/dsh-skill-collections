import { mkdtemp, mkdir, readFile, rm, writeFile, lstat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  effectiveSkills,
  importUploadedSkill,
  readCollections,
  readWorkspaceConfig,
  removeCollection,
  resolvePaths,
  saveCollection,
  scanSkills,
  syncWorkspace,
  updateWorkspaceCollection,
  updateWorkspaceSkill,
} from '../lib/core.js'

const root = await mkdtemp(join(tmpdir(), 'dsh-skill-collections-'))
const paths = resolvePaths(join(root, 'dsh-home'))
const workspace = join(root, 'workspace')
let passed = 0

function check(label, condition) {
  if (!condition) throw new Error(`FAIL: ${label}`)
  passed += 1
  console.log(`ok ${passed} - ${label}`)
}

async function skill(name, description = name) {
  const dir = join(paths.library, name)
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, 'SKILL.md'), `---\nname: ${name}\ndescription: ${description}\n---\n\n# ${name}\n`, 'utf8')
}

try {
  await mkdir(workspace, { recursive: true })
  await skill('unity-coding', 'Unity C# coding workflow.')
  await skill('unity-debugging', 'Unity debugging workflow.')

  const uploaded = await importUploadedSkill(paths, [
    {
      path: 'SKILL.md',
      content: Buffer.from('---\nname: unity-editor\ndescription: Unity Editor workflow.\n---\n\n# Unity Editor\n').toString('base64'),
    },
    { path: 'references/notes.md', content: Buffer.from('# Notes\n').toString('base64') },
  ])
  check('directory upload installs into the fixed managed library', uploaded.name === 'unity-editor')

  const library = await scanSkills(paths.library)
  check('library scans valid skill bundles', library.length === 3)

  await saveCollection(paths, {
    id: 'unity-development',
    name: 'Unity Development',
    description: 'Unity skills',
    skills: ['unity-coding', 'unity-debugging'],
  })
  check('collection persists both members', (await readCollections(paths))[0]?.skills.length === 2)

  await updateWorkspaceCollection(workspace, 'unity-development', true)
  const first = await syncWorkspace(paths, workspace)
  check('first sync creates both links', first.created.length === 2)
  check('linked skill is a symlink', (await lstat(join(workspace, '.dsh', 'skills', 'unity-coding'))).isSymbolicLink())
  check('effective view reports linked skills', (await effectiveSkills(paths, workspace)).every(row => row.status === 'linked'))

  await updateWorkspaceSkill(workspace, 'unity-debugging', 'disable')
  const disabled = await syncWorkspace(paths, workspace)
  check('workspace disable removes one managed link', disabled.removed.includes('unity-debugging'))
  check('workspace config records explicit disable', (await readWorkspaceConfig(workspace)).skills.disabled.includes('unity-debugging'))

  await updateWorkspaceSkill(workspace, 'unity-debugging', 'clear')
  const restored = await syncWorkspace(paths, workspace)
  check('clearing override restores collection member', restored.created.includes('unity-debugging'))

  await writeFile(join(workspace, '.dsh', 'skills', 'unity-debugging', 'local.txt'), 'library target remains writable through link')
  check('link targets managed library', (await readFile(join(paths.library, 'unity-debugging', 'local.txt'), 'utf8')).includes('through link'))

  await updateWorkspaceCollection(workspace, 'unity-development', false)
  const removed = await syncWorkspace(paths, workspace)
  check('disabling collection removes all managed links', removed.removed.length === 2)

  await removeCollection(paths, 'unity-development')
  check('collection deletion leaves Skill files intact', (await scanSkills(paths.library)).length === 3)

  await writeFile(join(workspace, '.dsh', 'skill-collections.manifest.json'), '{broken', 'utf8')
  await checkRejects('malformed manifest fails closed', () => syncWorkspace(paths, workspace), /cannot safely read/)

  console.log(`\n${passed} checks passed`)
} finally {
  await rm(root, { recursive: true, force: true })
}

async function checkRejects(label, operation, pattern) {
  let message = ''
  try { await operation() } catch (error) { message = String(error) }
  check(label, pattern.test(message))
}
