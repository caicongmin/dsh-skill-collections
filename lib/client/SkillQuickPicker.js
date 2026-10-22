import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { IconChevronDownOutlineRegular, IconRefreshOutlineRegular, IconSearchOutlineRegular, } from '@deepseek-ai/dsh-client-ui-primitives';
import { listAvailableSkills, subscribeCatalogChanges } from './index.js';
import { buildInsertedDraft } from './draft.js';
import { LightningIcon } from './LightningIcon.js';
import { effectivePickerSkills } from './picker-skills.js';
import css from './skill-collections.module.css';
const USAGE_KEY = 'dsh-skill-collections:skill-usage';
const MAX_RECENT = 6;
const UNSCOPED_WORKSPACE = '__unscoped__';
function loadUsage(workspaceId) {
    try {
        const raw = localStorage.getItem(USAGE_KEY);
        if (raw === null)
            return {};
        const parsed = JSON.parse(raw);
        return parsed[workspaceId] ?? {};
    }
    catch {
        return {};
    }
}
function saveUsage(workspaceId, value) {
    try {
        const raw = localStorage.getItem(USAGE_KEY);
        const parsed = raw === null ? {} : JSON.parse(raw);
        parsed[workspaceId] = value;
        localStorage.setItem(USAGE_KEY, JSON.stringify(parsed));
    }
    catch {
        // UI recency is optional; a storage failure must not block invocation.
    }
}
function rankByUsage(skills, usage) {
    return skills.slice().sort((a, b) => {
        const ua = usage[a.name];
        const ub = usage[b.name];
        const last = (ub?.lastUsed ?? 0) - (ua?.lastUsed ?? 0);
        if (last !== 0)
            return last;
        const count = (ub?.count ?? 0) - (ua?.count ?? 0);
        return count !== 0 ? count : a.name.localeCompare(b.name);
    });
}
function findComposerTextarea(box) {
    let current = box;
    while (current !== null) {
        const card = current.matches('[data-composer-card]')
            ? current
            : current.querySelector('[data-composer-card]');
        if (card !== null) {
            const textarea = card.querySelector('textarea');
            return textarea instanceof HTMLTextAreaElement ? textarea : null;
        }
        current = current.parentElement;
    }
    return null;
}
export function SkillQuickPicker(props) {
    const sessionCwd = props.useSessions(state => state.byId[props.sessionId]?.cwd);
    const workspaces = props.useWorkspaces(state => state.items);
    const workspaceId = workspaces.find(workspace => workspace.sessionIds.some((id) => String(id) === String(props.sessionId)))?.workspaceId
        ?? workspaces.find(workspace => workspace.path === sessionCwd)?.workspaceId;
    const resolvedWorkspaceId = workspaceId === undefined ? UNSCOPED_WORKSPACE : String(workspaceId);
    const draft = props.useInput(state => state.draft);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [catalog, setCatalog] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [usage, setUsage] = useState(() => loadUsage(resolvedWorkspaceId));
    const [activeIndex, setActiveIndex] = useState(0);
    const boxRef = useRef(null);
    const textareaFocusedRef = useRef(false);
    const selectionRef = useRef(undefined);
    const requestRef = useRef(0);
    const abortRef = useRef(null);
    useEffect(() => {
        setUsage(loadUsage(resolvedWorkspaceId));
    }, [resolvedWorkspaceId]);
    const load = useCallback(async () => {
        const request = ++requestRef.current;
        abortRef.current?.abort();
        const abort = new AbortController();
        abortRef.current = abort;
        setCatalog(null);
        setLoading(true);
        setError(null);
        try {
            const value = await listAvailableSkills(String(props.sessionId), abort.signal);
            if (request === requestRef.current)
                setCatalog(value);
        }
        catch (caught) {
            if (request === requestRef.current)
                setError(caught instanceof Error ? caught.message : String(caught));
        }
        finally {
            if (request === requestRef.current)
                setLoading(false);
        }
    }, [props.sessionId, sessionCwd]);
    useEffect(() => {
        if (open)
            void load();
        return () => { requestRef.current += 1; abortRef.current?.abort(); };
    }, [open, load]);
    useEffect(() => {
        if (!open)
            return;
        return subscribeCatalogChanges(sessionId => {
            if (sessionId === undefined || sessionId === String(props.sessionId))
                void load();
        }, String(props.sessionId));
    }, [open, load, props.sessionId]);
    const toggle = () => {
        const textarea = findComposerTextarea(boxRef.current);
        if (textarea !== null && textarea.value === draft) {
            textareaFocusedRef.current = true;
            selectionRef.current = { start: textarea.selectionStart, end: textarea.selectionEnd };
        }
        setOpen(value => !value);
        setQuery('');
        setActiveIndex(0);
    };
    const skills = useMemo(() => effectivePickerSkills(catalog), [catalog]);
    const ordered = useMemo(() => rankByUsage(skills, usage), [skills, usage]);
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const filtered = ordered.filter(skill => normalizedQuery === ''
        || skill.name.toLocaleLowerCase().includes(normalizedQuery)
        || skill.description.toLocaleLowerCase().includes(normalizedQuery));
    const recent = normalizedQuery === ''
        ? filtered.filter(skill => (usage[skill.name]?.lastUsed ?? 0) > 0).slice(0, MAX_RECENT)
        : [];
    const recentNames = new Set(recent.map(skill => skill.name));
    const rest = filtered.filter(skill => !recentNames.has(skill.name));
    const items = [...recent, ...rest];
    const pick = (name) => {
        const currentDraft = typeof draft === 'string' ? draft : '';
        let range;
        const textarea = findComposerTextarea(boxRef.current);
        if (textarea !== null && textarea.value === currentDraft && textareaFocusedRef.current) {
            range = selectionRef.current ?? { start: textarea.selectionStart, end: textarea.selectionEnd };
        }
        const inserted = buildInsertedDraft(currentDraft, name, range);
        props.inputActions.setDraft(inserted.text);
        const nextUsage = {
            ...usage,
            [name]: { count: (usage[name]?.count ?? 0) + 1, lastUsed: Date.now() },
        };
        setUsage(nextUsage);
        saveUsage(resolvedWorkspaceId, nextUsage);
        setOpen(false);
        setQuery('');
        if (textarea !== null && typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(() => {
                textarea.focus();
                if (textarea.value === inserted.text)
                    textarea.setSelectionRange(inserted.caret, inserted.caret);
            });
        }
    };
    useEffect(() => {
        if (!open)
            return;
        const onFocusIn = (event) => {
            const textarea = findComposerTextarea(boxRef.current);
            if (textarea !== null && event.target === textarea) {
                textareaFocusedRef.current = true;
                selectionRef.current = { start: textarea.selectionStart, end: textarea.selectionEnd };
            }
        };
        const onPointerDown = (event) => {
            if (boxRef.current !== null && event.target instanceof Node && !boxRef.current.contains(event.target))
                setOpen(false);
        };
        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                setOpen(false);
                return;
            }
            if (event.key === 'ArrowDown') {
                event.preventDefault();
                setActiveIndex(index => Math.min(index + 1, Math.max(items.length - 1, 0)));
            }
            else if (event.key === 'ArrowUp') {
                event.preventDefault();
                setActiveIndex(index => Math.max(index - 1, 0));
            }
            else if (event.key === 'Enter' && items[activeIndex] !== undefined) {
                event.preventDefault();
                pick(items[activeIndex].name);
            }
        };
        document.addEventListener('focusin', onFocusIn);
        document.addEventListener('pointerdown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('focusin', onFocusIn);
            document.removeEventListener('pointerdown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open, activeIndex, items, pick]);
    const renderItem = (skill, index) => (_jsxs("button", { type: "button", role: "option", "aria-selected": index === activeIndex, className: `${css.quickItem} ${index === activeIndex ? css.quickItemActive : ''}`, onMouseEnter: () => setActiveIndex(index), onClick: () => pick(skill.name), children: [_jsxs("span", { className: css.quickItemName, children: ["/", skill.name, " ", _jsx("small", { children: skill.scope })] }), _jsx("span", { className: css.quickItemDescription, children: skill.description || '无描述' })] }, skill.name));
    return (_jsxs("div", { ref: boxRef, className: css.quickPicker, children: [_jsxs("button", { type: "button", className: `${css.quickButton} ${open ? css.quickButtonActive : ''}`, onClick: toggle, title: "\u9009\u62E9\u5F53\u524D\u5DE5\u4F5C\u533A Skill", "aria-label": "\u9009\u62E9\u5F53\u524D\u5DE5\u4F5C\u533A Skill", "aria-expanded": open, "aria-haspopup": "dialog", onMouseDown: event => event.preventDefault(), children: [_jsx(LightningIcon, {}), _jsx(IconChevronDownOutlineRegular, { className: css.quickChevron })] }), open && (_jsxs("div", { className: css.quickPopover, role: "dialog", "aria-label": "\u9009\u62E9 Skill", children: [_jsxs("div", { className: css.quickHeader, children: [_jsxs("div", { className: css.quickTitle, children: [_jsx(LightningIcon, {}), " ", _jsx("strong", { children: "\u5F53\u524D\u4F1A\u8BDD\u53EF\u7528 Skill" }), _jsx("span", { children: skills.length })] }), _jsx("button", { type: "button", className: css.quickIconButton, onClick: () => void load(), title: "\u5237\u65B0 Skill \u5217\u8868", "aria-label": "\u5237\u65B0 Skill \u5217\u8868", children: _jsx(IconRefreshOutlineRegular, { size: 14 }) })] }), _jsxs("div", { className: css.quickSearchRow, children: [_jsx(IconSearchOutlineRegular, {}), _jsx("input", { className: css.quickSearch, value: query, onChange: event => { setQuery(event.currentTarget.value); setActiveIndex(0); }, placeholder: "\u641C\u7D22\u540D\u79F0\u6216\u63CF\u8FF0\u2026", autoFocus: true })] }), loading && _jsx("div", { className: css.quickStatus, children: "\u6B63\u5728\u8BFB\u53D6\u539F\u751F\u4F1A\u8BDD Skill \u76EE\u5F55\u2026" }), !loading && error !== null && _jsx("div", { className: css.quickStatusError, children: error }), !loading && error === null && items.length === 0 && (_jsx("div", { className: css.quickStatus, children: skills.length === 0 ? '原生目录中暂无可手动调用的 Skill。' : '没有匹配的 Skill。' })), !loading && error === null && items.length > 0 && (_jsxs("div", { className: css.quickList, role: "listbox", "aria-label": "\u5F53\u524D\u4F1A\u8BDD\u5168\u90E8\u53EF\u7528 Skill", children: [recent.length > 0 && _jsx("div", { className: css.quickSectionLabel, children: "\u6700\u8FD1\u4F7F\u7528" }), recent.map((skill, index) => renderItem(skill, index)), rest.length > 0 && _jsx("div", { className: css.quickSectionLabel, children: "\u5168\u90E8\u6280\u80FD" }), rest.map((skill, index) => renderItem(skill, recent.length + index))] })), _jsxs("div", { className: css.quickFooter, children: ["\u9009\u62E9\u540E\u63D2\u5165\u539F\u751F ", _jsx("code", { children: "/\u6280\u80FD\u540D" }), "\uFF0C\u4ECD\u53EF\u7EE7\u7EED\u7F16\u8F91"] })] }))] }));
}
//# sourceMappingURL=SkillQuickPicker.js.map