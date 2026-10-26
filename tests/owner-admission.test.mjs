import test from 'node:test'
import assert from 'node:assert/strict'
import { apply, _internals } from '../lib/index.js'

test('Skill management follows Connection trust/auth rejection and only admits owners', () => {
  const req = { headers: { host: 'localhost' } }
  for (const rejection of [401, 403]) {
    let admissions = 0
    assert.equal(_internals.ownerRejection({
      requestRejection: value => { assert.equal(value, req); return rejection },
      admit: () => { admissions++; throw Error('Admission must not run after request rejection') },
    }, req), rejection)
    assert.equal(admissions, 0)
  }
  for (const [kind, expected] of [['device', 403], ['owner', undefined]]) {
    const calls = []
    assert.equal(_internals.ownerRejection({
      requestRejection: value => { assert.equal(value, req); calls.push('request'); return undefined },
      admit: value => { assert.equal(value, req); calls.push('principal'); return { peer: { principal: { kind } } } },
    }, req), expected)
    assert.deepEqual(calls, ['request', 'principal'])
  }
  for (const rejection of [401, 403]) {
    assert.equal(_internals.ownerRejection({
      requestRejection: () => undefined,
      admit: () => ({ rejection }),
    }, req), rejection, 'a later admission rejection must still fail closed')
  }
})

test('registered HTTP handler denies before body access and fails closed without Connection', async () => {
  let route, bodyReads = 0
  const admission = { rejection: 401 }
  const ctx = {
    get: () => ({ requestRejection: () => admission.rejection, admit: () => admission }), effect: setup => setup(),
    webServer: { register(value) { route = value; return () => {} } },
    tools: { register() {} }, logger: { info() {} },
  }
  apply(ctx)
  const req = { headers: {}, method: 'POST', url: '/dsh-skill-collections-api/library-delete',
    on() { bodyReads++; throw Error('Rejected request body must not be read') } }
  const response = { writeHead(status, headers) { this.status = status; this.headers = headers }, end() {} }
  await route.handler(req, response)
  assert.equal(response.status, 401)
  assert.equal(response.headers['cache-control'], 'no-store')
  assert.equal(bodyReads, 0)
  ctx.get = () => undefined
  assert.throws(() => apply(ctx), /requires Connection/)
})

test('an authenticated non-owner is rejected before accessing the request body', async () => {
  let route, bodyReads = 0
  const ctx = {
    get: () => ({ requestRejection: () => undefined, admit: () => ({ peer: { principal: { kind: 'device' } } }) }),
    effect: setup => setup(),
    webServer: { register(value) { route = value; return () => {} } },
    tools: { register() {} }, logger: { info() {} },
  }
  apply(ctx)
  const response = { writeHead(status, headers) { this.status = status; this.headers = headers }, end() {} }
  await route.handler({ method: 'POST', url: '/dsh-skill-collections-api/library-delete', on() { bodyReads++ } }, response)
  assert.equal(response.status, 403)
  assert.equal(response.headers['cache-control'], 'no-store')
  assert.equal(bodyReads, 0)
})
