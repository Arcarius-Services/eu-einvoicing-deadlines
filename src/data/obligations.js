// The single adapter point between Ledger's dataset and everything the site and
// API render. Column names here are his (dataset/SCHEMA.md v1.0.0) — if he bumps
// the schema, this file is the only thing that changes.

import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const REAL = fileURLToPath(new URL('../../dataset/dist/obligations.json', import.meta.url))
const FIXTURE = fileURLToPath(new URL('../../fixtures/obligations.fixture.json', import.meta.url))

// Obligations that bind a company. `format-version` rows are the standards-body
// release calendar, not a duty anyone owes, so they never reach a checker page.
const COMPANY_REGIMES = new Set([
  'e-invoicing-b2b',
  'e-invoicing-b2g',
  'e-invoicing-b2c',
  'e-reporting',
])

// Not countries: EU-level instruments and non-geographic standards bodies.
const NON_COUNTRY = new Set(['EU', 'XX'])

export const DIRECTIONS = {
  issue: { slug: 'issue', verb: 'issue', label: 'Issuing' },
  receive: { slug: 'receive', verb: 'receive', label: 'Receiving' },
  report: { slug: 'report', verb: 'report', label: 'Reporting' },
}

// Turnover limits from EU Recommendation 2003/361. That recommendation also uses
// headcount and balance-sheet totals; we band on turnover alone and say so on the
// page. These are a size *classification*, not a compliance date.
export const BANDS = {
  micro: { slug: 'micro', label: 'Micro', lo: 0, hi: 2_000_000, blurb: 'turnover up to €2m' },
  small: { slug: 'small', label: 'Small', lo: 2_000_000, hi: 10_000_000, blurb: 'turnover €2m–€10m' },
  medium: { slug: 'medium', label: 'Medium', lo: 10_000_000, hi: 50_000_000, blurb: 'turnover €10m–€50m' },
  large: { slug: 'large', label: 'Large', lo: 50_000_000, hi: Infinity, blurb: 'turnover above €50m' },
}

export function slugify(s) {
  return String(s)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

let cache = null

/**
 * Loads the dataset. `isFixture` is true when Ledger's dist/ is not yet built —
 * the site then refuses to be indexed, because a fixture row is not a fact.
 */
export function loadDataset() {
  if (cache) return cache

  const usingReal = existsSync(REAL)
  const payload = JSON.parse(readFileSync(usingReal ? REAL : FIXTURE, 'utf8'))
  const rows = Array.isArray(payload.rows) ? payload.rows : []

  cache = {
    isFixture: !usingReal,
    schemaVersion: payload.schema_version ?? 'unknown',
    rowCount: payload.row_count ?? rows.length,
    rows,
  }
  return cache
}

/**
 * Does this obligation bind every company in the band, none of them, or can we
 * not tell? Never guesses: anything we cannot resolve from the row itself comes
 * back as 'unresolved' and the page says so rather than inventing a date.
 */
export function appliesToBand(row, band) {
  const type = row.threshold_type

  if (type === 'none') return 'all'
  if (type !== 'turnover') return 'unresolved' // headcount / balance sheet / invoice value / unknown
  if (row.threshold_currency !== 'EUR') return 'unresolved' // no FX rate, so no claim

  const v = row.threshold_value
  const op = row.threshold_operator
  if (typeof v !== 'number' || !op) return 'unresolved'

  const { lo, hi } = band
  // `hi` is exclusive; `lo` inclusive. Satisfied = the company is inside the duty.
  switch (op) {
    case 'gt':
      if (lo > v) return 'all'
      if (hi <= v) return 'none'
      return 'partial'
    case 'gte':
      if (lo >= v) return 'all'
      if (hi <= v) return 'none'
      return 'partial'
    case 'lt':
      if (hi <= v) return 'all'
      if (lo >= v) return 'none'
      return 'partial'
    case 'lte':
      if (hi <= v) return 'all'
      if (lo > v) return 'none'
      return 'partial'
    default:
      return 'unresolved'
  }
}

const eur = (n) =>
  n >= 1_000_000 ? `€${(n / 1_000_000).toLocaleString('en-GB', { maximumFractionDigits: 2 })}m`
  : `€${n.toLocaleString('en-GB')}`

/**
 * A national threshold rarely lines up with the EU size bands — Germany splits at
 * €800k, which cuts straight through "micro". For a row that binds only part of a
 * band, this describes exactly which part, so the page can give both answers
 * instead of shrugging. Returns null when the sub-range is not computable.
 */
export function partialRange(row, band) {
  if (row.threshold_type !== 'turnover' || row.threshold_currency !== 'EUR') return null
  const v = row.threshold_value
  if (typeof v !== 'number') return null

  const { lo, hi } = band
  let from = lo
  let to = hi
  let open // which end the threshold itself opened

  switch (row.threshold_operator) {
    case 'gt':
    case 'gte':
      from = Math.max(lo, v)
      open = 'lower'
      break
    case 'lt':
    case 'lte':
      to = Math.min(hi, v)
      open = 'upper'
      break
    default:
      return null
  }
  if (!(from < to)) return null

  const inclusive = row.threshold_operator === 'gte' || row.threshold_operator === 'lte'
  const label =
    open === 'lower'
      ? `turnover ${inclusive ? 'from' : 'above'} ${eur(from)}${Number.isFinite(to) ? ` up to ${eur(to)}` : ''}`
      : `turnover ${Number.isFinite(from) && from > 0 ? `from ${eur(from)} ` : ''}up to ${inclusive ? 'and including ' : ''}${eur(to)}`

  return { from, to, label }
}

const byDate = (a, b) => String(a.mandatory_from ?? '9999').localeCompare(String(b.mandatory_from ?? '9999'))

/** Every country x direction x band combination the dataset can actually answer. */
export function buildCheckerPages() {
  const { rows, isFixture } = loadDataset()

  const relevant = rows.filter(
    (r) => COMPANY_REGIMES.has(r.regime) && !NON_COUNTRY.has(r.jurisdiction) && DIRECTIONS[r.direction]
  )

  const countries = new Map()
  for (const r of relevant) {
    if (!countries.has(r.jurisdiction)) {
      countries.set(r.jurisdiction, { iso2: r.jurisdiction, name: r.jurisdiction_name, slug: slugify(r.jurisdiction_name) })
    }
  }

  const pages = []
  for (const country of countries.values()) {
    for (const direction of Object.values(DIRECTIONS)) {
      const inScope = relevant
        .filter((r) => r.jurisdiction === country.iso2 && r.direction === direction.slug)
        .sort(byDate)
      if (inScope.length === 0) continue // no row, no page — we do not publish empty answers

      for (const band of Object.values(BANDS)) {
        const graded = inScope.map((row) => ({ row, verdict: appliesToBand(row, band) }))

        const binding = graded.filter((g) => g.verdict === 'all').map((g) => g.row)

        // Rows that bind part of this band, with the part spelled out.
        const partial = graded
          .filter((g) => g.verdict === 'partial')
          .map((g) => ({ row: g.row, range: partialRange(g.row, band) }))
          .filter((p) => p.range)
          .sort((a, b) => a.range.from - b.range.from)

        // Rows we cannot size against a turnover band at all.
        const unresolved = graded
          .filter((g) => g.verdict === 'unresolved' || (g.verdict === 'partial' && !partialRange(g.row, band)))
          .map((g) => g.row)

        // The answer is the first dated duty that binds the whole band.
        const answer = binding.find((r) => r.mandatory_from) ?? null

        pages.push({ country, direction, band, binding, partial, unresolved, answer, all: inScope, isFixture })
      }
    }
  }
  return pages
}

export function listCountries() {
  const seen = new Map()
  for (const p of buildCheckerPages()) seen.set(p.country.iso2, p.country)
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name))
}

/** Rows the checker pages deliberately exclude, surfaced on the docs page instead. */
export function contextRows() {
  const { rows } = loadDataset()
  return rows.filter((r) => NON_COUNTRY.has(r.jurisdiction) || r.regime === 'format-version')
}

export function fmtDate(iso) {
  if (!iso) return null
  const d = new Date(`${iso}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

export function fmtThreshold(row) {
  if (row.threshold_type === 'none') return 'Applies regardless of company size'
  if (row.threshold_type === 'unknown' || row.threshold_value == null) return 'Size threshold not published'
  const op = { gt: 'above', gte: 'at or above', lt: 'below', lte: 'at or below' }[row.threshold_operator] ?? row.threshold_operator
  const amount = new Intl.NumberFormat('en-GB').format(row.threshold_value)
  const cur = row.threshold_currency ?? ''
  return `${row.threshold_type.replace(/_/g, ' ')} ${op} ${amount} ${cur}`.trim()
}
