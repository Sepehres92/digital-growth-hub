# P1 SEO Repair — Deployment Package

Status: staged locally; not deployed.

## Targets

- Product 2692 — 6-gauge welded wire mesh
- Product 2707 — 5-ft × 12-in circular steel cage
- Product 2719 — 24×8 15M rebar dowel
- Product category term 422 — Rebar Stirrups
- WoodMart HTML block 242 — shared Shipping & Delivery tab

## Deploy

1. Copy this directory to the WordPress server.
2. From the WordPress document root, run `bash /path/to/p1-seo-repair/wp-cli-deploy.sh`.
3. Save the backup-directory path printed by the script.
4. Purge the affected CDN/page caches if the site uses an external cache beyond WordPress object cache.
5. Run `powershell -File verify.ps1` from an authorized workstation.
6. Manually test the product variations, Add to Cart, Buy Now, quote link, mobile layout, and the Stirrups product grid.

Do not request Search Console recrawls until live verification passes. Do not use GA4 conversion results to judge the change until the separate P0 tracking repair is completed.

## Roll back

From the WordPress document root, run:

`bash /path/to/p1-seo-repair/wp-cli-rollback.sh /absolute/path/printed/by/deploy`

Then purge caches and re-run `verify.ps1`; the verifier is designed for the new state, so after rollback its expected-content assertions should fail while HTTP, canonical, indexability, and placeholder state should match the restored production version.

