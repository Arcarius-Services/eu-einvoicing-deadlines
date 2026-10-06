// Keyed JSON API over Ledger's obligation dataset.
//
// Deliberately node:http + node:sqlite with no third-party dependency: this is
// the process that holds hashed customer keys, so its whole supply chain is the
// Node standard library.

import { createServer } from 'node:http'
import { findLiveKey, consumeQuota, peekQuota, recordAccessRequest } from './keys.mjs'
import { loadDataset } from '../src/data/obligations.js'
import { BRAND, DISCLAIMER } from '../src/brand.mjs'

const PORT = Number(process.env.PORT ?? 8787)

// Browser origins allowed to POST the access-request form. The site is static and
// on a different origin from this API, so the form needs an explicit allowlist —
// not a wildcard.
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

// Loaded once. The dataset is a build artifact; a change means a redeploy.
const dataset = loadDataset()

// Odysseus's rule, enforced here and not only in the build guard: a row without
// its own source URL and checked-on date does not get served. The deploy guard
// should already have failed the build, so anything dropped here is a bug — say
// so loudly at boot rather than quietly serving an uncitable fact.
const servable = dataset.rows.filter((r) => r.source_url && r.checked_on)
const withheld = dataset.rows.length - servable.length
if (withheld > 0) {
  console.error(`WARNING withholding ${withheld} row(s) with no source_url/checked_on. The deploy guard should have caught this.`)
}

const byId = new Map(servable.map((r) => [r.obligation_id, r]))

const ROUTE_SCOPE = 'obligations:read'

// Travels with the data into whatever app consumes it, so the caveat does not get
// stripped off by living only in our footer.
const ENVELOPE = {
  source: BRAND,
  disclaimer: DISCLAIMER,
  schema_version: dataset.schemaVersion,
}

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

  let rows = servable
  for (const field of ['jurisdiction', 'direction', 'regime', 'confidence']) {
    const v = sp.get(field)
    if (v) rows = rows.filter(eq(field, v))
  }

  const limit = Math.min(Math.max(Number(sp.get('limit') ?? 100) || 100, 1), 1000)
  const offset = Math.max(Number(sp.get('offset') ?? 0) || 0, 0)

  return { total: rows.length, limit, offset, rows: rows.slice(offset, offset + limit) }
}

const MAX_BODY = 4096

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (c) => {
      size += c.length
      if (size > MAX_BODY) {
        reject(Object.assign(new Error('body_too_large'), { code: 'body_too_large' }))
        req.destroy()
        return
      }
      chunks.push(c)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

// Deliberately permissive: this validates that a reply is possible, not that the
// address is real. Bouncing a prospect off our signup form over a regex is a worse
// outcome than storing one undeliverable row.
const looksLikeEmail = (s) => typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim())

const PLAN_INTEREST = new Set(['free', 'starter', 'vendor', 'undecided'])

/**
 * Records a request for API access. This is the willingness-to-pay test from the
 * ARC-2 pivot, so it has to land somewhere durable — it writes to the same SQLite
 * file as the keys, and returns 201 whether or not the address is new.
 */
async function handleAccessRequest(req, res, cors) {
  let raw
  try {
    raw = await readBody(req)
  } catch {
    return fail(res, 413, 'body_too_large', `Keep the request under ${MAX_BODY} bytes.`, cors)
  }

  let body
  try {
    body = JSON.parse(raw || '{}')
  } catch {
    return fail(res, 400, 'invalid_json', 'Send a JSON object.', cors)
  }

  if (!looksLikeEmail(body.email)) {
    return fail(res, 400, 'invalid_email', 'An email address we can reply to is the one field we need.', cors)
  }

  const plan = PLAN_INTEREST.has(body.plan_interest) ? body.plan_interest : 'undecided'
  const trim = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : null)

  const result = recordAccessRequest({
    email: body.email.trim().slice(0, 320),
    company: trim(body.company, 200),
    useCase: trim(body.use_case, 1000),
    planInterest: plan,
  })

  // The email is a customer identifier, so it is not in the access log — only the
  // row id and whether it was new.
  console.log(JSON.stringify({ t: new Date().toISOString(), event: 'access_request', id: result.id, repeat: result.repeat, plan }))

  return send(res, 201, {
    status: 'recorded',
    id: result.id,
    message: 'Thanks — we have your request and will reply with a free-tier key.',
  }, cors)
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

  const origin = typeof req.headers.origin === 'string' ? req.headers.origin : null
  const cors = origin && ALLOWED_ORIGINS.includes(origin)
    ? { 'access-control-allow-origin': origin, 'vary': 'origin' }
    : {}

  if (req.method === 'OPTIONS') {
    res.writeHead(204, { ...cors, 'access-control-allow-methods': 'GET, POST', 'access-control-allow-headers': 'content-type', 'access-control-max-age': '86400' })
    return res.end()
  }

  // The only write route. It is the pricing page's request-access form: no key,
  // because the whole point is that a stranger who has no key can ask for one.
  if (path === '/v1/access-requests') {
    if (req.method !== 'POST') return fail(res, 405, 'method_not_allowed', 'Send this as POST.', cors)
    return handleAccessRequest(req, res, cors)
  }

  if (req.method !== 'GET') return fail(res, 405, 'method_not_allowed', 'This API is read-only.', cors)

  // Unkeyed, uncounted: deploy checks must not need a customer key.
  if (path === '/v1/health') {
    return send(res, 200, { status: 'ok', schema_version: dataset.schemaVersion, row_count: servable.length, fixture: dataset.isFixture })
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
      ...ENVELOPE,
      row_count: servable.length,
      fixture: dataset.isFixture,
      key: { id: key.id, plan: key.plan, scopes: key.scopes },
      quota: peekQuota(key.id, key.daily_limit),
    }, h)
  }

  if (path === '/v1/obligations') {
    const result = queryObligations(url)
    return send(res, 200, { ...ENVELOPE, ...result }, h)
  }

  const one = path.match(/^\/v1\/obligations\/(.+)$/)
  if (one) {
    const row = byId.get(decodeURIComponent(one[1]))
    if (!row) return fail(res, 404, 'not_found', 'No obligation with that id.', h)
    return send(res, 200, { ...ENVELOPE, row }, h)
  }

  return fail(res, 404, 'not_found', `No route for ${path}.`, h)
})

server.listen(PORT, () => {
  console.log(`API listening on http://127.0.0.1:${PORT} (fixture=${dataset.isFixture}, rows=${dataset.rowCount})`)
})
