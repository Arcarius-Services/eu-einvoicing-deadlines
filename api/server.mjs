// Keyed JSON API over Ledger's obligation dataset.
//
// Deliberately node:http + node:sqlite with no third-party dependency: this is
// the process that holds hashed customer keys, so its whole supply chain is the
// Node standard library.

import { createServer } from 'node:http'
import { findLiveKey, consumeQuota, peekQuota } from './keys.mjs'
import { loadDataset } from '../src/data/obligations.js'

const PORT = Number(process.env.PORT ?? 8787)

// Loaded once. The dataset is a build artifact; a change means a redeploy.
const dataset = loadDataset()
const byId = new Map(dataset.rows.map((r) => [r.obligation_id, r]))

const ROUTE_SCOPE = 'obligations:read'

function send(res, status, body, headers = {}) {
  const payload = JSON.stringify(body, null, 2)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    ...headers,
  })
  res.end(payload)
}

const fail = (res, status, code, message, headers) => send(res, status, { error: { code, message } }, headers)

/**
 * Authenticates the request. A key in the query string is rejected outright
 * rather than honoured — it would already be in access logs and referrers by
 * the time we saw it, so the only safe response is "rotate that key".
 */
function authenticate(req, url, res) {
  for (const param of ['key', 'api_key', 'apikey', 'token']) {
    if (url.searchParams.has(param)) {
      fail(res, 400, 'key_in_query_string',
        `Do not put your key in the URL — it leaks into logs, history and referrer headers. Send it as the X-API-Key header, and rotate the key you just exposed.`)
      return null
    }
  }

  const presented = req.headers['x-api-key']
  if (!presented || typeof presented !== 'string') {
    fail(res, 401, 'missing_key', 'Send your key in the X-API-Key header.')
    return null
  }

  const key = findLiveKey(presented)
  if (!key) {
    // Absent and revoked are deliberately the same answer.
    fail(res, 401, 'invalid_key', 'No live key matches that value.')
    return null
  }

  if (!key.scopes.includes(ROUTE_SCOPE)) {
    fail(res, 403, 'insufficient_scope', `This key is not scoped for ${ROUTE_SCOPE}.`)
    return null
  }

  return key
}

function quotaHeaders(q) {
  return {
    'x-ratelimit-limit': String(q.limit),
    'x-ratelimit-remaining': String(q.remaining),
    'x-ratelimit-reset': String(q.reset),
  }
}

function queryObligations(url) {
  const sp = url.searchParams
  const eq = (field, value) => (r) => String(r[field] ?? '').toLowerCase() === value.toLowerCase()

  let rows = dataset.rows
  for (const field of ['jurisdiction', 'direction', 'regime', 'confidence']) {
    const v = sp.get(field)
    if (v) rows = rows.filter(eq(field, v))
  }

  const limit = Math.min(Math.max(Number(sp.get('limit') ?? 100) || 100, 1), 1000)
  const offset = Math.max(Number(sp.get('offset') ?? 0) || 0, 0)

  return { total: rows.length, limit, offset, rows: rows.slice(offset, offset + limit) }
}

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`)
  const path = url.pathname.replace(/\/+$/, '') || '/'

  // Observability: one line per request, so a paying customer's failure is
  // visible. Path without query string, and the key *id* only — never the
  // presented key, because customers do put secrets in URLs by mistake.
  const started = Date.now()
  res.on('finish', () => {
    console.log(JSON.stringify({
      t: new Date().toISOString(),
      method: req.method,
      path,
      status: res.statusCode,
      ms: Date.now() - started,
      key_id: res.keyId ?? null,
    }))
  })

  if (req.method !== 'GET') return fail(res, 405, 'method_not_allowed', 'This API is read-only.')

  // Unkeyed, uncounted: deploy checks must not need a customer key.
  if (path === '/v1/health') {
    return send(res, 200, { status: 'ok', schema_version: dataset.schemaVersion, row_count: dataset.rowCount, fixture: dataset.isFixture })
  }

  const key = authenticate(req, url, res)
  if (!key) return // authenticate already responded
  res.keyId = key.id

  const quota = consumeQuota(key.id, key.daily_limit)
  if (!quota.allowed) {
    return fail(res, 429, 'rate_limited', `Daily limit of ${quota.limit} requests reached.`, {
      ...quotaHeaders(quota),
      'retry-after': String(Math.max(1, quota.reset - Math.floor(Date.now() / 1000))),
    })
  }

  const h = quotaHeaders(quota)

  if (path === '/v1/meta') {
    return send(res, 200, {
      schema_version: dataset.schemaVersion,
      row_count: dataset.rowCount,
      fixture: dataset.isFixture,
      key: { id: key.id, plan: key.plan, scopes: key.scopes },
      quota: peekQuota(key.id, key.daily_limit),
    }, h)
  }

  if (path === '/v1/obligations') {
    const result = queryObligations(url)
    return send(res, 200, { schema_version: dataset.schemaVersion, ...result }, h)
  }

  const one = path.match(/^\/v1\/obligations\/(.+)$/)
  if (one) {
    const row = byId.get(decodeURIComponent(one[1]))
    if (!row) return fail(res, 404, 'not_found', 'No obligation with that id.', h)
    return send(res, 200, { schema_version: dataset.schemaVersion, row }, h)
  }

  return fail(res, 404, 'not_found', `No route for ${path}.`, h)
})

server.listen(PORT, () => {
  console.log(`API listening on http://127.0.0.1:${PORT} (fixture=${dataset.isFixture}, rows=${dataset.rowCount})`)
})
