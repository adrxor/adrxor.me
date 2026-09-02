const ALLOWED_ORIGIN = "https://adrxor.me";

function cors(req) {
  const origin = req.headers.get('Origin');
  return {
    "Access-Control-Allow-Origin": origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN,
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Credentials": "true",
    "Cache-Control": "no-store",
    "Vary": "Origin"
  };
}
function json(data, status = 200, req) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", ...cors(req) } });
}
function slugify(s) {
  return String(s).toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 90) || `item-${Date.now()}`;
}
function authorized(req, env) {
  const h = req.headers.get('Authorization') || '';
  if (!h.startsWith('Basic ')) return false;
  try {
    const decoded = atob(h.slice(6));
    const i = decoded.indexOf(':');
    return i > 0 && decoded.slice(0, i) === env.ADMIN_USER && decoded.slice(i + 1) === env.ADMIN_PASS;
  } catch { return false; }
}
function requireAuth(req, env) {
  if (authorized(req, env)) return null;
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { "Content-Type": "application/json", "WWW-Authenticate": 'Basic realm="adrxor admin"', ...cors(req) }
  });
}
function tags(v) { return Array.isArray(v) ? v : String(v || '').split(',').map(x => x.trim()).filter(Boolean); }

export default { async fetch(req, env) {
  const url = new URL(req.url);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors(req) });
  if (url.pathname === '/api/health') return json({ ok: true, service: 'adrxor-api', database: 'd1' }, 200, req);
  if (url.pathname === '/api/auth/check') {
    const ok = authorized(req, env);
    if (!ok) return requireAuth(req, env);
    return json({ ok: true, authenticated: true }, 200, req);
  }

  const protectedMutation = ['POST', 'PUT', 'DELETE'].includes(req.method);
  if (url.pathname.startsWith('/api/') && protectedMutation) {
    const denied = requireAuth(req, env);
    if (denied) return denied;
  }

  // ----- Research: metadata + external/static PDF URL. No R2 required. -----
  if (url.pathname === '/api/research' && req.method === 'GET') {
    const { results } = await env.DB.prepare('SELECT id,title,slug,description,tags,created_at,file_name,file_key AS file_url FROM research ORDER BY created_at DESC').all();
    return json({ items: results.map(x => ({ ...x, tags: JSON.parse(x.tags || '[]') })) }, 200, req);
  }
  if (url.pathname === '/api/research' && req.method === 'POST') {
    const b = await req.json();
    const title = String(b.title || '').trim();
    const fileUrl = String(b.file_url || '').trim();
    if (!title || !fileUrl) return json({ error: 'Title and PDF URL are required' }, 400, req);
    const slug = slugify(String(b.slug || title));
    const now = new Date().toISOString();
    try {
      await env.DB.prepare('INSERT INTO research(title,slug,description,tags,file_key,file_name,created_at) VALUES(?,?,?,?,?,?,?)')
        .bind(title, slug, String(b.description || ''), JSON.stringify(tags(b.tags)), fileUrl, String(b.file_name || fileUrl.split('/').pop() || 'research.pdf'), now).run();
    } catch { return json({ error: 'Slug already exists or database error' }, 409, req); }
    return json({ ok: true, slug }, 201, req);
  }

  // ----- Blog CRUD -----
  if (url.pathname === '/api/posts' && req.method === 'GET') {
    const { results } = await env.DB.prepare('SELECT id,title,slug,excerpt,tags,content,published,created_at,published_at FROM posts WHERE published=1 ORDER BY COALESCE(published_at,created_at) DESC').all();
    return json({ items: results.map(x => ({ ...x, published: Boolean(x.published), tags: JSON.parse(x.tags || '[]') })) }, 200, req);
  }
  if (url.pathname === '/api/posts/all' && req.method === 'GET') {
    const denied = requireAuth(req, env); if (denied) return denied;
    const { results } = await env.DB.prepare('SELECT id,title,slug,excerpt,tags,content,published,created_at,published_at FROM posts ORDER BY created_at DESC').all();
    return json({ items: results.map(x => ({ ...x, published: Boolean(x.published), tags: JSON.parse(x.tags || '[]') })) }, 200, req);
  }
  const postMatch = url.pathname.match(/^\/api\/posts\/(\d+)$/);
  if (postMatch && req.method === 'GET') {
    const { results } = await env.DB.prepare('SELECT id,title,slug,excerpt,tags,content,published,created_at,published_at FROM posts WHERE id=?').bind(postMatch[1]).all();
    if (!results.length) return json({ error: 'Post not found' }, 404, req);
    const x = results[0]; return json({ item: { ...x, published: Boolean(x.published), tags: JSON.parse(x.tags || '[]') } }, 200, req);
  }
  if (url.pathname === '/api/posts' && req.method === 'POST') {
    const b = await req.json();
    const title = String(b.title || '').trim(), content = String(b.content || '').trim();
    if (!title || !content) return json({ error: 'Title and content required' }, 400, req);
    const slug = slugify(String(b.slug || title)), now = new Date().toISOString(), pub = b.published ? 1 : 0;
    try {
      await env.DB.prepare('INSERT INTO posts(title,slug,excerpt,tags,content,published,created_at,published_at) VALUES(?,?,?,?,?,?,?,?)')
        .bind(title, slug, String(b.excerpt || ''), JSON.stringify(tags(b.tags)), content, pub, now, pub ? now : null).run();
    } catch { return json({ error: 'Slug already exists or database error' }, 409, req); }
    return json({ ok: true, slug }, 201, req);
  }
  if (postMatch && req.method === 'PUT') {
    const id = postMatch[1], b = await req.json();
    const title = String(b.title || '').trim(), content = String(b.content || '').trim();
    if (!title || !content) return json({ error: 'Title and content required' }, 400, req);
    const slug = slugify(String(b.slug || title)), pub = b.published ? 1 : 0;
    const existing = await env.DB.prepare('SELECT published_at FROM posts WHERE id=?').bind(id).first();
    if (!existing) return json({ error: 'Post not found' }, 404, req);
    const publishedAt = pub ? (existing.published_at || new Date().toISOString()) : null;
    try {
      await env.DB.prepare('UPDATE posts SET title=?,slug=?,excerpt=?,tags=?,content=?,published=?,published_at=? WHERE id=?')
        .bind(title, slug, String(b.excerpt || ''), JSON.stringify(tags(b.tags)), content, pub, publishedAt, id).run();
    } catch { return json({ error: 'Slug already exists or database error' }, 409, req); }
    return json({ ok: true }, 200, req);
  }
  if (postMatch && req.method === 'DELETE') {
    const result = await env.DB.prepare('DELETE FROM posts WHERE id=?').bind(postMatch[1]).run();
    if (!result.meta?.changes) return json({ error: 'Post not found' }, 404, req);
    return json({ ok: true }, 200, req);
  }

  // ----- Podcast metadata. Audio URL can point to any static/CDN host. -----
  if (url.pathname === '/api/podcast' && req.method === 'GET') {
    const { results } = await env.DB.prepare('SELECT id,title,description,episode,file_key AS file_url,file_name,created_at FROM podcast ORDER BY created_at DESC').all();
    return json({ items: results }, 200, req);
  }
  if (url.pathname === '/api/podcast' && req.method === 'POST') {
    const b = await req.json();
    const title = String(b.title || '').trim(), fileUrl = String(b.file_url || '').trim();
    if (!title || !fileUrl) return json({ error: 'Title and audio URL are required' }, 400, req);
    await env.DB.prepare('INSERT INTO podcast(title,description,episode,file_key,file_name,created_at) VALUES(?,?,?,?,?,?)')
      .bind(title, String(b.description || ''), String(b.episode || ''), fileUrl, String(b.file_name || fileUrl.split('/').pop() || 'episode'), new Date().toISOString()).run();
    return json({ ok: true }, 201, req);
  }
  if (url.pathname.startsWith('/api/podcast/') && req.method === 'DELETE') {
    const id = url.pathname.split('/').pop();
    await env.DB.prepare('DELETE FROM podcast WHERE id=?').bind(id).run();
    return json({ ok: true }, 200, req);
  }

  return json({ error: 'Not found' }, 404, req);
} };
