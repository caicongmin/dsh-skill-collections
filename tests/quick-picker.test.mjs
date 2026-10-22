import test from 'node:test'
import assert from 'node:assert/strict'
import { buildInsertedDraft } from '../lib/client/draft.js'

test('quick picker appends a native skill gesture with a separator', () => {
  assert.deepEqual(buildInsertedDraft('请检查代码', 'code-review'), {
    text: '请检查代码 /code-review ',
    caret: 19,
  })
})

test('quick picker inserts at the current caret and keeps following text readable', () => {
  const result = buildInsertedDraft('请检查这里的代码', 'code-review', { start: 3, end: 5 })
  assert.equal(result.text, '请检查 /code-review 的代码')
  assert.equal(result.caret, 17)
})

test('quick picker replaces a selected range without duplicating whitespace', () => {
  const result = buildInsertedDraft('/old-skill 继续', 'new-skill', { start: 0, end: 10 })
  assert.equal(result.text, '/new-skill 继续')
  assert.equal(result.caret, 10)
})
