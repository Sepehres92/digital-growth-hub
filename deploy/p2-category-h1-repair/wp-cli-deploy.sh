#!/usr/bin/env bash
set -euo pipefail

# Run from the WordPress document root with WP-CLI authenticated as an administrator.
# The change is intentionally minimal: prepend one H1 while preserving each term description.

BACKUP_DIR="${1:-/tmp/rebar-p2-h1-$(date +%Y%m%d-%H%M%S)}"
mkdir -p "$BACKUP_DIR"

ensure_h1() {
  local term_id="$1"
  local expected_h1="$2"
  local current

  current="$(wp term get product_cat "$term_id" --field=description)"
  printf '%s' "$current" > "$BACKUP_DIR/$term_id-description.html"

  if printf '%s' "$current" | grep -qi '<h1\b'; then
    printf 'Term %s already contains an H1; left unchanged to prevent duplication.\n' "$term_id"
    return 0
  fi

  wp term update product_cat "$term_id" --description="<h1>$expected_h1</h1>
$current"
}

ensure_h1 422 'Rebar Stirrups &amp; Ties — Standard Sizes or Custom Fabrication'
ensure_h1 533 'Fiberglass Rebar (GFRP) — Corrosion-Resistant Reinforcement'

wp cache flush

printf 'P2 H1 repair written. Backup directory: %s\n' "$BACKUP_DIR"
printf 'Run verify.ps1 and inspect both category pages on desktop and mobile.\n'

