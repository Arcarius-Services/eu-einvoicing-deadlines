#!/usr/bin/env node
// Key administration. Until self-serve signup exists (blocked on the payment
// account) this is how a free-tier key gets issued.
//
//   node api/keyctl.mjs mint "Acme Invoicing" free
//   node api/keyctl.mjs list
//   node api/keyctl.mjs revoke <key-id>

import { mintKey, revokeKey, listKeys, PLANS } from './keys.mjs'

const [cmd, ...args] = process.argv.slice(2)

try {
  switch (cmd) {
    case 'mint': {
      const [label, plan = 'free'] = args
      if (!label) throw new Error('Usage: keyctl mint "<label>" [free|starter|vendor]')
      const k = mintKey({ label, plan })
      console.log(`\nKey id:   ${k.id}`)
      console.log(`Plan:     ${k.plan} (${k.dailyLimit}/day, scopes: ${k.scopes.join(' ')})`)
      console.log(`\n  ${k.plaintext}\n`)
      console.log('This is the only time the key is shown. We store a hash — it cannot be recovered, only revoked.\n')
      break
    }
    case 'revoke': {
      const [id] = args
      if (!id) throw new Error('Usage: keyctl revoke <key-id>')
      console.log(revokeKey(id) ? `Revoked ${id}. It stops working on the next request.` : `No live key with id ${id}.`)
      break
    }
    case 'list': {
      const rows = listKeys()
      if (rows.length === 0) { console.log('No keys.'); break }
      for (const r of rows) {
        console.log(`${r.id}  ${r.revoked_at ? 'REVOKED' : 'live   '}  ${r.plan.padEnd(8)} ${String(r.daily_limit).padStart(7)}/day  ${r.label}`)
      }
      break
    }
    default:
      console.log(`Usage: keyctl <mint|list|revoke>\nPlans: ${Object.keys(PLANS).join(', ')}`)
      process.exit(cmd ? 1 : 0)
  }
} catch (err) {
  console.error(`Error: ${err.message}`)
  process.exit(1)
}
