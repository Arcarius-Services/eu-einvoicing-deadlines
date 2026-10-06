#!/usr/bin/env node
// Smoke test for the request-access capture. Proves the three behaviours the
// pricing page depends on: a good submission is stored, a replay of the same
// address updates instead of duplicating, and a junk address is refused.
//
//   PORT=8791 node scripts/smoke-access-request.mjs

const ORIGIN = process.env.SMOKE_ORIGIN ?? `http://127.0.0.1:${process.env.PORT ?? 8787}`
const SITE_ORIGIN = process.env.SMOKE_SITE_ORIGIN ?? 'https://arcarius-services.github.io'

async function post(body, headers = {}) {
  const res = await fetch(`${ORIGIN}/v1/access-requests`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
  return { status: res.status, cors: res.headers.get('access-control-allow-origin'), body: await res.json() }
}

const email = `dev+${Date.now()}@acme-invoicing.example`

console.log('1. good submission, from the site origin')
console.log(JSON.stringify(await post(
  { email, company: 'Acme Invoicing', plan_interest: 'vendor', use_case: 'Invoicing for ~400 EU SMEs; need mandate dates per country.' },
  { Origin: SITE_ORIGIN },
), null, 2))

console.log('\n2. replay of the same address — must update, not duplicate')
console.log(JSON.stringify(await post({ email, plan_interest: 'starter' }), null, 2))

console.log('\n3. junk address — must be refused')
console.log(JSON.stringify(await post({ email: 'nope' }), null, 2))

console.log('\n4. preflight from an origin that is not allowlisted')
const bad = await fetch(`${ORIGIN}/v1/access-requests`, {
  method: 'OPTIONS',
  headers: { Origin: 'https://not-us.example' },
})
console.log(`status=${bad.status} access-control-allow-origin=${bad.headers.get('access-control-allow-origin')}`)
