const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Editor-Password',
};

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

function checkAuth(request, env) {
  const password = request.headers.get('X-Editor-Password');
  return env.EDITOR_PASSWORD && password === env.EDITOR_PASSWORD;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    if (url.pathname === '/api/fetch' && request.method === 'GET') {
      const state = await env.PORTFOLIO_KV.get('state');
      return new Response(state || 'null', {
        headers: { 'Content-Type': 'application/json', ...CORS },
      });
    }

    if (url.pathname === '/api/save' && request.method === 'POST') {
      if (!checkAuth(request, env)) return json({ error: 'Unauthorized' }, 401);
      const body = await request.json();
      if (!body || !body.state) return json({ error: 'No state in body' }, 400);
      await env.PORTFOLIO_KV.put('state', JSON.stringify(body.state));
      return json({ ok: true, savedAt: Date.now() });
    }

    if (url.pathname === '/api/reset' && request.method === 'POST') {
      if (!checkAuth(request, env)) return json({ error: 'Unauthorized' }, 401);
      await env.PORTFOLIO_KV.delete('state');
      return json({ ok: true });
    }

    return json({ error: 'Not found' }, 404);
  },
};
