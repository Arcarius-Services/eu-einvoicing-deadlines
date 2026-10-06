// API key storage. The plaintext key exists exactly once, in the response to
// whoever minted it. We keep a hash; we cannot recover the key, only revoke it.

import { DatabaseSync } from 'node:sqlite'
import { randomBytes, createHmac, timingSafeEqual } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

const DB_PATH = process.env.API_DB_PATH ?? './api/data/keys.db'

// Keys are hashed with HMAC-SHA256 under a server-side pepper so a stolen
// database alone cannot be brute-forced offline. The pepper is an env var and
// never touches the repo.
function pepper() {
  const p = process.env.API_KEY_PEPPER
  if (!p || p.length < 32) {
    throw new Error('API_KEY_PEPPER must be set to at least 32 characters. Refusing to start with a weak or absent pepper.')
  }
  return p
}

export function hashKey(plaintext) {
  return createHmac('sha256', pepper()).update(plaintext, 'utf8').digest('hex')
}

let db = null

export function openDb() {
  if (db) return db
  mkdirSync(dirname(DB_PATH), { recursive: true })
  db = new DatabaseSync(DB_PATH)
  db.exec(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id           TEXT PRIMARY KEY,
      key_hash     TEXT NOT NULL UNIQUE,
      label        TEXT NOT NULL,
      plan         TEXT NOT NULL,
      scopes       TEXT NOT NULL,
      daily_limit  INTEGER NOT NULL,
      created_at   TEXT NOT NULL,
      revoked_at   TEXT
    );
    CREATE TABLE IF NOT EXISTS usage (
      key_id  TEXT NOT NULL,
      day     TEXT NOT NULL,
      count   INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (key_id, day)
    );
    -- The pricing page's request-access capture. This is the willingness-to-pay
    -- test from the ARC-2 pivot, so losing a row loses the experiment.
    CREATE TABLE IF NOT EXISTS access_requests (
      id            TEXT PRIMARY KEY,
      email         TEXT NOT NULL UNIQUE,
      company       TEXT,
      use_case      TEXT,
      plan_interest TEXT NOT NULL,
      created_at    TEXT NOT NULL,
      updated_at    TEXT NOT NULL
    );
  `)
  return db
}

export const PLANS = {
  free: { dailyLimit: 100, scopes: ['obligations:read'] },
  starter: { dailyLimit: 10_000, scopes: ['obligations:read', 'changes:read'] },
  vendor: { dailyLimit: 100_000, scopes: ['obligations:read', 'changes:read', 'webhooks:manage'] },
}

export function mintKey({ label, plan = 'free' }) {
  const spec = PLANS[plan]
  if (!spec) throw new Error(`Unknown plan "${plan}". Known: ${Object.keys(PLANS).join(', ')}`)

  // 32 random bytes, base64url. The prefix is a convenience for humans grepping
  // their own config; it carries no secret.
  const plaintext = `eid_${plan}_${randomBytes(32).toString('base64url')}`
  const id = randomBytes(8).toString('hex')

  openDb()
    .prepare(
      `INSERT INTO api_keys (id, key_hash, label, plan, scopes, daily_limit, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(id, hashKey(plaintext), label, plan, spec.scopes.join(','), spec.dailyLimit, new Date().toISOString())

  return { id, plaintext, plan, scopes: spec.scopes, dailyLimit: spec.dailyLimit }
}

export function revokeKey(id) {
  const res = openDb()
    .prepare(`UPDATE api_keys SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL`)
    .run(new Date().toISOString(), id)
  return res.changes > 0
}

export function listKeys() {
  return openDb()
    .prepare(`SELECT id, label, plan, scopes, daily_limit, created_at, revoked_at FROM api_keys ORDER BY created_at`)
    .all()
}

/** Looks up a live key by its plaintext. Returns null for absent or revoked. */
export function findLiveKey(plaintext) {
  const hash = hashKey(plaintext)
  const row = openDb().prepare(`SELECT * FROM api_keys WHERE key_hash = ?`).get(hash)
  if (!row || row.revoked_at) return null

  // The unique-index lookup already decided this; the constant-time compare is
  // belt and braces against any future non-indexed lookup path.
  const a = Buffer.from(row.key_hash, 'hex')
  const b = Buffer.from(hash, 'hex')
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null

  return { ...row, scopes: row.scopes.split(',') }
}

/**
 * Stores a request for API access, keyed on email so a double-submit updates the
 * row instead of creating a duplicate. Returns `repeat: true` when we had already
 * heard from that address — the caller reports success either way, because
 * telling a stranger "you already asked" leaks who is on the list.
 */
export function recordAccessRequest({ email, company, useCase, planInterest }) {
  const d = openDb()
  const now = new Date().toISOString()
  const existing = d.prepare(`SELECT id FROM access_requests WHERE email = ?`).get(email)

  if (existing) {
    d.prepare(
      `UPDATE access_requests
         SET company = COALESCE(?, company),
             use_case = COALESCE(?, use_case),
             plan_interest = ?,
             updated_at = ?
       WHERE id = ?`
    ).run(company, useCase, planInterest, now, existing.id)
    return { id: existing.id, repeat: true }
  }

  const id = randomBytes(8).toString('hex')
  d.prepare(
    `INSERT INTO access_requests (id, email, company, use_case, plan_interest, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, email, company, useCase, planInterest, now, now)
  return { id, repeat: false }
}

/** Operator view of the capture. Used by keyctl, never exposed over HTTP. */
export function listAccessRequests() {
  return openDb()
    .prepare(`SELECT id, email, company, plan_interest, use_case, created_at FROM access_requests ORDER BY created_at DESC`)
    .all()
}

export function utcDay(now = new Date()) {
  return now.toISOString().slice(0, 10)
}

/**
 * Counts one request against the key's daily quota and returns the quota state.
 * Increment and read happen in one transaction so concurrent requests cannot
 * both slip past the limit.
 */
export function consumeQuota(keyId, dailyLimit, now = new Date()) {
  const d = openDb()
  const day = utcDay(now)

  d.exec('BEGIN IMMEDIATE')
  try {
    d.prepare(
      `INSERT INTO usage (key_id, day, count) VALUES (?, ?, 1)
       ON CONFLICT(key_id, day) DO UPDATE SET count = count + 1`
    ).run(keyId, day)
    const { count } = d.prepare(`SELECT count FROM usage WHERE key_id = ? AND day = ?`).get(keyId, day)
    d.exec('COMMIT')

    // Reset at the next UTC midnight — the same boundary `day` is keyed on.
    const reset = Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1) / 1000)
    return { count, limit: dailyLimit, remaining: Math.max(0, dailyLimit - count), reset, allowed: count <= dailyLimit }
  } catch (err) {
    d.exec('ROLLBACK')
    throw err
  }
}

export function peekQuota(keyId, dailyLimit, now = new Date()) {
  const row = openDb().prepare(`SELECT count FROM usage WHERE key_id = ? AND day = ?`).get(keyId, utcDay(now))
  const count = row?.count ?? 0
  const reset = Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1) / 1000)
  return { count, limit: dailyLimit, remaining: Math.max(0, dailyLimit - count), reset }
}
