#!/usr/bin/env python3
"""Export the current menu, full admin schedule, and every referenced local photo.

Read-only apart from obtaining a normal admin session. Output is private data:
do not commit it. curl uses the operating system certificate store on macOS.
"""
import argparse, getpass, hashlib, json, os, pathlib, subprocess, tempfile
from datetime import datetime, timezone
from urllib.parse import urljoin, urlparse

parser = argparse.ArgumentParser()
parser.add_argument('--origin', required=True)
parser.add_argument('--output', type=pathlib.Path, required=True)
args = parser.parse_args()
origin = args.origin.rstrip('/')
if urlparse(origin).scheme != 'https' or urlparse(origin).path not in ('', '/'):
    parser.error('Use the HTTPS origin of the original Worker website.')
args.output.mkdir(parents=True, exist_ok=False)
os.chmod(args.output, 0o700)
username = os.environ.get('LING_EXPORT_USERNAME') or input('Admin username: ')
password = os.environ.get('LING_EXPORT_PASSWORD') or getpass.getpass('Admin password: ')

with tempfile.TemporaryDirectory() as tmp:
    cookie = pathlib.Path(tmp) / 'session.cookies'
    def request(path, body=None):
        url = urljoin(origin + '/', path)
        if urlparse(url).scheme != 'https' or urlparse(url).netloc != urlparse(origin).netloc:
            raise ValueError('Refusing to send the session to another origin.')
        cmd = ['curl', '--fail-with-body', '-sS', '--max-time', '40', '-b', str(cookie), '-c', str(cookie), url]
        payload = None
        if body is not None:
            cmd += ['-H', 'Content-Type: application/json', '--data-binary', '@-']
            payload = json.dumps(body).encode()
        result = subprocess.run(cmd, input=payload, capture_output=True)
        if result.returncode:
            raise RuntimeError(f'Request failed for {path}: curl exit {result.returncode}')
        return result.stdout
    auth = json.loads(request('/api/admin/login', {'username': username, 'password': password}))
    if not auth.get('authenticated'): raise RuntimeError('Admin login did not succeed.')
    menu = json.loads(request('/api/menu'))
    schedule = json.loads(request('/api/admin/schedule'))
    if not isinstance(menu.get('items'), list) or not isinstance(schedule.get('shifts'), list):
        raise RuntimeError('The source did not return a complete menu/schedule.')
    files, images = {}, []
    for item in menu['items']:
        image = item.get('image', '')
        if not image: continue
        image_url = urljoin(origin + '/', image)
        if urlparse(image_url).netloc != urlparse(origin).netloc:
            raise RuntimeError(f'Item {item["id"]} has an external image; inspect it before migration.')
        data = request(image)
        if data.startswith(b'\xff\xd8\xff'): kind, ext = 'image/jpeg', 'jpg'
        elif data.startswith(b'\x89PNG\r\n\x1a\n'): kind, ext = 'image/png', 'png'
        elif data[:4] == b'RIFF' and data[8:12] == b'WEBP': kind, ext = 'image/webp', 'webp'
        elif 'menu-placeholder.svg' in image or 'menu-sprite' in image:
            continue
        else: raise RuntimeError(f'Item {item["id"]}: invalid image response.')
        filename = f'images/{int(item["id"])}.{ext}'
        files[filename] = data
        images.append({'id': int(item['id']), 'file': filename, 'content_type': kind,
                       'source_path': image, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()})
    # Detect edits during export instead of silently producing a mixed snapshot.
    if menu != json.loads(request('/api/menu')) or schedule != json.loads(request('/api/admin/schedule')):
        raise RuntimeError('Source changed during export. Retry when editing has paused.')
    snapshot = {'format': 'ling-migration-v1', 'source': origin,
                'exported_at': datetime.now(timezone.utc).isoformat(),
                'menu': menu, 'schedule': schedule, 'images': images}
    for filename, data in files.items():
        target = args.output / filename; target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data); os.chmod(target, 0o600)
    path = args.output / 'snapshot.json'
    path.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2)); os.chmod(path, 0o600)
    print(json.dumps({'snapshot': str(path), 'items': len(menu['items']),
                      'baristas': len(schedule['baristas']), 'shifts': len(schedule['shifts']),
                      'overrides': len(schedule['overrides']), 'images': len(images)}, ensure_ascii=False))
