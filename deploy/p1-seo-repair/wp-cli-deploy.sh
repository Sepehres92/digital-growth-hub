#!/usr/bin/env bash
set -euo pipefail

# Run from the WordPress document root with WP-CLI authenticated as an administrator.
# This script backs up every changed value before writing.

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PAYLOAD_DIR="$SCRIPT_DIR/payload"
BACKUP_DIR="${1:-/tmp/rebar-p1-seo-$(date +%Y%m%d-%H%M%S)}"

mkdir -p "$BACKUP_DIR"

for id in 2692 2707 2719; do
  wp post get "$id" --field=post_excerpt > "$BACKUP_DIR/$id-post_excerpt.html"
  wp post meta get "$id" _yoast_wpseo_title > "$BACKUP_DIR/$id-yoast-title.txt" || true
  wp post meta get "$id" _yoast_wpseo_metadesc > "$BACKUP_DIR/$id-yoast-metadesc.txt" || true
done

wp term get product_cat 422 --field=description > "$BACKUP_DIR/422-description.html"
wp term meta get product_cat 422 _yoast_wpseo_title > "$BACKUP_DIR/422-yoast-title.txt" || true
wp term meta get product_cat 422 _yoast_wpseo_metadesc > "$BACKUP_DIR/422-yoast-metadesc.txt" || true
wp post get 242 --field=post_content > "$BACKUP_DIR/242-post_content.html"

wp post meta update 2692 _yoast_wpseo_title '6×6 6-Gauge Welded Wire Mesh | 4×8 & 8×20 Sheets'
wp post meta update 2692 _yoast_wpseo_metadesc 'Shop 6×6 welded wire mesh in 6-gauge steel, available in 4×8 and 8×20 sheets. Built for concrete slabs, driveways, walls and footings.'
wp post update 2692 --post_excerpt="$(cat "$PAYLOAD_DIR/mesh-excerpt.html")"

wp post meta update 2707 _yoast_wpseo_title '5-ft × 12-in Circular Rebar Cage | Pre-Tied Steel'
wp post meta update 2707 _yoast_wpseo_metadesc 'Prefabricated 5-ft-long × 12-in-diameter circular steel rebar cage for caissons, piles and concrete piers. Order online or request a custom-spec quote.'
wp post update 2707 --post_excerpt="$(cat "$PAYLOAD_DIR/cage-excerpt.html")"

wp post meta update 2719 _yoast_wpseo_title '15M Rebar Dowel 24×8 in | Grade 400W L-Bar'
wp post meta update 2719 _yoast_wpseo_metadesc 'Shop prefabricated 15M Grade 400W rebar dowels with 24-in and 8-in legs. In-stock L-bars for footings, slabs and reinforced concrete joints.'
wp post update 2719 --post_excerpt="$(cat "$PAYLOAD_DIR/dowel-excerpt.html")"

wp term meta update product_cat 422 _yoast_wpseo_title 'Rebar Stirrups & Ties | CSA 400W | Custom Sizes'
wp term meta update product_cat 422 _yoast_wpseo_metadesc 'Buy standard rebar stirrups or request custom sizes in CSA Grade 400W steel. Ready-to-install reinforcement for beams and columns, with Ontario delivery.'
wp term update product_cat 422 --description="$(cat "$PAYLOAD_DIR/stirrups-description.html")"

wp post update 242 --post_content="$(cat "$PAYLOAD_DIR/shipping-delivery.html")"

wp cache flush

printf 'P1 repair written. Backup directory: %s\n' "$BACKUP_DIR"
printf 'Run verify.ps1 from an authorized Windows workstation, then inspect mobile cart and quote actions.\n'

