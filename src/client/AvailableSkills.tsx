import { useEffect, useState } from 'react'
import { listAvailableSkills, subscribeCatalogChanges } from './index.js'
import type { AvailableSkill } from './types.js'
import css from './skill-collections.module.css'

interface Props {
  readonly sessionIds: readonly string[]
  readonly preferredSessionId?: string
  readonly query: string
  readonly refreshKey: unknown
}

/** Read-only view of the same session-addressed catalog as the native / menu. */
export function AvailableSkills({ sessionIds, preferredSessionId, query, refreshKey }: Props): JSX.Element {
  const ids = [...new Set([...(preferredSessionId === undefined ? [] : [preferredSessionId]), ...sessionIds])]
  const [selected, setSelected] = useState(preferredSessionId)
  const sessionId = selected !== undefined && ids.includes(selected) ? selected : ids[0]
  const [refresh, setRefresh] = useState(0)
  const [state, setState] = useState<{ sessionId?: string; loading: boolean; skills: readonly AvailableSkill[]; error?: string }>({ loading: false, skills: [] })

  useEffect(() => subscribeCatalogChanges(changed => {
    if (changed === undefined || changed === sessionId) setRefresh(value => value + 1)
  }, sessionId), [sessionId])

  useEffect(() => {
    if (sessionId === undefined) return
    const abort = new AbortController()
    setState({ sessionId, loading: true, skills: [] })
    void listAvailableSkills(sessionId, abort.signal).then(skills => {
      if (!abort.signal.aborted) setState({ sessionId, loading: false, skills })
    }, error => {
      if (!abort.signal.aborted) setState({ sessionId, loading: false, skills: [], error: error instanceof Error ? error.message : String(error) })
    })
    return () => abort.abort()
  }, [sessionId, refreshKey, refresh])

  const current = state.sessionId === sessionId ? state : undefined
  const loading = sessionId !== undefined && (current === undefined || current.loading)
  const skills = current?.skills ?? []
  const normalized = query.trim().toLocaleLowerCase()
  const filtered = skills.filter(skill => [skill.name, skill.description, skill.whenToUse ?? '', skill.path ?? ''].some(value => value.toLocaleLowerCase().includes(normalized)))

  return <section className={css.availableSkills} aria-label="原生会话可用 Skill 目录">
    <div className={css.sectionHeader}>
      <div><h3>当前会话可用 Skill</h3><p>与原生 / 菜单使用同一目录，包含未托管、本地、全局、内置和预设技能；不同会话的预设可能不同。</p></div>
      <span className={css.badge}>{loading ? '…' : `${filtered.length} / ${skills.length}`}</span>
    </div>
    <div className={css.listToolbar}>
      <label className={css.catalogSession}>查看会话<select aria-label="选择 Skill 目录所属会话" value={sessionId ?? ''} onChange={event => setSelected(event.currentTarget.value)}>
        {ids.length === 0 && <option value="">暂无会话</option>}
        {ids.map(id => <option key={id} value={id}>{id === preferredSessionId ? '当前会话 · ' : '会话 · '}{id.slice(0, 12)}</option>)}
      </select></label>
      <button className={css.catalogRefresh} type="button" disabled={loading || sessionId === undefined} onClick={() => setRefresh(value => value + 1)}>刷新目录</button>
    </div>
    {sessionId === undefined && <div className={css.emptyCompact}>此工作区暂无会话。新建会话后，可按它的实际工作目录和预设查看完整 Skill 列表。</div>}
    {loading && <div className={css.emptyCompact} role="status">正在读取原生 Skill 目录…</div>}
    {current?.error && <div className={css.error} role="alert">{current.error}。未用托管库列表替代原生结果，请刷新重试。</div>}
    {!loading && !current?.error && <div className={css.catalogList}>
      {filtered.map(skill => <div key={skill.name} className={css.row}><div className={css.rowMain}>
        <div className={css.rowTitle}>/{skill.name} <span className={`${css.status} ${css.status_linked}`}>{skill.modelInvocable ? '可用' : '仅手动调用'}</span></div>
        <div className={css.rowDescription}>{skill.description}</div>
        {skill.path && <div className={css.path}>{skill.path}</div>}
      </div></div>)}
      {sessionId !== undefined && filtered.length === 0 && <div className={css.emptyCompact}>{skills.length === 0 ? '原生目录中暂无可手动调用的 Skill。' : '没有匹配的可用 Skill。'}</div>}
    </div>}
  </section>
}
