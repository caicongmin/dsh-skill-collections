import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { ConfirmationController } from '../lib/client/confirmation.js'

const options = { title: '删除 Skill', message: '删除会移除托管文件', confirmLabel: '删除', danger: true }

test('confirmation waits for an explicit answer, then closes exactly once', async () => {
  const changes = []
  const controller = new ConfirmationController(value => changes.push(value))
  controller.activate()
  const result = controller.request(options)
  assert.deepEqual(changes, [options])
  controller.answer(true)
  controller.answer(true)
  assert.equal(await result, true)
  assert.deepEqual(changes, [options, null])
})

test('cancel or dismissal never authorizes the operation', async () => {
  const controller = new ConfirmationController(() => {})
  controller.activate()
  const result = controller.request(options)
  controller.answer(false)
  assert.equal(await result, false)
})

test('overlapping requests do not replace the pending confirmation', async () => {
  const changes = []
  const controller = new ConfirmationController(value => changes.push(value))
  controller.activate()
  const first = controller.request(options)
  assert.equal(await controller.request({ ...options, title: '另一操作' }), false)
  assert.deepEqual(changes, [options])
  controller.answer(false)
  assert.equal(await first, false)
})

test('unmount cancels pending work and prevents a later force confirmation', async () => {
  const controller = new ConfirmationController(() => {})
  controller.activate()
  const result = controller.request(options)
  controller.dispose()
  assert.equal(await result, false)
  assert.equal(await controller.request(options), false)
  // React Strict Mode can start the same effect again.
  controller.activate()
  const next = controller.request(options)
  controller.answer(true)
  assert.equal(await next, true)
})

test('the next deletion confirmation requires a separate explicit answer', async () => {
  const controller = new ConfirmationController(() => {})
  controller.activate()
  const first = controller.request(options)
  controller.answer(true)
  assert.equal(await first, true)
  const forced = controller.request({ ...options, title: '强制删除' })
  controller.answer(false)
  assert.equal(await forced, false)
})

test('Skill management source and built bundle contain no native browser dialogs', async () => {
  for (const path of ['../src/client/SkillCollectionsPanel.tsx', '../lib/client.js']) {
    const source = await readFile(new URL(path, import.meta.url), 'utf8')
    assert.doesNotMatch(source, /\b(?:window\s*\.\s*)?(?:confirm|alert|prompt)\s*\(/)
  }
})
