#!/usr/bin/env python3
"""Build a PHP deployment from a verified export; never substitute demo data."""
import argparse, hashlib, json, pathlib, re, shutil, subprocess, zipfile
from datetime import datetime, timezone

parser = argparse.ArgumentParser()
parser.add_argument('--snapshot', type=pathlib.Path, required=True)
parser.add_argument('--vendor', type=pathlib.Path, required=True)
parser.add_argument('--output', type=pathlib.Path, required=True)
parser.add_argument('--admin-hash-file', type=pathlib.Path, required=True)
parser.add_argument('--table-prefix', default='ling_')
args = parser.parse_args()
here = pathlib.Path(__file__).resolve().parent
repo = here.parent.parent
snapshot = json.loads(args.snapshot.read_text())
if snapshot.get('format') != 'ling-migration-v1': raise ValueError('A verified migration snapshot is required.')
if not re.fullmatch('[a-z][a-z0-9_]{0,30}', args.table_prefix): raise ValueError('Invalid table prefix.')
if args.output.exists(): raise ValueError('Output exists; use a new directory to preserve the earlier package.')
args.output.mkdir(parents=True)
site = args.output / 'site'; site.mkdir()
included = subprocess.check_output(['git', 'ls-files', '-z'], cwd=repo).decode().split('\0')
for name in included:
    if not name or name.startswith(('.', 'tests/', 'deploy/')) or name in ['README.md', 'wrangler.toml', 'worker.js', 'router.js']: continue
    source = repo / name
    dest = site / name; dest.parent.mkdir(parents=True, exist_ok=True); shutil.copyfile(source, dest)
for source in (here / 'site').iterdir(): shutil.copyfile(source, site / source.name)
shutil.copytree(args.vendor, site / 'vendor')
for required in ['fonts.css', 'html2canvas.min.js', 'cafe-background.jpg', 'community.jpg']:
    if not (site / 'vendor' / required).is_file(): raise ValueError('Missing self-hosted asset: ' + required)

# Package-specific transformations leave the original Worker frontend unchanged.
for path in site.glob('*.js'):
    if path.name == 'php-adapter.js': continue
    text = path.read_text()
    text = re.sub(r'(?<![\w.])fetch\(', 'window.lingFetch(', text)
    text = text.replace("'/menu-placeholder.svg'", "'menu-placeholder.svg'").replace("url('/menu-placeholder.svg')", "url('menu-placeholder.svg')")
    text = text.replace('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js', 'vendor/html2canvas.min.js')
    text = text.replace('Regular users can ignore it. Menu edits here are stored on the Cloudflare backend and are shared across devices.', 'Regular users can ignore it. Saved menu changes are shared across devices.')
    text = text.replace('Authentication is handled by the Cloudflare Worker.', 'Sign in with your cafe administrator account.')
    # Invalidate every script cache used by the previous static upload.
    text = re.sub(r'\.js\?v=[a-zA-Z0-9-]+', '.js?v=php-mysql-20260921', text)
    if path.name == 'app.js':
        text = re.sub(r'const menu = \[.*?\n\];', 'let menuLoadFailed = false;\nconst menu = [];', text, count=1, flags=re.S)
        for fn, root_id in [('renderHome', 'homeDrinks'), ('renderMenu', 'menuGrid')]:
            marker = f"function {fn}(){{\n  const root=$('#{root_id}');\n  if(!root) return;"
            if marker not in text: raise ValueError('Menu renderer patch needs review.')
            text = text.replace(marker, marker + '''
  if(menuLoadFailed && !menu.length){
    root.innerHTML='<p class="muted">Menu unavailable. Please try again later.</p>';
    return;
  }''', 1)
    if path.name == 'admin.js':
        text = text.replace('function replaceMenu(items){', 'function replaceMenu(items){\n    menuLoadFailed=false;', 1)
        old = 'if(showError) toast(err.message);\n      return false;'
        new = '''if(showError) toast(err.message);
      menuLoadFailed=true;
      renderMenu();renderHome();
      return false;'''
        if old not in text: raise ValueError('Menu error-state patch needs review.')
        text = text.replace(old, new, 1)
    if path.name == 'schedule-ui-polish.js':
        old = 'if(!root||renderingProfiles)return false;'
        if old not in text: raise ValueError('Schedule authentication guard needs review.')
        text = text.replace(old, "if(!root||renderingProfiles||!document.body.classList.contains('admin-authenticated'))return false;", 1)
    if path.name == 'i18n.js':
        marker = "'Schedule unavailable':"
        if marker not in text: raise ValueError('Translation dictionary changed; review required.')
        text = text.replace(marker, "'Menu unavailable. Please try again later.':'菜单暂时无法加载，请稍后重试。'," + marker, 1)
    path.write_text(text)
index = (site / 'index.html').read_text()
index = re.sub(r'^.*<link[^>]+(?:fonts.googleapis.com|fonts.gstatic.com)[^>]*>\s*\n', '', index, flags=re.M)
index = index.replace('</head>', '  <link rel="stylesheet" href="vendor/fonts.css">\n</head>')
index = index.replace('  <script src="i18n.js', '  <script src="php-adapter.js?v=php-mysql-20260921"></script>\n  <script src="i18n.js')
index = re.sub(r'\.(js|css)\?v=[a-zA-Z0-9-]+', r'.\1?v=php-mysql-20260921', index)
(site / 'index.html').write_text(index)
styles = (site / 'styles.css').read_text()
styles = re.sub(r'https://images.unsplash.com/photo-1445116572660-236099ec97a0\?[^"\s]+', 'vendor/cafe-background.jpg', styles)
styles = re.sub(r'https://images.unsplash.com/photo-1521017432531-fbd92d768814\?[^"\s]+', 'vendor/community.jpg', styles)
(site / 'styles.css').write_text(styles)
password_hash = args.admin_hash_file.read_text().strip()
if not password_hash.startswith(('$2y$', '$argon2')): raise ValueError('Expected a PHP password_hash value.')
config = (site / 'config.example.php').read_text().replace('REPLACE_WITH_PASSWORD_HASH', password_hash)
config = config.replace("'table_prefix' => 'ling_'", "'table_prefix' => '" + args.table_prefix + "'")
(site / 'config.example.php').write_text(config)

menu = json.loads(json.dumps(snapshot['menu']))
schedule = json.loads(json.dumps(snapshot['schedule']))
schedule.pop('today', None)
image_rows = []
for image in snapshot['images']:
    image_path = (args.snapshot.parent / image['file']).resolve()
    if not image_path.is_relative_to(args.snapshot.parent.resolve()): raise ValueError('Invalid image path.')
    data = image_path.read_bytes()
    if hashlib.sha256(data).hexdigest() != image['sha256']: raise ValueError('Image checksum mismatch.')
    if len(data) > 1900000: raise ValueError('Image exceeds the backend limit.')
    if image['content_type'] not in ['image/jpeg', 'image/png', 'image/webp']: raise ValueError('Unsupported image MIME type.')
    item = next(item for item in menu['items'] if int(item['id']) == int(image['id']))
    item['image'] = '/api/menu-images/' + str(int(image['id'])) + '?v=' + image['sha256'][:12]
    image_rows.append(f"INSERT INTO {args.table_prefix}images VALUES ({int(image['id'])}, '{image['content_type']}', X'{data.hex()}');")
menu['nextId'] = max([int(i['id']) for i in menu['items']] + [0]) + 1
schedule['nextBaristaId'] = max([int(i['id']) for i in schedule['baristas']] + [0]) + 1
schedule['nextShiftId'] = max([int(i['id']) for i in schedule['shifts']] + [0]) + 1
schema = (here / 'schema.sql').read_text().replace('PREFIX_', args.table_prefix)
sql = [schema, 'START TRANSACTION;']
for key, data in [('menu', menu), ('schedule', schedule)]:
    encoded = json.dumps(data, ensure_ascii=False, separators=(',', ':')).encode().hex()
    sql.append(f"INSERT INTO {args.table_prefix}state VALUES ('{key}', CONVERT(X'{encoded}' USING utf8mb4));")
sql += image_rows + ['COMMIT;']
(args.output / 'IMPORT-IN-MYSQL.sql').write_text('\n'.join(sql) + '\n')
shutil.copyfile(here / 'DEPLOYMENT.md', args.output / 'START-HERE-部署说明.md')
shutil.copyfile(repo / 'COPYRIGHT.md', args.output / 'COPYRIGHT.md')
report = {'source': snapshot['source'], 'exported_at': snapshot['exported_at'],
          'built_at': datetime.now(timezone.utc).isoformat(),
          'items': len(menu['items']), 'images': len(image_rows), 'baristas': len(schedule['baristas']),
          'shifts': len(schedule['shifts']), 'overrides': len(schedule['overrides']),
          'source_snapshot_sha256': hashlib.sha256(args.snapshot.read_bytes()).hexdigest(),
          'data_scope': 'Full admin schedule, current menu and referenced images; no old sessions or deleted image blobs.',
          'files': {str(p.relative_to(args.output)): hashlib.sha256(p.read_bytes()).hexdigest() for p in args.output.rglob('*') if p.is_file()}}
(args.output / 'MANIFEST.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
archive = args.output.with_suffix('.zip')
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    for path in args.output.rglob('*'):
        if path.is_file(): z.write(path, args.output.name + '/' + str(path.relative_to(args.output)))
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
print(json.dumps({'zip': str(archive), 'items': report['items'], 'images': report['images'], 'shifts': report['shifts'], 'bytes': archive.stat().st_size}))
