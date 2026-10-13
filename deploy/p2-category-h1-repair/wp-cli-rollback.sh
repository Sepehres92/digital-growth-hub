#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 || ! -d "$1" ]]; then
  printf 'Usage: %s /absolute/path/to/rebar-p2-h1-backup\n' "$0" >&2
  exit 2
fi

BACKUP_DIR="$1"

for term_id in 422 533; do
  backup="$BACKUP_DIR/$term_id-description.html"
  if [[ ! -f "$backup" ]]; then
    printf 'Missing backup file: %s\n' "$backup" >&2
    exit 3
  fi
  wp term update product_cat "$term_id" --description="$(cat "$backup")"
done

wp cache flush
printf 'P2 rollback written from %s. Re-run live verification.\n' "$BACKUP_DIR"

