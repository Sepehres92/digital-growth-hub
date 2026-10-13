#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 1 ]; then
  printf 'Usage: %s /absolute/path/to/p3-backup-directory\n' "$0" >&2
  exit 1
fi

BACKUP_DIR="$1"
PLUGIN_TARGET='wp-content/mu-plugins/rebar-shop-p3-stirrups-taxonomy.php'
MEMBERSHIP_FILE="$BACKUP_DIR/product-category-membership.tsv"

wp core is-installed >/dev/null
test -f "$MEMBERSHIP_FILE"

if [ -f "$BACKUP_DIR/rebar-shop-p3-stirrups-taxonomy.php.previous" ]; then
  cp "$BACKUP_DIR/rebar-shop-p3-stirrups-taxonomy.php.previous" "$PLUGIN_TARGET"
elif [ -f "$BACKUP_DIR/plugin-was-absent" ]; then
  rm -f "$PLUGIN_TARGET"
else
  printf 'Rollback refused: plugin backup state is missing.\n' >&2
  exit 1
fi

tail -n +2 "$MEMBERSHIP_FILE" | while IFS=$'\t' read -r PRODUCT_ID HAD_422 HAD_572; do
  if [ "$HAD_422" = '1' ]; then
    wp post term add "$PRODUCT_ID" product_cat 422 --by=id >/dev/null
  else
    wp post term remove "$PRODUCT_ID" product_cat 422 --by=id >/dev/null || true
  fi

  if [ "$HAD_572" = '1' ]; then
    wp post term add "$PRODUCT_ID" product_cat 572 --by=id >/dev/null
  else
    wp post term remove "$PRODUCT_ID" product_cat 572 --by=id >/dev/null || true
  fi
done

printf 'P3 rollback restored plugin state and product category memberships from %s.\n' "$BACKUP_DIR"
