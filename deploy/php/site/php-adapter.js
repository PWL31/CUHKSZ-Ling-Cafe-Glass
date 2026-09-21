/* Copyright (c) 2026 Trent (PWL31). PHP deployment adapter; no rewrite rules required. */
(() => {
  const base = new URL('./', document.currentScript.src);
  const apiURL = path => {
    const original = new URL(path, location.origin);
    const result = new URL('api.php', base);
    result.searchParams.set('route', original.pathname.replace(/^\/api/, ''));
    original.searchParams.forEach((value, key) => {
      if (key !== 'route' && key !== '_method') result.searchParams.append(key, value);
    });
    return result;
  };
  window.lingFetch = (path, init = {}) => {
    if (typeof path !== 'string' || !path.startsWith('/api/')) return fetch(path, init);
    const url = apiURL(path);
    const method = (init.method || 'GET').toUpperCase();
    const headers = new Headers(init.headers);
    headers.set('X-Ling-Request', '1');
    // Shared hosting often permits only GET/POST. Preserve the API's logical method.
    if (method === 'PUT' || method === 'DELETE') url.searchParams.set('_method', method);
    return fetch(url, {...init, method: ['PUT', 'DELETE'].includes(method) ? 'POST' : method,
      headers, credentials: 'same-origin'});
  };
})();
