import { useCallback } from 'react'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import css from './skill-collections.module.css'
import { LightningIcon } from './LightningIcon.js'
import { SKILL_MANAGEMENT_OPEN_EVENT } from './SkillManagementOverlay.js'

type Props = PropsRuntime<'conversation.input.right'>

/** The former settings/sidebar entry, moved beside the composer. */
export function SkillManagementEntry({ sessionId, useSessions, useWorkspaces }: Props): JSX.Element {
  const sessionCwd = useSessions(state => state.byId[sessionId]?.cwd)
  const workspaces = useWorkspaces(state => state.items)
  const workspace = workspaces.find(item => item.sessionIds.some((id: unknown) => String(id) === String(sessionId)))
    ?? workspaces.find(item => item.path === sessionCwd)

  const openManager = useCallback(() => {
    if (workspace === undefined) return
    window.dispatchEvent(new CustomEvent(SKILL_MANAGEMENT_OPEN_EVENT, {
      detail: { workspaceId: String(workspace.workspaceId), title: workspace.title, sessionId: String(sessionId) },
    }))
  }, [workspace, sessionId])

  return (
    <button
      type="button"
      className={`${css.quickButton} ${css.managementButton}`}
      onMouseDown={event => event.preventDefault()}
      onClick={openManager}
      disabled={workspace === undefined}
      title="打开 Skill 管理"
      aria-label="打开 Skill 管理"
    >
      <LightningIcon />
    </button>
  )
}
