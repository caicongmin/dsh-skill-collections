import type { IncomingMessage, ServerResponse } from 'node:http'
import { realpath } from 'node:fs/promises'
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-host-webserver'
import type {} from '@deepseek-ai/dsh-workspace'
import type {} from '@deepseek-ai/dsh-tools'
import type {} from '@deepseek-ai/dsh-api-session-controller'
import {
  adoptGlobalSkill,
  deleteLibrarySkill,
  effectiveSkills,
  importSkillFromPath,
  importUploadedSkill,
  listGlobalSkills,
  readCollections,
  readWorkspaceConfig,
  removeCollection,
  resolvePaths,
  saveCollection,
  scanSkills,
  setGlobalSkill,
  syncWorkspace,
  updateWorkspaceCollection,
  updateWorkspaceSkill,
  type Paths,
} from './core.js'

export const name = 'dsh-skill-collections'
export const inject = ['webServer', 'workspaceRegistry', 'tools', 'sessionSkillCatalog', 'connection']

const API_BASE = '/dsh-skill-collections-api'
const MAX_BODY_BYTES = 16 * 1024 * 1024

export interface Config {
  readonly dshHome?: string
}

interface MinimalAgent {
  readonly id?: string
  readonly session?: { readonly header?: { readonly cwd?: string } }
}

interface ToolExec {
  readonly agent?: MinimalAgent
  readonly signal: AbortSignal
}

function send(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  res.end(JSON.stringify(body))
}

function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise(resolveBody => {
    let raw = ''
    let tooLarge = false
    req.on('data', (chunk: Buffer) => {
      if (tooLarge) return
      raw += chunk.toString()
      if (Buffer.byteLength(raw) > MAX_BODY_BYTES) tooLarge = true
    })
    req.on('end', () => {
      if (tooLarge) return resolveBody({ __error: 'request body too large' })
      if (raw.length === 0) return resolveBody({})
      try {
        const parsed = JSON.parse(raw) as unknown
        resolveBody(typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
          ? parsed as Record<string, unknown>
          : { __error: 'JSON object required' })
      } catch {
        resolveBody({ __error: 'malformed JSON body' })
      }
    })
  })
}

function toolDefinition(
  toolName: string,
  description: string,
  parameters: Record<string, unknown>,
  execute: (args: Record<string, unknown>, exec: ToolExec) => Promise<unknown>,
): Record<string, unknown> {
  return {
    name: toolName,
    description,
    parameters,
    output: {
      schema: {},
      render: (_args: unknown, value: unknown) => [{ type: 'text', text: JSON.stringify(value, null, 2) }],
    },
    execute,
  }
}

function workspaceById(ctx: Context, id: unknown): { readonly id: string; readonly title: string; readonly path: string } {
  if (typeof id !== 'string' || id.length === 0) throw new Error('workspaceId is required')
  const workspace = ctx.workspaceRegistry.list().find(entry => String(entry.id) === id)
  if (workspace === undefined) throw new Error(`unknown workspace ${JSON.stringify(id)}`)
  return { id: String(workspace.id), title: workspace.title, path: workspace.path }
}

async function currentWorkspace(
  ctx: Context,
  exec: ToolExec,
  explicit?: unknown,
): Promise<{ readonly id: string; readonly title: string; readonly path: string }> {
  if (typeof explicit === 'string' && explicit.length > 0) return workspaceById(ctx, explicit)
  const cwd = exec.agent?.session?.header?.cwd
  if (cwd === undefined) throw new Error('workspace_id is required when the current session has no cwd')
  const canonical = await realpath(cwd)
  const workspace = ctx.workspaceRegistry.list().find(entry => entry.path === canonical)
  if (workspace === undefined) throw new Error(`current cwd is not a registered workspace: ${canonical}`)
  return { id: String(workspace.id), title: workspace.title, path: workspace.path }
}

async function snapshot(ctx: Context, paths: Paths, workspaceId?: unknown): Promise<unknown> {
  const workspaces = ctx.workspaceRegistry.list().map(workspace => ({
    id: String(workspace.id),
    title: workspace.title,
    path: workspace.path,
    sessionIds: Array.from(workspace.sessionIds ?? [], String),
  }))
  const value: Record<string, unknown> = {
    paths,
    library: await scanSkills(paths.library),
    globalSkills: await listGlobalSkills(paths),
    collections: await readCollections(paths),
    workspaces,
  }
  if (typeof workspaceId === 'string' && workspaceId.length > 0) {
    const workspace = workspaceById(ctx, workspaceId)
    value.workspace = {
      ...workspace,
      config: await readWorkspaceConfig(workspace.path),
      effective: await effectiveSkills(paths, workspace.path),
    }
  }
  return value
}

async function resyncUsers(ctx: Context, paths: Paths, collectionId?: string, skillName?: string): Promise<void> {
  const collections = skillName === undefined ? [] : await readCollections(paths)
  for (const workspace of ctx.workspaceRegistry.list()) {
    const config = await readWorkspaceConfig(workspace.path)
    if (collectionId !== undefined && !config.collections.includes(collectionId)) continue
    if (skillName !== undefined) {
      const viaCollection = collections.some(collection => config.collections.includes(collection.id) && collection.skills.includes(skillName))
      if (!viaCollection && !config.skills.enabled.includes(skillName)) continue
    }
    await syncWorkspace(paths, workspace.path)
  }
}

async function handleEndpoint(ctx: Context, paths: Paths, endpoint: string, body: Record<string, unknown>): Promise<unknown> {
  if (endpoint === 'snapshot') return snapshot(ctx, paths, body.workspaceId)
  if (endpoint === 'global-skill') {
    if (typeof body.enabled !== 'boolean') throw new Error('enabled must be a boolean')
    return setGlobalSkill(paths, typeof body.name === 'string' ? body.name : '', body.enabled)
  }
  if (endpoint === 'collection-save') {
    const id = typeof body.id === 'string' ? body.id : ''
    const collection = await saveCollection(paths, {
      id,
      name: typeof body.name === 'string' ? body.name : '',
      description: typeof body.description === 'string' ? body.description : '',
      skills: Array.isArray(body.skills) ? body.skills.filter((entry): entry is string => typeof entry === 'string') : [],
    })
    await resyncUsers(ctx, paths, id)
    return collection
  }
  if (endpoint === 'collection-delete') {
    const id = typeof body.id === 'string' ? body.id : ''
    const users = []
    for (const workspace of ctx.workspaceRegistry.list()) {
      if ((await readWorkspaceConfig(workspace.path)).collections.includes(id)) users.push(workspace)
    }
    if (users.length > 0 && body.force !== true) throw new Error(`collection is enabled in ${users.length} workspace(s); confirm force deletion`)
    for (const workspace of users) await updateWorkspaceCollection(workspace.path, id, false)
    await removeCollection(paths, id)
    for (const workspace of users) await syncWorkspace(paths, workspace.path)
    return { id, removedFrom: users.map(workspace => String(workspace.id)) }
  }
  if (endpoint === 'workspace-collection') {
    const workspace = workspaceById(ctx, body.workspaceId)
    const id = typeof body.id === 'string' ? body.id : ''
    if (body.enabled === true && !(await readCollections(paths)).some(collection => collection.id === id)) throw new Error(`unknown collection ${JSON.stringify(id)}`)
    await updateWorkspaceCollection(workspace.path, id, body.enabled === true)
    return { config: await readWorkspaceConfig(workspace.path), sync: await syncWorkspace(paths, workspace.path) }
  }
  if (endpoint === 'workspace-skill') {
    const workspace = workspaceById(ctx, body.workspaceId)
    const skill = typeof body.skill === 'string' ? body.skill : ''
    const mode = body.mode === 'enable' || body.mode === 'disable' || body.mode === 'clear' ? body.mode : undefined
    if (mode === undefined) throw new Error('mode must be enable, disable, or clear')
    if (mode === 'enable' && !(await scanSkills(paths.library)).some(entry => entry.name === skill)) throw new Error(`skill ${JSON.stringify(skill)} is not installed in the managed library`)
    await updateWorkspaceSkill(workspace.path, skill, mode)
    return { config: await readWorkspaceConfig(workspace.path), sync: await syncWorkspace(paths, workspace.path) }
  }
  if (endpoint === 'workspace-sync') {
    const workspace = workspaceById(ctx, body.workspaceId)
    return syncWorkspace(paths, workspace.path)
  }
  if (endpoint === 'library-adopt-global') {
    const skill = await adoptGlobalSkill(paths, typeof body.name === 'string' ? body.name : '')
    await resyncUsers(ctx, paths, undefined, skill.name)
    return { skill }
  }
  if (endpoint === 'library-import-path') {
    const skill = await importSkillFromPath(
      paths,
      typeof body.path === 'string' ? body.path : '',
      typeof body.name === 'string' ? body.name : undefined,
    )
    await resyncUsers(ctx, paths, undefined, skill.name)
    return { skill }
  }
  if (endpoint === 'library-upload') {
    if (!Array.isArray(body.files)) throw new Error('files array is required')
    const files = body.files.map((entry) => {
      if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) throw new Error('invalid uploaded file')
      const record = entry as Record<string, unknown>
      if (typeof record.path !== 'string' || typeof record.content !== 'string') throw new Error('invalid uploaded file')
      return { path: record.path, content: record.content }
    })
    const skill = await importUploadedSkill(paths, files)
    await resyncUsers(ctx, paths, undefined, skill.name)
    return { skill }
  }
  if (endpoint === 'library-delete') {
    const skill = typeof body.name === 'string' ? body.name : ''
    const assigned = []
    for (const workspace of ctx.workspaceRegistry.list()) {
      if ((await effectiveSkills(paths, workspace.path)).some(entry => entry.name === skill)) assigned.push(workspace)
    }
    const collectionUsers = (await readCollections(paths)).filter(collection => collection.skills.includes(skill))
    if ((assigned.length > 0 || collectionUsers.length > 0) && body.force !== true) {
      throw new Error(`skill is referenced by ${collectionUsers.length} collection(s) and ${assigned.length} workspace(s); confirm force deletion`)
    }
    await deleteLibrarySkill(paths, skill)
    await resyncUsers(ctx, paths, undefined, skill)
    return {
      skill,
      collections: collectionUsers.map(collection => collection.id),
      workspaces: assigned.map(workspace => String(workspace.id)),
    }
  }
  throw new Error(`unknown endpoint ${endpoint}`)
}

function registerTools(ctx: Context, paths: Paths): void {
  ctx.tools.register(toolDefinition(
    'skill_collection_list',
    'List Skill management state and the current session’s complete native / catalog. workspace.effective is binding diagnostics, not the full available catalog.',
    {
      type: 'object',
      properties: { workspace_id: { type: 'string', description: 'Optional registered workspace id. Omit to use the current session workspace.' } },
      additionalProperties: false,
    },
    async (args, exec) => {
      exec.signal.throwIfAborted()
      let id = typeof args.workspace_id === 'string' && args.workspace_id.length > 0 ? args.workspace_id : undefined
      if (id === undefined && exec.agent?.session?.header?.cwd !== undefined) {
        const cwd = await realpath(exec.agent.session.header.cwd)
        id = ctx.workspaceRegistry.list().find(workspace => workspace.path === cwd)?.id
      }
      const value = await snapshot(ctx, paths, id) as Record<string, unknown>
      exec.signal.throwIfAborted()
      if (exec.agent?.id !== undefined) {
        type NativeSessionId = Parameters<Context['sessionSkillCatalog']['list']>[0]['sessionId']
        const catalog = await ctx.sessionSkillCatalog.list({ sessionId: exec.agent.id as NativeSessionId }, exec.signal)
        exec.signal.throwIfAborted()
        value.currentSessionCatalog = { sessionId: exec.agent.id, skills: catalog.skills }
      }
      return value
    },
  ) as never)

  ctx.tools.register(toolDefinition(
    'skill_collection_manage',
    'Manage Skill collections and workspace bindings, import Skills, enable/disable managed Skills globally, or adopt external global Skills into the library (removes the global original). Disabling global only removes this plugin’s link; library content is preserved.',
    {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['save_collection', 'delete_collection', 'enable_collection', 'disable_collection', 'enable_skill', 'disable_skill', 'clear_skill', 'sync', 'import_path', 'adopt_global', 'enable_global', 'disable_global'] },
        workspace_id: { type: 'string', description: 'Registered workspace id; omit to use the current session workspace.' },
        collection_id: { type: 'string' },
        name: { type: 'string', description: 'Collection display name, Skill name, or optional imported Skill name depending on action.' },
        description: { type: 'string' },
        skills: { type: 'array', items: { type: 'string' } },
        source_path: { type: 'string', description: 'Absolute local Skill directory or flat Markdown path for import_path.' },
        force: { type: 'boolean' },
      },
      required: ['action'],
      additionalProperties: false,
    },
    async (args, exec) => {
      const action = args.action
      if (action === 'save_collection') return handleEndpoint(ctx, paths, 'collection-save', {
        id: args.collection_id,
        name: args.name,
        description: args.description,
        skills: args.skills,
      })
      if (action === 'delete_collection') return handleEndpoint(ctx, paths, 'collection-delete', { id: args.collection_id, force: args.force })
      if (action === 'import_path') return handleEndpoint(ctx, paths, 'library-import-path', { path: args.source_path, name: args.name })
      if (action === 'adopt_global') return handleEndpoint(ctx, paths, 'library-adopt-global', { name: args.name })
      if (action === 'enable_global' || action === 'disable_global') return handleEndpoint(ctx, paths, 'global-skill', { name: args.name, enabled: action === 'enable_global' })
      const workspace = await currentWorkspace(ctx, exec, args.workspace_id)
      if (action === 'enable_collection' || action === 'disable_collection') {
        return handleEndpoint(ctx, paths, 'workspace-collection', {
          workspaceId: workspace.id,
          id: args.collection_id,
          enabled: action === 'enable_collection',
        })
      }
      if (action === 'enable_skill' || action === 'disable_skill' || action === 'clear_skill') {
        return handleEndpoint(ctx, paths, 'workspace-skill', {
          workspaceId: workspace.id,
          skill: args.name,
          mode: action.replace('_skill', ''),
        })
      }
      if (action === 'sync') return handleEndpoint(ctx, paths, 'workspace-sync', { workspaceId: workspace.id })
      throw new Error(`unsupported action ${String(action)}`)
    },
  ) as never)
}

export function apply(ctx: Context, config: Config = {}): void {
  const paths = resolvePaths(config.dshHome)
  const connection = ctx.get('connection')
  if (!connection) throw new Error('Skill collections requires Connection owner authentication')
  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: API_BASE,
    handler: async (req, res) => {
      // File/skill management is owner-only. Reject before accepting a body or reading disk.
      const rejection = ownerRejection(connection, req)
      if (rejection !== undefined) return send(res, rejection, { ok: false, error: { message: 'Owner authentication required' } })
      if (req.method !== 'POST') return send(res, 405, { ok: false, error: { message: 'POST required' } })
      const body = await readBody(req)
      if (typeof body.__error === 'string') return send(res, 400, { ok: false, error: { message: body.__error } })
      const endpoint = (req.url ?? '').split('?')[0].split('/').filter(Boolean).at(-1) ?? ''
      try {
        send(res, 200, { ok: true, value: await handleEndpoint(ctx, paths, endpoint, body) })
      } catch (error) {
        send(res, 400, { ok: false, error: { message: error instanceof Error ? error.message : String(error) } })
      }
    },
  }), 'dsh-skill-collections: api routes')
  registerTools(ctx, paths)
  ctx.logger.info(`Skill collections ready: library=${paths.library}`)
}

function ownerRejection(connection: {
  requestRejection(request: IncomingMessage): 401 | 403 | undefined
  admit(request: IncomingMessage): { rejection: 401 | 403 } | { peer: { principal: { kind: string } } }
}, req: IncomingMessage): 401 | 403 | undefined {
  // First enforce the official request trust/authentication gate, then inspect
  // the admitted principal. Authentication alone does not grant owner access.
  const rejection = connection.requestRejection(req)
  if (rejection !== undefined) return rejection
  const admission = connection.admit(req)
  if ('rejection' in admission) return admission.rejection
  return admission.peer.principal.kind === 'owner' ? undefined : 403
}

export const _internals = { handleEndpoint, snapshot, ownerRejection }
