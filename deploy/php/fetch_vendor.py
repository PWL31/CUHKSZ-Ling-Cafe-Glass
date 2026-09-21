#!/usr/bin/env python3
"""Fetch pinned self-hosted frontend assets without installing dependencies."""
import argparse
import hashlib
import json
import pathlib
import shutil
import subprocess

parser = argparse.ArgumentParser()
parser.add_argument('--output', type=pathlib.Path, required=True)
args = parser.parse_args()
here = pathlib.Path(__file__).resolve().parent
sources = json.loads((here / 'vendor-sources.json').read_text())
args.output.mkdir(parents=True, exist_ok=True)
for entry in sources:
    target = args.output / entry['file']
    if not target.exists():
        partial = target.with_suffix(target.suffix + '.partial')
        subprocess.run(['curl', '--fail', '--silent', '--show-error', '--location',
                        '--proto', '=https', '--proto-redir', '=https', '--max-time', '60',
                        '--output', str(partial), entry['source']], check=True)
        if hashlib.sha256(partial.read_bytes()).hexdigest() != entry['sha256']:
            raise ValueError('Downloaded asset changed: ' + entry['file'])
        partial.rename(target)
    if hashlib.sha256(target.read_bytes()).hexdigest() != entry['sha256']:
        raise ValueError('Asset checksum mismatch: ' + entry['file'])
shutil.copyfile(here / 'fonts.css', args.output / 'fonts.css')
shutil.copyfile(here / 'vendor-sources.json', args.output / 'SOURCES.json')
print(json.dumps({'assets': len(sources), 'verified': True, 'directory': str(args.output)}))
