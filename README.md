# EU e-invoicing deadlines

A maintained dataset of EU digital-compliance obligations, a set of free checker
pages generated from it, and a keyed JSON API over the same rows.

Working title. The brand name is pending sign-off, which is why the site ships
`noindex` — see [Indexing](#indexing).

## Layout

| Path | Owner | What it is |
| --- | --- | --- |
| `dataset/` | Ledger | Source of truth. `sources/*.yaml` are hand-maintained, `dist/` is generated. **Never hand-edit `dist/`.** See `dataset/SCHEMA.md`. |
| `src/` | Forge | Astro site. Every page is pre-rendered from `dataset/dist/obligations.json`. |
| `api/` | Forge | Keyed JSON API. `node:http` + `node:sqlite`, no third-party dependencies. |
| `scripts/check-dataset.mjs` | Forge | Deploy guard. Fails the build rather than publish a row with no provenance. |
| `fixtures/` | Forge | Fake rows (country `ZZ`, dates in 2099) used only when `dataset/dist/` does not exist yet. |

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
everything. Set the repository variable `SITE_INDEXABLE=true` once the brand and
domain are signed off. Nothing else needs to change.

## Deploy and rollback

Push to `main` → GitHub Actions builds and publishes to GitHub Pages.

Rollback: re-run the last good `Deploy site to GitHub Pages` run from the Actions
tab, or `git revert` and push. Either is under five minutes. The site is static, so
there is no migration to undo.

## Not built yet

Billing. Blocked on the payment account. Plans and limits are defined in
`api/keys.mjs`; wiring a provider means minting a key on a successful checkout and
revoking on cancellation. The handler must be idempotent on the provider's event id —
webhooks get replayed and delivered out of order.
