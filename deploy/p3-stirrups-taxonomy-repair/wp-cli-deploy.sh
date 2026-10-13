#!/usr/bin/env bash
set -euo pipefail

PRIMARY_TERM_ID=422
DUPLICATE_TERM_ID=572
EXPECTED_IDS='2735 2737 2739 2741 2743 21279 21283 21284 21285 21286'
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_SOURCE="$SCRIPT_DIR/rebar-shop-p3-stirrups-taxonomy.php"
PLUGIN_TARGET='wp-content/mu-plugins/rebar-shop-p3-stirrups-taxonomy.php'

wp core is-installed >/dev/null
SITE_URL="$(wp option get home)"
case "$SITE_URL" in
  https://rebar.shop|https://www.rebar.shop) ;;
  *) printf 'Refusing P3 production deploy: unexpected home URL %s\n' "$SITE_URL" >&2; exit 1 ;;
esac

test "$(wp term get product_cat "$PRIMARY_TERM_ID" --field=slug)" = 'stirrups'
test "$(wp term get product_cat "$DUPLICATE_TERM_ID" --field=slug)" = 'rebar-stirrups'
test -f "$PLUGIN_SOURCE"

CURRENT_IDS="$(wp post list --post_type=product --post_status=any --product_cat=rebar-stirrups --field=ID | sort -n | tr '\n' ' ' | sed 's/ $//')"
if [ "$CURRENT_IDS" != "$EXPECTED_IDS" ]; then
  printf 'Refusing stale P3 deploy. Expected duplicate-term products: %s\nCurrent: %s\n' "$EXPECTED_IDS" "$CURRENT_IDS" >&2
  exit 1
fi

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_DIR="wp-content/uploads/rebar-seo-backups/p3-stirrups-taxonomy-$STAMP"
mkdir -p "$BACKUP_DIR"
wp term get product_cat "$PRIMARY_TERM_ID" --format=json > "$BACKUP_DIR/term-422.json"
wp term get product_cat "$DUPLICATE_TERM_ID" --format=json > "$BACKUP_DIR/term-572.json"
printf 'product_id\thad_422\thad_572\n' > "$BACKUP_DIR/product-category-membership.tsv"

for PRODUCT_ID in $EXPECTED_IDS; do
  TERMS="$(wp post term list "$PRODUCT_ID" product_cat --field=term_id)"
  HAD_422=0
  HAD_572=0
  printf '%s\n' "$TERMS" | grep -qx "$PRIMARY_TERM_ID" && HAD_422=1 || true
  printf '%s\n' "$TERMS" | grep -qx "$DUPLICATE_TERM_ID" && HAD_572=1 || true
  if [ "$HAD_572" -ne 1 ]; then
    printf 'Refusing deploy: product %s is no longer assigned to term 572.\n' "$PRODUCT_ID" >&2
    exit 1
  fi
  printf '%s\t%s\t%s\n' "$PRODUCT_ID" "$HAD_422" "$HAD_572" >> "$BACKUP_DIR/product-category-membership.tsv"
done

mkdir -p "$(dirname "$PLUGIN_TARGET")"
if [ -f "$PLUGIN_TARGET" ]; then
  cp "$PLUGIN_TARGET" "$BACKUP_DIR/rebar-shop-p3-stirrups-taxonomy.php.previous"
else
  : > "$BACKUP_DIR/plugin-was-absent"
fi
cp "$PLUGIN_SOURCE" "$PLUGIN_TARGET"

for PRODUCT_ID in $EXPECTED_IDS; do
  wp post term add "$PRODUCT_ID" product_cat "$PRIMARY_TERM_ID" --by=id >/dev/null
  wp post term remove "$PRODUCT_ID" product_cat "$DUPLICATE_TERM_ID" --by=id >/dev/null
done

printf 'P3 repair written. Duplicate term retained for redirect safety.\nBackup directory: %s\n' "$BACKUP_DIR"
