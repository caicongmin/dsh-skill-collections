import { SkillCollectionsPanel } from './SkillCollectionsPanel.js';
import { SkillManagementEntry } from './SkillManagementEntry.js';
import { SkillManagementOverlay } from './SkillManagementOverlay.js';
import { SkillQuickPicker } from './SkillQuickPicker.js';
import { installStyles } from './skill-collections.module.css';
export const inject = ['slots', 'workspaces', 'sessions', 'remote', 'remote.session', 'remote.skills'];
let openHostPath;
let readCatalog;
let watchDirectory;
const catalogListeners = new Set();
export function subscribeCatalogChanges(listener, sessionId) {
    catalogListeners.add(listener);
    const stop = sessionId === undefined ? undefined : watchDirectory?.(sessionId, () => listener(sessionId));
    return () => { catalogListeners.delete(listener); stop?.(); };
}
export async function listAvailableSkills(sessionId, signal) {
    if (readCatalog === undefined)
        throw new Error('原生会话 Skill 目录不可用，请刷新页面后重试');
    return readCatalog(sessionId, signal);
}
export async function openPath(path) {
    if (openHostPath === undefined)
        throw new Error('Host 路径打开能力不可用');
    await openHostPath(path);
}
export async function rpc(endpoint, args = {}) {
    const response = await fetch(`/dsh-skill-collections-api/${endpoint}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(args),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok)
        throw new Error(data?.error?.message ?? `Skill collections request failed (${response.status})`);
    return data.value;
}
export function apply(ctx) {
    ctx.effect(installStyles, 'dsh-skill-collections: styles');
    ctx.effect(() => () => { openHostPath = undefined; readCatalog = undefined; watchDirectory = undefined; }, 'dsh-skill-collections: remote cleanup');
    ctx.effect(() => {
        const notify = (sessionId) => { for (const listener of catalogListeners)
            listener(sessionId); };
        const disposers = [
            ctx.remote.$on('agent-preset/selected', sessionId => notify(String(sessionId))),
            ctx.remote.$on('plugin-manager/changed', () => notify()),
            ctx.on('connection/reset', () => notify()),
        ];
        return () => { for (const dispose of disposers)
            dispose(); catalogListeners.clear(); };
    }, 'dsh-skill-collections: catalog invalidation');
    // Older UI declaration merges still name this field SessionStore; use the
    // published sessions contract verified against the live Client service.
    const sessions = ctx.sessions;
    watchDirectory = (sessionId, changed) => ctx.effect(() => {
        const read = () => {
            // The optional working-directory plugin owns this wire key; do not pull
            // its Host Context declarations into the Client type program.
            const values = sessions.list.getSnapshot().projectionsBySession[sessionId]?.values;
            return typeof values?.workingDirectory === 'string' ? values.workingDirectory : undefined;
        };
        let previous = read();
        return sessions.list.subscribe(() => {
            const next = read();
            // A cold reference can drop its local projection on release. Absence is
            // not a directory change and must not cause a retain/refresh loop.
            if (next !== undefined && next !== previous) {
                previous = next;
                changed();
            }
        });
    }, 'dsh-skill-collections: selected session directory');
    readCatalog = async (sessionId, signal) => {
        return sessions.using(sessionId, { source: 'skillCollectionsCatalog', signal }, async (reference) => {
            signal.throwIfAborted();
            const state = reference.binding.session.getSnapshot();
            if (state.openState !== 'open')
                throw new Error(state.openError?.message ?? '会话尚未打开，无法读取原生 Skill 目录');
            const result = await ctx.remote.skills.list({ sessionId: sessionId }, signal);
            signal.throwIfAborted();
            if (!result.ok)
                throw new Error(`原生 Skill 目录读取失败：${result.error.message}`);
            return result.value.skills;
        });
    };
    openHostPath = async (path) => {
        const result = await ctx.remote.session.openWorkspacePath({ path });
        if (!result.ok)
            throw new Error(result.error.message);
    };
    ctx.effect(() => ctx.slots.inject('conversation.input.right', () => ctx.slots.register({
        name: 'conversation.input.right',
        id: 'skill-collections-management-entry',
        order: 99,
        label: 'Skill 管理',
    }, SkillManagementEntry)), 'dsh-skill-collections: management entry');
    ctx.effect(() => ctx.slots.inject('conversation.input.right', () => ctx.slots.register({
        name: 'conversation.input.right',
        id: 'skill-collections-picker',
        order: 100,
        label: 'Skill 快捷入口',
    }, SkillQuickPicker)), 'dsh-skill-collections: composer picker');
    ctx.effect(() => ctx.slots.inject('conversation.input.overlay', () => ctx.slots.register({
        name: 'conversation.input.overlay',
        id: 'skill-collections-management-overlay',
        order: 0,
    }, SkillManagementOverlay)), 'dsh-skill-collections: management overlay');
    ctx.effect(() => ctx.slots.inject('settings.section', () => ctx.slots.register({
        name: 'settings.section',
        id: 'skill-collections',
        order: 26,
        label: () => 'Skill 收藏夹',
        // The injector's static client preflight requires an inline component
        // marker; the runtime still receives the component through register's
        // canonical second argument.
        component: SkillCollectionsPanel,
    }, SkillCollectionsPanel)), 'dsh-skill-collections: settings section');
}
//# sourceMappingURL=index.js.map