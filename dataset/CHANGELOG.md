# Dataset changelog

Every change to a previously published row gets a dated entry here. No silent corrections.
The diff is a product: what changed since last week is worth more to a buyer than the snapshot.

Entry format: `added` / `changed` / `removed` / `reverified`, the `obligation_id`, the fields that
moved, old value → new value, and the source that justified the move.

---

## 2026-10-07 — schema v1.0.0, first release

Schema `1.0.0` published; contract in [`dataset/schema/v1.md`](schema/v1.md), machine-checkable at
`dataset/schema/obligations.v1.schema.json`. Nothing precedes this release, so there are no diffs.

### added — 12 rows, 5 jurisdictions, all `verified`

| obligation_id | direction | mandatory_from | tolerance_ends |
| --- | --- | --- | --- |
| `BE-e-invoicing-b2b-issue-all` | issue | 2026-01-01 | 2026-03-31 |
| `BE-e-invoicing-b2b-receive-all` | receive | 2026-01-01 | 2026-03-31 |
| `DE-e-invoicing-b2b-receive-all` | receive | 2025-01-01 | — |
| `DE-e-invoicing-b2b-issue-turnover-gt-800k` | issue | 2027-01-01 | 2026-12-31 |
| `DE-e-invoicing-b2b-issue-turnover-lte-800k` | issue | 2028-01-01 | 2027-12-31 |
| `FR-e-invoicing-b2b-receive-all` | receive | 2026-09-01 | — |
| `FR-e-invoicing-b2b-issue-grandes-entreprises-et-eti` | issue | 2026-09-01 | — |
| `FR-e-invoicing-b2b-issue-pme-tpe-micro` | issue | 2027-09-01 | — |
| `IT-e-invoicing-b2b-issue-forfetario-residual` | issue | 2024-01-01 | — |
| `PL-e-invoicing-b2b-receive-all` | receive | 2026-02-01 | — |
| `PL-e-invoicing-b2b-issue-turnover-gt-200m-pln` | issue | 2026-02-01 | — |
| `PL-e-invoicing-b2b-issue-turnover-lte-200m-pln` | issue | 2026-04-01 | 2026-12-31 |

### added — 7 further rows, 3 further jurisdictions (ES, GR, RO)

Not all `verified`, deliberately. These are the rows where the honest answer is weaker than the
date, and the confidence column is carrying that rather than hiding it.

| obligation_id | direction | mandatory_from | tolerance_ends | confidence |
| --- | --- | --- | --- | --- |
| `ES-e-invoicing-b2b-issue-turnover-gt-8m-eur` | issue | 2027-10-06 | — | `reported` |
| `ES-e-invoicing-b2b-issue-turnover-lte-8m-eur` | issue | 2028-10-06 | — | `reported` |
| `ES-e-invoicing-b2b-receive-all` | receive | — | — | `unknown` |
| `GR-e-invoicing-b2b-issue-revenue-gt-1m-eur` | issue | 2026-03-02 | 2026-05-03 | `reported` |
| `GR-e-invoicing-b2b-issue-revenue-lte-1m-eur` | issue | 2026-10-01 | — | `reported` |
| `RO-e-invoicing-b2b-issue-all` | issue | 2024-07-01 | — | `verified` |
| `RO-e-invoicing-b2b-issue-reporting-phase` | issue | 2024-01-01 | 2024-03-31 | `verified` |

**Release total: 19 rows, 8 jurisdictions — 14 `verified`, 4 `reported`, 1 `unknown`.** Oldest
`checked_on` in the set: **2026-10-07**. 17 of 19 rows carry open `unknowns` — named gaps on rows
whose date is sound. See `dataset/dist/coverage.md`.

### why Spain is `reported` and not `verified`

Both Spanish instruments were read directly, and the row is still not `verified`, because
`mandatory_from` is **our arithmetic rather than a date either instrument prints**. Orden
HAC/1028/2026 (BOE of 2026-10-05) enters into force the day after publication — 2026-10-06 — and
that entry into force is the event the RD 238/2026 phase-in periods run from: 12 months for
turnover above €8m, 24 months for everyone else. Adding those periods is a computation, and
whether a period expressed in months under art. 30 of Ley 39/2015 expires on 2027-10-06 or
2027-10-05 is a legal-interpretation question. Escalated to Odysseus; the later reading is
recorded. Promoting these to `verified` requires either that reading settled or AEAT publishing
the dates itself.

This is also the freshest commercial fact in the release: **before 2026-10-06 the Spanish dates
could not be computed at all**, because the phase-in ran from a ministerial order that had not
been published. Any competitor snapshot taken before 2026-10-05 still shows Spain as undated.

### why Greece is `reported` and not `verified`

Access, not source quality. `aade.gr` returned HTTP 403 to this host on every attempt on
2026-10-07 — English FAQ, Greek press-release pages and the press-release PDFs, with and without
browser headers. No AADE text was read. The dates come from search-index extractions of AADE's own
documents, so `source_type` is `secondary` to describe **our access**, not AADE's standing, and
`confidence` is capped at `reported`. No circumvention was attempted.

Greece is the highest-priority re-verification in the set: the second-phase date (2026-10-01) has
**already passed**, so a buyer reading it is asking whether they are currently non-compliant — and
an AADE press release dated 2026-09-22 was identified but could not be retrieved, nine days before
that date, and could amend it.

### sources read for the ES, GR and RO rows on 2026-10-07

- Orden HAC/1028/2026, de 2 de octubre (BOE núm. 247, 2026-10-05, disposición 20587) — retrieved as
  the BOE PDF and text-extracted. Disposición final única: in force the day after publication,
  "dándose inicio al cómputo de los plazos". Anexo I references the UBL model and EN 16931.
- Real Decreto 238/2026, de 25 de marzo (BOE-A-2026-7295) — disposición final cuarta, the 12/24
  month periods, the €8,000,000 figure and its art. 121 Ley 37/1992 basis.
- ANAF, "Termenele legale de transmitere a facturii electronice în sistemul național RO e-factura"
  — retrieved as PDF and text-extracted: the 15%-of-invoice-value sanction from 01.07.2024, the
  1 Jan – 31 Mar 2024 contravention tolerance, and the working-day → calendar-day switch.
- Greece: **nothing read.** See above.

### corrections to the starting brief on [ARC-3](/ARC/issues/ARC-3)

Five starting facts were given to be verified, not trusted. Four hold; two were incomplete in
ways that change who is in scope.

- **Belgium B2B live Jan 2026, tolerance ended 31 Mar 2026** — holds. Sharpened: the tolerance is
  penalties-only and FPS Finance states "under no circumstances" will a general postponement be
  granted. Reported as a delay, it is not one.
- **Poland KSeF phases Feb/Apr 2026** — holds, but incomplete. The Feb phase is gated on PLN 200m
  of 2024 sales, **receiving is mandatory for everyone from 2026-02-01 regardless of size**, and a
  PLN 10,000/month small-invoice transition runs to 2026-12-31. A small Polish company is in scope
  two months before the headline April date.
- **France receive from 1 Sep 2026, SMEs issue from 1 Sep 2027** — holds, but incomplete in the
  other direction: **grandes entreprises and ETI must also issue from 2026-09-01**, not merely
  receive. The size boundary is also composite, not a headcount line — see the FR rows'
  `threshold_definition`.
- **Germany above €800k from 1 Jan 2027, all from 1 Jan 2028** — holds, confirmed in § 27 Abs. 38
  UStG. The statute frames it as a transitional *permission* to keep issuing paper, measured on
  prior-calendar-year Gesamtumsatz per § 19 Abs. 2.
- **Peppol BIS 3.0.21 mandatory 17 Aug 2026** — holds exactly. Published 2026-05-20, mandatory
  2026-08-17, per the OpenPeppol release notes. 3.0.20 was mandatory from 2026-02-23.

### sources read for the DE and IT rows on 2026-10-07

Verified directly, quotes in [`sources/verification-log.md`](sources/verification-log.md):

- § 14 and § 27 Abs. 38 UStG, consolidated text (gesetze-im-internet.de) — the €800,000
  Gesamtumsatz figure and the "vorangegangenes Kalenderjahr" measurement period.
- BMF e-Rechnung FAQ, **Stand März 2026** — Q8/Q12 receiving obligation with no grace period,
  Q11 the issuer-side transition, Q7 the permitted formats.
- DL 36/2022 art. 18 cc. 2–3 (Normattiva, text in force) — the €25,000 / *ragguagliati ad anno*
  wording and both commencement dates.
- Agenzia delle Entrate FatturaPA technical specifications v1.9 and v1.9.1.

The FR, BE and PL rows were produced by the [ARC-3](/ARC/issues/ARC-3) build in the same workspace
and carry their own `source_url` and `confidence_note`. They were **not** independently re-read in
this pass.

### the Germany split, recorded deliberately

Germany is three rows, not one. Receiving has been mandatory since 2025-01-01 with **no** grace
period; issuing is 2027-01-01 above €800k turnover and 2028-01-01 at or below it. The §27 Abs. 38
tolerance is issuer-side only. A single "Germany: 2025" row would be wrong for almost every reader,
and recording only one side of the €800k line would mislead anyone sitting near the boundary.

### open unknowns carried by the DE/IT rows

- `DE-…-issue-turnover-lte-800k` — Kleinunternehmer are exempt from issuing outright, not deferred
  to 2028. Until that exemption has its own row, this row over-states their obligation.
- `IT-…-forfetario-residual` — no grace period located for the 2024-01-01 cohort; `contribuenti
  minimi` and amateur sports bodies not separately verified; no published date on which FatturaPA
  spec v1.9 stops being accepted by the SdI.

### known gaps, deliberately not rows yet

Recorded so nobody mistakes absence for "no obligation":

- Italy's general SdI mandate from 2019-01-01, and the 1 July 2022 forfetario cohort. The
  2019-01-01 date was read on the Agenzia delle Entrate guide page on 2026-10-07 and is not
  recorded only because it has not been written as a row yet.
- Germany's Kleinunternehmer issuing exemption, and B2G (which predates the B2B regime).
- **The EU layer: Directive 2014/55/EU (B2G) and Council Directive (EU) 2025/516 (ViDA).** Not a
  sourcing failure — `eur-lex.europa.eu` answered every request from this host with HTTP 202 and an
  empty body, across the CELEX, ELI and PDF routes and the Publications Office cellar. That is a
  bot challenge, and working around it would breach the access terms, so it was not attempted.
  These two instruments are the baseline every national B2G row derives from, so the gap is
  structural rather than cosmetic.
- Romania's invoice format (RO_CIUS / EN 16931): `mfinante.gov.ro` reset the connection on the
  OUG 120/2021 PDF. `format_name` is left null rather than guessed.
- France's permitted format versions (Factur-X, UBL, CII): the "spécifications externes" document
  carrying them was not retrieved.
- 19 of 27 member states, plus UK and Norway.

### proposed for 1.1.0 — `threshold_is_live`

Additive, not yet shipped. 1.0.0 cannot distinguish a threshold that still screens (Germany's
€800k) from one that only selected a past commencement date (Italy's €25,000, dead since
2024-01-01). Rationale and the interim render in `schema/v1.md`. Consumers must not code against
it until it appears here as `added`.

---

## Re-verification schedule

Rows are re-checked against `source_url` and `checked_on` is advanced on each pass. A row whose
`checked_on` has gone stale keeps its value and its date — it is never silently refreshed without
the source actually being re-read. Cadence and ownership are set on
[ARC-3](/ARC/issues/ARC-3).

Follow-ups already identified:

- The BMF-Schreiben of **15 October 2025** has not been read in full; it is the current
  administrative view alongside the 15 October 2024 letter.
- France's dates have a history of movement; re-read the DGFiP source rather than trusting the
  recorded value.
