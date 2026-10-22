export interface DraftRange {
  readonly start: number
  readonly end: number
}

export interface InsertDraftResult {
  readonly text: string
  readonly caret: number
}

/** Insert the native `/skill-name` gesture at a textarea range. */
export function buildInsertedDraft(draft: string, name: string, range?: DraftRange): InsertDraftResult {
  if (range === undefined || range.start < 0) {
    const before = draft === '' || draft.endsWith(' ') || draft.endsWith('\n') ? '' : ' '
    const text = `${draft}${before}/${name} `
    return { text, caret: text.length }
  }

  const start = Math.min(range.start, draft.length)
  const end = range.end > start ? Math.min(range.end, draft.length) : start
  const prefix = draft.slice(0, start)
  const suffix = draft.slice(end)
  const before = prefix === '' || prefix.endsWith(' ') || prefix.endsWith('\n') ? '' : ' '
  const after = suffix === '' || suffix.startsWith(' ') || suffix.startsWith('\n') ? '' : ' '
  const text = `${prefix}${before}/${name}${after}${suffix}`
  const caret = start + before.length + 1 + name.length + after.length
  return { text, caret }
}
