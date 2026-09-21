# Validation — 2026-09-21

Tested with PHP 8.4.25 and MySQL 8.4.11 on isolated localhost databases.
The actual Kangle host has not been configured or tested.

- 48 integration checks passed: login/session/logout, unauthorized writes,
  request-origin restrictions, menu CRUD, Popular limit, Chinese text, image
  validation and byte-for-byte image retrieval, barista profiles, overlapping
  shifts, opening-hour boundaries, archived profiles and frozen history.
- SQL import into a fresh database passed. Repeated import was rejected rather
  than replacing the existing records. Imported image hashes matched the source.
- All packaged PHP and JavaScript files passed syntax checks.
- All five existing bilingual UI regression tests passed.
- Browser checks at `/LING_COFFEE/site/` loaded the fixture menu and admin login.
  English/Chinese unavailable messages survived navigation and filter rendering
  when the database was deliberately left unconfigured. No demo prices appeared.
- Self-hosted font/background/library files were verified against pinned hashes.
  Preference-card rendering produced a PNG blob; native sharing waited on the
  browser share flow. The download fallback displayed its success message, but
  an actual downloaded file was not verified in the in-app browser.

All test data was explicitly marked as fixtures. These results do not verify a
production data export. A production deployment package must be built from a
fresh authenticated snapshot of the original site and checked against its
manifest before delivery. Do not ship fixture packages as migrated site data.
