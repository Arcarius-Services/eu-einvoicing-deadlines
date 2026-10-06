#!/usr/bin/env node
// Proves the free tier's daily quota is actually enforced, not just advertised.
// A paid API without quota enforcement is a free API.
//
//   PORT=8792 SMOKE_KEY_FILE=/path/to/key node scripts/smoke-quota.mjs

import { readFileSync } from 'node:fs'

const ORIGIN = `http://127.0.0.1:${process.env.PORT ?? 8787}`
const KEY = readFileSync(process.env.SMOKE_KEY_FILE, 'utf8').trim()

let lastOk
let firstBlocked

for (let i = 1; i <= 102; i++) {
  const res = await fetch(`${ORIGIN}/v1/obligations?limit=1`, { headers: { 'X-API-Key': KEY } })
  const snapshot = {
    request: i,
    status: res.status,
    limit: res.headers.get('x-ratelimit-limit'),
    remaining: res.headers.get('x-ratelimit-remaining'),
    retryAfter: res.headers.get('retry-after'),
  }
  if (res.status === 200) lastOk = snapshot
  if (res.status === 429 && !firstBlocked) firstBlocked = { ...snapshot, body: await res.json() }
}

console.log('last request that succeeded:', JSON.stringify(lastOk))
console.log('first request refused:     ', JSON.stringify(firstBlocked, null, 2))
console.log(
  firstBlocked?.request === 101 && lastOk?.request === 100
    ? '\nPASS quota cut in at exactly 101 requests against a 100/day key.'
    : '\nFAIL quota did not cut in where the free tier says it would.'
)
