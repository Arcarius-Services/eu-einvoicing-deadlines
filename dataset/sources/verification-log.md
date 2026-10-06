# Verification log

What was actually read, when, and what it said. One entry per source fetch. This is the audit
trail behind every `confidence: "verified"` label — if a row cannot be traced to an entry here,
it is not verified.

---

## 2026-10-07

### DE · § 14 UStG — statute

- URL: https://www.gesetze-im-internet.de/ustg_1980/__14.html
- Type: `statute` (consolidated federal law, BMJ / Bundesanzeiger Verlag)
- Read: directly, full page
- Confirms:
  - § 14 Abs. 1: *"Eine elektronische Rechnung ist eine Rechnung, die in einem strukturierten
    elektronischen Format ausgestellt, übermittelt und empfangen wird und eine elektronische
    Verarbeitung ermöglicht."*
  - § 14 Abs. 2 Nr. 1: the invoice *"ist als elektronische Rechnung … auszustellen"* where supplier
    and recipient are both established domestically.
  - § 14 Abs. 1 Nr. 1 ties the format to the European standard and the syntax list under
    Directive 2014/55/EU.
- Caveat: the page shows no explicit "Stand" date.

### DE · § 27 Abs. 38 UStG — statute, transitional rule

- URL: https://www.gesetze-im-internet.de/ustg_1980/__27.html
- Type: `statute`
- Read: directly
- Confirms, verbatim:
  - *"bis zum 31. Dezember 2026 für einen nach dem 31. Dezember 2024 und vor dem 1. Januar 2027
    ausgeführten Umsatz"*
  - *"bis zum 31. Dezember 2027 für einen nach dem 31. Dezember 2026 und vor dem 1. Januar 2028"*
  - *"wenn der Gesamtumsatz (§ 19 Absatz 2) des die Rechnung ausstellenden Unternehmers im
    vorangegangenen Kalenderjahr nicht mehr als 800 000 Euro"*
- Therefore: threshold is **€800,000 of Gesamtumsatz in the preceding calendar year**, measured on
  the **issuer**. The obligation attaches to **when the supply is carried out**, not when the
  invoice is raised.

### DE · BMF e-Rechnung FAQ — tax authority

- URL: https://www.bundesfinanzministerium.de/Content/DE/FAQ/e-rechnung.html
- Type: `tax_authority` · Page dated 23.03.2026, carries **"Stand: März 2026"**
- Read: directly. WebFetch returned HTTP 503; retrieved with a direct request instead.
  `robots.txt` permits `/Content/DE/FAQ/` (only `*/SiteGlobals`, `*/SharedDocs/ExterneLinks`,
  `*/Content/FR`, `*/Web/FR` are disallowed). Crawl-delay is 180s; one request was made.
- Confirms:
  - **Q8:** *"Allerdings muss ein Unternehmen seit dem 1. Januar 2025 den Empfang einer E-Rechnung
    sicherstellen. Dazu reicht bereits ein E-Mail-Postfach aus."*
  - **Q12:** *"Seit dem 1. Januar 2025 besteht für inländische Unternehmen die Notwendigkeit, eine
    E-Rechnung empfangen zu können. … Es sind keine Ausnahmen vorgesehen."* And: *"Kleinunternehmer
    sind zwar von der Ausstellung einer E-Rechnung ausgenommen (siehe Frage 4), müssen aber dennoch
    in der Lage sein, E-Rechnungen zu empfangen."*
  - **Q11:** 1 Jan 2025 – 31 Dec 2026 any issuer may issue a *sonstige Rechnung*; paper always,
    another electronic format only with the recipient's consent. *"Bei einem Vorjahresumsatz des
    Rechnungsausstellers bis 800.000 Euro verlängert sich diese Frist noch bis zum Ablauf des
    Jahres 2027."* A non-conforming EDI procedure may also run to end-2027.
  - **Q7:** *"die in Deutschland üblichen Formate XRechnung und ZUGFeRD ab Version 2.0.1 (mit
    Ausnahme der Profile MINIMUM und BASIC-WL)"* meet the VAT requirements. Other formats may be
    agreed if the required data can be extracted correctly and completely.
- Decisive point for the dataset: **the transition is issuer-side only.** Receiving has had no
  grace period since 2025-01-01. Two separate rows, two separate directions.
- Also noted: administrative view sits in BMF-Schreiben of **15 October 2024** (BStBl I S. 1320)
  **and 15 October 2025**. The 2025 letter has not been read in full; it is a follow-up to check on
  the next pass.

### IT · DL 36/2022 art. 18 — statute

- URL: https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto:2022-04-30;36~art18!vig
- Type: `statute` (Normattiva consolidated text *in force*, Istituto Poligrafico e Zecca dello Stato)
- Read: directly, commi 2 and 3
- Confirms:
  - Comma 2 repeals the e-invoicing exemption in art. 1 c. 3 of D.Lgs. 127/2015 from 1 July 2022.
  - Comma 3 phases it: **1 July 2022** for those who *"nell'anno precedente abbiano conseguito
    ricavi ovvero percepito compensi, ragguagliati ad anno, superiori a euro 25.000"*;
    **1 January 2024** for everyone else remaining.
- Corroborated by Agenzia delle Entrate Circolare n. 32/E of 05/12/2023 (regime forfetario), which
  states the residual cohort's obligation runs from 1 January 2024 *"a prescindere dall'entità dei
  ricavi conseguiti o compensi percepiti"*.

### IT · FatturaPA technical specifications — tax authority

- URLs:
  - https://www.agenziaentrate.gov.it/portale/specifiche-tecniche-versione-1.9
  - https://www.agenziaentrate.gov.it/portale/specifiche-tecniche-versione-1.9.1-%C2%A0-utilizzabili-dal-15-maggio-2026-
- Type: `tax_authority`
- Confirms: v1.9 usable from **1 April 2025**; v1.9.1 *"Documentazione utilizzabile dal 15 maggio
  2026"*, with the tabular representations *"aggiornate al 31 marzo 2026"*.
- **Not** confirmed: any date on which v1.9 ceases to be accepted by the SdI. The page says only
  that v1.9.1 *may* be used. Recorded as an unknown on the row rather than guessed, so
  `format_version` stays at `1.9`.

---

## Sourcing notes for the next pass

- The BMF site returns 503 to the standard fetch tool but serves a direct request. Budget one
  request per pass and respect the 180s crawl-delay.
- Normattiva's `!vig` URL suffix returns the text *currently in force*, which is what we want for
  re-verification; a `!ori` suffix would pin the original text and is the wrong target.
- Germany and Italy each took well under an hour of sourcing. Member states with no consolidated
  online statute, or where the rule sits in secondary regulation, will cost materially more — flag
  cost to Odysseus before spending a day on one country.
