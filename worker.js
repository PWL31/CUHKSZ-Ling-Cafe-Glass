const encoder = new TextEncoder();
const decoder = new TextDecoder();

const DEMO_USERNAME = 'Trent';
const DEMO_PASSWORD_SHA256 = '6d19ca72de1fe7973e5a763cdbaf47af34674d4f45a8a2cacd881b751d680a4f';
const DEMO_SESSION_SECRET = 'ling-cafe-glass-demo-session-secret-2026-change-before-production';
const COOKIE_NAME = 'ling_admin_session';
const SESSION_SECONDS = 60 * 60 * 8;

const ADMIN_UI_POLISH = `<style id="admin-ui-polish">
  .admin-popular-toggle{
    border-radius:999px!important;
    min-height:52px!important;
    padding:6px 14px!important;
    gap:11px!important;
    justify-content:flex-start!important;
    overflow:hidden;
    cursor:pointer;
  }
  .admin-popular-toggle input[type="checkbox"]{
    -webkit-appearance:none!important;
    appearance:none!important;
    width:44px!important;
    min-width:44px!important;
    height:26px!important;
    margin:0!important;
    padding:0!important;
    border:1px solid rgba(92,63,47,.18)!important;
    border-radius:999px!important;
    background:
      radial-gradient(circle at 12px 50%,rgba(255,255,255,.98) 0 8px,transparent 9px),
      rgba(92,63,47,.14)!important;
    box-shadow:inset 0 1px 3px rgba(62,36,23,.10),0 1px 0 rgba(255,255,255,.38)!important;
    transition:background .18s ease,border-color .18s ease,box-shadow .18s ease!important;
    cursor:pointer;
  }
  .admin-popular-toggle input[type="checkbox"]:checked{
    border-color:rgba(10,186,181,.38)!important;
    background:
      radial-gradient(circle at calc(100% - 12px) 50%,rgba(255,255,255,.98) 0 8px,transparent 9px),
      var(--accent)!important;
    box-shadow:inset 0 1px 2px rgba(0,0,0,.08),0 5px 14px rgba(10,186,181,.16)!important;
  }
  .admin-popular-toggle input[type="checkbox"]:focus-visible{
    outline:2px solid rgba(10,186,181,.42)!important;
    outline-offset:2px;
  }
  @media(max-width:760px),(orientation:portrait){
    .admin-popular-toggle{
      width:100%;
      min-width:0;
      min-height:50px!important;
      padding:6px 12px!important;
    }
  }
</style>`;

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

  const html = await response.text();
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  return new Response(
    html.includes('</head>') ? html.replace('</head>', `${ADMIN_UI_POLISH}</head>`) : html,
    { status: response.status, statusText: response.statusText, headers }
  );
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
