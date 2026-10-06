#!/usr/bin/env node
// Deploy guard. A production build must never render the fixture, and must never
// render a row without the provenance the pages promise. Non-zero exit stops CI.

import { existsSync, readFileSync } from 'node:fs'

const PATH = 'dataset/dist/obligations.json'
const problems = []

if (!existsSync(PATH)) {
  console.error(`FAIL ${PATH} is missing.`)
  console.error('      That file is Ledger\'s published artifact. Without it the site would render')
  console.error('      the 2099 fixture, so this build is refused rather than deployed.')
  process.exit(1)
}

const payload = JSON.parse(readFileSync(PATH, 'utf8'))
const rows = payload.rows ?? []

const TODAY = new Date().toISOString().slice(0, 10)
const SKEW_LIMIT = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)

if (rows.length === 0) problems.push('dataset contains zero rows')

for (const r of rows) {
  const id = r.obligation_id ?? '<no obligation_id>'
  // These three are what every public page cites. A row without them cannot ship.
  if (!r.source_url) problems.push(`${id}: no source_url`)
  if (!r.checked_on) problems.push(`${id}: no checked_on`)
  if (!r.confidence) problems.push(`${id}: no confidence`)
  if (r.mandatory_from == null && r.confidence !== 'unknown') {
    problems.push(`${id}: mandatory_from is null but confidence is "${r.confidence}" (must be "unknown")`)
  }
  // `build.py` already rejects a future checked_on against the clock of whoever
  // authored the row. Here we only catch a wildly wrong stamp, with a day of slack
  // for timezone and clock skew between the author's machine and the CI runner —
  // otherwise a correct row fails the build for being stamped in UTC+3.
  if (r.checked_on && r.checked_on > SKEW_LIMIT) {
    problems.push(`${id}: checked_on ${r.checked_on} is more than a day ahead of this machine's clock (${TODAY})`)
  }
}

// Scout's provider dataset (ARC-7) is optional — the comparison section simply
// does not exist until it lands. But once it does exist, it gets the same
// provenance rule as the obligations: no source URL or no verified-on date, no
// publish. A comparison table of unsourced vendor prices is a lawsuit.
const PROVIDERS = 'dataset/dist/providers.json'
let providerCount = 0

if (existsSync(PROVIDERS)) {
  const pPayload = JSON.parse(readFileSync(PROVIDERS, 'utf8'))
  const providers = pPayload.providers ?? []
  providerCount = providers.length

  if (providers.length === 0) problems.push(`${PROVIDERS} exists but contains zero providers`)

  for (const p of providers) {
    const id = p.provider_id ?? p.name ?? '<no provider_id>'
    if (!p.provider_id) problems.push(`provider ${id}: no provider_id`)
    if (!p.name) problems.push(`provider ${id}: no name`)
    if (!p.source_url) problems.push(`provider ${id}: no source_url`)
    if (!p.verified_on) problems.push(`provider ${id}: no verified_on`)
    if (p.verified_on && p.verified_on > SKEW_LIMIT) {
      problems.push(`provider ${id}: verified_on ${p.verified_on} is more than a day ahead of this machine's clock (${TODAY})`)
    }
  }

  const ids = providers.map((p) => p.provider_id).filter(Boolean)
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i)
  if (dupes.length > 0) problems.push(`duplicate provider_id(s): ${[...new Set(dupes)].join(', ')}`)
}

if (problems.length > 0) {
  console.error(`FAIL ${problems.length} row problem(s) — refusing to publish:`)
  for (const p of problems) console.error(`      - ${p}`)
  process.exit(1)
}

console.log(`OK   ${rows.length} rows, schema ${payload.schema_version}, every row has a source, a checked-on date and a confidence.`)
console.log(
  providerCount > 0
    ? `OK   ${providerCount} providers, every one with a source URL and a verified-on date.`
    : `--   no ${PROVIDERS} yet (Scout, ARC-7); the comparison section is not generated.`
)
