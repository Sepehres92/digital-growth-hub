#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 || ! -d "$1" ]]; then
  printf 'Usage: %s /absolute/path/to/rebar-p1-seo-backup\n' "$0" >&2
  exit 2
fi

BACKUP_DIR="$1"

restore_meta() {
  local id="$1" key="$2" file="$3"
  if [[ -s "$file" ]]; then
    wp post meta update "$id" "$key" "$(cat "$file")"
  else
    wp post meta delete "$id" "$key" || true
  fi
}

for id in 2692 2707 2719; do
  wp post update "$id" --post_excerpt="$(cat "$BACKUP_DIR/$id-post_excerpt.html")"
  restore_meta "$id" _yoast_wpseo_title "$BACKUP_DIR/$id-yoast-title.txt"
  restore_meta "$id" _yoast_wpseo_metadesc "$BACKUP_DIR/$id-yoast-metadesc.txt"
done

wp term update product_cat 422 --description="$(cat "$BACKUP_DIR/422-description.html")"
if [[ -s "$BACKUP_DIR/422-yoast-title.txt" ]]; then
  wp term meta update product_cat 422 _yoast_wpseo_title "$(cat "$BACKUP_DIR/422-yoast-title.txt")"
else
  wp term meta delete product_cat 422 _yoast_wpseo_title || true
fi
if [[ -s "$BACKUP_DIR/422-yoast-metadesc.txt" ]]; then
  wp term meta update product_cat 422 _yoast_wpseo_metadesc "$(cat "$BACKUP_DIR/422-yoast-metadesc.txt")"
else
  wp term meta delete product_cat 422 _yoast_wpseo_metadesc || true
fi

wp post update 242 --post_content="$(cat "$BACKUP_DIR/242-post_content.html")"
wp cache flush
printf 'Rollback written from %s. Re-run live verification.\n' "$BACKUP_DIR"

