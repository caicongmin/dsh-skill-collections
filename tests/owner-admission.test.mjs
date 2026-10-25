import test from 'node:test'
import assert from 'node:assert/strict'
import { apply, _internals } from '../lib/index.js'

test('Skill management follows Connection trust/auth rejection and only admits owners', () => {
  const req = { headers: { host: 'localhost' } }
  for (const rejection of [401, 403]) {
    assert.equal(_internals.ownerRejection({ admit: value => { assert.equal(value, req); return { rejection } } }, req), rejection)
  }
  assert.equal(_internals.ownerRejection({ admit: () => ({ peer: { principal: { kind: 'device' } } }) }, req), 403)
  assert.equal(_internals.ownerRejection({ admit: () => ({ peer: { principal: { kind: 'owner' } } }) }, req), undefined)
})

test('registered HTTP handler denies before body access and fails closed without Connection', async () => {
  let route, bodyReads = 0
  const admission = { rejection: 401 }
  const ctx = {
    get: () => ({ admit: () => admission }), effect: setup => setup(),
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
