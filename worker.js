import { DurableObject } from "cloudflare:workers";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const DEMO_USERNAME = 'Trent';
const DEMO_PASSWORD_SHA256 = '6d19ca72de1fe7973e5a763cdbaf47af34674d4f45a8a2cacd881b751d680a4f';
const DEMO_SESSION_SECRET = 'ling-cafe-glass-demo-session-secret-2026-change-before-production';
const COOKIE_NAME = 'ling_admin_session';
const SESSION_SECONDS = 60 * 60 * 8;
const MENU_STORE_NAME = 'ling-cafe-menu';
const MENU_CATALOG_VERSION = 2;

const SEED_MENU = [
  {id:1, cat:'Milk Coffee', name:'Caffè Latte', desc:'Espresso · steamed milk · hot / iced', amount:0, available:true, popular:true, image:'/menu-sprite.jpg'},
  {id:2, cat:'Milk Coffee', name:'Cappuccino', desc:'Espresso · steamed milk · milk foam', amount:0, available:true, popular:false, image:'/menu-sprite.jpg'},
  {id:3, cat:'Milk Coffee', name:'Latte Macchiato', desc:'Layered milk · espresso', amount:0, available:true, popular:false, image:'/menu-sprite.jpg'},
  {id:4, cat:'Milk Coffee', name:'Espresso Macchiato', desc:'Espresso · touch of milk foam', amount:0, available:true, popular:false, image:'/menu-sprite.jpg'},
  {id:5, cat:'Milk Coffee', name:'Flat White', desc:'Espresso · silky microfoam', amount:0, available:true, popular:false, image:'/menu-sprite.jpg'},
  {id:6, cat:'Black Coffee', name:'Espresso', desc:'Straight espresso', amount:0, available:true, popular:false, image:'/menu-sprite.jpg'},
  {id:7, cat:'Black Coffee', name:'Americano', desc:'Espresso · water · hot / iced', amount:0, available:true, popular:true, image:'/menu-sprite.jpg'},
  {id:8, cat:'Black Coffee', name:'Lungo', desc:'Long-pulled espresso', amount:0, available:true, popular:false, image:'/menu-sprite.jpg'},
  {id:9, cat:'Pour-over', name:'Single-Origin Pour-over', desc:'SOE beans · hand brewed', amount:0, available:true, popular:true, image:'/menu-sprite.jpg'},
  {id:10, cat:'Specials', name:'Custom Tea-Coffee', desc:'Tea · coffee · made to order', amount:0, available:true, popular:false, image:'/menu-sprite.jpg'},
  {id:11, cat:'Specials', name:'House Coffee Special', desc:'Ling Cafe house-style coffee creation', amount:0, available:true, popular:false, image:'/menu-sprite.jpg'},
  {id:12, cat:'Non-coffee', name:'Hot Milk', desc:'Steamed milk', amount:0, available:true, popular:false, image:'/menu-sprite.jpg'},
  {id:13, cat:'Non-coffee', name:'Pure Tea', desc:'Freshly brewed tea', amount:0, available:true, popular:false, image:'/menu-sprite.jpg'},
  {id:14, cat:'Non-coffee', name:'Monk Fruit Tea', desc:'Monk fruit infusion', amount:0, available:true, popular:false, image:'/menu-sprite.jpg'},
  {id:15, cat:'Non-coffee', name:'Hand-Shaken Lemon Black Tea', desc:'Lemon · black tea · hand shaken', amount:0, available:true, popular:false, image:'/menu-sprite.jpg'},
  {id:16, cat:'Non-coffee', name:'Jasmine Iced Lemon Tea', desc:'Jasmine tea · lemon · iced', amount:0, available:true, popular:false, image:'/menu-sprite.jpg'},
  {id:17, cat:'Non-coffee', name:'Matcha Latte', desc:'Matcha · milk', amount:0, available:true, popular:true, image:'/menu-sprite.jpg'},
  {id:18, cat:'Non-coffee', name:'Matcha Milk Tea', desc:'Matcha · milk tea', amount:0, available:true, popular:false, image:'/menu-sprite.jpg'},
  {id:19, cat:'Non-coffee', name:'Bottled Cold Brew Tea', desc:'Slow-steeped chilled tea', amount:0, available:true, popular:false, image:'/menu-sprite.jpg'}
];

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

function cleanText(value, maxLength) {
  return String(value ?? '').trim().slice(0, maxLength);
}

function normalizeMenuInput(body, current = null) {
  const next = {
    cat: cleanText(body.cat ?? current?.cat, 40),
    name: cleanText(body.name ?? current?.name, 80),
    desc: cleanText(body.desc ?? current?.desc, 180),
    amount: Math.max(0, Math.min(9999, Number(body.amount ?? current?.amount ?? 0) || 0)),
    available: body.available === undefined ? Boolean(current?.available ?? true) : Boolean(body.available),
    popular: body.popular === undefined ? Boolean(current?.popular ?? false) : Boolean(body.popular),
  };
  if (!next.cat) throw new Error('Category is required.');
  if (!next.name) throw new Error('Name is required.');
  return next;
}

export class MenuStore extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      const version = await ctx.storage.get('menu_catalog_version');
      const existing = await ctx.storage.get('menu');
      if (version !== MENU_CATALOG_VERSION || !Array.isArray(existing) || existing.length === 0) {
        await ctx.storage.put('menu', SEED_MENU.map(item => ({...item})));
        await ctx.storage.put('menu_catalog_version', MENU_CATALOG_VERSION);
      }
    });
  }

  async readMenu() {
    const items = await this.ctx.storage.get('menu');
    return Array.isArray(items) ? items : [];
  }

  async writeMenu(items) {
    await this.ctx.storage.put('menu', items);
  }

  popularCount(items) {
    return items.filter(item => item.popular).length;
  }

  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method.toUpperCase();

    if (path === '/menu' && method === 'GET') {
      return json({items: await this.readMenu()});
    }

    if (path === '/menu' && method === 'POST') {
      let body;
      try { body = await request.json(); } catch { return json({error:'Invalid request body.'},400); }
      let clean;
      try { clean = normalizeMenuInput(body); } catch (err) { return json({error:err.message},400); }
      const items = await this.readMenu();
      const id = items.reduce((max,item)=>Math.max(max,Number(item.id)||0),0) + 1;
      const next = { id, ...clean, image:'/menu-placeholder.svg' };
      const candidate = [...items, next];
      if (this.popularCount(candidate) > 4) return json({error:'Popular drinks are limited to four.'},409);
      await this.writeMenu(candidate);
      return json({item:next, items:candidate},201);
    }

    const itemMatch = path.match(/^\/menu\/(\d+)$/);
    if (itemMatch && method === 'PUT') {
      const id = Number(itemMatch[1]);
      let body;
      try { body = await request.json(); } catch { return json({error:'Invalid request body.'},400); }
      const items = await this.readMenu();
      const index = items.findIndex(item => Number(item.id) === id);
      if (index < 0) return json({error:'Menu item not found.'},404);
      let clean;
      try { clean = normalizeMenuInput(body, items[index]); } catch (err) { return json({error:err.message},400); }
      const updated = {...items[index], ...clean};
      const candidate = items.map((item,i)=>i===index?updated:item);
      if (this.popularCount(candidate) > 4) return json({error:'Popular drinks are limited to four.'},409);
      await this.writeMenu(candidate);
      return json({item:updated, items:candidate});
    }

    if (itemMatch && method === 'DELETE') {
      const id = Number(itemMatch[1]);
      const items = await this.readMenu();
      if (!items.some(item => Number(item.id) === id)) return json({error:'Menu item not found.'},404);
      const next = items.filter(item => Number(item.id) !== id);
      await this.writeMenu(next);
      return json({ok:true, items:next});
    }

    const imageMatch = path.match(/^\/menu\/(\d+)\/image$/);
    if (imageMatch && method === 'PUT') {
      const id = Number(imageMatch[1]);
      let body;
      try { body = await request.json(); } catch { return json({error:'Invalid request body.'},400); }
      const image = cleanText(body.image, 1200);
      if (!image) return json({error:'Image path or URL is required.'},400);
      const items = await this.readMenu();
      const index = items.findIndex(item => Number(item.id) === id);
      if (index < 0) return json({error:'Menu item not found.'},404);
      const updated = {...items[index], image};
      const next = items.map((item,i)=>i===index?updated:item);
      await this.writeMenu(next);
      return json({item:updated, items:next});
    }

    return json({error:'Not found.'},404);
  }
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
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
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
async function requireAdmin(request, env) {
  return verifySession(getCookie(request, COOKIE_NAME), env);
}

async function login(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({error:'Invalid request body.'},400); }
  const username = String(body.username || '').trim();
  const password = String(body.password || '');
  const expectedUsername = env.ADMIN_USERNAME || DEMO_USERNAME;
  const expectedHash = env.ADMIN_PASSWORD_HASH || DEMO_PASSWORD_SHA256;
  if (username !== expectedUsername || await sha256Hex(password) !== expectedHash) {
    return json({error:'Invalid username or password.'},401);
  }
  const token = await makeSession(username, env);
  return json({ok:true, authenticated:true, username},200,{'set-cookie':sessionCookie(token)});
}

async function session(request, env) {
  const data = await requireAdmin(request, env);
  return json(data ? {authenticated:true, username:data.username} : {authenticated:false});
}
function logout() {
  return json({ok:true},200,{'set-cookie':expiredCookie()});
}

function menuStore(env) {
  return env.MENU_STORE.getByName(MENU_STORE_NAME);
}

async function forwardMenu(request, env, internalPath) {
  if (!env.MENU_STORE) return json({error:'Menu storage is not configured.'},500);
  const target = `https://menu.internal${internalPath}`;
  const method = request.method.toUpperCase();
  const init = { method, headers: new Headers(request.headers) };
  if (method !== 'GET' && method !== 'HEAD') init.body = await request.arrayBuffer();
  return menuStore(env).fetch(new Request(target, init));
}

async function health(env) {
  const result = { ok:true, worker:true, assets:Boolean(env.ASSETS), menuStore:Boolean(env.MENU_STORE) };
  if (env.MENU_STORE) {
    try {
      const response = await menuStore(env).fetch('https://menu.internal/menu');
      result.menuBackend = response.ok;
    } catch (error) {
      result.menuBackend = false;
      result.menuError = String(error?.message || error);
    }
  }
  return json(result, result.menuBackend === false ? 503 : 200);
}

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      if (url.pathname === '/api/health' && request.method === 'GET') return health(env);
      if (url.pathname === '/api/admin/login' && request.method === 'POST') return login(request, env);
      if (url.pathname === '/api/admin/session' && request.method === 'GET') return session(request, env);
      if (url.pathname === '/api/admin/logout' && request.method === 'POST') return logout();
      if (url.pathname === '/api/menu' && request.method === 'GET') return forwardMenu(request, env, '/menu');

      const adminMenuMatch = url.pathname.match(/^\/api\/admin\/menu(?:\/(\d+))?(\/image)?$/);
      if (adminMenuMatch) {
        const admin = await requireAdmin(request, env);
        if (!admin) return json({error:'Authentication required.'},401);
        const id = adminMenuMatch[1];
        const imageSuffix = adminMenuMatch[2] || '';
        return forwardMenu(request, env, id ? `/menu/${id}${imageSuffix}` : '/menu');
      }

      if (url.pathname.startsWith('/api/')) return json({error:'Not found.'},404);
      return env.ASSETS ? env.ASSETS.fetch(request) : new Response('Not found.',{status:404});
    } catch (error) {
      console.error('Worker request failed', error);
      return json({error:'Worker runtime error.', detail:String(error?.message || error)},500);
    }
  },
};