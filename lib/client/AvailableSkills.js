import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { listAvailableSkills, subscribeCatalogChanges } from './index.js';
import css from './skill-collections.module.css';
/** Read-only view of the same session-addressed catalog as the native / menu. */
export function AvailableSkills({ sessionIds, preferredSessionId, query, refreshKey }) {
    const ids = [...new Set([...(preferredSessionId === undefined ? [] : [preferredSessionId]), ...sessionIds])];
    const [selected, setSelected] = useState(preferredSessionId);
    const sessionId = selected !== undefined && ids.includes(selected) ? selected : ids[0];
    const [refresh, setRefresh] = useState(0);
    const [state, setState] = useState({ loading: false, skills: [] });
    useEffect(() => subscribeCatalogChanges(changed => {
        if (changed === undefined || changed === sessionId)
            setRefresh(value => value + 1);
    }, sessionId), [sessionId]);
    useEffect(() => {
        if (sessionId === undefined)
            return;
        const abort = new AbortController();
        setState({ sessionId, loading: true, skills: [] });
        void listAvailableSkills(sessionId, abort.signal).then(skills => {
            if (!abort.signal.aborted)
                setState({ sessionId, loading: false, skills });
        }, error => {
            if (!abort.signal.aborted)
                setState({ sessionId, loading: false, skills: [], error: error instanceof Error ? error.message : String(error) });
        });
        return () => abort.abort();
    }, [sessionId, refreshKey, refresh]);
    const current = state.sessionId === sessionId ? state : undefined;
    const loading = sessionId !== undefined && (current === undefined || current.loading);
    const skills = current?.skills ?? [];
    const normalized = query.trim().toLocaleLowerCase();
    const filtered = skills.filter(skill => [skill.name, skill.description, skill.whenToUse ?? '', skill.path ?? ''].some(value => value.toLocaleLowerCase().includes(normalized)));
    return _jsxs("section", { className: css.availableSkills, "aria-label": "\u539F\u751F\u4F1A\u8BDD\u53EF\u7528 Skill \u76EE\u5F55", children: [_jsxs("div", { className: css.sectionHeader, children: [_jsxs("div", { children: [_jsx("h3", { children: "\u5F53\u524D\u4F1A\u8BDD\u53EF\u7528 Skill" }), _jsx("p", { children: "\u4E0E\u539F\u751F / \u83DC\u5355\u4F7F\u7528\u540C\u4E00\u76EE\u5F55\uFF0C\u5305\u542B\u672A\u6258\u7BA1\u3001\u672C\u5730\u3001\u5168\u5C40\u3001\u5185\u7F6E\u548C\u9884\u8BBE\u6280\u80FD\uFF1B\u4E0D\u540C\u4F1A\u8BDD\u7684\u9884\u8BBE\u53EF\u80FD\u4E0D\u540C\u3002" })] }), _jsx("span", { className: css.badge, children: loading ? '…' : `${filtered.length} / ${skills.length}` })] }), _jsxs("div", { className: css.listToolbar, children: [_jsxs("label", { className: css.catalogSession, children: ["\u67E5\u770B\u4F1A\u8BDD", _jsxs("select", { "aria-label": "\u9009\u62E9 Skill \u76EE\u5F55\u6240\u5C5E\u4F1A\u8BDD", value: sessionId ?? '', onChange: event => setSelected(event.currentTarget.value), children: [ids.length === 0 && _jsx("option", { value: "", children: "\u6682\u65E0\u4F1A\u8BDD" }), ids.map(id => _jsxs("option", { value: id, children: [id === preferredSessionId ? '当前会话 · ' : '会话 · ', id.slice(0, 12)] }, id))] })] }), _jsx("button", { className: css.catalogRefresh, type: "button", disabled: loading || sessionId === undefined, onClick: () => setRefresh(value => value + 1), children: "\u5237\u65B0\u76EE\u5F55" })] }), sessionId === undefined && _jsx("div", { className: css.emptyCompact, children: "\u6B64\u5DE5\u4F5C\u533A\u6682\u65E0\u4F1A\u8BDD\u3002\u65B0\u5EFA\u4F1A\u8BDD\u540E\uFF0C\u53EF\u6309\u5B83\u7684\u5B9E\u9645\u5DE5\u4F5C\u76EE\u5F55\u548C\u9884\u8BBE\u67E5\u770B\u5B8C\u6574 Skill \u5217\u8868\u3002" }), loading && _jsx("div", { className: css.emptyCompact, role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u539F\u751F Skill \u76EE\u5F55\u2026" }), current?.error && _jsxs("div", { className: css.error, role: "alert", children: [current.error, "\u3002\u672A\u7528\u6258\u7BA1\u5E93\u5217\u8868\u66FF\u4EE3\u539F\u751F\u7ED3\u679C\uFF0C\u8BF7\u5237\u65B0\u91CD\u8BD5\u3002"] }), !loading && !current?.error && _jsxs("div", { className: css.catalogList, children: [filtered.map(skill => _jsx("div", { className: css.row, children: _jsxs("div", { className: css.rowMain, children: [_jsxs("div", { className: css.rowTitle, children: ["/", skill.name, " ", _jsx("span", { className: `${css.status} ${css.status_linked}`, children: skill.modelInvocable ? '可用' : '仅手动调用' })] }), _jsx("div", { className: css.rowDescription, children: skill.description }), skill.path && _jsx("div", { className: css.path, children: skill.path })] }) }, skill.name)), sessionId !== undefined && filtered.length === 0 && _jsx("div", { className: css.emptyCompact, children: skills.length === 0 ? '原生目录中暂无可手动调用的 Skill。' : '没有匹配的可用 Skill。' })] })] });
}
//# sourceMappingURL=AvailableSkills.js.map