import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import type {} from '@deepseek-ai/dsh-api-session-controller/client'
import type { ISessions } from '@deepseek-ai/dsh-api-session-controller/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-workspace/client'
import { SkillCollectionsPanel } from './SkillCollectionsPanel.js'
import { SkillManagementEntry } from './SkillManagementEntry.js'
import { SkillManagementOverlay } from './SkillManagementOverlay.js'
import { SkillQuickPicker } from './SkillQuickPicker.js'
import { installStyles } from './skill-collections.module.css'
import type { AvailableSkill } from './types.js'

declare module '@deepseek-ai/dsh-api-session-controller/client' {
  interface SessionReferenceSourceMap {
    skillCollectionsCatalog: unknown
  }
}

export const inject = ['slots', 'workspaces', 'sessions', 'remote', 'remote.session', 'remote.skills']

let openHostPath: ((path: string) => Promise<void>) | undefined
let readCatalog: ((sessionId: string, signal: AbortSignal) => Promise<readonly AvailableSkill[]>) | undefined
let watchDirectory: ((sessionId: string, changed: () => void) => () => void) | undefined
const catalogListeners = new Set<(sessionId?: string) => void>()

export function subscribeCatalogChanges(listener: (sessionId?: string) => void, sessionId?: string): () => void {
  catalogListeners.add(listener)
  const stop = sessionId === undefined ? undefined : watchDirectory?.(sessionId, () => listener(sessionId))
  return () => { catalogListeners.delete(listener); stop?.() }
}

export async function listAvailableSkills(sessionId: string, signal: AbortSignal): Promise<readonly AvailableSkill[]> {
  if (readCatalog === undefined) throw new Error('原生会话 Skill 目录不可用，请刷新页面后重试')
  return readCatalog(sessionId, signal)
}

export async function openPath(path: string): Promise<void> {
  if (openHostPath === undefined) throw new Error('Host 路径打开能力不可用')
  await openHostPath(path)
}

export async function rpc<T>(endpoint: string, args: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch(`/dsh-skill-collections-api/${endpoint}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(args),
  })
  const data = await response.json().catch(() => null)
  if (!response.ok || !data?.ok) throw new Error(data?.error?.message ?? `Skill collections request failed (${response.status})`)
  return data.value as T
}

export function apply(ctx: ClientContext): void {
  ctx.effect(installStyles, 'dsh-skill-collections: styles')
  ctx.effect(() => () => { openHostPath = undefined; readCatalog = undefined; watchDirectory = undefined }, 'dsh-skill-collections: remote cleanup')
  ctx.effect(() => {
    const notify = (sessionId?: string): void => { for (const listener of catalogListeners) listener(sessionId) }
    const disposers = [
      ctx.remote.$on('agent-preset/selected', sessionId => notify(String(sessionId))),
      ctx.remote.$on('plugin-manager/changed', () => notify()),
      ctx.on('connection/reset', () => notify()),
    ]
    return () => { for (const dispose of disposers) dispose(); catalogListeners.clear() }
  }, 'dsh-skill-collections: catalog invalidation')
  type NativeSessionId = Parameters<typeof ctx.remote.skills.list>[0]['sessionId']
  // Older UI declaration merges still name this field SessionStore; use the
  // published sessions contract verified against the live Client service.
  const sessions = ctx.sessions as unknown as ISessions
  watchDirectory = (sessionId, changed) => ctx.effect(() => {
    const read = (): string | undefined => {
      // The optional working-directory plugin owns this wire key; do not pull
      // its Host Context declarations into the Client type program.
      const values = sessions.list.getSnapshot().projectionsBySession[sessionId as NativeSessionId]?.values as Readonly<Record<string, unknown>> | undefined
      return typeof values?.workingDirectory === 'string' ? values.workingDirectory : undefined
    }
    let previous = read()
    return sessions.list.subscribe(() => {
      const next = read()
      // A cold reference can drop its local projection on release. Absence is
      // not a directory change and must not cause a retain/refresh loop.
      if (next !== undefined && next !== previous) { previous = next; changed() }
    })
  }, 'dsh-skill-collections: selected session directory')
  readCatalog = async (sessionId, signal) => {
    return sessions.using(sessionId as NativeSessionId, { source: 'skillCollectionsCatalog', signal }, async reference => {
      signal.throwIfAborted()
      const state = reference.binding.session.getSnapshot()
      if (state.openState !== 'open') throw new Error(state.openError?.message ?? '会话尚未打开，无法读取原生 Skill 目录')
      const result = await ctx.remote.skills.list({ sessionId: sessionId as NativeSessionId }, signal)
      signal.throwIfAborted()
      if (!result.ok) throw new Error(`原生 Skill 目录读取失败：${result.error.message}`)
      return result.value.skills
    })
  }
  openHostPath = async (path: string) => {
    const result = await ctx.remote.session.openWorkspacePath({ path })
    if (!result.ok) throw new Error(result.error.message)
  }
  ctx.effect(() => ctx.slots.inject('conversation.input.right', () => ctx.slots.register({
    name: 'conversation.input.right',
    id: 'skill-collections-management-entry',
    order: 99,
    label: 'Skill 管理',
  }, SkillManagementEntry)), 'dsh-skill-collections: management entry')
  ctx.effect(() => ctx.slots.inject('conversation.input.right', () => ctx.slots.register({
    name: 'conversation.input.right',
    id: 'skill-collections-picker',
    order: 100,
    label: 'Skill 快捷入口',
  }, SkillQuickPicker)), 'dsh-skill-collections: composer picker')
  ctx.effect(() => ctx.slots.inject('conversation.input.overlay', () => ctx.slots.register({
    name: 'conversation.input.overlay',
    id: 'skill-collections-management-overlay',
    order: 0,
  }, SkillManagementOverlay)), 'dsh-skill-collections: management overlay')
  ctx.effect(() => ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'skill-collections',
    order: 26,
    label: () => 'Skill 收藏夹',
    // The injector's static client preflight requires an inline component
    // marker; the runtime still receives the component through register's
    // canonical second argument.
    component: SkillCollectionsPanel,
  } as never, SkillCollectionsPanel)), 'dsh-skill-collections: settings section')
}
