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

### PT · Lei n.º 73-A/2025 (Orçamento do Estado para 2026) — official gazette

- URL: https://files.dre.pt/gratuitos/1s/2025/12/25002.pdf
- Type: `official_gazette` (Diário da República, 1.ª série, n.º 250, **2.º Suplemento**, 30-12-2025)
- Read: retrieved as the gazette PDF and text-extracted in full
- Confirms, verbatim, art. 95.º ("Disposições transitórias relativas a obrigações fiscais") n.º 3:
  - *"Até 31 de dezembro de 2026 são aceites faturas em ficheiro PDF, sendo consideradas como
    faturas eletrónicas para todos os efeitos previstos na legislação fiscal."*
- Also confirms, art. 95.º n.º 2: *"A submissão do ficheiro SAF-T (PT) relativo à contabilidade,
  nos termos definidos pela Portaria n.º 31/2019, de 24 de janeiro, é aplicável aos períodos de
  2027 e seguintes, a entregar em 2028 ou em períodos seguintes."*
- Also confirms, art. 260.º ("Prorrogação de efeitos") n.º 2: *"O regime previsto no n.º 4 do
  artigo 9.º do Decreto-Lei n.º 111-B/2017, de 31 de agosto, é prorrogado até 31 de dezembro de
  2026."* — the B2G extension. Not written as a row: see below.
- **Not** confirmed: that electronic invoicing becomes compulsory in B2B on any date. The law
  states an acceptance window for PDF files; it does not mandate electronic issuing.
- Negative finding worth keeping: art. 260.º n.º 4(b) prorogates **art. 240.º of Lei n.º 82/2023**,
  which secondary sources describe as the PDF-invoice rule. Lei n.º 82/2023 art. 240.º was
  retrieved (`https://files.dre.pt/gratuitos/1s/2023/12/25000.pdf`, DR n.º 250 of 29-12-2023) and
  read: it is *"Regime extraordinário de apoio a encargos suportados na produção agrícola"*. The
  cross-reference is unrelated. That gazette's own art. 95.º-equivalent does carry the PDF rule for
  2024 (*"Até 31 de dezembro de 2024 são aceites faturas em ficheiro PDF…"*), confirming the rule is
  re-enacted annually in the budget law body rather than carried by prorogation.

### PT · Decreto-Lei n.º 28/2019 art. 12.º — official gazette

- URL: https://files.dre.pt/gratuitos/1s/2019/02/03300.pdf
- Type: `official_gazette` (Diário da República, 1.ª série, n.º 33, 15-02-2019)
- Read: retrieved as the gazette PDF and text-extracted
- Confirms, verbatim, art. 12.º ("Emissão de fatura por via eletrónica") n.º 1:
  - *"As faturas e demais documentos fiscalmente relevantes podem, mediante aceitação pelo
    destinatário, ser emitidos por via eletrónica."*
  - This is the decisive fact for Portugal: electronic issuing is **permissive** and conditional on
    the recipient's acceptance. There is no B2B mandate and no receiving obligation.
- Confirms, verbatim, art. 12.º n.º 2 — authenticity of origin and integrity of content are
  guaranteed if one of these is adopted:
  - *"a) Aposição de uma assinatura eletrónica qualificada nos termos legais;"*
  - *"b) Aposição de um selo eletrónico qualificado, nos termos do Regulamento (UE) n.º 910/2014,
    do Parlamento Europeu e do Conselho, de 23 de julho de 2014;"*
  - *"c) Utilização de um sistema de intercâmbio eletrónico de dados, desde que os respetivos
    emitentes e destinatários outorguem um acordo que siga as condições jurídicas do «Acordo tipo
    EDI europeu», aprovado pela Recomendação n.º 1994/820/CE, da Comissão, de 19 de outubro."*
- Therefore no structured format is mandated for Portuguese B2B invoicing — no CIUS, no UBL
  profile, no Peppol requirement. `format_name` is null on the row by design.

### PT · AT Ofício Circulado n.º 25120 — tax authority (negative read)

- URL: https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/legislacao/instrucoes_administrativas/Documents/Ofcio-circulado-25120-2026.pdf
- Type: `tax_authority`, dated 2026-07-28
- Read: retrieved as PDF and text-extracted in full
- **Does not** address PDF invoices, electronic issuing or the 2027 cut-off. Subject is
  *"Procedimentos de retificação de faturas e regularização do imposto"*. Logged because a negative
  read is still a read: no AT administrative guidance on the 2027-01-01 position was located.

---

## Sourcing notes for the next pass

- The BMF site returns 503 to the standard fetch tool but serves a direct request. Budget one
  request per pass and respect the 180s crawl-delay.
- **Portugal: never use `diariodarepublica.pt`.** It is a fully client-rendered OutSystems app; the
  detail, ELI (`data.dre.pt/eli/…`) and `legislacao-consolidada` routes all return the SPA shell
  with no legal text, and the site serves no `robots.txt`. The official gazette PDFs are at
  `https://files.dre.pt/gratuitos/1s/{yyyy}/{mm}/{nnnss}.pdf`, where `nnn` is the número and `ss`
  is the supplement (`00` = main issue, `01` = 1.º Suplemento, …). Probe the supplement index: the
  budget law lives in a supplement, not the main issue. PT cost about 30 minutes once that pattern
  was known.
- Normattiva's `!vig` URL suffix returns the text *currently in force*, which is what we want for
  re-verification; a `!ori` suffix would pin the original text and is the wrong target.
- Germany and Italy each took well under an hour of sourcing. Member states with no consolidated
  online statute, or where the rule sits in secondary regulation, will cost materially more — flag
  cost to Odysseus before spending a day on one country.
