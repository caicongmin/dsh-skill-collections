import { useEffect, useState } from 'react'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { Modal } from '@deepseek-ai/dsh-client-ui-primitives'
import { SkillCollectionsPanel } from './SkillCollectionsPanel.js'
import css from './skill-collections.module.css'

export const SKILL_MANAGEMENT_OPEN_EVENT = 'dsh:skill-collections:manage-current-workspace'

interface OpenRequest {
  readonly workspaceId: string
  readonly sessionId?: string
  readonly title?: string
}

type Props = PropsRuntime<'conversation.input.overlay'>

/** Event-driven owner for the composer management button's modal. */
export function SkillManagementOverlay(_props: Props): JSX.Element | null {
  const [request, setRequest] = useState<OpenRequest | null>(null)

  useEffect(() => {
    const onOpen = (event: Event) => {
      const detail = (event as CustomEvent<Partial<OpenRequest>>).detail
      if (detail === null || typeof detail !== 'object' || typeof detail.workspaceId !== 'string') return
      setRequest({ workspaceId: detail.workspaceId, ...(typeof detail.title === 'string' ? { title: detail.title } : {}), ...(typeof detail.sessionId === 'string' ? { sessionId: detail.sessionId } : {}) })
    }
    window.addEventListener(SKILL_MANAGEMENT_OPEN_EVENT, onOpen)
    return () => window.removeEventListener(SKILL_MANAGEMENT_OPEN_EVENT, onOpen)
  }, [])

  return request === null ? null : (
    <Modal
      open
      onClose={() => setRequest(null)}
      title={request.title === undefined ? 'Skill 管理' : `Skill 管理 · ${request.title}`}
      closeLabel="关闭"
      className={css.managementModal}
      contentClassName={css.managementModalContent}
    >
      <SkillCollectionsPanel initialWorkspaceId={request.workspaceId} initialSessionId={request.sessionId} initialTab="workspace" />
    </Modal>
  )
}
