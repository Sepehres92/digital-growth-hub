# P3 Stirrups Taxonomy Consolidation

Status: staging implementation prepared; production not changed.

## Confirmed live defect

- Primary product category: term `422`, slug `stirrups`, 12 products, sitemap-listed, HTTP 200, self-canonical and rendered as indexable.
- Duplicate product category: term `572`, slug `rebar-stirrups`, 10 products also assigned to term 422, HTTP 200, self-canonical and rendered as indexable.
- The duplicate is absent from the product-category sitemap, but that does not prevent indexing because the live archive remains internally discoverable and returns an indexable 200.
- Public REST Yoast output reports `noindex` while rendered HTML reports `index`; rendered HTML is the operative signal.

## Repair decision

Keep term 422 because it is the established nested category, is already targeted by P1/P2, is sitemap-listed, and contains the complete steel plus GFRP assortment.

Retain term 572 as an empty term so its legacy URL can resolve predictably, but:

1. permanently redirect its archive to term 422;
2. normalize generated term-572 links to the primary URL;
3. remove term 572 from the 10 duplicate product assignments;
4. do not delete either term or change the primary URL.

## Production deployment order — approval required

1. Copy this directory to the WordPress server.
2. From the production WordPress document root, run `bash /path/to/p3-stirrups-taxonomy-repair/wp-cli-deploy.sh`.
3. Save the printed backup-directory path.
4. Purge the two category URLs and the 10 affected product URLs from page/CDN cache.
5. Run `powershell -File verify.ps1` from an authorized workstation.
6. Manually confirm the primary archive grid, breadcrumbs, filters and pagination on desktop/mobile, and spot-check product category links.

The deploy script refuses to run on an unexpected home URL, requires exact term IDs/slugs, and refuses a stale product-membership set.

## Rollback

From the WordPress document root:

`bash /path/to/p3-stirrups-taxonomy-repair/wp-cli-rollback.sh /absolute/path/printed/by/deploy`

Then purge the affected caches and confirm both original archives and product memberships are restored.

## Remaining validation gates

- Run `php -l rebar-shop-p3-stirrups-taxonomy.php` on the WordPress server.
- Run `bash -n wp-cli-deploy.sh wp-cli-rollback.sh` on the WordPress server.
- Production execution, cache purge and browser interaction checks require Sepehr's explicit approval.
