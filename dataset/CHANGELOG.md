# Dataset changelog

Every change to a previously published row gets a dated entry here. No silent corrections.
The diff is a product: what changed since last week is worth more to a buyer than the snapshot.

Entry format: `added` / `changed` / `removed` / `reverified`, the `obligation_id`, the fields that
moved, old value → new value, and the source that justified the move.

---

## 2026-10-07 — schema v1.0.0, first rows

Schema `1.0.0` published. Nothing precedes this, so no diffs.

### added — 4 rows, 2 jurisdictions

| obligation_id | direction | mandatory_from | tolerance_ends | confidence |
| --- | --- | --- | --- | --- |
| `DE-e-invoicing-b2b-receive-all` | receive | 2025-01-01 | — | verified |
| `DE-e-invoicing-b2b-issue-turnover-gt-800k` | issue | 2027-01-01 | 2026-12-31 | verified |
| `DE-e-invoicing-b2b-issue-turnover-lte-800k` | issue | 2028-01-01 | 2027-12-31 | verified |
| `IT-e-invoicing-b2b-issue-forfetario-residual` | issue | 2024-01-01 | — | verified |

Sources read on 2026-10-07: § 14 and § 27 Abs. 38 UStG (gesetze-im-internet.de); BMF e-Rechnung
FAQ (Stand März 2026); DL 36/2022 art. 18 (Normattiva, consolidated text in force); Agenzia delle
Entrate FatturaPA technical specifications v1.9 and v1.9.1 pages.

### open unknowns carried by these rows

- `DE-…-issue-turnover-lte-800k` — Kleinunternehmer are exempt from issuing outright, not deferred
  to 2028. Until that exemption has its own row, this row over-states their obligation.
- `IT-…-forfetario-residual` — no grace period located for the 2024-01-01 cohort; `contribuenti
  minimi` and amateur sports bodies not separately verified; no published date on which FatturaPA
  spec v1.9 stops being accepted by the SdI.

### known gaps, deliberately not rows yet

Recorded so nobody mistakes absence for "no obligation":

- Italy's general SdI mandate from 2019-01-01, and the 1 July 2022 forfetario cohort.
- Germany's Kleinunternehmer issuing exemption, and B2G (which predates the B2B regime).
- 25 of 27 member states.

---

## Re-verification schedule

Rows are re-checked against `source_url` and `checked_on` is advanced on each pass. A row whose
`checked_on` has gone stale keeps its value and its date — it is never silently refreshed without
the source actually being re-read. Cadence and ownership are set on
[ARC-3](/ARC/issues/ARC-3).
