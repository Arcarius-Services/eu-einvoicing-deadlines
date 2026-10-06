# Rulefeed

A maintained reference dataset of published EU digital-compliance timelines, a set
of free checker pages generated from it, and a keyed JSON API over the same rows.

Rulefeed is **not** tax or legal advice and never claims to make anyone compliant.
Every row carries its primary source and the date a human last read it, and that
disclaimer ships in the API response envelope as well as the page footer, so the
caveat travels with the data.

The site ships `noindex` until it is serving from its final origin — see
[Indexing](#indexing).

## Layout

| Path | Owner | What it is |
| --- | --- | --- |
| `dataset/` | Ledger | Source of truth. `sources/*.yaml` are hand-maintained, `dist/` is generated. **Never hand-edit `dist/`.** See `dataset/SCHEMA.md`. |
| `src/` | Forge | Astro site. Every page is pre-rendered from `dataset/dist/obligations.json`. |
| `api/` | Forge | Keyed JSON API. `node:http` + `node:sqlite`, no third-party dependencies. |
| `scripts/check-dataset.mjs` | Forge | Deploy guard. Fails the build rather than publish a row with no provenance. |
| `fixtures/` | Forge | Fake rows (country `ZZ`, dates in 2099) used only when `dataset/dist/` does not exist yet. |
| `dataset/schema/providers.v1.md` | Forge | The contract for Scout's Peppol access-point dataset (ARC-7). The comparison pages do not exist until `dataset/dist/providers.json` does. |

## Configuration

Every credential and origin comes from an environment variable. No secret is ever
committed; `.env` is gitignored and only `.env.example` (empty values) is tracked.

| Variable | Used by | What it is |
| --- | --- | --- |
| `API_KEY_PEPPER` | API | Server-side pepper for HMAC-hashing customer keys. Minimum 32 chars; the API refuses to start without it. `openssl rand -hex 32`. |
| `API_DB_PATH` | API | SQLite file holding key hashes, usage counters and access requests. Defaults to `./api/data/keys.db`. |
| `ALLOWED_ORIGINS` | API | Comma-separated browser origins allowed to POST the access-request form. No wildcard. |
| `PUBLIC_API_ORIGIN` | Site build | Public origin of the JSON API, baked in so the pricing-page form knows where to post. **Unset means the form is not rendered at all** rather than posting into nowhere. |
| `SITE_URL` / `SITE_BASE` | Site build | The canonical origin and base path. These two values are the only place a host appears; moving to `rulefeed.eu` is a change to them and nothing else. |
| `SITE_INDEXABLE` | Site build | `true` lifts `noindex` and the `robots.txt` disallow. Leave unset until the final origin is live. |

## The one rule

**No page may state a date the dataset does not back.** Nothing in `src/` hardcodes
a date; every date, format, threshold and source link is read from the dataset at
build time. If you find yourself typing a date into a template, stop.

Consequences of that rule, already wired in:

- If `dataset/dist/obligations.json` is absent, the site renders the 2099 fixture
  and every page is forced `noindex`.
- `scripts/check-dataset.mjs` fails CI if any row lacks `source_url`, `checked_on`
  or `confidence`, or claims a date while flagged `unknown`.
- A size band we cannot resolve from the row renders as "we will not guess this",
  with the threshold in the source's own words. It never renders as a date.

## Run it

```sh
npm ci
npm run build          # static site into dist/
npm run dev            # dev server
```

### API

```sh
cp .env.example .env   # then set API_KEY_PEPPER (openssl rand -hex 32)
npm run keyctl mint "Customer name" free
npm run api
```

```sh
curl -H "X-API-Key: $KEY" 'http://127.0.0.1:8787/v1/obligations?jurisdiction=DE&direction=issue'
```

Key handling:

- Keys are HMAC-SHA256 hashed under `API_KEY_PEPPER`. The plaintext is shown once,
  at mint time, and is not recoverable — only revocable.
- A key in a query string is rejected with `400 key_in_query_string`, because by the
  time we see it, it is already in logs and referrer headers.
- Request logs record the key **id**, never the key.
- Quotas are per key, per UTC day, enforced in a single SQLite transaction so
  concurrent requests cannot both slip past the limit.

```sh
npm run keyctl list
npm run keyctl revoke <key-id>
```

## Checker page URLs

```
/e-invoicing/<country>/<direction>/<band>/
```

`direction` is `issue`, `receive` or `report` — separate duties with separate dates,
never merged. `band` is `micro`, `small`, `medium` or `large`, on the turnover limits
in EU Recommendation 2003/361.

Where a national threshold cuts through a band — Germany splits at €800,000, inside
the €2m "micro" band — the page gives every date in that band against the turnover
range it applies to, rather than picking one.

## Indexing

`SITE_INDEXABLE` is unset, so every page carries `noindex` and `robots.txt` disallows
everything. Set the repository variable `SITE_INDEXABLE=true` once `rulefeed.eu` is
serving. Holding it until then means we never have to migrate search engines off the
GitHub Pages URL. Nothing else needs to change.

## Deploy and rollback

Push to `main` → GitHub Actions builds and publishes to GitHub Pages.

Rollback: re-run the last good `Deploy site to GitHub Pages` run from the Actions
tab, or `git revert` and push. Either is under five minutes. The site is static, so
there is no migration to undo.

## Request-access capture

`POST /v1/access-requests` is the only write route and the only one that needs no
key — a stranger asking for a key does not have one yet. It is keyed on email, so a
double submit updates the row instead of duplicating it, and it answers `201` either
way rather than disclosing who is already on the list.

```sh
npm run keyctl requests       # operator view; never exposed over HTTP
```

Smoke tests for both halves of the API:

```sh
PORT=8787 node scripts/smoke-access-request.mjs
PORT=8787 SMOKE_KEY_FILE=/path/to/key node scripts/smoke-quota.mjs
```

## Not built yet

**Billing.** Rail is Stripe (Billing + Stripe Tax, EUR subscriptions) — decided, not
wired, and deliberately so: the paid feed is a later upsell and the current revenue
experiment is the request-access capture above. Plans and limits live in
`api/keys.mjs`. Wiring it means minting a key on a successful checkout and revoking
on cancellation, and the handler must be idempotent on the provider's event id,
because webhooks get replayed and delivered out of order. There is no billing
abstraction in the repo yet, on purpose — an interface with no implementation behind
it is a guess about a provider we have not called.

**Peppol provider comparison.** Template, routing and deploy guard are built. Waiting
on `dataset/dist/providers.json` from Scout (ARC-7). With no file the section
generates zero pages and drops out of the nav, rather than rendering an empty table.
