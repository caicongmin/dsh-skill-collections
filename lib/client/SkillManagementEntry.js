import { jsx as _jsx } from "react/jsx-runtime";
import { useCallback } from 'react';
import css from './skill-collections.module.css';
import { LightningIcon } from './LightningIcon.js';
import { SKILL_MANAGEMENT_OPEN_EVENT } from './SkillManagementOverlay.js';
/** The former settings/sidebar entry, moved beside the composer. */
export function SkillManagementEntry({ sessionId, useSessions, useWorkspaces }) {
    const sessionCwd = useSessions(state => state.byId[sessionId]?.cwd);
    const workspaces = useWorkspaces(state => state.items);
    const workspace = workspaces.find(item => item.sessionIds.some((id) => String(id) === String(sessionId)))
        ?? workspaces.find(item => item.path === sessionCwd);
    const openManager = useCallback(() => {
        if (workspace === undefined)
            return;
        window.dispatchEvent(new CustomEvent(SKILL_MANAGEMENT_OPEN_EVENT, {
            detail: { workspaceId: String(workspace.workspaceId), title: workspace.title, sessionId: String(sessionId) },
        }));
    }, [workspace, sessionId]);
    return (_jsx("button", { type: "button", className: `${css.quickButton} ${css.managementButton}`, onMouseDown: event => event.preventDefault(), onClick: openManager, disabled: workspace === undefined, title: "\u6253\u5F00 Skill \u7BA1\u7406", "aria-label": "\u6253\u5F00 Skill \u7BA1\u7406", children: _jsx(LightningIcon, {}) }));
}
//# sourceMappingURL=SkillManagementEntry.js.map