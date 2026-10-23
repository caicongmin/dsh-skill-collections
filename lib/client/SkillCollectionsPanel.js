import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Input, Modal } from '@deepseek-ai/dsh-client-ui-primitives';
import { openPath, rpc } from './index.js';
import { ConfirmationController } from './confirmation.js';
import css from './skill-collections.module.css';
const EMPTY_DRAFT = { id: '', name: '', description: '', skills: [] };
const MAX_UPLOAD_FILES = 500;
const MAX_UPLOAD_FILE_BYTES = 4 * 1024 * 1024;
const MAX_UPLOAD_TOTAL_BYTES = 12 * 1024 * 1024;
function errorText(error) {
    return error instanceof Error ? error.message : String(error);
}
function readAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = String(reader.result);
            const comma = result.indexOf(',');
            resolve(comma >= 0 ? result.slice(comma + 1) : result);
        };
        reader.onerror = () => reject(reader.error ?? new Error(`无法读取 ${file.name}`));
        reader.readAsDataURL(file);
    });
}
async function uploadFilesFromSelection(selected) {
    if (selected.length === 0 || selected.length > MAX_UPLOAD_FILES)
        throw new Error(`请选择包含 1-${MAX_UPLOAD_FILES} 个文件的单个 Skill 目录`);
    const roots = new Set(selected.map(file => file.webkitRelativePath.split('/')[0]).filter(Boolean));
    if (roots.size !== 1)
        throw new Error('一次只能选择一个 Skill 目录');
    const files = [];
    let totalBytes = 0;
    for (const file of selected) {
        const path = file.webkitRelativePath.split('/').slice(1).join('/');
        if (!path)
            continue;
        if (file.size > MAX_UPLOAD_FILE_BYTES)
            throw new Error(`单个文件超过 4 MiB：${path}`);
        totalBytes += file.size;
        if (totalBytes > MAX_UPLOAD_TOTAL_BYTES)
            throw new Error('Skill 目录总大小超过 12 MiB');
        files.push({ path, content: await readAsBase64(file) });
    }
    if (!files.some(file => file.path === 'SKILL.md'))
        throw new Error('请选择根目录含有 SKILL.md 的单个 Skill 目录');
    return files;
}
function SkillRow({ skill, scope, action, onDetails, }) {
    return (_jsxs("div", { className: css.skillRow, children: [_jsxs("button", { type: "button", className: css.skillSummary, onClick: onDetails, title: skill.description, children: [_jsx("strong", { children: skill.name }), _jsx("span", { className: css.skillScope, children: scope }), _jsx("span", { className: css.skillDescription, children: skill.description })] }), action && _jsx("div", { className: css.rowActions, children: action })] }));
}
export function SkillCollectionsPanel({ initialWorkspaceId, initialTab = 'library', context }) {
    const requestedWorkspaceId = context?.workspaceId ?? initialWorkspaceId;
    const requestedTab = context?.workspaceId === undefined ? initialTab : 'workspace';
    const [tab, setTab] = useState(requestedTab);
    const [snapshot, setSnapshot] = useState(null);
    const [workspaceId, setWorkspaceId] = useState(requestedWorkspaceId ?? '');
    const workspaceIdRef = useRef(workspaceId);
    workspaceIdRef.current = workspaceId;
    const loadRequestRef = useRef(0);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const [notice, setNotice] = useState(null);
    const [draft, setDraft] = useState(EMPTY_DRAFT);
    const [collectionEditorOpen, setCollectionEditorOpen] = useState(false);
    const [collectionSkillQuery, setCollectionSkillQuery] = useState('');
    const [libraryQuery, setLibraryQuery] = useState('');
    const [librarySort, setLibrarySort] = useState('name-asc');
    const [collectionQuery, setCollectionQuery] = useState('');
    const [collectionSort, setCollectionSort] = useState('name-asc');
    const [workspaceSkillQuery, setWorkspaceSkillQuery] = useState('');
    const [workspaceStatusFilter, setWorkspaceStatusFilter] = useState('all');
    const [selectedSkill, setSelectedSkill] = useState(null);
    const [openingPath, setOpeningPath] = useState(false);
    const directoryInputRef = useRef(null);
    const [confirmation, setConfirmation] = useState(null);
    const confirmationController = useMemo(() => new ConfirmationController(setConfirmation), []);
    useEffect(() => {
        confirmationController.activate();
        return () => confirmationController.dispose();
    }, [confirmationController]);
    const load = useCallback(async (nextWorkspaceId = workspaceIdRef.current) => {
        const request = ++loadRequestRef.current;
        setLoading(true);
        setError(null);
        try {
            const value = await rpc('snapshot', nextWorkspaceId ? { workspaceId: nextWorkspaceId } : {});
            if (request !== loadRequestRef.current)
                return;
            if (!nextWorkspaceId && value.workspaces[0]) {
                const id = value.workspaces[0].id;
                setWorkspaceId(id);
                const selected = await rpc('snapshot', { workspaceId: id });
                if (request === loadRequestRef.current)
                    setSnapshot(selected);
            }
            else
                setSnapshot(value);
        }
        catch (caught) {
            if (request === loadRequestRef.current)
                setError(errorText(caught));
        }
        finally {
            if (request === loadRequestRef.current)
                setLoading(false);
        }
    }, []);
    useEffect(() => () => { loadRequestRef.current += 1; }, []);
    useEffect(() => {
        if (requestedWorkspaceId !== undefined) {
            setWorkspaceId(requestedWorkspaceId);
            setTab(requestedTab);
        }
        void load(requestedWorkspaceId ?? '');
    }, [requestedTab, requestedWorkspaceId, load]);
    const mutate = useCallback(async (endpoint, args, success) => {
        setBusy(true);
        setError(null);
        setNotice(null);
        try {
            await rpc(endpoint, args);
            setNotice(success);
            await load();
            return true;
        }
        catch (caught) {
            setError(errorText(caught));
            return false;
        }
        finally {
            setBusy(false);
        }
    }, [load]);
    const collectionMap = useMemo(() => new Map(snapshot?.collections.map(item => [item.id, item]) ?? []), [snapshot]);
    const globalMap = useMemo(() => new Map(snapshot?.globalSkills.map(item => [item.name, item]) ?? []), [snapshot]);
    const workspace = snapshot?.workspace?.id === workspaceId ? snapshot.workspace : undefined;
    const toggleGlobal = async (name, enabled) => {
        const message = enabled
            ? `将“${name}”设为全局 Skill？它将对所有工作区生效，托管库原件和已有工作区绑定保持不变。`
            : `取消“${name}”的全局启用？只移除本插件创建的全局链接；托管库原件和已有工作区绑定保持不变。`;
        if (await confirmationController.request({ title: enabled ? '设为全局 Skill' : '取消全局 Skill', message, confirmLabel: enabled ? '设为全局' : '取消全局' })) {
            await mutate('global-skill', { name, enabled }, `Skill “${name}”已${enabled ? '设为全局' : '取消全局'}`);
        }
    };
    const deleteSkill = async (name) => {
        if (!await confirmationController.request({
            title: '删除托管 Skill', message: `确定删除“${name}”？这会删除托管库中的 Skill 文件，无法撤销。若仍被引用，需要再次确认。`, confirmLabel: '删除 Skill', danger: true,
        }))
            return;
        const ok = await mutate('library-delete', { name }, `Skill “${name}”已删除`);
        if (!ok && await confirmationController.request({
            title: '强制删除 Skill', message: `“${name}”删除失败。若它仍被收藏夹或工作区引用，强制删除会保留这些引用并产生缺失诊断。确定继续？全局链接保护不会被绕过。`, confirmLabel: '强制删除', danger: true,
        }))
            await mutate('library-delete', { name, force: true }, `Skill “${name}”已强制删除`);
    };
    const adoptSkill = async (name) => {
        if (await confirmationController.request({
            title: '收纳全局 Skill', message: `将“${name}”从全局目录收纳到托管库？全局原件会被移除，它将不再对所有工作区自动生效。`, confirmLabel: '收纳并移除全局原件', danger: true,
        }))
            await mutate('library-adopt-global', { name }, `Skill “${name}”已收纳`);
    };
    const deleteCurrentCollection = async () => {
        const { id, name } = draft;
        if (!await confirmationController.request({
            title: '删除收藏夹', message: `确定删除收藏夹“${name}”？只删除收藏夹定义，不会删除 Skill 文件。`, confirmLabel: '删除收藏夹', danger: true,
        }))
            return;
        let ok = await mutate('collection-delete', { id }, '收藏夹已删除');
        if (!ok && await confirmationController.request({
            title: '解绑并删除收藏夹', message: `“${name}”删除失败。若它已绑定工作区，强制删除将先从这些工作区解绑，再删除收藏夹。Skill 文件仍会保留。`, confirmLabel: '解绑并删除', danger: true,
        }))
            ok = await mutate('collection-delete', { id, force: true }, '收藏夹已解绑并删除');
        if (ok) {
            setDraft(EMPTY_DRAFT);
            setCollectionEditorOpen(false);
        }
    };
    const editCollection = (collection) => {
        setDraft(collection === undefined ? EMPTY_DRAFT : {
            id: collection.id,
            name: collection.name,
            description: collection.description,
            skills: [...collection.skills],
        });
        setCollectionSkillQuery('');
        setCollectionEditorOpen(true);
    };
    const saveDraft = async () => {
        const ok = await mutate('collection-save', { ...draft }, `收藏夹“${draft.name || draft.id}”已保存`);
        if (ok) {
            setDraft(EMPTY_DRAFT);
            setCollectionEditorOpen(false);
        }
    };
    const toggleDraftSkill = (name) => {
        setDraft(current => ({
            ...current,
            skills: current.skills.includes(name) ? current.skills.filter(skill => skill !== name) : [...current.skills, name].sort(),
        }));
    };
    const chooseSkillDirectory = (event) => {
        const selected = Array.from(event.target.files ?? []);
        event.target.value = '';
        if (selected.length === 0)
            return;
        setBusy(true);
        setError(null);
        setNotice(null);
        void uploadFilesFromSelection(selected)
            .then(files => rpc('library-upload', { files }))
            .then(async (result) => {
            setNotice(`Skill “${result.skill.name}”已导入固定托管库`);
            await load();
        })
            .catch(caught => setError(errorText(caught)))
            .finally(() => setBusy(false));
    };
    const editingExistingCollection = collectionMap.has(draft.id);
    const openSkillDirectory = async () => {
        if (selectedSkill === null || openingPath)
            return;
        setOpeningPath(true);
        setError(null);
        try {
            await openPath(selectedSkill.skill.path);
        }
        catch (caught) {
            setError(errorText(caught));
        }
        finally {
            setOpeningPath(false);
        }
    };
    const selectableSkills = useMemo(() => {
        const query = collectionSkillQuery.trim().toLocaleLowerCase();
        const rows = snapshot?.library ?? [];
        if (!query)
            return rows;
        return rows.filter(skill => skill.name.toLocaleLowerCase().includes(query) || skill.description.toLocaleLowerCase().includes(query));
    }, [collectionSkillQuery, snapshot]);
    const normalizedLibraryQuery = libraryQuery.trim().toLocaleLowerCase();
    const matchesSkill = useCallback((skill) => normalizedLibraryQuery === ''
        || skill.name.toLocaleLowerCase().includes(normalizedLibraryQuery)
        || skill.description.toLocaleLowerCase().includes(normalizedLibraryQuery), [normalizedLibraryQuery]);
    const sortSkills = useCallback((skills) => skills.slice().sort((a, b) => {
        if (librarySort === 'description') {
            const descriptionOrder = a.description.localeCompare(b.description);
            return descriptionOrder !== 0 ? descriptionOrder : a.name.localeCompare(b.name);
        }
        const nameOrder = a.name.localeCompare(b.name);
        return librarySort === 'name-desc' ? -nameOrder : nameOrder;
    }), [librarySort]);
    const filteredLibrary = useMemo(() => sortSkills((snapshot?.library ?? []).filter(matchesSkill)), [matchesSkill, snapshot, sortSkills]);
    const filteredGlobalSkills = useMemo(() => sortSkills((snapshot?.globalSkills ?? []).filter(matchesSkill)), [matchesSkill, snapshot, sortSkills]);
    const normalizedCollectionQuery = collectionQuery.trim().toLocaleLowerCase();
    const filteredCollections = useMemo(() => (snapshot?.collections ?? []).filter(collection => normalizedCollectionQuery === ''
        || collection.name.toLocaleLowerCase().includes(normalizedCollectionQuery)
        || collection.id.toLocaleLowerCase().includes(normalizedCollectionQuery)
        || collection.description.toLocaleLowerCase().includes(normalizedCollectionQuery)
        || collection.skills.some(skill => skill.toLocaleLowerCase().includes(normalizedCollectionQuery))).sort((a, b) => {
        if (collectionSort === 'count-desc')
            return b.skills.length - a.skills.length || a.name.localeCompare(b.name);
        return a.name.localeCompare(b.name);
    }), [collectionSort, normalizedCollectionQuery, snapshot]);
    const normalizedWorkspaceQuery = workspaceSkillQuery.trim().toLocaleLowerCase();
    const matchesWorkspaceSkill = (name) => normalizedWorkspaceQuery === '' || name.toLocaleLowerCase().includes(normalizedWorkspaceQuery);
    const filteredWorkspaceSkills = useMemo(() => (snapshot?.library ?? []).filter(skill => matchesWorkspaceSkill(skill.name)), [normalizedWorkspaceQuery, snapshot]);
    const filteredEffectiveSkills = useMemo(() => (workspace?.effective ?? []).filter(skill => {
        if (!matchesWorkspaceSkill(skill.name))
            return false;
        if (workspaceStatusFilter === 'linked')
            return skill.status === 'linked' || skill.status === 'global';
        if (workspaceStatusFilter === 'problem')
            return skill.status !== 'linked' && skill.status !== 'global';
        return true;
    }), [normalizedWorkspaceQuery, snapshot, workspace, workspaceStatusFilter]);
    if (loading && snapshot === null)
        return _jsx("div", { className: css.empty, children: "\u6B63\u5728\u52A0\u8F7D Skill \u6536\u85CF\u5939\u2026" });
    return (_jsxs("div", { className: css.root, children: [_jsxs("header", { className: css.header, children: [_jsxs("div", { children: [_jsx("h2", { children: "Skill \u6536\u85CF\u5939" }), _jsx("p", { children: "\u663E\u5F0F\u7EC4\u7EC7 Skill \u96C6\u5408\u5E76\u7ED1\u5B9A\u5230\u5DE5\u4F5C\u533A\uFF1B\u63D2\u4EF6\u4E0D\u4F1A\u81EA\u52A8\u8BC6\u522B\u9879\u76EE\u7C7B\u578B\u3002" })] }), _jsx(Button, { variant: "outline", size: "sm", disabled: loading || busy, onClick: () => void load(), children: "\u5237\u65B0" })] }), _jsx("nav", { className: css.tabs, "aria-label": "Skill \u6536\u85CF\u5939\u529F\u80FD", children: [['library', 'Skill 库'], ['collections', '收藏夹'], ['workspace', '工作区']].map(([id, label]) => (_jsx("button", { type: "button", className: tab === id ? css.tabActive : css.tab, onClick: () => setTab(id), children: label }, id))) }), error && _jsx("div", { className: css.error, role: "alert", children: error }), notice && _jsx("div", { className: css.notice, children: notice }), tab === 'library' && snapshot && (_jsxs("section", { className: css.section, children: [_jsxs("div", { className: css.sectionHeader, children: [_jsxs("div", { children: [_jsx("h3", { children: "\u6258\u7BA1 Skill \u5E93" }), _jsx("p", { children: "\u5B58\u50A8\u4F4D\u7F6E\u56FA\u5B9A\uFF1B\u8FD9\u91CC\u4E0D\u4F1A\u88AB DSH \u81EA\u52A8\u626B\u63CF\uFF0C\u53EA\u6709\u7ED1\u5B9A\u5DE5\u4F5C\u533A\u540E\u624D\u4F1A\u751F\u6210\u539F\u751F\u94FE\u63A5\u3002" })] }), _jsx("span", { className: css.badge, children: snapshot.library.length })] }), _jsxs("div", { className: css.libraryLocation, children: [_jsxs("div", { children: [_jsx("strong", { children: "\u56FA\u5B9A\u6258\u7BA1\u76EE\u5F55" }), _jsx("code", { children: snapshot.paths.library })] }), _jsx(Button, { variant: "primary", size: "sm", disabled: busy, onClick: () => directoryInputRef.current?.click(), children: busy ? '正在导入…' : '选择 Skill 目录' }), _jsx("input", { ref: directoryInputRef, type: "file", multiple: true, className: css.hiddenInput, webkitdirectory: '', directory: '', onChange: chooseSkillDirectory })] }), _jsxs("div", { className: css.listToolbar, children: [_jsx(Input, { className: css.listSearch, value: libraryQuery, onChange: event => setLibraryQuery(event.target.value), placeholder: "\u641C\u7D22\u6258\u7BA1\u548C\u5168\u5C40 Skill\u2026" }), _jsxs("select", { className: css.filterSelect, value: librarySort, onChange: event => setLibrarySort(event.target.value), "aria-label": "Skill \u6392\u5E8F", children: [_jsx("option", { value: "name-asc", children: "\u540D\u79F0 A-Z" }), _jsx("option", { value: "name-desc", children: "\u540D\u79F0 Z-A" }), _jsx("option", { value: "description", children: "\u6309\u63CF\u8FF0" })] }), _jsxs("span", { className: css.resultCount, children: [filteredLibrary.length + filteredGlobalSkills.length, " / ", snapshot.library.length + snapshot.globalSkills.length] })] }), _jsxs("div", { className: css.list, children: [snapshot.library.length === 0 && _jsx("div", { className: css.empty, children: "\u6258\u7BA1\u5E93\u4E3A\u7A7A\u3002\u8BF7\u9009\u62E9\u6839\u76EE\u5F55\u5305\u542B SKILL.md \u7684 Skill \u6587\u4EF6\u5939\uFF0C\u6216\u4ECE\u4E0B\u65B9\u5168\u5C40 Skill \u4E2D\u6536\u7EB3\u3002" }), snapshot.library.length > 0 && filteredLibrary.length === 0 && _jsx("div", { className: css.emptyCompact, children: "\u6CA1\u6709\u5339\u914D\u7684\u6258\u7BA1 Skill\u3002" }), filteredLibrary.map(skill => {
                                const global = globalMap.get(skill.name);
                                return _jsx(SkillRow, { skill: skill, scope: global ? '托管 · 全局' : '托管', onDetails: () => setSelectedSkill({ skill, scope: '托管 Skill' }), action: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "outline", size: "sm", disabled: busy || (global !== undefined && !global.globalManaged), onClick: () => void toggleGlobal(skill.name, global === undefined), children: global === undefined ? '设为全局' : global.globalManaged ? '取消全局' : '全局（外部）' }), _jsx(Button, { className: css.dangerLink, variant: "ghost", size: "sm", disabled: busy || global?.globalManaged, title: global?.globalManaged ? '请先取消全局，再删除托管 Skill' : undefined, onClick: () => void deleteSkill(skill.name), children: "\u5220\u9664" })] }) }, skill.name);
                            })] }), _jsxs("div", { className: css.sectionHeaderSecondary, children: [_jsxs("div", { children: [_jsx("h3", { children: "\u5F53\u524D\u5168\u5C40 Skill" }), _jsx("p", { children: "\u5BF9\u6240\u6709\u5DE5\u4F5C\u533A\u751F\u6548\u3002\u6258\u7BA1\u94FE\u63A5\u53EF\u76F4\u63A5\u201C\u53D6\u6D88\u5168\u5C40\u201D\uFF1B\u5916\u90E8 Skill \u7684\u201C\u6536\u7EB3\u201D\u4F1A\u590D\u5236\u5230\u6258\u7BA1\u5E93\u5E76\u79FB\u9664\u5168\u5C40\u539F\u4EF6\u3002" })] }), _jsxs("span", { className: css.badgeMuted, children: [filteredGlobalSkills.length, " / ", snapshot.globalSkills.length] })] }), _jsxs("div", { className: css.list, children: [snapshot.globalSkills.length === 0 && _jsx("div", { className: css.emptyCompact, children: "\u6682\u65E0\u5168\u5C40 Skill\u3002\u53EF\u5728\u6258\u7BA1 Skill \u65C1\u70B9\u51FB\u201C\u8BBE\u4E3A\u5168\u5C40\u201D\u3002" }), snapshot.globalSkills.length > 0 && filteredGlobalSkills.length === 0 && _jsx("div", { className: css.emptyCompact, children: "\u6CA1\u6709\u5339\u914D\u7684\u5168\u5C40 Skill\u3002" }), filteredGlobalSkills.map(skill => _jsx(SkillRow, { skill: skill, scope: skill.globalManaged ? '全局 · 托管链接' : '全局 · 外部', onDetails: () => setSelectedSkill({ skill, scope: '全局 Skill' }), action: skill.globalManaged ?
                                    _jsx(Button, { variant: "outline", size: "sm", disabled: busy, onClick: () => void toggleGlobal(skill.name, false), children: "\u53D6\u6D88\u5168\u5C40" }) :
                                    _jsx(Button, { variant: "outline", size: "sm", disabled: busy || snapshot.library.some(item => item.name === skill.name), onClick: () => void adoptSkill(skill.name), children: "\u6536\u7EB3" }) }, skill.name))] })] })), tab === 'collections' && snapshot && (_jsxs("section", { className: css.section, children: [_jsxs("div", { className: css.sectionHeader, children: [_jsxs("div", { children: [_jsx("h3", { children: "\u6536\u85CF\u5939" }), _jsx("p", { children: "\u6BCF\u4E2A\u6536\u85CF\u5939\u662F\u4E00\u7EC4 Skill \u5F15\u7528\u3002\u70B9\u51FB\u4E00\u884C\u5373\u53EF\u67E5\u770B\u6216\u7F16\u8F91\u3002" })] }), _jsx(Button, { variant: "primary", size: "sm", onClick: () => editCollection(), children: "\u65B0\u5EFA\u6536\u85CF\u5939" })] }), _jsxs("div", { className: css.listToolbar, children: [_jsx(Input, { className: css.listSearch, value: collectionQuery, onChange: event => setCollectionQuery(event.target.value), placeholder: "\u641C\u7D22\u6536\u85CF\u5939\u3001\u63CF\u8FF0\u6216 Skill\u2026" }), _jsxs("select", { className: css.filterSelect, value: collectionSort, onChange: event => setCollectionSort(event.target.value), "aria-label": "\u6536\u85CF\u5939\u6392\u5E8F", children: [_jsx("option", { value: "name-asc", children: "\u540D\u79F0 A-Z" }), _jsx("option", { value: "count-desc", children: "Skill \u6570\u91CF" })] }), _jsxs("span", { className: css.resultCount, children: [filteredCollections.length, " / ", snapshot.collections.length] })] }), _jsxs("div", { className: css.collectionRows, children: [filteredCollections.map(collection => (_jsxs("button", { type: "button", className: css.collectionRow, onClick: () => editCollection(collection), children: [_jsx("strong", { children: collection.name }), _jsx("span", { className: css.collectionDescription, children: collection.description || collection.id }), _jsxs("span", { className: css.collectionCount, children: [collection.skills.length, " \u4E2A Skill"] })] }, collection.id))), snapshot.collections.length === 0 && _jsx("div", { className: css.empty, children: "\u8FD8\u6CA1\u6709\u6536\u85CF\u5939\u3002\u70B9\u51FB\u201C\u65B0\u5EFA\u6536\u85CF\u5939\u201D\u5F00\u59CB\u6574\u7406 Skill\u3002" }), snapshot.collections.length > 0 && filteredCollections.length === 0 && _jsx("div", { className: css.emptyCompact, children: "\u6CA1\u6709\u5339\u914D\u7684\u6536\u85CF\u5939\u3002" })] })] })), tab === 'workspace' && snapshot && (_jsxs("section", { className: css.section, children: [_jsxs("div", { className: css.workspaceToolbar, children: [_jsxs("label", { children: ["\u5DE5\u4F5C\u533A", _jsx("select", { value: workspaceId, onChange: event => {
                                            const id = event.target.value;
                                            setWorkspaceId(id);
                                            void load(id);
                                        }, children: snapshot.workspaces.map(item => _jsxs("option", { value: item.id, children: [item.title, " \u2014 ", item.path] }, item.id)) })] }), _jsx(Button, { variant: "outline", size: "sm", disabled: busy || !workspaceId, onClick: () => void mutate('workspace-sync', { workspaceId }, '工作区链接已同步'), children: "\u91CD\u65B0\u540C\u6B65" })] }), _jsx("div", { className: css.listToolbar, children: _jsx(Input, { className: css.listSearch, value: workspaceSkillQuery, onChange: event => setWorkspaceSkillQuery(event.target.value), placeholder: "\u641C\u7D22\u5F53\u524D\u5DE5\u4F5C\u533A Skill\u2026" }) }), !workspace && _jsx("div", { className: css.empty, children: "\u8BF7\u9009\u62E9\u5DF2\u6CE8\u518C\u7684\u5DE5\u4F5C\u533A\u3002" }), workspace && _jsxs(_Fragment, { children: [_jsxs("div", { className: css.workspaceColumns, children: [_jsxs("div", { children: [_jsx("h3", { children: "\u542F\u7528\u6536\u85CF\u5939" }), _jsx("div", { className: css.toggleList, children: snapshot.collections.filter(collection => normalizedWorkspaceQuery === ''
                                                    || collection.name.toLocaleLowerCase().includes(normalizedWorkspaceQuery)
                                                    || collection.skills.some(skill => skill.toLocaleLowerCase().includes(normalizedWorkspaceQuery))).map(collection => {
                                                    const enabled = workspace.config.collections.includes(collection.id);
                                                    return _jsxs("label", { className: css.toggleRow, children: [_jsx("input", { type: "checkbox", checked: enabled, disabled: busy, onChange: () => void mutate('workspace-collection', { workspaceId, id: collection.id, enabled: !enabled }, enabled ? '收藏夹已从工作区移除' : '收藏夹已绑定到工作区') }), _jsxs("span", { children: [_jsx("strong", { children: collection.name }), _jsx("small", { children: collection.skills.join('、') || '空收藏夹' })] })] }, collection.id);
                                                }) })] }), _jsxs("div", { children: [_jsx("h3", { children: "\u5355\u4E2A Skill \u8986\u76D6" }), _jsxs("div", { className: css.toggleList, children: [filteredWorkspaceSkills.map(skill => {
                                                        const direct = workspace.config.skills.enabled.includes(skill.name);
                                                        const global = globalMap.has(skill.name);
                                                        const disabled = workspace.config.skills.disabled.includes(skill.name);
                                                        const effective = workspace.effective.some(item => item.name === skill.name);
                                                        const mode = disabled ? 'clear' : effective && !direct ? 'disable' : direct ? 'clear' : 'enable';
                                                        const label = disabled ? '清除禁用' : effective && !direct ? '在此禁用' : direct ? '移除单独启用' : '单独启用';
                                                        return _jsxs("div", { className: css.overrideRow, children: [_jsxs("span", { children: [_jsx("strong", { children: skill.name }), _jsx("small", { children: global ? '全局生效，工作区覆盖不能屏蔽全局 Skill' : disabled ? '工作区禁用覆盖' : direct ? '工作区单独启用' : effective ? '来自收藏夹' : '未启用' })] }), _jsx(Button, { variant: "outline", size: "sm", disabled: busy || global, onClick: () => void mutate('workspace-skill', { workspaceId, skill: skill.name, mode }, `${skill.name}: ${label}`), children: global ? '全局生效' : label })] }, skill.name);
                                                    }), filteredWorkspaceSkills.length === 0 && _jsx("div", { className: css.emptyCompact, children: "\u6CA1\u6709\u5339\u914D\u7684\u6258\u7BA1 Skill\u3002" })] })] })] }), _jsxs("details", { className: css.bindingDiagnostics, children: [_jsx("summary", { children: "\u6258\u7BA1\u7ED1\u5B9A\u4E0E\u5168\u5C40\u76EE\u5F55\u8BCA\u65AD\uFF08\u4E0D\u662F\u5B8C\u6574\u53EF\u7528\u76EE\u5F55\uFF09" }), _jsxs("div", { className: css.sectionHeaderSecondary, children: [_jsxs("div", { children: [_jsx("h3", { children: "\u7ED1\u5B9A\u8BCA\u65AD" }), _jsx("p", { children: "\u7528\u4E8E\u68C0\u67E5\u672C\u63D2\u4EF6\u7684\u94FE\u63A5\u3001\u5168\u5C40\u76EE\u5F55\u53CA\u51B2\u7A81\uFF1B\u67E5\u770B\u5F53\u524D\u4F1A\u8BDD\u53EF\u7528\u6280\u80FD\u8BF7\u4F7F\u7528\u8F93\u5165\u6846\u65C1\u7684 Skill \u5FEB\u6377\u9009\u62E9\u3002" })] }), _jsxs("span", { className: css.badge, children: [filteredEffectiveSkills.length, " / ", workspace.effective.length] })] }), _jsx("div", { className: css.listToolbar, children: _jsxs("select", { className: css.filterSelect, value: workspaceStatusFilter, onChange: event => setWorkspaceStatusFilter(event.target.value), "aria-label": "\u7B5B\u9009\u6258\u7BA1\u7ED1\u5B9A\u8BCA\u65AD\u72B6\u6001", children: [_jsx("option", { value: "all", children: "\u5168\u90E8\u7ED1\u5B9A\u72B6\u6001" }), _jsx("option", { value: "linked", children: "\u5DF2\u94FE\u63A5 / \u5168\u5C40" }), _jsx("option", { value: "problem", children: "\u5F02\u5E38\u9879" })] }) }), _jsxs("div", { className: css.list, children: [filteredEffectiveSkills.map(skill => (_jsx("div", { className: css.row, children: _jsxs("div", { className: css.rowMain, children: [_jsxs("div", { className: css.rowTitle, children: [skill.name, " ", _jsx("span", { className: `${css.status} ${css[`status_${skill.status}`]}`, children: skill.status === 'global' ? '全局生效' : skill.status })] }), _jsx("div", { className: css.rowDescription, children: skill.sources.map(source => source === 'global' ? '全局' : source === 'workspace:local' ? '工作区本地' : source).join(' · ') }), skill.detail && _jsx("div", { className: css.warning, children: skill.detail }), skill.targetPath && _jsx("div", { className: css.path, children: skill.targetPath })] }) }, skill.name))), workspace.effective.length === 0 && _jsx("div", { className: css.empty, children: "\u8BE5\u5DE5\u4F5C\u533A\u6682\u65E0\u5168\u5C40\u6216\u6258\u7BA1 Skill\u3002" }), workspace.effective.length > 0 && filteredEffectiveSkills.length === 0 && _jsx("div", { className: css.emptyCompact, children: "\u6CA1\u6709\u5339\u914D\u7684\u7ED1\u5B9A\u8BCA\u65AD\u3002" })] })] })] })] })), _jsx(Modal, { open: selectedSkill !== null, onClose: () => setSelectedSkill(null), title: selectedSkill?.skill.name ?? 'Skill 详情', closeLabel: "\u5173\u95ED", description: selectedSkill?.scope, className: css.detailModal, footer: _jsxs(_Fragment, { children: [selectedSkill?.skill.layout === 'directory' && _jsx(Button, { variant: "outline", size: "sm", disabled: openingPath, onClick: () => void openSkillDirectory(), children: openingPath ? '正在打开…' : '打开目录' }), _jsx(Button, { variant: "primary", size: "sm", onClick: () => setSelectedSkill(null), children: "\u5B8C\u6210" })] }), children: selectedSkill && _jsxs("dl", { className: css.detailList, children: [_jsxs("div", { children: [_jsx("dt", { children: "\u8BF4\u660E" }), _jsx("dd", { children: selectedSkill.skill.description })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u683C\u5F0F" }), _jsx("dd", { children: selectedSkill.skill.layout === 'directory' ? '目录型 Skill' : '平铺 Markdown Skill' })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u8DEF\u5F84" }), _jsx("dd", { children: _jsx("code", { children: selectedSkill.skill.path }) })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u7B26\u53F7\u94FE\u63A5" }), _jsx("dd", { children: selectedSkill.skill.isSymlink ? selectedSkill.skill.linkTarget ?? '是' : '否' })] })] }) }), _jsx(Modal, { open: collectionEditorOpen, onClose: () => !busy && setCollectionEditorOpen(false), title: editingExistingCollection ? '编辑收藏夹' : '新建收藏夹', closeLabel: "\u5173\u95ED", description: "\u6536\u85CF\u5939\u53EA\u4FDD\u5B58 Skill \u5F15\u7528\uFF0C\u4E0D\u590D\u5236\u6216\u79FB\u52A8 Skill \u6587\u4EF6\u3002", className: css.collectionModal, contentClassName: css.collectionModalContent, footer: _jsxs(_Fragment, { children: [editingExistingCollection && _jsx(Button, { className: css.modalDelete, variant: "outline", size: "sm", disabled: busy, onClick: () => void deleteCurrentCollection(), children: "\u5220\u9664" }), _jsx(Button, { variant: "ghost", size: "sm", disabled: busy, onClick: () => setCollectionEditorOpen(false), children: "\u53D6\u6D88" }), _jsx(Button, { variant: "primary", size: "sm", disabled: busy || !draft.id || !draft.name, onClick: () => void saveDraft(), children: "\u4FDD\u5B58" })] }), children: _jsxs("div", { className: css.modalForm, children: [_jsxs("label", { children: ["ID", _jsx("input", { value: draft.id, disabled: editingExistingCollection, onChange: event => setDraft(current => ({ ...current, id: event.target.value })), placeholder: "unity-development" })] }), _jsxs("label", { children: ["\u540D\u79F0", _jsx("input", { value: draft.name, onChange: event => setDraft(current => ({ ...current, name: event.target.value })), placeholder: "Unity \u5F00\u53D1" })] }), _jsxs("label", { children: ["\u8BF4\u660E", _jsx("textarea", { value: draft.description, onChange: event => setDraft(current => ({ ...current, description: event.target.value })), rows: 3, placeholder: "\u8FD9\u4E2A\u6536\u85CF\u5939\u9002\u5408\u4EC0\u4E48\u5DE5\u4F5C" })] }), _jsxs("div", { className: css.skillPickerHeader, children: [_jsxs("div", { children: [_jsx("strong", { children: "\u9009\u62E9 Skill" }), _jsxs("span", { children: ["\u5DF2\u9009\u62E9 ", draft.skills.length, " \u4E2A"] })] }), _jsx(Input, { className: css.skillSearch, value: collectionSkillQuery, onChange: event => setCollectionSkillQuery(event.target.value), placeholder: "\u641C\u7D22 Skill" })] }), _jsxs("div", { className: css.modalSkillList, children: [selectableSkills.map(skill => (_jsxs("label", { className: css.modalSkillRow, children: [_jsx("input", { type: "checkbox", checked: draft.skills.includes(skill.name), onChange: () => toggleDraftSkill(skill.name) }), _jsx("strong", { children: skill.name }), _jsx("span", { children: skill.description })] }, skill.name))), selectableSkills.length === 0 && _jsx("div", { className: css.emptyCompact, children: "\u6CA1\u6709\u5339\u914D\u7684 Skill\u3002" })] })] }) }), _jsx(Modal, { open: confirmation !== null, onClose: () => confirmationController.answer(false), title: confirmation?.title ?? '确认操作', closeLabel: "\u53D6\u6D88\u64CD\u4F5C", className: css.confirmationModal, footer: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "outline", size: "sm", "data-modal-autofocus": true, onClick: () => confirmationController.answer(false), children: "\u53D6\u6D88" }), _jsx(Button, { variant: confirmation?.danger ? 'outline' : 'primary', className: confirmation?.danger ? css.dangerButton : undefined, size: "sm", onClick: () => confirmationController.answer(true), children: confirmation?.confirmLabel ?? '确认' })] }), children: _jsx("p", { className: css.confirmationMessage, children: confirmation?.message }) })] }));
}
//# sourceMappingURL=SkillCollectionsPanel.js.map