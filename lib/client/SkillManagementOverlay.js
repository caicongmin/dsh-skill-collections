import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Modal } from '@deepseek-ai/dsh-client-ui-primitives';
import { SkillCollectionsPanel } from './SkillCollectionsPanel.js';
import css from './skill-collections.module.css';
export const SKILL_MANAGEMENT_OPEN_EVENT = 'dsh:skill-collections:manage-current-workspace';
/** Event-driven owner for the composer management button's modal. */
export function SkillManagementOverlay(_props) {
    const [request, setRequest] = useState(null);
    useEffect(() => {
        const onOpen = (event) => {
            const detail = event.detail;
            if (detail === null || typeof detail !== 'object' || typeof detail.workspaceId !== 'string')
                return;
            setRequest({ workspaceId: detail.workspaceId, ...(typeof detail.title === 'string' ? { title: detail.title } : {}), ...(typeof detail.sessionId === 'string' ? { sessionId: detail.sessionId } : {}) });
        };
        window.addEventListener(SKILL_MANAGEMENT_OPEN_EVENT, onOpen);
        return () => window.removeEventListener(SKILL_MANAGEMENT_OPEN_EVENT, onOpen);
    }, []);
    return request === null ? null : (_jsx(Modal, { open: true, onClose: () => setRequest(null), title: request.title === undefined ? 'Skill 管理' : `Skill 管理 · ${request.title}`, closeLabel: "\u5173\u95ED", className: css.managementModal, contentClassName: css.managementModalContent, children: _jsx(SkillCollectionsPanel, { initialWorkspaceId: request.workspaceId, initialSessionId: request.sessionId, initialTab: "workspace" }) }));
}
//# sourceMappingURL=SkillManagementOverlay.js.map