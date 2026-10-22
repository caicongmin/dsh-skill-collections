import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import {
  IconChevronDownOutlineRegular,
  IconRefreshOutlineRegular,
  IconSearchOutlineRegular,
} from '@deepseek-ai/dsh-client-ui-primitives'
import { listAvailableSkills, subscribeCatalogChanges } from './index.js'
import { buildInsertedDraft, type DraftRange } from './draft.js'
import { LightningIcon } from './LightningIcon.js'
import type { AvailableSkill } from './types.js'
import { effectivePickerSkills, type PickerSkill } from './picker-skills.js'
import css from './skill-collections.module.css'

type Props = PropsRuntime<'conversation.input.right'>

interface UsageEntry {
  readonly count: number
  readonly lastUsed: number
}

type UsageStore = Record<string, Record<string, UsageEntry>>

const USAGE_KEY = 'dsh-skill-collections:skill-usage'
const MAX_RECENT = 6
const UNSCOPED_WORKSPACE = '__unscoped__'

function loadUsage(workspaceId: string): Record<string, UsageEntry> {
  try {
    const raw = localStorage.getItem(USAGE_KEY)
    if (raw === null) return {}
    const parsed = JSON.parse(raw) as UsageStore
    return parsed[workspaceId] ?? {}
  } catch {
    return {}
  }
}

function saveUsage(workspaceId: string, value: Record<string, UsageEntry>): void {
  try {
    const raw = localStorage.getItem(USAGE_KEY)
    const parsed = raw === null ? {} : JSON.parse(raw) as UsageStore
    parsed[workspaceId] = value
    localStorage.setItem(USAGE_KEY, JSON.stringify(parsed))
  } catch {
    // UI recency is optional; a storage failure must not block invocation.
  }
}

function rankByUsage(skills: readonly PickerSkill[], usage: Record<string, UsageEntry>): PickerSkill[] {
  return skills.slice().sort((a, b) => {
    const ua = usage[a.name]
    const ub = usage[b.name]
    const last = (ub?.lastUsed ?? 0) - (ua?.lastUsed ?? 0)
    if (last !== 0) return last
    const count = (ub?.count ?? 0) - (ua?.count ?? 0)
    return count !== 0 ? count : a.name.localeCompare(b.name)
  })
}

function findComposerTextarea(box: HTMLElement | null): HTMLTextAreaElement | null {
  let current = box
  while (current !== null) {
    const card = current.matches('[data-composer-card]')
      ? current
      : current.querySelector<HTMLElement>('[data-composer-card]')
    if (card !== null) {
      const textarea = card.querySelector('textarea')
      return textarea instanceof HTMLTextAreaElement ? textarea : null
    }
    current = current.parentElement
  }
  return null
}

export function SkillQuickPicker(props: Props): JSX.Element {
  const sessionCwd = props.useSessions(state => state.byId[props.sessionId]?.cwd)
  const workspaces = props.useWorkspaces(state => state.items)
  const workspaceId = workspaces.find(workspace => workspace.sessionIds.some((id: unknown) => String(id) === String(props.sessionId)))?.workspaceId
    ?? workspaces.find(workspace => workspace.path === sessionCwd)?.workspaceId
  const resolvedWorkspaceId = workspaceId === undefined ? UNSCOPED_WORKSPACE : String(workspaceId)
  const draft = props.useInput(state => state.draft)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [catalog, setCatalog] = useState<readonly AvailableSkill[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usage, setUsage] = useState<Record<string, UsageEntry>>(() => loadUsage(resolvedWorkspaceId))
  const [activeIndex, setActiveIndex] = useState(0)
  const boxRef = useRef<HTMLDivElement | null>(null)
  const textareaFocusedRef = useRef(false)
  const selectionRef = useRef<DraftRange | undefined>(undefined)
  const requestRef = useRef(0)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    setUsage(loadUsage(resolvedWorkspaceId))
  }, [resolvedWorkspaceId])

  const load = useCallback(async () => {
    const request = ++requestRef.current
    abortRef.current?.abort()
    const abort = new AbortController()
    abortRef.current = abort
    setCatalog(null)
    setLoading(true)
    setError(null)
    try {
      const value = await listAvailableSkills(String(props.sessionId), abort.signal)
      if (request === requestRef.current) setCatalog(value)
    } catch (caught) {
      if (request === requestRef.current) setError(caught instanceof Error ? caught.message : String(caught))
    } finally {
      if (request === requestRef.current) setLoading(false)
    }
  }, [props.sessionId, sessionCwd])

  useEffect(() => {
    if (open) void load()
    return () => { requestRef.current += 1; abortRef.current?.abort() }
  }, [open, load])

  useEffect(() => {
    if (!open) return
    return subscribeCatalogChanges(sessionId => {
      if (sessionId === undefined || sessionId === String(props.sessionId)) void load()
    }, String(props.sessionId))
  }, [open, load, props.sessionId])

  const toggle = (): void => {
    const textarea = findComposerTextarea(boxRef.current)
    if (textarea !== null && textarea.value === draft) {
      textareaFocusedRef.current = true
      selectionRef.current = { start: textarea.selectionStart, end: textarea.selectionEnd }
    }
    setOpen(value => !value)
    setQuery('')
    setActiveIndex(0)
  }

  const skills = useMemo(() => effectivePickerSkills(catalog), [catalog])
  const ordered = useMemo(() => rankByUsage(skills, usage), [skills, usage])
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const filtered = ordered.filter(skill => normalizedQuery === ''
    || skill.name.toLocaleLowerCase().includes(normalizedQuery)
    || skill.description.toLocaleLowerCase().includes(normalizedQuery))
  const recent = normalizedQuery === ''
    ? filtered.filter(skill => (usage[skill.name]?.lastUsed ?? 0) > 0).slice(0, MAX_RECENT)
    : []
  const recentNames = new Set(recent.map(skill => skill.name))
  const rest = filtered.filter(skill => !recentNames.has(skill.name))
  const items = [...recent, ...rest]

  const pick = (name: string): void => {
    const currentDraft = typeof draft === 'string' ? draft : ''
    let range: DraftRange | undefined
    const textarea = findComposerTextarea(boxRef.current)
    if (textarea !== null && textarea.value === currentDraft && textareaFocusedRef.current) {
      range = selectionRef.current ?? { start: textarea.selectionStart, end: textarea.selectionEnd }
    }
    const inserted = buildInsertedDraft(currentDraft, name, range)
    props.inputActions.setDraft(inserted.text)
    const nextUsage = {
      ...usage,
      [name]: { count: (usage[name]?.count ?? 0) + 1, lastUsed: Date.now() },
    }
    setUsage(nextUsage)
    saveUsage(resolvedWorkspaceId, nextUsage)
    setOpen(false)
    setQuery('')
    if (textarea !== null && typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => {
        textarea.focus()
        if (textarea.value === inserted.text) textarea.setSelectionRange(inserted.caret, inserted.caret)
      })
    }
  }

  useEffect(() => {
    if (!open) return
    const onFocusIn = (event: FocusEvent): void => {
      const textarea = findComposerTextarea(boxRef.current)
      if (textarea !== null && event.target === textarea) {
        textareaFocusedRef.current = true
        selectionRef.current = { start: textarea.selectionStart, end: textarea.selectionEnd }
      }
    }
    const onPointerDown = (event: globalThis.PointerEvent): void => {
      if (boxRef.current !== null && event.target instanceof Node && !boxRef.current.contains(event.target)) setOpen(false)
    }
    const onKeyDown = (event: globalThis.KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setOpen(false)
        return
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setActiveIndex(index => Math.min(index + 1, Math.max(items.length - 1, 0)))
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        setActiveIndex(index => Math.max(index - 1, 0))
      } else if (event.key === 'Enter' && items[activeIndex] !== undefined) {
        event.preventDefault()
        pick(items[activeIndex].name)
      }
    }
    document.addEventListener('focusin', onFocusIn)
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('focusin', onFocusIn)
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, activeIndex, items, pick])

  const renderItem = (skill: PickerSkill, index: number): JSX.Element => (
    <button
      key={skill.name}
      type="button"
      role="option"
      aria-selected={index === activeIndex}
      className={`${css.quickItem} ${index === activeIndex ? css.quickItemActive : ''}`}
      onMouseEnter={() => setActiveIndex(index)}
      onClick={() => pick(skill.name)}
    >
      <span className={css.quickItemName}>/{skill.name} <small>{skill.scope}</small></span>
      <span className={css.quickItemDescription}>{skill.description || '无描述'}</span>
    </button>
  )

  return (
    <div ref={boxRef} className={css.quickPicker}>
      <button
        type="button"
        className={`${css.quickButton} ${open ? css.quickButtonActive : ''}`}
        onClick={toggle}
        title="选择当前工作区 Skill"
        aria-label="选择当前工作区 Skill"
        aria-expanded={open}
        aria-haspopup="dialog"
        onMouseDown={event => event.preventDefault()}
      >
          <LightningIcon />
        <IconChevronDownOutlineRegular className={css.quickChevron} />
      </button>
      {open && (
        <div className={css.quickPopover} role="dialog" aria-label="选择 Skill">
          <div className={css.quickHeader}>
          <div className={css.quickTitle}><LightningIcon /> <strong>当前会话可用 Skill</strong><span>{skills.length}</span></div>
            <button type="button" className={css.quickIconButton} onClick={() => void load()} title="刷新 Skill 列表" aria-label="刷新 Skill 列表">
              <IconRefreshOutlineRegular size={14} />
            </button>
          </div>
          <div className={css.quickSearchRow}>
            <IconSearchOutlineRegular />
            <input
              className={css.quickSearch}
              value={query}
              onChange={event => { setQuery(event.currentTarget.value); setActiveIndex(0) }}
              placeholder="搜索名称或描述…"
              autoFocus
            />
          </div>
          {loading && <div className={css.quickStatus}>正在读取原生会话 Skill 目录…</div>}
          {!loading && error !== null && <div className={css.quickStatusError}>{error}</div>}
          {!loading && error === null && items.length === 0 && (
            <div className={css.quickStatus}>{skills.length === 0 ? '原生目录中暂无可手动调用的 Skill。' : '没有匹配的 Skill。'}</div>
          )}
          {!loading && error === null && items.length > 0 && (
            <div className={css.quickList} role="listbox" aria-label="当前会话全部可用 Skill">
              {recent.length > 0 && <div className={css.quickSectionLabel}>最近使用</div>}
              {recent.map((skill, index) => renderItem(skill, index))}
              {rest.length > 0 && <div className={css.quickSectionLabel}>全部技能</div>}
              {rest.map((skill, index) => renderItem(skill, recent.length + index))}
            </div>
          )}
          <div className={css.quickFooter}>选择后插入原生 <code>/技能名</code>，仍可继续编辑</div>
        </div>
      )}
    </div>
  )
}
