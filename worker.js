const encoder = new TextEncoder();
const decoder = new TextDecoder();

const DEMO_USERNAME = 'Trent';
const DEMO_PASSWORD_SHA256 = '6d19ca72de1fe7973e5a763cdbaf47af34674d4f45a8a2cacd881b751d680a4f';
const DEMO_SESSION_SECRET = 'ling-cafe-glass-demo-session-secret-2026-change-before-production';
const COOKIE_NAME = 'ling_admin_session';
const SESSION_SECONDS = 60 * 60 * 8;

const ADMIN_UI_POLISH = `<style id="admin-ui-polish">
  .admin-popular-toggle{
    border:0!important;
    background:transparent!important;
    border-radius:0!important;
    min-height:42px!important;
    width:auto!important;
    max-width:100%!important;
    padding:0!important;
    gap:10px!important;
    display:inline-flex!important;
    align-items:center!important;
    justify-content:flex-start!important;
    overflow:visible!important;
    cursor:pointer;
    color:var(--muted)!important;
    font-size:12px!important;
    white-space:nowrap;
  }
  .admin-popular-toggle input[type="checkbox"]{
    position:absolute!important;
    opacity:0!important;
    pointer-events:none!important;
    width:1px!important;
    height:1px!important;
    margin:0!important;
  }
  .admin-popular-toggle::before{
    content:""!important;
    position:static!important;
    width:34px!important;
    min-width:34px!important;
    height:34px!important;
    display:inline-flex!important;
    align-items:center!important;
    justify-content:center!important;
    transform:none!important;
    border-radius:50%!important;
    border:1px solid var(--line-soft)!important;
    background:rgba(255,255,255,.42)!important;
    box-shadow:inset 0 1px 0 rgba(255,255,255,.55),0 2px 8px rgba(62,36,23,.08)!important;
    color:#fff!important;
    font:800 21px/1 var(--sans)!important;
    transition:background .16s ease,border-color .16s ease,opacity .16s ease!important;
  }
  .admin-popular-toggle::after{
    content:none!important;
  }
  .admin-popular-toggle:has(input:checked)::before{
    content:"✓"!important;
    background:var(--accent)!important;
    border-color:rgba(10,186,181,.72)!important;
    box-shadow:0 5px 14px rgba(10,186,181,.18),inset 0 1px 0 rgba(255,255,255,.40)!important;
  }
  .admin-popular-toggle:has(input:focus-visible)::before{
    outline:2px solid rgba(10,186,181,.38)!important;
    outline-offset:2px!important;
  }
  .admin-popular-toggle:has(input:disabled){
    opacity:.38!important;
    cursor:not-allowed!important;
  }
  @media(max-width:760px),(orientation:portrait){
    .admin-popular-toggle{
      grid-column:1/-1!important;
      justify-self:end!important;
      width:auto!important;
      min-width:0!important;
      min-height:42px!important;
      padding:0!important;
    }
  }
</style>`;

const ADMIN_POPULAR_LIMIT_SCRIPT = `<script id="admin-popular-limit">
(() => {
  const selector = '[data-admin-field="popular"]';

  function syncPopularLimit() {
    const boxes = [...document.querySelectorAll(selector)];
    if (!boxes.length) return;
    const checked = boxes.filter(box => box.checked);
    const atLimit = checked.length >= 4;
    boxes.forEach(box => {
      box.disabled = atLimit && !box.checked;
      const label = box.closest('.admin-popular-toggle');
      if (label) label.title = box.disabled ? 'Maximum of four Popular drinks' : 'Show in Popular drinks';
    });
  }

  document.addEventListener('change', event => {
    const box = event.target.closest?.(selector);
    if (!box) return;
    const checked = [...document.querySelectorAll(selector)].filter(item => item.checked);
    if (checked.length > 4) {
      box.checked = false;
      if (typeof window.toast === 'function') window.toast('Popular drinks are limited to four');
    }
    syncPopularLimit();
  }, true);

  const observer = new MutationObserver(syncPopularLimit);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncPopularLimit, { once: true });
  } else {
    syncPopularLimit();
  }
})();
<\/script>`;

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...extraHeaders,
    },
  });
}

function bytesToHex(buffer) {
  return [...new Uint8Array(buffer)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

async function sha256Hex(value) {
  return bytesToHex(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
}

function base64UrlEncode(value) {
  const bytes = typeof value === 'string' ? encoder.encode(value) : new Uint8Array(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(value) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
  return decoder.decode(bytes);
}

async function hmac(value, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return base64UrlEncode(await crypto.subtle.sign('HMAC', key, encoder.encode(value)));
}

async function makeSession(username, env) {
  const payload = base64UrlEncode(JSON.stringify({
    username,
    exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS,
  }));
  const signature = await hmac(payload, env.SESSION_SECRET || DEMO_SESSION_SECRET);
  return `${payload}.${signature}`;
}

async function verifySession(token, env) {
  if (!token || !token.includes('.')) return null;
  const [payload, signature] = token.split('.');
  const expected = await hmac(payload, env.SESSION_SECRET || DEMO_SESSION_SECRET);
  if (signature !== expected) return null;
  try {
    const data = JSON.parse(base64UrlDecode(payload));
    if (!data.username || !data.exp || data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch {
    return null;
  }
}

function getCookie(request, name) {
  const cookie = request.headers.get('cookie') || '';
  const pair = cookie.split(';').map(part => part.trim()).find(part => part.startsWith(`${name}=`));
  return pair ? decodeURIComponent(pair.slice(name.length + 1)) : '';
}

function sessionCookie(token) {
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_SECONDS}`;
}

function expiredCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

async function login(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }

  const username = String(body.username || '').trim();
  const password = String(body.password || '');
  const expectedUsername = env.ADMIN_USERNAME || DEMO_USERNAME;
  const expectedHash = env.ADMIN_PASSWORD_HASH || DEMO_PASSWORD_SHA256;
  const passwordHash = await sha256Hex(password);

  if (username !== expectedUsername || passwordHash !== expectedHash) {
    return json({ error: 'Invalid username or password.' }, 401);
  }

  const token = await makeSession(username, env);
  return json(
    { ok: true, authenticated: true, username },
    200,
    { 'set-cookie': sessionCookie(token) }
  );
}

async function session(request, env) {
  const data = await verifySession(getCookie(request, COOKIE_NAME), env);
  if (!data) return json({ authenticated: false }, 200);
  return json({ authenticated: true, username: data.username }, 200);
}

function logout() {
  return json({ ok: true }, 200, { 'set-cookie': expiredCookie() });
}

async function staticAsset(request, env) {
  const response = await env.ASSETS.fetch(request);
  const type = response.headers.get('content-type') || '';
  if (!type.includes('text/html')) return response;

  let html = await response.text();
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  if (html.includes('</head>')) html = html.replace('</head>', `${ADMIN_UI_POLISH}</head>`);
  if (html.includes('</body>')) html = html.replace('</body>', `${ADMIN_POPULAR_LIMIT_SCRIPT}<script src="/support.js" defer></script></body>`);
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/admin/login' && request.method === 'POST') {
      return login(request, env);
    }
    if (url.pathname === '/api/admin/session' && request.method === 'GET') {
      return session(request, env);
    }
    if (url.pathname === '/api/admin/logout' && request.method === 'POST') {
      return logout();
    }
    if (url.pathname.startsWith('/api/')) {
      return json({ error: 'Not found.' }, 404);
    }

    if (!env.ASSETS) {
      return new Response('Static assets binding is not configured.', { status: 500 });
    }
    return staticAsset(request, env);
  },
};
