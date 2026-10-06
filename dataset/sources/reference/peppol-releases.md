# Peppol BIS Billing release calendar

Not obligations, so not rows — but several national mandates (Belgium most directly) point at
Peppol BIS Billing as their default format, and the *version* those mandates land on moves on
OpenPeppol's schedule rather than the member state's. A format name without a version is
incomplete, so the versions live here and are referenced from the affected rows' `format_note`.

**Source:** <https://docs.peppol.eu/poacc/billing/3.0/release-notes/> (standards body, OpenPeppol
Post-Award Coordinating Community). **Read on:** 2026-10-07. **Confidence:** verified.

| Version | Published | Mandatory from | Notes |
|---|---|---|---|
| 3.0.21 | 2026-05-20 | **2026-08-17** | Current mandatory release. Naming corrections to "Peppol", a new optional profile (02) for invoice responses, significant validation-artefact updates. Member review 2026-03-02. |
| 3.0.20-hotfix | 2026-01-27 | 2026-02-23 | Adds Slovak tax identification code support. Shares the 3.0.20 mandatory date. |
| 3.0.20 | 2025-11-24 | 2026-02-23 | Removed restrictions on binary invoice attachments; added Danish validation rules. Member review 2025-09-15. |
| 3.0.19 | 2025-05-21 | 2025-08-25 | Updated Swedish organisation-number validation; expanded French VAT exemption codes. |

## The cadence, because it is predictable and worth selling

OpenPeppol publishes twice a year, in May and November, and each release carries a roughly
three-month transition during which both the old and the new version are accepted. After that the
new version is mandatory. That means a buyer can be told, ahead of time, that:

- a release published in **May** becomes mandatory in **mid-August**;
- a release published in **November** becomes mandatory in **late February**.

So the next cutover after 3.0.21 should be a November 2026 release going mandatory around late
February 2027. **That is an inference from the pattern above, not a published date** — do not
record it as a fact or quote it to a customer until the release notes actually show it.

## Why this matters for the obligation rows

Belgium's law names EN 16931-1 and CEN/TS 16931-2, and its royal decree sets Peppol BIS Billing
(UBL) over the Peppol network as the *default* standard. Belgium does not pin a Peppol version.
A Belgian company compliant on 2026-01-01 therefore had to move to 3.0.21 by 2026-08-17 without
any Belgian instrument changing — a version cutover is a live compliance event that no national
gazette will announce.

## Open items

- Whether any member state pins a specific Peppol BIS version in its own legislation, rather than
  tracking OpenPeppol, has not been checked.
- Peppol's own CIUS/extension variants per country (e.g. national rule sets layered on BIS
  Billing) are not catalogued here.
