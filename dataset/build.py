#!/usr/bin/env python3
"""Build the obligations dataset from dataset/sources/*.yaml.

One source of truth: the per-jurisdiction YAML files. Everything in dataset/dist/ is
generated — obligations.json (API shape), obligations.csv (snapshot shape) and coverage.md.
Hand-editing dist/ is how the JSON and the CSV drift apart, so don't.

Idempotent: same sources, byte-identical output. Rows are sorted by obligation_id, JSON keys
are emitted in the documented column order, and no build timestamp is written into the data.
`generated_on` comes from the newest checked_on in the set, not from the clock, so a rebuild
that reads nothing new changes nothing.

    python3 dataset/build.py          # validate + write dist/
    python3 dataset/build.py --check  # validate only, write nothing

Exits non-zero on any schema violation. A dataset that loads but contradicts itself is worse
than one that fails to build.
"""

import argparse
import csv
import datetime as dt
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

import yaml

SCHEMA_VERSION = "1.0.0"

ROOT = Path(__file__).resolve().parent
SOURCES = ROOT / "sources"
DIST = ROOT / "dist"

DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")

# Column order is the published contract — see dataset/schema/v1.md. Additive only.
COLUMNS = [
    "obligation_id", "jurisdiction", "jurisdiction_name", "regime", "regime_label",
    "direction", "counterparty_scope", "bound_party",
    "threshold_type", "threshold_value", "threshold_currency", "threshold_operator",
    "threshold_basis", "threshold_period", "threshold_definition",
    "format_name", "format_version", "format_note",
    "mandatory_from", "tolerance_ends", "tolerance_note",
    "legal_instrument", "source_url", "source_title", "source_type",
    "secondary_source_urls", "checked_on", "confidence", "confidence_note",
    "unknowns", "notes",
]

ENUMS = {
    "direction": {"issue", "receive"},
    "counterparty_scope": {"b2b", "b2c", "b2g", "b2b-and-b2c", "cross-border-b2b"},
    "threshold_type": {"none", "turnover", "revenue_or_fees", "headcount", "entity_type"},
    "threshold_operator": {"gt", "gte", "lt", "lte", "between", None},
    "source_type": {"statute", "tax_authority", "official_gazette", "eu_legal_act",
                    "standards_body", "secondary"},
    "confidence": {"verified", "reported", "unknown"},
}

PRIMARY = ENUMS["source_type"] - {"secondary"}
SIZED = {"turnover", "revenue_or_fees", "headcount"}

# Columns on which two rows would be claiming the same obligation.
OBLIGATION_KEY = ("jurisdiction", "regime", "direction", "threshold_type",
                  "threshold_operator", "threshold_value")

LIST_FIELDS = ("secondary_source_urls", "unknowns")


def load_rows():
    """Read sources in sorted path order so output never depends on directory iteration order."""
    rows = []
    for path in sorted(SOURCES.glob("*.yaml")):
        doc = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
        for row in doc.get("obligations") or []:
            row["_source_file"] = path.name
            rows.append(row)
    return rows


def validate(rows, today):
    errors = []
    seen_ids = {}
    seen_obligations = {}

    for i, row in enumerate(rows):
        rid = row.get("obligation_id") or f"<{row.get('_source_file', '?')} row {i}>"

        def err(msg, rid=rid):
            errors.append(f"{rid}: {msg}")

        for field in COLUMNS:
            if field not in row:
                err(f"missing required field '{field}'")

        unexpected = sorted(set(row) - set(COLUMNS) - {"_source_file"})
        if unexpected:
            err(f"unknown field(s): {', '.join(unexpected)}")

        for field, allowed in ENUMS.items():
            if field in row and row[field] not in allowed:
                err(f"{field}={row[field]!r} is not one of {sorted(map(str, allowed))}")

        for field in LIST_FIELDS:
            if field in row and not isinstance(row[field], list):
                err(f"{field} must be a list (use [] for none), got {type(row[field]).__name__}")

        # Provenance per row: no orphan facts, ever.
        if not str(row.get("source_url") or "").startswith(("http://", "https://")):
            err("source_url must be an absolute http(s) URL")
        if not DATE.match(str(row.get("checked_on") or "")):
            err("checked_on must be YYYY-MM-DD")
        elif row["checked_on"] > today:
            err(f"checked_on {row['checked_on']} is in the future")

        for field in ("mandatory_from", "tolerance_ends"):
            v = row.get(field)
            if v is not None and not DATE.match(str(v)):
                err(f"{field}={v!r} must be YYYY-MM-DD or null")

        # Threshold traps: a sized rule without its period is not usable.
        ttype = row.get("threshold_type")
        if ttype in SIZED:
            if not isinstance(row.get("threshold_value"), (int, float)):
                err(f"threshold_type={ttype} requires a numeric threshold_value")
            if row.get("threshold_operator") is None:
                err(f"threshold_type={ttype} requires a threshold_operator")
            if not str(row.get("threshold_period") or "").strip():
                err(f"threshold_type={ttype} requires a threshold_period "
                    "(a threshold without its measurement period is not usable)")
        elif ttype == "none":
            if row.get("threshold_value") is not None:
                err("threshold_type=none must have threshold_value null")
            if row.get("threshold_operator") is not None:
                err("threshold_type=none must have threshold_operator null")

        # Format versioning: a name without a version is incomplete.
        if row.get("format_name") and row.get("format_version") is None \
                and not str(row.get("format_note") or "").strip():
            err("format_version is null and format_note is empty — record the version or say "
                "in format_note why there isn't one")

        # Confidence labelling: verified means a primary source was actually read.
        if row.get("confidence") == "verified":
            if row.get("source_type") not in PRIMARY:
                err(f"confidence=verified but source_type={row.get('source_type')!r} "
                    "is not a primary source")
            if not str(row.get("confidence_note") or "").strip():
                err("confidence=verified requires a confidence_note saying what was read")
        if row.get("confidence") == "unknown" and row.get("mandatory_from") is not None:
            err("confidence=unknown must not carry a mandatory_from date")
        if row.get("mandatory_from") is None and row.get("confidence") != "unknown":
            err("mandatory_from is null, so confidence must be 'unknown'")
        if row.get("mandatory_from") is None and not (row.get("unknowns") or []):
            err("mandatory_from is null, so unknowns must name the gap")

        # Tolerance: buyers care about both dates, so if one exists it must be explained.
        if row.get("tolerance_ends") and not str(row.get("tolerance_note") or "").strip():
            err("tolerance_ends is set but tolerance_note does not say what is tolerated")

        # Keys: no duplicates, no contradictions.
        if row.get("obligation_id") in seen_ids:
            err(f"duplicate obligation_id (first seen in {seen_ids[row['obligation_id']]})")
        else:
            seen_ids[row.get("obligation_id")] = row.get("_source_file")

        key = tuple(row.get(k) for k in OBLIGATION_KEY)
        if key in seen_obligations:
            prev = seen_obligations[key]
            if (prev.get("mandatory_from") != row.get("mandatory_from")
                    or prev.get("tolerance_ends") != row.get("tolerance_ends")):
                err(f"contradicts {prev.get('obligation_id')}: same jurisdiction/regime/"
                    "direction/threshold but a different mandatory_from or tolerance_ends")
        else:
            seen_obligations[key] = row

    return errors


def normalise(row):
    out = {}
    for col in COLUMNS:
        v = row.get(col)
        if col in LIST_FIELDS:
            out[col] = list(v or [])
        else:
            out[col] = None if v == "" else v
    return out


def build_coverage(rows, note):
    checks = sorted(r["checked_on"] for r in rows)
    counts = Counter(r["confidence"] for r in rows)
    return {
        "jurisdictions": sorted({r["jurisdiction"] for r in rows}),
        "jurisdiction_count": len({r["jurisdiction"] for r in rows}),
        "regimes": sorted({r["regime"] for r in rows}),
        "confidence_counts": {
            "verified": counts.get("verified", 0),
            "reported": counts.get("reported", 0),
            "unknown": counts.get("unknown", 0),
        },
        "oldest_checked_on": checks[0] if checks else None,
        "newest_checked_on": checks[-1] if checks else None,
        "rows_with_open_unknowns": sum(1 for r in rows if r["unknowns"]),
        "note": note,
    }


def coverage_markdown(rows, coverage):
    names = {r["jurisdiction"]: r["jurisdiction_name"] for r in rows}
    c = coverage["confidence_counts"]
    lines = [
        "# Coverage report",
        "",
        "Generated by `dataset/build.py` from `dataset/sources/*.yaml`. Do not hand-edit.",
        "",
        f"- Schema version: **{SCHEMA_VERSION}**",
        f"- Rows: **{len(rows)}**",
        f"- Jurisdictions: **{coverage['jurisdiction_count']}** "
        f"({', '.join(coverage['jurisdictions'])})",
        f"- Confidence: **{c['verified']} verified**, **{c['reported']} reported**, "
        f"**{c['unknown']} unknown**",
        f"- Oldest `checked_on` in the set: **{coverage['oldest_checked_on']}** "
        "— quote this with any coverage claim",
        f"- Newest `checked_on` in the set: **{coverage['newest_checked_on']}**",
        f"- Rows carrying open unknowns: **{coverage['rows_with_open_unknowns']}**",
        "",
        f"> {coverage['note']}",
        "",
        "## By jurisdiction",
        "",
        "| Code | Jurisdiction | Rows | verified | reported | unknown | Oldest `checked_on` |",
        "|---|---|---|---|---|---|---|",
    ]
    for code in coverage["jurisdictions"]:
        subset = [r for r in rows if r["jurisdiction"] == code]
        cc = Counter(r["confidence"] for r in subset)
        lines.append(
            f"| `{code}` | {names[code]} | {len(subset)} | {cc.get('verified', 0)} | "
            f"{cc.get('reported', 0)} | {cc.get('unknown', 0)} | "
            f"{min(r['checked_on'] for r in subset)} |"
        )

    lines += ["", "## By regime and direction", "",
              "| Regime | Direction | Rows |", "|---|---|---|"]
    for (regime, direction), count in sorted(
            Counter((r["regime"], r["direction"]) for r in rows).items()):
        lines.append(f"| `{regime}` | `{direction}` | {count} |")

    unknown_rows = [r for r in rows if r["confidence"] == "unknown"]
    lines += ["", "## Rows recorded as `unknown`", ""]
    if unknown_rows:
        lines += ["| Obligation | Jurisdiction | What is not established |", "|---|---|---|"]
        for r in unknown_rows:
            why = "; ".join(r["unknowns"]).replace("|", "\\|")
            lines.append(f"| `{r['obligation_id']}` | {r['jurisdiction_name']} | {why} |")
    else:
        lines.append("None.")

    open_unknowns = [r for r in rows if r["unknowns"] and r["confidence"] != "unknown"]
    lines += ["", "## Open gaps on otherwise-sourced rows", "",
              "The date is sound; a neighbouring fact is not. These are the honest edges of "
              "the dataset.", ""]
    if open_unknowns:
        lines += ["| Obligation | Confidence | Gap |", "|---|---|---|"]
        for r in open_unknowns:
            for gap in r["unknowns"]:
                lines.append(f"| `{r['obligation_id']}` | `{r['confidence']}` | "
                             f"{gap.replace('|', chr(92) + '|')} |")
    else:
        lines.append("None.")

    lines.append("")
    return "\n".join(lines)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="validate only, write nothing")
    ap.add_argument("--note", default=None, help="override the coverage scope note")
    args = ap.parse_args()

    today = dt.date.today().isoformat()
    raw = load_rows()
    if not raw:
        print(f"FAIL  no obligations found in {SOURCES}", file=sys.stderr)
        return 1

    errors = validate(raw, today)
    if errors:
        print(f"FAIL  {len(errors)} problem(s) in dataset/sources/:", file=sys.stderr)
        for e in errors:
            print(f"  - {e}", file=sys.stderr)
        return 1

    rows = sorted((normalise(r) for r in raw), key=lambda r: r["obligation_id"])
    jurisdictions = sorted({r["jurisdiction"] for r in rows})
    note = args.note or (
        f"Partial dataset. {len(jurisdictions)} jurisdictions recorded of 27 EU member states "
        "plus UK and Norway in scope for v1. This is not a completeness claim: a jurisdiction "
        "absent from rows means not yet recorded, never 'no obligation'. See "
        "dataset/dist/coverage.md and dataset/CHANGELOG.md."
    )
    coverage = build_coverage(rows, note)

    if args.check:
        print(f"OK    {len(rows)} rows · {coverage['jurisdiction_count']} jurisdictions "
              f"({', '.join(jurisdictions)}) · "
              f"verified {coverage['confidence_counts']['verified']}, "
              f"reported {coverage['confidence_counts']['reported']}, "
              f"unknown {coverage['confidence_counts']['unknown']} · "
              f"oldest checked_on {coverage['oldest_checked_on']}")
        return 0

    DIST.mkdir(parents=True, exist_ok=True)

    payload = {
        "schema_version": SCHEMA_VERSION,
        "generated_from": "dataset/sources/*.yaml (source of truth; dataset/build.py validates "
                          "and generates this file, the CSV and coverage.md)",
        # Derived from the data, not the clock, so an unchanged build is byte-identical.
        "generated_on": coverage["newest_checked_on"],
        "row_count": len(rows),
        "coverage": coverage,
        "rows": rows,
    }
    (DIST / "obligations.json").write_text(
        json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    with (DIST / "obligations.csv").open("w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=COLUMNS, lineterminator="\n")
        w.writeheader()
        for row in rows:
            out = {}
            for col in COLUMNS:
                v = row[col]
                if isinstance(v, list):
                    v = " | ".join(str(x) for x in v)
                out[col] = "" if v is None else v
            w.writerow(out)

    (DIST / "coverage.md").write_text(coverage_markdown(rows, coverage), encoding="utf-8")

    print(f"OK    {len(rows)} rows · {coverage['jurisdiction_count']} jurisdictions "
          f"({', '.join(jurisdictions)}) · "
          f"verified {coverage['confidence_counts']['verified']}, "
          f"reported {coverage['confidence_counts']['reported']}, "
          f"unknown {coverage['confidence_counts']['unknown']} · "
          f"oldest checked_on {coverage['oldest_checked_on']}")
    print("OK    wrote dist/obligations.json, dist/obligations.csv, dist/coverage.md")
    return 0


if __name__ == "__main__":
    sys.exit(main())
