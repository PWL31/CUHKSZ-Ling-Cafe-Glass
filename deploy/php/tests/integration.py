#!/usr/bin/env python3
"""Exercise the real PHP/MySQL deployment against an ISOLATED fixture database.

Never point this at production: the test adds/edits/deletes fixture records.
Run after importing a fixture package into an isolated local MySQL database.
"""
import argparse, http.cookiejar, json, os, pathlib, urllib.error, urllib.parse, urllib.request
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

p = argparse.ArgumentParser()
p.add_argument('--base', required=True)
p.add_argument('--image', type=pathlib.Path, required=True)
args = p.parse_args()
if urllib.parse.urlparse(args.base).hostname not in ('localhost', '127.0.0.1'):
    p.error('Tests are restricted to a local isolated fixture.')
cookie = http.cookiejar.CookieJar()
client = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cookie))
count = 0
def request(route, method='GET', data=None, expected=200, headers=None, use_header=True):
    global count
    url = args.base.rstrip('/') + '/api.php?route=' + urllib.parse.quote(route, safe='/')
    if method in ('PUT', 'DELETE'):
        url += '&_method=' + method; method = 'POST'
    h = {'X-Ling-Request': '1'} if use_header else {}
    if headers: h.update(headers)
    if isinstance(data, (dict, list)):
        data = json.dumps(data, ensure_ascii=False).encode(); h['Content-Type'] = 'application/json'
    if method == 'POST' and data is None: data = b'{}'; h['Content-Type'] = 'application/json'
    req = urllib.request.Request(url, data=data, headers=h, method=method)
    try: response = client.open(req, timeout=10)
    except urllib.error.HTTPError as e: response = e
    body = response.read()
    assert response.status == expected, (route, response.status, expected, body[:300])
    count += 1
    return json.loads(body) if 'json' in response.headers.get('Content-Type', '') else body

health = request('/health'); assert health['backend'] == 'php-mysql'
original = request('/menu')['items']; assert len(original) == 19
assert original[0]['image'].startswith('/LING_COFFEE/site/')
assert request('/admin/session')['authenticated'] is False
request('/admin/menu', 'POST', {'cat':'Test','name':'Unauthorized'}, expected=401)
request('/admin/schedule', expected=401)
request('/admin/login', 'POST', {'username':'Trent','password':'bad'}, expected=401)
login = {'username': 'Trent', 'password': os.environ['LING_TEST_PASSWORD']}
request('/admin/login', 'POST', login, expected=403, use_header=False)
request('/admin/login', 'POST', login, expected=403, headers={'Sec-Fetch-Site':'cross-site'})
request('/admin/login', 'POST', login)
assert request('/admin/session')['authenticated']
assert list(cookie)[0].path == '/LING_COFFEE/site/'
request('/admin/menu', 'POST', {'cat':'Test','name':'Fifth popular','popular':True}, expected=409)
assert len(request('/menu')['items']) == 19
new = request('/admin/menu', 'POST', {'cat':'测试分类','name':'测试咖啡 ☕','desc':"Oat's <test>",'amount':12.5}, expected=201)['item']
route = '/admin/menu/' + str(new['id'])
updated = request(route, 'PUT', {'amount':18,'available':False})['item']
assert updated['name'] == new['name'] and updated['amount'] == 18 and not updated['available']
request(route, 'PUT', {'name':''}, expected=400)
request(route+'/image', 'PUT', b'<?php echo "bad"; ?>', expected=415, headers={'Content-Type':'image/jpeg'})
image = args.image.read_bytes()
uploaded = request(route+'/image', 'PUT', image, headers={'Content-Type':'image/webp'})
assert uploaded['item']['image'].startswith('/LING_COFFEE/site/api.php?route=/menu-images/')
assert request('/menu-images/'+str(new['id'])) == image
request(route, 'DELETE')
request('/menu-images/'+str(new['id']), expected=404)
assert request('/menu')['items'] == original

schedule = request('/admin/schedule')
public = request('/schedule')
assert len(public['baristas']) < len(schedule['baristas']) # archived profiles remain in admin/history
barista = request('/admin/schedule/baristas', 'POST', {'name':'测试咖啡师','bio':'喜欢燕麦奶','color':'#ABCDEF'}, expected=201)['barista']
assert barista['color'] == '#abcdef'
request('/admin/schedule/baristas', 'POST', {'name':'测试咖啡师'}, expected=409)
bp = '/admin/schedule/baristas/'+str(barista['id'])
request(bp, 'PUT', {'color':'red'}, expected=400)
request(bp, 'PUT', {'bio':'欢迎光临'})
future = (datetime.now(ZoneInfo('Asia/Shanghai')) + timedelta(days=40)).date().isoformat()
day = '/admin/schedule/day/' + future
request(day, 'PUT', {'mode':'custom','open':'10:00','close':'20:00'})
payload = {'date':future,'baristaId':barista['id'],'start':'11:00','end':'13:00'}
shift = request('/admin/schedule/shifts', 'POST', payload, expected=201)['shift']
request('/admin/schedule/shifts', 'POST', {**payload,'start':'12:00'}, expected=409)
request('/admin/schedule/shifts', 'POST', {**payload,'start':'09:00','end':'10:00'}, expected=409)
request('/admin/schedule/shifts', 'POST', {**payload,'date':'2020-01-01'}, expected=409)
request('/admin/schedule/day/2026-02-30', 'PUT', {'mode':'closed'}, expected=400)
request(day, 'PUT', {'mode':'closed'}, expected=409)
weekly = {day:{'open':'09:00','close':'22:00','closed':False} for day in ['mon','tue','wed','thu','fri','sat','sun']}
old_day = next(iter(schedule['weekly']))
request('/admin/schedule/weekly', 'PUT', {'weekly':weekly})
assert request('/admin/schedule')['overrides'] # historical hours frozen
sp = '/admin/schedule/shifts/'+str(shift['id'])
request(sp, 'PUT', {'end':'14:00'})
request(bp, 'DELETE')
assert any(x['id']==shift['id'] for x in request('/admin/schedule')['shifts'])
request('/admin/schedule/shifts', 'POST', {**payload,'start':'15:00','end':'16:00'}, expected=409)
request(sp, 'DELETE')
request(day, 'PUT', {'mode':'default'})

request('/admin/logout', 'POST')
assert not request('/admin/session')['authenticated']
request(route, 'PUT', {'amount':10}, expected=401)
request('/admin/login', 'POST', login)
assert request('/menu')['items'] == original # persisted across logout/login, not browser-local
request('/admin/logout', 'POST')
print(json.dumps({'checks':count, 'result':'passed', 'backend':'real PHP + MySQL', 'scope':'isolated local fixtures only'}))
