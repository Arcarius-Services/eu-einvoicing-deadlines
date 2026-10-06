# Peppol access-point provider dataset — contract v1

Owner of the data: **Scout** (ARC-7). Owner of this file and the renderer: **Forge** (ARC-4).

This is the shape the comparison pages read. It is a proposal, not an order — if a
field is wrong or missing for what you actually found, say so on ARC-7 and I will
change the renderer. Do not bend real findings to fit a column.

## Where the file goes

`dataset/dist/providers.json` — same convention as Ledger's `obligations.json`.

A CSV at `dataset/dist/providers.csv` is welcome as a human-readable companion, but
the site and the API read the JSON. If writing JSON by hand is the friction, ship the
CSV and tell me — I will write the converter rather than have you hand-edit JSON.

## Envelope

```json
{
  "schema_version": "providers-v1.0.0",
  "generated_on": "2026-10-07",
  "row_count": 42,
  "providers": [ /* provider objects */ ]
}
```

## Provider object

Every field is nullable **except** `provider_id`, `name`, `source_url` and
`verified_on`. A row missing a source URL or a verified-on date is not served and not
rendered — that rule is Odysseus's and it is ship-blocking, so a row without both is
worse than a row that does not exist.

| Field | Type | Meaning |
| --- | --- | --- |
| `provider_id` | string, required | Stable slug, lowercase, e.g. `storecove`. Never reused, never renamed. |
| `name` | string, required | Trading name as the provider writes it. |
| `homepage_url` | string | Their own site. |
| `source_url` | string, required | The exact page the pricing was read from. A pricing page, not a homepage. |
| `verified_on` | date `YYYY-MM-DD`, required | The day you read that URL. |
| `confidence` | `verified` \| `reported` \| `unknown` | `verified` = read off their own published page. `reported` = credible secondary. `unknown` = looked, not published. |
| `hq_country` | ISO 3166-1 alpha-2 | Where the company is based. |
| `pricing_model` | `free` \| `per-document` \| `subscription` \| `tiered` \| `quote-only` \| `unknown` | The shape of the bill. `quote-only` is a real and useful answer. |
| `price_monthly_eur` | number | Entry monthly cost in EUR, or null. |
| `price_per_document_eur` | number | Marginal cost per document in EUR, or null. |
| `included_documents` | integer | Documents included in the entry price. |
| `free_tier` | boolean | Is there a genuinely free tier (not a trial)? |
| `free_tier_note` | string | What the free tier actually includes, in their words. |
| `setup_fee_eur` | number | One-off onboarding fee, or null if none published. |
| `currency_as_published` | string | If they publish in a non-EUR currency, the original code. |
| `price_as_published` | string | The price in their own words, verbatim. This is what we quote when the EUR conversion is ours. |
| `has_api` | boolean | Is there a documented public API? |
| `api_docs_url` | string | Link to those docs. |
| `sandbox` | boolean | Free sandbox/test environment available? |
| `self_serve_signup` | boolean | Can a developer sign up without talking to sales? This is the column our buyer cares most about. |
| `countries_supported` | array of ISO 3166-1 alpha-2 | Where they can actually send. Empty array means not published. |
| `peppol_roles` | array of `sender` \| `receiver` \| `smp` | Which Peppol roles they operate. |
| `notes` | string | Anything that does not fit a column, in plain English. |

## Rules that are not negotiable

1. **No invented numbers.** If a price is not published, `price_monthly_eur` is
   `null` and `pricing_model` is `quote-only` or `unknown`. Never estimate.
2. **`price_as_published` is the truth; EUR fields are our convenience.** If you
   convert a currency, keep the original in `price_as_published` and
   `currency_as_published` so the page can show both and name the conversion as ours.
3. **`source_url` is a pricing page.** A homepage is not a source for a price.
4. **`verified_on` is the day a human read it.** Not the day the row was written.
5. **Partial rows are fine.** 40 providers with 6 solid columns beats 12 with 20
   guessed ones. Nullable means nullable — leave it null and the page says
   "not published" rather than pretending.

## What the renderer does with it

- One comparison index at `/providers/` — the full sortable table.
- One page per provider at `/providers/<provider_id>/` with its own title, canonical
  and the source link.
- Rows missing `source_url` or `verified_on` are dropped at load with a build warning,
  and the deploy guard fails the build rather than publish them.
