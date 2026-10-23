import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { Button, Input, Modal } from '@deepseek-ai/dsh-client-ui-primitives'
import { openPath, rpc } from './index.js'
import type { CollectionInfo, SkillInfo, Snapshot } from './types.js'
import { ConfirmationController, type ConfirmationOptions } from './confirmation.js'
import css from './skill-collections.module.css'

type Props = PropsRuntime<'settings.section'>
type Tab = 'library' | 'collections' | 'workspace'

interface Draft {
  id: string
  name: string
  description: string
  skills: string[]
}

const EMPTY_DRAFT: Draft = { id: '', name: '', description: '', skills: [] }
const MAX_UPLOAD_FILES = 500
const MAX_UPLOAD_FILE_BYTES = 4 * 1024 * 1024
const MAX_UPLOAD_TOTAL_BYTES = 12 * 1024 * 1024

interface UploadFile {
  readonly path: string
  readonly content: string
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result)
      const comma = result.indexOf(',')
      resolve(comma >= 0 ? result.slice(comma + 1) : result)
    }
    reader.onerror = () => reject(reader.error ?? new Error(`无法读取 ${file.name}`))
    reader.readAsDataURL(file)
  })
}

async function uploadFilesFromSelection(selected: readonly File[]): Promise<UploadFile[]> {
  if (selected.length === 0 || selected.length > MAX_UPLOAD_FILES) throw new Error(`请选择包含 1-${MAX_UPLOAD_FILES} 个文件的单个 Skill 目录`)
  const roots = new Set(selected.map(file => file.webkitRelativePath.split('/')[0]).filter(Boolean))
  if (roots.size !== 1) throw new Error('一次只能选择一个 Skill 目录')
  const files: UploadFile[] = []
  let totalBytes = 0
  for (const file of selected) {
    const path = file.webkitRelativePath.split('/').slice(1).join('/')
    if (!path) continue
    if (file.size > MAX_UPLOAD_FILE_BYTES) throw new Error(`单个文件超过 4 MiB：${path}`)
    totalBytes += file.size
    if (totalBytes > MAX_UPLOAD_TOTAL_BYTES) throw new Error('Skill 目录总大小超过 12 MiB')
    files.push({ path, content: await readAsBase64(file) })
  }
  if (!files.some(file => file.path === 'SKILL.md')) throw new Error('请选择根目录含有 SKILL.md 的单个 Skill 目录')
  return files
}

function SkillRow({
  skill,
  scope,
  action,
  onDetails,
}: {
  readonly skill: SkillInfo
  readonly scope: string
  readonly action?: JSX.Element
  readonly onDetails: () => void
}): JSX.Element {
  return (
    <div className={css.skillRow}>
      <button type="button" className={css.skillSummary} onClick={onDetails} title={skill.description}>
        <strong>{skill.name}</strong>
        <span className={css.skillScope}>{scope}</span>
        <span className={css.skillDescription}>{skill.description}</span>
      </button>
      {action && <div className={css.rowActions}>{action}</div>}
    </div>
  )
}

export function SkillCollectionsPanel({ initialWorkspaceId, initialTab = 'library', context }: Partial<Props> & { readonly initialWorkspaceId?: string; readonly initialSessionId?: string; readonly initialTab?: Tab; readonly context?: { workspaceId?: string } }): JSX.Element {
  const requestedWorkspaceId = context?.workspaceId ?? initialWorkspaceId
  const requestedTab = context?.workspaceId === undefined ? initialTab : 'workspace'
  const [tab, setTab] = useState<Tab>(requestedTab)
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [workspaceId, setWorkspaceId] = useState(requestedWorkspaceId ?? '')
  const workspaceIdRef = useRef(workspaceId)
  workspaceIdRef.current = workspaceId
  const loadRequestRef = useRef(0)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)
  const [collectionEditorOpen, setCollectionEditorOpen] = useState(false)
  const [collectionSkillQuery, setCollectionSkillQuery] = useState('')
  const [libraryQuery, setLibraryQuery] = useState('')
  const [librarySort, setLibrarySort] = useState<'name-asc' | 'name-desc' | 'description'>('name-asc')
  const [collectionQuery, setCollectionQuery] = useState('')
  const [collectionSort, setCollectionSort] = useState<'name-asc' | 'count-desc'>('name-asc')
  const [workspaceSkillQuery, setWorkspaceSkillQuery] = useState('')
  const [workspaceStatusFilter, setWorkspaceStatusFilter] = useState<'all' | 'linked' | 'problem'>('all')
  const [selectedSkill, setSelectedSkill] = useState<{ readonly skill: SkillInfo; readonly scope: string } | null>(null)
  const [openingPath, setOpeningPath] = useState(false)
  const directoryInputRef = useRef<HTMLInputElement>(null)
  const [confirmation, setConfirmation] = useState<ConfirmationOptions | null>(null)
  const confirmationController = useMemo(() => new ConfirmationController(setConfirmation), [])

  useEffect(() => {
    confirmationController.activate()
    return () => confirmationController.dispose()
  }, [confirmationController])

  const load = useCallback(async (nextWorkspaceId = workspaceIdRef.current) => {
    const request = ++loadRequestRef.current
    setLoading(true)
    setError(null)
    try {
      const value = await rpc<Snapshot>('snapshot', nextWorkspaceId ? { workspaceId: nextWorkspaceId } : {})
      if (request !== loadRequestRef.current) return
      if (!nextWorkspaceId && value.workspaces[0]) {
        const id = value.workspaces[0].id
        setWorkspaceId(id)
        const selected = await rpc<Snapshot>('snapshot', { workspaceId: id })
        if (request === loadRequestRef.current) setSnapshot(selected)
      } else setSnapshot(value)
    } catch (caught) {
      if (request === loadRequestRef.current) setError(errorText(caught))
    } finally {
      if (request === loadRequestRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => () => { loadRequestRef.current += 1 }, [])

  useEffect(() => {
    if (requestedWorkspaceId !== undefined) {
      setWorkspaceId(requestedWorkspaceId)
      setTab(requestedTab)
    }
    void load(requestedWorkspaceId ?? '')
  }, [requestedTab, requestedWorkspaceId, load])

  const mutate = useCallback(async (endpoint: string, args: Record<string, unknown>, success: string) => {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      await rpc(endpoint, args)
      setNotice(success)
      await load()
      return true
    } catch (caught) {
      setError(errorText(caught))
      return false
    } finally {
      setBusy(false)
    }
  }, [load])

  const collectionMap = useMemo(() => new Map(snapshot?.collections.map(item => [item.id, item]) ?? []), [snapshot])
  const globalMap = useMemo(() => new Map(snapshot?.globalSkills.map(item => [item.name, item]) ?? []), [snapshot])
  const workspace = snapshot?.workspace?.id === workspaceId ? snapshot.workspace : undefined

  const toggleGlobal = async (name: string, enabled: boolean): Promise<void> => {
    const message = enabled
      ? `将“${name}”设为全局 Skill？它将对所有工作区生效，托管库原件和已有工作区绑定保持不变。`
      : `取消“${name}”的全局启用？只移除本插件创建的全局链接；托管库原件和已有工作区绑定保持不变。`
    if (await confirmationController.request({ title: enabled ? '设为全局 Skill' : '取消全局 Skill', message, confirmLabel: enabled ? '设为全局' : '取消全局' })) {
      await mutate('global-skill', { name, enabled }, `Skill “${name}”已${enabled ? '设为全局' : '取消全局'}`)
    }
  }

  const deleteSkill = async (name: string): Promise<void> => {
    if (!await confirmationController.request({
      title: '删除托管 Skill', message: `确定删除“${name}”？这会删除托管库中的 Skill 文件，无法撤销。若仍被引用，需要再次确认。`, confirmLabel: '删除 Skill', danger: true,
    })) return
    const ok = await mutate('library-delete', { name }, `Skill “${name}”已删除`)
    if (!ok && await confirmationController.request({
      title: '强制删除 Skill', message: `“${name}”删除失败。若它仍被收藏夹或工作区引用，强制删除会保留这些引用并产生缺失诊断。确定继续？全局链接保护不会被绕过。`, confirmLabel: '强制删除', danger: true,
    })) await mutate('library-delete', { name, force: true }, `Skill “${name}”已强制删除`)
  }

  const adoptSkill = async (name: string): Promise<void> => {
    if (await confirmationController.request({
      title: '收纳全局 Skill', message: `将“${name}”从全局目录收纳到托管库？全局原件会被移除，它将不再对所有工作区自动生效。`, confirmLabel: '收纳并移除全局原件', danger: true,
    })) await mutate('library-adopt-global', { name }, `Skill “${name}”已收纳`)
  }

  const deleteCurrentCollection = async (): Promise<void> => {
    const { id, name } = draft
    if (!await confirmationController.request({
      title: '删除收藏夹', message: `确定删除收藏夹“${name}”？只删除收藏夹定义，不会删除 Skill 文件。`, confirmLabel: '删除收藏夹', danger: true,
    })) return
    let ok = await mutate('collection-delete', { id }, '收藏夹已删除')
    if (!ok && await confirmationController.request({
      title: '解绑并删除收藏夹', message: `“${name}”删除失败。若它已绑定工作区，强制删除将先从这些工作区解绑，再删除收藏夹。Skill 文件仍会保留。`, confirmLabel: '解绑并删除', danger: true,
    })) ok = await mutate('collection-delete', { id, force: true }, '收藏夹已解绑并删除')
    if (ok) {
      setDraft(EMPTY_DRAFT)
      setCollectionEditorOpen(false)
    }
  }

  const editCollection = (collection?: CollectionInfo): void => {
    setDraft(collection === undefined ? EMPTY_DRAFT : {
      id: collection.id,
      name: collection.name,
      description: collection.description,
      skills: [...collection.skills],
    })
    setCollectionSkillQuery('')
    setCollectionEditorOpen(true)
  }

  const saveDraft = async (): Promise<void> => {
    const ok = await mutate('collection-save', { ...draft }, `收藏夹“${draft.name || draft.id}”已保存`)
    if (ok) {
      setDraft(EMPTY_DRAFT)
      setCollectionEditorOpen(false)
    }
  }

  const toggleDraftSkill = (name: string): void => {
    setDraft(current => ({
      ...current,
      skills: current.skills.includes(name) ? current.skills.filter(skill => skill !== name) : [...current.skills, name].sort(),
    }))
  }

  const chooseSkillDirectory = (event: ChangeEvent<HTMLInputElement>): void => {
    const selected = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (selected.length === 0) return
    setBusy(true)
    setError(null)
    setNotice(null)
    void uploadFilesFromSelection(selected)
      .then(files => rpc<{ readonly skill: SkillInfo }>('library-upload', { files }))
      .then(async result => {
        setNotice(`Skill “${result.skill.name}”已导入固定托管库`)
        await load()
      })
      .catch(caught => setError(errorText(caught)))
      .finally(() => setBusy(false))
  }

  const editingExistingCollection = collectionMap.has(draft.id)
  const openSkillDirectory = async (): Promise<void> => {
    if (selectedSkill === null || openingPath) return
    setOpeningPath(true)
    setError(null)
    try {
      await openPath(selectedSkill.skill.path)
    } catch (caught) {
      setError(errorText(caught))
    } finally {
      setOpeningPath(false)
    }
  }
  const selectableSkills = useMemo(() => {
    const query = collectionSkillQuery.trim().toLocaleLowerCase()
    const rows = snapshot?.library ?? []
    if (!query) return rows
    return rows.filter(skill => skill.name.toLocaleLowerCase().includes(query) || skill.description.toLocaleLowerCase().includes(query))
  }, [collectionSkillQuery, snapshot])

  const normalizedLibraryQuery = libraryQuery.trim().toLocaleLowerCase()
  const matchesSkill = useCallback((skill: SkillInfo): boolean => normalizedLibraryQuery === ''
    || skill.name.toLocaleLowerCase().includes(normalizedLibraryQuery)
    || skill.description.toLocaleLowerCase().includes(normalizedLibraryQuery), [normalizedLibraryQuery])
  const sortSkills = useCallback((skills: readonly SkillInfo[]): SkillInfo[] => skills.slice().sort((a, b) => {
    if (librarySort === 'description') {
      const descriptionOrder = a.description.localeCompare(b.description)
      return descriptionOrder !== 0 ? descriptionOrder : a.name.localeCompare(b.name)
    }
    const nameOrder = a.name.localeCompare(b.name)
    return librarySort === 'name-desc' ? -nameOrder : nameOrder
  }), [librarySort])
  const filteredLibrary = useMemo(() => sortSkills((snapshot?.library ?? []).filter(matchesSkill)), [matchesSkill, snapshot, sortSkills])
  const filteredGlobalSkills = useMemo(() => sortSkills((snapshot?.globalSkills ?? []).filter(matchesSkill)), [matchesSkill, snapshot, sortSkills])

  const normalizedCollectionQuery = collectionQuery.trim().toLocaleLowerCase()
  const filteredCollections = useMemo(() => (snapshot?.collections ?? []).filter(collection => normalizedCollectionQuery === ''
    || collection.name.toLocaleLowerCase().includes(normalizedCollectionQuery)
    || collection.id.toLocaleLowerCase().includes(normalizedCollectionQuery)
    || collection.description.toLocaleLowerCase().includes(normalizedCollectionQuery)
    || collection.skills.some(skill => skill.toLocaleLowerCase().includes(normalizedCollectionQuery))).sort((a, b) => {
      if (collectionSort === 'count-desc') return b.skills.length - a.skills.length || a.name.localeCompare(b.name)
      return a.name.localeCompare(b.name)
    }), [collectionSort, normalizedCollectionQuery, snapshot])

  const normalizedWorkspaceQuery = workspaceSkillQuery.trim().toLocaleLowerCase()
  const matchesWorkspaceSkill = (name: string): boolean => normalizedWorkspaceQuery === '' || name.toLocaleLowerCase().includes(normalizedWorkspaceQuery)
  const filteredWorkspaceSkills = useMemo(() => (snapshot?.library ?? []).filter(skill => matchesWorkspaceSkill(skill.name)), [normalizedWorkspaceQuery, snapshot])
  const filteredEffectiveSkills = useMemo(() => (workspace?.effective ?? []).filter(skill => {
    if (!matchesWorkspaceSkill(skill.name)) return false
    if (workspaceStatusFilter === 'linked') return skill.status === 'linked' || skill.status === 'global'
    if (workspaceStatusFilter === 'problem') return skill.status !== 'linked' && skill.status !== 'global'
    return true
  }), [normalizedWorkspaceQuery, snapshot, workspace, workspaceStatusFilter])

  if (loading && snapshot === null) return <div className={css.empty}>正在加载 Skill 收藏夹…</div>

  return (
    <div className={css.root}>
      <header className={css.header}>
        <div><h2>Skill 收藏夹</h2><p>显式组织 Skill 集合并绑定到工作区；插件不会自动识别项目类型。</p></div>
        <Button variant="outline" size="sm" disabled={loading || busy} onClick={() => void load()}>刷新</Button>
      </header>

      <nav className={css.tabs} aria-label="Skill 收藏夹功能">
        {([['library', 'Skill 库'], ['collections', '收藏夹'], ['workspace', '工作区']] as const).map(([id, label]) => (
          <button key={id} type="button" className={tab === id ? css.tabActive : css.tab} onClick={() => setTab(id)}>{label}</button>
        ))}
      </nav>

      {error && <div className={css.error} role="alert">{error}</div>}
      {notice && <div className={css.notice}>{notice}</div>}

      {tab === 'library' && snapshot && (
        <section className={css.section}>
          <div className={css.sectionHeader}>
            <div><h3>托管 Skill 库</h3><p>存储位置固定；这里不会被 DSH 自动扫描，只有绑定工作区后才会生成原生链接。</p></div>
            <span className={css.badge}>{snapshot.library.length}</span>
          </div>
          <div className={css.libraryLocation}>
            <div><strong>固定托管目录</strong><code>{snapshot.paths.library}</code></div>
            <Button variant="primary" size="sm" disabled={busy} onClick={() => directoryInputRef.current?.click()}>
              {busy ? '正在导入…' : '选择 Skill 目录'}
            </Button>
            <input
              ref={directoryInputRef}
              type="file"
              multiple
              className={css.hiddenInput}
              {...{ webkitdirectory: '', directory: '' }}
              onChange={chooseSkillDirectory}
            />
          </div>
          <div className={css.listToolbar}>
            <Input className={css.listSearch} value={libraryQuery} onChange={event => setLibraryQuery(event.target.value)} placeholder="搜索托管和全局 Skill…" />
            <select className={css.filterSelect} value={librarySort} onChange={event => setLibrarySort(event.target.value as typeof librarySort)} aria-label="Skill 排序">
              <option value="name-asc">名称 A-Z</option>
              <option value="name-desc">名称 Z-A</option>
              <option value="description">按描述</option>
            </select>
            <span className={css.resultCount}>{filteredLibrary.length + filteredGlobalSkills.length} / {snapshot.library.length + snapshot.globalSkills.length}</span>
          </div>
          <div className={css.list}>
            {snapshot.library.length === 0 && <div className={css.empty}>托管库为空。请选择根目录包含 SKILL.md 的 Skill 文件夹，或从下方全局 Skill 中收纳。</div>}
            {snapshot.library.length > 0 && filteredLibrary.length === 0 && <div className={css.emptyCompact}>没有匹配的托管 Skill。</div>}
            {filteredLibrary.map(skill => {
              const global = globalMap.get(skill.name)
              return <SkillRow key={skill.name} skill={skill} scope={global ? '托管 · 全局' : '托管'} onDetails={() => setSelectedSkill({ skill, scope: '托管 Skill' })} action={<>
              <Button variant="outline" size="sm" disabled={busy || (global !== undefined && !global.globalManaged)} onClick={() => void toggleGlobal(skill.name, global === undefined)}>
                {global === undefined ? '设为全局' : global.globalManaged ? '取消全局' : '全局（外部）'}
              </Button>
              <Button className={css.dangerLink} variant="ghost" size="sm" disabled={busy || global?.globalManaged} title={global?.globalManaged ? '请先取消全局，再删除托管 Skill' : undefined} onClick={() => void deleteSkill(skill.name)}>删除</Button>
            </>} />})}
          </div>

          <div className={css.sectionHeaderSecondary}>
            <div><h3>当前全局 Skill</h3><p>对所有工作区生效。托管链接可直接“取消全局”；外部 Skill 的“收纳”会复制到托管库并移除全局原件。</p></div>
            <span className={css.badgeMuted}>{filteredGlobalSkills.length} / {snapshot.globalSkills.length}</span>
          </div>
          <div className={css.list}>
            {snapshot.globalSkills.length === 0 && <div className={css.emptyCompact}>暂无全局 Skill。可在托管 Skill 旁点击“设为全局”。</div>}
            {snapshot.globalSkills.length > 0 && filteredGlobalSkills.length === 0 && <div className={css.emptyCompact}>没有匹配的全局 Skill。</div>}
            {filteredGlobalSkills.map(skill => <SkillRow key={skill.name} skill={skill} scope={skill.globalManaged ? '全局 · 托管链接' : '全局 · 外部'} onDetails={() => setSelectedSkill({ skill, scope: '全局 Skill' })} action={skill.globalManaged ?
              <Button variant="outline" size="sm" disabled={busy} onClick={() => void toggleGlobal(skill.name, false)}>取消全局</Button> :
              <Button variant="outline" size="sm" disabled={busy || snapshot.library.some(item => item.name === skill.name)} onClick={() => void adoptSkill(skill.name)}>收纳</Button>
            } />)}
          </div>
        </section>
      )}

      {tab === 'collections' && snapshot && (
        <section className={css.section}>
          <div className={css.sectionHeader}>
            <div><h3>收藏夹</h3><p>每个收藏夹是一组 Skill 引用。点击一行即可查看或编辑。</p></div>
            <Button variant="primary" size="sm" onClick={() => editCollection()}>新建收藏夹</Button>
          </div>
          <div className={css.listToolbar}>
            <Input className={css.listSearch} value={collectionQuery} onChange={event => setCollectionQuery(event.target.value)} placeholder="搜索收藏夹、描述或 Skill…" />
            <select className={css.filterSelect} value={collectionSort} onChange={event => setCollectionSort(event.target.value as typeof collectionSort)} aria-label="收藏夹排序">
              <option value="name-asc">名称 A-Z</option>
              <option value="count-desc">Skill 数量</option>
            </select>
            <span className={css.resultCount}>{filteredCollections.length} / {snapshot.collections.length}</span>
          </div>
          <div className={css.collectionRows}>
            {filteredCollections.map(collection => (
              <button key={collection.id} type="button" className={css.collectionRow} onClick={() => editCollection(collection)}>
                <strong>{collection.name}</strong>
                <span className={css.collectionDescription}>{collection.description || collection.id}</span>
                <span className={css.collectionCount}>{collection.skills.length} 个 Skill</span>
              </button>
            ))}
            {snapshot.collections.length === 0 && <div className={css.empty}>还没有收藏夹。点击“新建收藏夹”开始整理 Skill。</div>}
            {snapshot.collections.length > 0 && filteredCollections.length === 0 && <div className={css.emptyCompact}>没有匹配的收藏夹。</div>}
          </div>
        </section>
      )}

      {tab === 'workspace' && snapshot && (
        <section className={css.section}>
          <div className={css.workspaceToolbar}>
            <label>工作区<select value={workspaceId} onChange={event => {
              const id = event.target.value
              setWorkspaceId(id)
              void load(id)
            }}>{snapshot.workspaces.map(item => <option key={item.id} value={item.id}>{item.title} — {item.path}</option>)}</select></label>
            <Button variant="outline" size="sm" disabled={busy || !workspaceId} onClick={() => void mutate('workspace-sync', { workspaceId }, '工作区链接已同步')}>重新同步</Button>
          </div>
          <div className={css.listToolbar}>
            <Input className={css.listSearch} value={workspaceSkillQuery} onChange={event => setWorkspaceSkillQuery(event.target.value)} placeholder="搜索当前工作区 Skill…" />
          </div>

          {!workspace && <div className={css.empty}>请选择已注册的工作区。</div>}
          {workspace && <>
            <div className={css.workspaceColumns}>
              <div><h3>启用收藏夹</h3><div className={css.toggleList}>
                {snapshot.collections.filter(collection => normalizedWorkspaceQuery === ''
                  || collection.name.toLocaleLowerCase().includes(normalizedWorkspaceQuery)
                  || collection.skills.some(skill => skill.toLocaleLowerCase().includes(normalizedWorkspaceQuery))).map(collection => {
                  const enabled = workspace.config.collections.includes(collection.id)
                  return <label key={collection.id} className={css.toggleRow}>
                    <input type="checkbox" checked={enabled} disabled={busy} onChange={() => void mutate('workspace-collection', { workspaceId, id: collection.id, enabled: !enabled }, enabled ? '收藏夹已从工作区移除' : '收藏夹已绑定到工作区')} />
                    <span><strong>{collection.name}</strong><small>{collection.skills.join('、') || '空收藏夹'}</small></span>
                  </label>
                })}
              </div></div>
              <div><h3>单个 Skill 覆盖</h3><div className={css.toggleList}>
                {filteredWorkspaceSkills.map(skill => {
                  const direct = workspace.config.skills.enabled.includes(skill.name)
                  const global = globalMap.has(skill.name)
                  const disabled = workspace.config.skills.disabled.includes(skill.name)
                  const effective = workspace.effective.some(item => item.name === skill.name)
                  const mode = disabled ? 'clear' : effective && !direct ? 'disable' : direct ? 'clear' : 'enable'
                  const label = disabled ? '清除禁用' : effective && !direct ? '在此禁用' : direct ? '移除单独启用' : '单独启用'
                  return <div key={skill.name} className={css.overrideRow}>
                    <span><strong>{skill.name}</strong><small>{global ? '全局生效，工作区覆盖不能屏蔽全局 Skill' : disabled ? '工作区禁用覆盖' : direct ? '工作区单独启用' : effective ? '来自收藏夹' : '未启用'}</small></span>
                    <Button variant="outline" size="sm" disabled={busy || global} onClick={() => void mutate('workspace-skill', { workspaceId, skill: skill.name, mode }, `${skill.name}: ${label}`)}>{global ? '全局生效' : label}</Button>
                  </div>
                })}
                {filteredWorkspaceSkills.length === 0 && <div className={css.emptyCompact}>没有匹配的托管 Skill。</div>}
              </div></div>
            </div>

            <details className={css.bindingDiagnostics}>
            <summary>托管绑定与全局目录诊断（不是完整可用目录）</summary>
            <div className={css.sectionHeaderSecondary}><div><h3>绑定诊断</h3><p>用于检查本插件的链接、全局目录及冲突；查看当前会话可用技能请使用输入框旁的 Skill 快捷选择。</p></div><span className={css.badge}>{filteredEffectiveSkills.length} / {workspace.effective.length}</span></div>
            <div className={css.listToolbar}><select className={css.filterSelect} value={workspaceStatusFilter} onChange={event => setWorkspaceStatusFilter(event.target.value as typeof workspaceStatusFilter)} aria-label="筛选托管绑定诊断状态">
              <option value="all">全部绑定状态</option><option value="linked">已链接 / 全局</option><option value="problem">异常项</option>
            </select></div>
            <div className={css.list}>
              {filteredEffectiveSkills.map(skill => (
                <div key={skill.name} className={css.row}><div className={css.rowMain}>
                  <div className={css.rowTitle}>{skill.name} <span className={`${css.status} ${css[`status_${skill.status}`]}`}>{skill.status === 'global' ? '全局生效' : skill.status}</span></div>
                  <div className={css.rowDescription}>{skill.sources.map(source => source === 'global' ? '全局' : source === 'workspace:local' ? '工作区本地' : source).join(' · ')}</div>
                  {skill.detail && <div className={css.warning}>{skill.detail}</div>}
                  {skill.targetPath && <div className={css.path}>{skill.targetPath}</div>}
                </div></div>
              ))}
              {workspace.effective.length === 0 && <div className={css.empty}>该工作区暂无全局或托管 Skill。</div>}
              {workspace.effective.length > 0 && filteredEffectiveSkills.length === 0 && <div className={css.emptyCompact}>没有匹配的绑定诊断。</div>}
            </div>
            </details>
          </>}
        </section>
      )}

      <Modal
        open={selectedSkill !== null}
        onClose={() => setSelectedSkill(null)}
        title={selectedSkill?.skill.name ?? 'Skill 详情'}
        closeLabel="关闭"
        description={selectedSkill?.scope}
        className={css.detailModal}
        footer={<>
          {selectedSkill?.skill.layout === 'directory' && <Button variant="outline" size="sm" disabled={openingPath} onClick={() => void openSkillDirectory()}>
            {openingPath ? '正在打开…' : '打开目录'}
          </Button>}
          <Button variant="primary" size="sm" onClick={() => setSelectedSkill(null)}>完成</Button>
        </>}
      >
        {selectedSkill && <dl className={css.detailList}>
          <div><dt>说明</dt><dd>{selectedSkill.skill.description}</dd></div>
          <div><dt>格式</dt><dd>{selectedSkill.skill.layout === 'directory' ? '目录型 Skill' : '平铺 Markdown Skill'}</dd></div>
          <div><dt>路径</dt><dd><code>{selectedSkill.skill.path}</code></dd></div>
          <div><dt>符号链接</dt><dd>{selectedSkill.skill.isSymlink ? selectedSkill.skill.linkTarget ?? '是' : '否'}</dd></div>
        </dl>}
      </Modal>

      <Modal
        open={collectionEditorOpen}
        onClose={() => !busy && setCollectionEditorOpen(false)}
        title={editingExistingCollection ? '编辑收藏夹' : '新建收藏夹'}
        closeLabel="关闭"
        description="收藏夹只保存 Skill 引用，不复制或移动 Skill 文件。"
        className={css.collectionModal}
        contentClassName={css.collectionModalContent}
        footer={<>
          {editingExistingCollection && <Button className={css.modalDelete} variant="outline" size="sm" disabled={busy} onClick={() => void deleteCurrentCollection()}>删除</Button>}
          <Button variant="ghost" size="sm" disabled={busy} onClick={() => setCollectionEditorOpen(false)}>取消</Button>
          <Button variant="primary" size="sm" disabled={busy || !draft.id || !draft.name} onClick={() => void saveDraft()}>保存</Button>
        </>}
      >
        <div className={css.modalForm}>
          <label>ID<input value={draft.id} disabled={editingExistingCollection} onChange={event => setDraft(current => ({ ...current, id: event.target.value }))} placeholder="unity-development" /></label>
          <label>名称<input value={draft.name} onChange={event => setDraft(current => ({ ...current, name: event.target.value }))} placeholder="Unity 开发" /></label>
          <label>说明<textarea value={draft.description} onChange={event => setDraft(current => ({ ...current, description: event.target.value }))} rows={3} placeholder="这个收藏夹适合什么工作" /></label>
          <div className={css.skillPickerHeader}>
            <div><strong>选择 Skill</strong><span>已选择 {draft.skills.length} 个</span></div>
            <Input className={css.skillSearch} value={collectionSkillQuery} onChange={event => setCollectionSkillQuery(event.target.value)} placeholder="搜索 Skill" />
          </div>
          <div className={css.modalSkillList}>
            {selectableSkills.map(skill => (
              <label key={skill.name} className={css.modalSkillRow}>
                <input type="checkbox" checked={draft.skills.includes(skill.name)} onChange={() => toggleDraftSkill(skill.name)} />
                <strong>{skill.name}</strong>
                <span>{skill.description}</span>
              </label>
            ))}
            {selectableSkills.length === 0 && <div className={css.emptyCompact}>没有匹配的 Skill。</div>}
          </div>
        </div>
      </Modal>
      <Modal
        open={confirmation !== null}
        onClose={() => confirmationController.answer(false)}
        title={confirmation?.title ?? '确认操作'}
        closeLabel="取消操作"
        className={css.confirmationModal}
        footer={<>
          <Button variant="outline" size="sm" data-modal-autofocus onClick={() => confirmationController.answer(false)}>取消</Button>
          <Button variant={confirmation?.danger ? 'outline' : 'primary'} className={confirmation?.danger ? css.dangerButton : undefined} size="sm" onClick={() => confirmationController.answer(true)}>{confirmation?.confirmLabel ?? '确认'}</Button>
        </>}
      >
        <p className={css.confirmationMessage}>{confirmation?.message}</p>
      </Modal>
    </div>
  )
}
