// Band resolution is the only real logic between Ledger's rows and a published
// date. A bug here does not crash anything — it quietly prints the wrong
// deadline, which is the one failure that ends this business. Hence tests.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { appliesToBand, partialRange, BANDS, buildCheckerPages } from './obligations.js'

const row = (over) => ({
  threshold_type: 'turnover',
  threshold_currency: 'EUR',
  threshold_operator: 'gt',
  threshold_value: 800_000,
  ...over,
})

test('threshold_type none binds every band', () => {
  for (const b of Object.values(BANDS)) {
    assert.equal(appliesToBand(row({ threshold_type: 'none', threshold_value: null, threshold_currency: null, threshold_operator: null }), b), 'all')
  }
})

test('a non-euro threshold is never resolved — we have no FX rate', () => {
  const r = row({ threshold_currency: 'PLN', threshold_value: 200_000_000 })
  for (const b of Object.values(BANDS)) assert.equal(appliesToBand(r, b), 'unresolved')
})

test('a non-turnover threshold is never resolved against a turnover band', () => {
  for (const t of ['headcount', 'balance_sheet', 'invoice_value', 'unknown', 'revenue_or_fees']) {
    assert.equal(appliesToBand(row({ threshold_type: t }), BANDS.small), 'unresolved')
  }
})

test('a threshold type outside the documented enum fails closed, not open', () => {
  // Ledger's dist already carries `revenue_or_fees`, which SCHEMA.md does not
  // list. An undocumented type must never be guessed at.
  assert.equal(appliesToBand(row({ threshold_type: 'something_new' }), BANDS.micro), 'unresolved')
})

test('Germany: the 800k line cuts through the micro band', () => {
  // micro is [0, 2m). The threshold is inside it, so neither row binds the whole band.
  assert.equal(appliesToBand(row({ threshold_operator: 'gt' }), BANDS.micro), 'partial')
  assert.equal(appliesToBand(row({ threshold_operator: 'lte' }), BANDS.micro), 'partial')
})

test('Germany: above 800k binds small, medium and large outright', () => {
  const over = row({ threshold_operator: 'gt' })
  for (const b of [BANDS.small, BANDS.medium, BANDS.large]) assert.equal(appliesToBand(over, b), 'all')
})

test('Germany: at-or-below 800k cannot touch small, medium or large', () => {
  const under = row({ threshold_operator: 'lte' })
  for (const b of [BANDS.small, BANDS.medium, BANDS.large]) assert.equal(appliesToBand(under, b), 'none')
})

test('every operator resolves correctly at the band boundary', () => {
  // small is [2m, 10m). A threshold exactly on the lower edge must not be fudged.
  assert.equal(appliesToBand(row({ threshold_operator: 'gte', threshold_value: 2_000_000 }), BANDS.small), 'all')
  assert.equal(appliesToBand(row({ threshold_operator: 'gt', threshold_value: 2_000_000 }), BANDS.small), 'partial')
  assert.equal(appliesToBand(row({ threshold_operator: 'lt', threshold_value: 2_000_000 }), BANDS.small), 'none')
  assert.equal(appliesToBand(row({ threshold_operator: 'lte', threshold_value: 10_000_000 }), BANDS.small), 'all')
})

test('the large band has no upper bound and still resolves', () => {
  assert.equal(appliesToBand(row({ threshold_operator: 'gt', threshold_value: 50_000_000 }), BANDS.large), 'partial')
  assert.equal(appliesToBand(row({ threshold_operator: 'gte', threshold_value: 50_000_000 }), BANDS.large), 'all')
  assert.equal(appliesToBand(row({ threshold_operator: 'lt', threshold_value: 1e12 }), BANDS.large), 'partial')
})

test('partialRange describes the sub-range, and never an empty one', () => {
  const upper = partialRange(row({ threshold_operator: 'gt' }), BANDS.micro)
  assert.deepEqual([upper.from, upper.to], [800_000, 2_000_000])
  assert.match(upper.label, /above €800,000 up to €2m/)

  const lower = partialRange(row({ threshold_operator: 'lte' }), BANDS.micro)
  assert.deepEqual([lower.from, lower.to], [0, 800_000])
  assert.match(lower.label, /up to and including €800,000/)

  // No overlap and no gap: the two halves tile the band exactly.
  assert.equal(lower.to, upper.from)

  // A threshold outside the band yields no range rather than a backwards one.
  assert.equal(partialRange(row({ threshold_operator: 'gt', threshold_value: 5_000_000 }), BANDS.micro), null)
  assert.equal(partialRange(row({ threshold_currency: 'PLN' }), BANDS.micro), null)
})

test('a page never both states an answer and hides a conflicting one', () => {
  // If a row binds the whole band, no partial row may claim a different date for
  // part of it — that would mean two answers to one question.
  for (const p of buildCheckerPages()) {
    if (p.answer) {
      assert.equal(p.partial.length, 0,
        `${p.country.iso2}/${p.direction.slug}/${p.band.slug} has a whole-band answer AND partial rows`)
    }
  }
})

test('every generated page can answer, or says plainly that it cannot', () => {
  const pages = buildCheckerPages()
  assert.ok(pages.length > 0, 'no pages generated')
  for (const p of pages) {
    const answers = Boolean(p.answer) || p.partial.length > 0
    const explains = p.unresolved.length > 0 || p.undated.length > 0
    assert.ok(answers || explains,
      `${p.country.iso2}/${p.direction.slug}/${p.band.slug} would render a dead end`)
  }
})

test('no published row is missing the provenance the pages promise', () => {
  for (const p of buildCheckerPages()) {
    for (const r of p.all) {
      assert.ok(r.source_url, `${r.obligation_id} has no source_url`)
      assert.ok(r.checked_on, `${r.obligation_id} has no checked_on`)
      assert.ok(r.confidence, `${r.obligation_id} has no confidence`)
    }
  }
})
