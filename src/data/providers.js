// Adapter between Scout's Peppol access-point dataset (ARC-7) and the comparison
// pages. Field names are the contract in dataset/schema/providers.v1.md.
//
// There is deliberately no fixture here. The obligations loader has one because a
// wrong-looking date is obvious; a plausible-looking fake provider price is not,
// and a comparison table of invented vendors is the single worst thing this site
// could publish. No data means no pages.

import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const SRC = fileURLToPath(new URL('../../dataset/dist/providers.json', import.meta.url))

let cache = null

/**
 * Loads the provider dataset, dropping any row without the provenance every
 * surface promises. Returns an empty list when Scout has not published yet.
 */
export function loadProviders() {
  if (cache) return cache

  if (!existsSync(SRC)) {
    cache = { schemaVersion: null, providers: [], dropped: [], published: false }
    return cache
  }

  const payload = JSON.parse(readFileSync(SRC, 'utf8'))
  const all = Array.isArray(payload.providers) ? payload.providers : []

  // Odysseus's rule, enforced at load rather than in a template: a row with no
  // source URL or no verified-on date does not get served.
  const keep = []
  const dropped = []
  for (const p of all) {
    if (p.provider_id && p.name && p.source_url && p.verified_on) keep.push(p)
    else dropped.push(p.provider_id ?? p.name ?? '<unidentified row>')
  }

  if (dropped.length > 0) {
    console.warn(`providers.json: dropped ${dropped.length} row(s) with no source_url/verified_on: ${dropped.join(', ')}`)
  }

  cache = {
    schemaVersion: payload.schema_version ?? 'unknown',
    generatedOn: payload.generated_on ?? null,
    providers: keep.sort((a, b) => a.name.localeCompare(b.name)),
    dropped,
    published: true,
  }
  return cache
}

/** What a price cell says. Never a number we invented. */
export function priceLabel(p) {
  if (p.price_as_published) return p.price_as_published
  if (typeof p.price_monthly_eur === 'number') return `€${p.price_monthly_eur.toLocaleString('en-GB')}/month`
  if (typeof p.price_per_document_eur === 'number') return `€${p.price_per_document_eur}/document`
  if (p.pricing_model === 'quote-only') return 'Quote only'
  if (p.pricing_model === 'free') return 'Free'
  return 'Not published'
}

export const yesNo = (v) => (v === true ? 'Yes' : v === false ? 'No' : 'Not published')
