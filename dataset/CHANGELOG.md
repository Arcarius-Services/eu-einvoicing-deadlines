# Dataset changelog

Every change to a previously published row gets a dated entry here. No silent corrections.
The diff is a product: what changed since last week is worth more to a buyer than the snapshot.

Entry format: `added` / `changed` / `removed` / `reverified`, the `obligation_id`, the fields that
moved, old value → new value, and the source that justified the move.

---

## 2026-10-07 — Portugal, closing the priority band ([ARC-3](/ARC/issues/ARC-3))

Portugal was the last of the eight jurisdictions in the priority band set on
[ARC-3](/ARC/issues/ARC-3) (PL, BE, FR, DE, IT, ES, RO, PT). With this row the band is covered.

### added — 1 row, 1 member state

| obligation_id | regime | direction | scope | mandatory_from | tolerance_ends | confidence |
| --- | --- | --- | --- | --- | --- | --- |
| `PT-e-invoicing-b2b-issue-electronic-issuers` | `e-invoicing-b2b` | issue | b2b-and-b2c | 2027-01-01 | 2026-12-31 | `verified` |

### the finding: Portugal has no B2B e-invoicing mandate, and that is the product

Every secondary source describes Portugal with a 2027 date, which reads like a mandate. It is not
one, and selling it as one would be the confidently-wrong row that kills this product. Read from
the gazette, art. 12.º n.º 1 of **Decreto-Lei n.º 28/2019** is permissive:

> "As faturas e demais documentos fiscalmente relevantes **podem**, mediante aceitação pelo
> destinatário, ser emitidos por via eletrónica."

Electronic issuing is optional *and* conditional on the recipient agreeing. Paper stays lawful.
There is therefore also no receiving obligation to record for Portugal, which is why this
jurisdiction has one row and not the usual two or three.

What **is** dated is narrower: the conditions on an invoice once it is issued electronically.
Art. 12.º n.º 2 requires one of three authenticity-and-integrity procedures — a qualified
electronic signature, a qualified electronic seal under Regulation (EU) No 910/2014, or an EDI
system under the European model EDI agreement. A plain PDF file satisfies none of them, and is
accepted only under the annual transitional rule. **Lei n.º 73-A/2025** (Orçamento do Estado para
2026), art. 95.º n.º 3, verbatim:

> "Até 31 de dezembro de 2026 são aceites faturas em ficheiro PDF, sendo consideradas como faturas
> eletrónicas para todos os efeitos previstos na legislação fiscal."

So `tolerance_ends` is 2026-12-31 and `mandatory_from` is 2027-01-01. The obligation a buyer must
act on is: *if you send PDF invoices to Portuguese customers, 2026-12-31 is the last day a bare PDF
counts as an electronic invoice.*

### why this is `verified` where Spain's computed dates are not

`mandatory_from` here is the day after a cut-off the statute prints in words. That is the
complement of an explicit end-date, with no competing reading — unlike Spain, where the date is the
end of a period expressed in months and the day it lands is a live question under art. 30 of Ley
39/2015. Same discipline, different facts.

### sources read on 2026-10-07

Both retrieved as the official Diário da República PDFs and text-extracted. Quotes in
[`sources/verification-log.md`](sources/verification-log.md).

- Lei n.º 73-A/2025, de 30 de dezembro — DR 1.ª série, n.º 250, **2.º Suplemento**, 30-12-2025:
  `https://files.dre.pt/gratuitos/1s/2025/12/25002.pdf`. Art. 95.º n.os 2 and 3, art. 260.º n.os 1,
  2 and 4.
- Decreto-Lei n.º 28/2019, de 15 de fevereiro — DR 1.ª série, n.º 33, 15-02-2019:
  `https://files.dre.pt/gratuitos/1s/2019/02/03300.pdf`. Art. 12.º n.os 1 and 2.
- AT Ofício Circulado n.º 25120 de 2026-07-28 — retrieved and read, and it does **not** address
  PDF invoices or the 2027 cut-off. Recorded because a negative read is still a read.

### a lead that did not survive

`diariodarepublica.pt` is fully client-rendered (OutSystems); the detail, ELI and
`legislacao-consolidada` routes all return the SPA shell with no text, and the site serves no
`robots.txt`. The gazette PDFs under `files.dre.pt/gratuitos/1s/{year}/{month}/{nnnss}.pdf` carry
the same official text and are what these rows cite — worth knowing for every future PT pass.

Secondary sources also pointed at **art. 240.º of Lei n.º 82/2023** as the PDF-invoice rule, via
art. 260.º n.º 4(b) of OE2026 prorogating it. That is wrong: art. 240.º of Lei n.º 82/2023 was read
and is an agricultural input-cost relief. The PDF rule lives in art. 95.º n.º 3 of the budget law
itself, re-enacted each year with a new date, not in a prorogated cross-reference. A vendor blog
chain would have put the wrong citation on the row.

### known gaps, deliberately not rows yet

- **Portugal's B2G mandate.** Art. 260.º n.º 2 of Lei n.º 73-A/2025 was read and prorogues "o
  regime previsto no n.º 4 do artigo 9.º do Decreto-Lei n.º 111-B/2017, de 31 de agosto" to
  31 de dezembro de 2026 — which puts the remaining B2G cohort at 2027-01-01. The text of that
  art. 9.º n.º 4 was **not** retrieved (it sits in the Código dos Contratos Públicos gazette and
  was not located in the pass), so which cohort it covers is unconfirmed and no row was written.
  Now that 1.1.0 carries an `e-invoicing-b2g` regime this is cheap to finish.
- The extension history of the PDF rule through earlier budget laws was not traced, so how many
  times 31 December has already moved is not established.
- Certified billing software, ATCUD, QR code and the SAF-T (PT) billing file: reported to apply to
  every Portuguese invoice regardless of medium, verified for none of them, no rows.

## 2026-10-07 — schema v1.1.0, EU-level layer ([ARC-8](/ARC/issues/ARC-8))

The two supranational instruments every national row in this dataset sits on top of. Additive
release: nothing published under 1.0.0 changed value, and no field was renamed or removed.

### added — 5 rows under the new `EU` jurisdiction code

| obligation_id | regime | direction | scope | mandatory_from | tolerance_ends | confidence |
| --- | --- | --- | --- | --- | --- | --- |
| `EU-e-invoicing-b2g-receive-contracting-authorities` | `e-invoicing-b2g` | receive | b2g | 2019-04-18 | 2020-04-18 | `verified` |
| `EU-e-invoicing-b2b-issue-member-state-option` | `e-invoicing-b2b` | issue | b2b | 2025-04-14 | — | `verified` |
| `EU-e-invoicing-b2b-issue-intra-community-structured` | `e-invoicing-b2b` | issue | cross-border-b2b | 2030-07-01 | — | `verified` |
| `EU-e-reporting-report-intra-community` | `e-reporting` | report | cross-border-b2b | 2030-07-01 | — | `verified` |
| `EU-e-reporting-report-domestic-convergence` | `e-reporting` | report | b2b | 2030-07-01 | 2035-01-01 | `verified` |

`jurisdiction: "EU"` is **not a country**. These rows bind Member States, not a reader's company,
and two of them record an enabling date rather than a duty. Rule 6 in
[`dataset/schema/v1.md`](schema/v1.md) is the contract; the site already routes `EU` to context
rather than to a checker answer.

### the access barrier, and how it was cleared

[ARC-8](/ARC/issues/ARC-8) was opened as blocked on access, not on research: on 2026-10-07
`eur-lex.europa.eu` answered this host with **HTTP 202 and an empty body** on every route — CELEX,
ELI, PDF — which is a bot challenge. It still does, including for `/robots.txt`. Circumventing it
would breach the access terms and was not attempted.

The Publications Office **cellar** serves the same primary text with no challenge, and that is
where these rows come from:

```
curl -H 'Accept: application/xhtml+xml' -H 'Accept-Language: eng' \
  http://publications.europa.eu/resource/celex/32014L0055
```

Same publisher, same act, full English text as adopted. `source_url` on each row carries the
canonical ELI (what a buyer should cite, and what resolves in a normal browser); `confidence_note`
records the cellar URL actually read. Acts read in full this way: `32014L0055` (Directive
2014/55/EU), `32017D1870` (Commission Implementing Decision (EU) 2017/1870), `32025L0516`
(Council Directive (EU) 2025/516). No consultancy summary was used, and nothing was written from
memory — the `confidence: unknown` fallback in the brief was not needed.

### the dates, and where each one is written

- **2019-04-18** is quoted, not computed. Art. 2 of Decision (EU) 2017/1870: "18 April 2019 is the
  final date for bringing into force of the measures referred to in the first subparagraph of
  Article 11(2) of Directive 2014/55/EU."
- **2020-04-18** is *derived* and flagged as such in that row's `unknowns`. Art. 11(2) second
  subparagraph expresses the sub-central postponement as "30 months after publication of the
  reference", not as a date, and no instrument read prints 18 April 2020. It is the 30-month point
  under the same day-count the Commission used for the 18-month point (OJ publication 17.10.2017,
  entry into force 18.10.2017). An arithmetic ceiling, not a published date.
- **27 November 2018** (Art. 11(1)) is deliberately *not* `mandatory_from`. Art. 11(2) carves the
  Art. 7 receive-and-process duty out of the general transposition deadline and dates it later.
- **2025-04-14** is quoted. Art. 6(1) of 2025/516: "Member States may apply the laws, regulations
  and administrative provisions regarding Article 1, points 2 and 3 from 14 April 2025."
- **2030-07-01** is quoted. Art. 6(5): "They shall apply those measures from 1 July 2030."
- **2035-01-01** is quoted, and conditional. Art. 6(5) second subparagraph, for Member States with
  a domestic real-time reporting obligation in place on 1 January 2024; the same subparagraph and
  recital (24) allow it to be postponed if the Art. 271c interim report (due 31 March 2033) finds
  shortcomings. Recorded as `tolerance_ends`, with the condition in `tolerance_note`.

### what the brief asked for that the text does not say

The brief asked for "the date from which Member States may mandate domestic e-invoicing **without
an Article 395 derogation**". The date is 14 April 2025 and it is recorded. But the directive text
never states that an Art. 395 authorisation ceases to be required — it grants the enabling
provisions (new paragraphs in Arts. 218 and 232) and dates them. The only Art. 395 references in
the text read are recital (24) and Art. 6(5), both about pre-existing *domestic reporting* systems.
That gap is written into the row's `unknowns` rather than smoothed over.

### changed — schema, all additive

- `direction` gains **`report`**. A duty to transmit transaction data to a tax authority is
  neither issuing nor receiving an invoice, and ViDA's digital reporting requirements are the
  first rows that need it. The site's `DIRECTIONS` map already carried `report`, so this closes a
  gap between the contract and the consumer rather than opening one.
- `coverage` gains **`member_state_count`**, **`member_state_jurisdictions`** and
  **`supranational_jurisdictions`**. Required by the `EU` code, not cosmetic: without them the
  generated note read "N jurisdictions recorded of 27 EU member states" with the EU layer counted
  inside N, which overstates member-state coverage by one. `member_state_count` is now the only
  number any coverage claim may use. `jurisdiction_count` keeps its 1.0.0 meaning — every code
  present — and is no longer the coverage number.
- `OBLIGATION_KEY` in `dataset/build.py` gains **`counterparty_scope`**. A domestic duty and an
  intra-Community duty under the same regime and direction are different obligations and may
  legitimately carry different dates; the old key called that pair a contradiction. Strictly a
  precision improvement — `obligation_id` uniqueness still catches genuine duplicates.
- **`format_name` is now `["string", "null"]`** in `obligations.v1.schema.json`. A contract bug,
  not a data change: 1.0.0 declared it `type: string` while five already-published rows
  (`GR-e-invoicing-b2b-issue-revenue-gt-1m-eur`, `GR-…-lte-1m-eur`,
  `PT-e-invoicing-b2b-issue-electronic-issuers`, `RO-e-invoicing-b2b-issue-all`,
  `RO-…-issue-reporting-phase`) carried null, so `dist/obligations.json` did not validate against
  its own schema. Null is the right value for those rows — Portugal mandates no format at all, and
  for GR/RO it was not established in the pass — so the schema was corrected to match the data
  rather than the rows being given a fabricated format name. `build.py` already required
  `format_note` to explain any null, and that check is unchanged. No row value moved.

### still open after this release

- No per-country determination of **which** Member States qualify for the 1 January 2035
  convergence window. It needs the three alternative tests in Art. 6(5) applied to each state's
  position as at 1 January 2024, against national instruments. Not done for any country yet.
- No `format_version` for the intra-Community reporting message: the new Art. 263(4) defers the
  common electronic message to an Art. 58(2) Regulation (EU) No 904/2010 procedure, with no
  deadline in the directive. Re-check before 2030.
- The replacement Art. 264 (the reported data set itself) was not read field by field.
- Whether Art. 395 authorisations granted before 2025/516 remain in force, and on what terms.

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
