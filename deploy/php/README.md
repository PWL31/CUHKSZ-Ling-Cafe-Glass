# PHP deployment target

This is an additional deployment target for Kangle + PHP + MySQL. The repository
root remains the Cloudflare deployment; publishing this directory does not replace
the existing Worker or migrate its database automatically.

`site/backend.php` preserves the menu and schedule API shapes. MySQL InnoDB state
rows are locked with SELECT FOR UPDATE for atomic mutations. Images are stored as
BLOBs, sessions as hashed random tokens, and login attempts are limited per client.
The browser adapter uses relative api.php query routes and POST method tunneling
so shared hosting needs neither URL rewriting nor PUT/DELETE support.

## Build

1. Run export_source.py against the original HTTPS Worker origin. Supply credentials
   interactively or through LING_EXPORT_USERNAME / LING_EXPORT_PASSWORD. Keep the
   resulting snapshot and image files outside the repository.
2. Run `python3 deploy/php/fetch_vendor.py --output PATH/vendor` to download
   the pinned fonts, background photos, html2canvas and licenses. The script
   checks each asset against vendor-sources.json and keeps source attribution.
3. Generate the existing admin password's hash with PHP password_hash; save that
   hash in a local file outside the repository.
4. Run build_package.py --snapshot PATH/snapshot.json --vendor PATH/vendor
   --admin-hash-file PATH/admin.hash --output PATH/new-package-directory.

The builder refuses missing snapshots and checksum mismatches. It removes frontend
demo menu prices, adds a visible unavailable state, rewrites same-origin API calls,
and produces the uploadable site directory plus SQL data import and manifest.

See DEPLOYMENT.md for recipient instructions. Never commit an exported snapshot,
database import, database credentials, or a populated config.php.
