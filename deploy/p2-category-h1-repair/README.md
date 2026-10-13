# P2 Category H1 Repair

Status: staged locally; not deployed.

## Confirmed production defect

Both target category pages return HTTP 200, self-canonicalize, and emit `index, follow`, but contain zero H1 elements:

- Product category term 422 — Rebar Stirrups
- Product category term 533 — Fiberglass Rebars (GFRP), containing 15 products

## Change

The deployment script prepends exactly one descriptive H1 to each existing term description. It preserves the current description and refuses to add another H1 if one is already present. This makes it safe to run after the P1 package, which already stages the same Stirrups heading.

## Deploy

1. Copy this directory to the WordPress server.
2. From the WordPress document root, run `bash /path/to/p2-category-h1-repair/wp-cli-deploy.sh`.
3. Save the backup-directory path printed by the script.
4. Purge the two category URLs from any external page/CDN cache.
5. Run `powershell -File verify.ps1` from an authorized workstation.
6. Visually confirm the H1 appears once above the product grid on desktop and mobile and that breadcrumbs, filters, pagination, and products still render.

## Roll back

From the WordPress document root, run:

`bash /path/to/p2-category-h1-repair/wp-cli-rollback.sh /absolute/path/printed/by/deploy`

Then purge caches and verify the restored pages.

