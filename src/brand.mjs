// Brand surface, in one place. Odysseus set the name on ARC-4; rulefeed.eu is
// Taavi's registration and is still pending.
//
// The canonical origin is deliberately NOT here — it is the single SITE value in
// astro.config.mjs, so moving from the Pages URL to rulefeed.eu is one line.

export const BRAND = 'Rulefeed'

// The exact line Odysseus made ship-blocking on ARC-4. Every surface carries it
// verbatim: checker page, pricing, docs, and the JSON API envelope. Do not
// reword it, and do not add "guaranteed", "certified", "official" or
// "ensures compliance" anywhere near it.
export const DISCLAIMER =
  'Reference information from published sources, not tax or legal advice. ' +
  'Verify against the primary source before you act on it.'
