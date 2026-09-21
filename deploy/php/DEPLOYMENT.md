# Ling Cafe — Kangle + PHP + MySQL

Copyright © 2026 Trent (PWL31).
Source: https://github.com/PWL31/CUHKSZ-Ling-Cafe-Glass

This package runs on your PHP/MySQL host. It does not call Cloudflare Workers.
这次需要同时上传网站文件和导入 MySQL 数据，不能只复制 index.html。

## 1. Hosting requirements / 主机要求

- PHP 8.2 or later, with PDO_MYSQL and standard PHP image-information functions.
- MySQL 5.7+ / MySQL 8, or a compatible MariaDB, with InnoDB and utf8mb4.
- HTTPS enabled for the website; keep `secure_cookie` set to true.
- No Node.js, Composer, rewrite rules, PATH_INFO or Cloudflare account required.
- Allow POST requests to `api.php` and request bodies of at least 2 MB.

The PHP/MySQL code is tested separately from Kangle. The recipient must verify
their actual PHP version, database permissions and host settings during deployment.

## 2. Import data / 先导入数据库

Create an empty database and database user in the hosting control panel.
Import `IMPORT-IN-MYSQL.sql` through phpMyAdmin or the hosting database tool.
It contains the menu, costs, availability, Popular choices, full barista roster,
weekly hours, day overrides, historical/future shifts and the referenced photos
captured from the original site. See MANIFEST.json for source date and counts.

Use a NEW database or new `ling_` table prefix. The script intentionally contains
no DROP, TRUNCATE or destructive replacement statements. Do not re-import this
snapshot to update an already-running site: it would revert to an older snapshot
if imported over a manually emptied database.

If the control panel rejects a large SQL upload, increase its import size limit
or ask the host to import the file into the new database. Do not upload SQL files
into the publicly served website directory.

## 3. Configure and upload / 配置并上传

Inside `site/`, copy `config.example.php` to `config.php`. Fill in:

```php
'db_host' => 'HOST_FROM_YOUR_CONTROL_PANEL',
'db_port' => 3306,
'db_name' => 'YOUR_DATABASE_NAME',
'db_user' => 'YOUR_DATABASE_USER',
'db_password' => 'YOUR_DATABASE_PASSWORD',
```

Keep `table_prefix` consistent with the imported SQL (`ling_` by default).
The admin name and password hash in the example preserve the existing Trent
login. The plaintext password is not included in this guide. Never commit your
filled `config.php` or publish a text copy of it.

Upload the CONTENTS of `site/` into the existing `/LING_COFFEE/site/` directory,
including the new api.php, backend.php, php-adapter.js and vendor/ directory.
The existing URL may remain:

    https://frankychan.com/LING_COFFEE/site/index.html

It also works in another subdirectory or at the domain root. Paths are determined
from the PHP endpoint and adapter location. No rewrite settings are necessary.

Only upload `site/`. Keep the SQL, manifest and deployment notes on your computer.
Existing legacy Worker files are not used by this version; remove obsolete Worker
configuration/source files from the PUBLIC server directory after backing it up.

## 4. Verify / 部署验收

At the same website directory, open:

    api.php?route=/health

Expect JSON containing `ok: true`, `backend: php-mysql`, `menuBackend: true` and
`scheduleBackend: true`. A 404 means PHP routing/files are not in place; a 503 JSON
response means to check config.php, database import or the PHP server error log.
Do not expose phpinfo or print database credentials to debug this.

Then verify the menu and images against the manifest; log in using the existing
admin account; save and revert a small menu edit; refresh in a second browser;
check weekly/day hours, existing shifts, and the downloaded preference card.
Finally test from a mainland mobile connection with VPN OFF. Accessibility from
that network must be tested on the real host; it cannot be guaranteed by packaging.

## 5. Future updates and backups / 后续更新和备份

Keep config.php and the existing MySQL database when uploading code updates.
Back up all `ling_` tables together: menu/schedule records and uploaded photo bytes
are in MySQL. Old Cloudflare login sessions are intentionally not migrated.
This snapshot is a point-in-time copy; later changes on the old site do not sync.
Once the new site is accepted, choose one site for ongoing admin edits.

The original frontend appearance, bilingual controls, line icons, downloadable
card and visible Trent copyright are retained. Fonts, background photos and the
card-export library are self-hosted in vendor/. Third-party licenses and sources
are included there; donation and source-code links still lead to their destinations.

PHP MySQL driver reference: https://www.php.net/manual/en/ref.pdo-mysql.php

## Data verification / 数据核对

MANIFEST.json contains export time, counts and hashes. The export compares source
menu/schedule data again after image download, refusing a mixed snapshot if data
changed during export. Packaged image bytes are verified against their hashes.
Deleted/unreferenced image blobs and old login sessions are not part of site content
and are not migrated. This package does not install itself on the recipient server.
