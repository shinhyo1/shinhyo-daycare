// Cloudflare Pages: keep the existing site and append approved Notion cards.
// Set NOTION_TOKEN as an encrypted Pages secret. Never commit its value.
// Enable only after a preview succeeds: NOTION_ENABLED=true.
// The database IDs below refer only to the two dedicated website databases.
const DATABASES = [
  { id: '406ed3f685fb80198b7bc873bea4c6f3', title: '프로그램 소식', date: '진행일', anchor: 'program-updates' },
  { id: '406ed3f685fb80169492d820b39c08c0', title: '센터 소식', date: '게시일', anchor: 'center-news' },
];
const memo = new Map();
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const plain = value => (value || []).map(x => x.plain_text ?? x.text?.content ?? '').join('');
function imageURL(value) {
  try { const u = new URL(value); return u.protocol === 'https:' ? u.href : ''; } catch { return ''; }
}
async function notion(token, path, body) {
  const response = await fetch('https://api.notion.com/v1/' + path, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: 'Bearer ' + token, 'Notion-Version': '2025-09-03', 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(2500),
  });
  if (!response.ok) throw new Error('Notion request failed');
  return response.json();
}
async function load(token, db) {
  const key = token + ':' + db.id;
  const cached = memo.get(key);
  if (cached && cached.until > Date.now()) return cached.value;
  const database = await notion(token, 'databases/' + db.id);
  if (database.data_sources?.length !== 1) throw new Error('Expected one data source');
  const result = await notion(token, 'data_sources/' + database.data_sources[0].id + '/query', {
    page_size: 12,
    filter: { property: '공개', checkbox: { equals: true } },
    sorts: [{ property: db.date, direction: 'descending' }, { timestamp: 'last_edited_time', direction: 'descending' }],
  });
  if (!Array.isArray(result.results)) throw new Error('Invalid Notion response');
  // Defence in depth: never expose unchecked or archived pages, even on an unexpected API response.
  const value = result.results.filter(p => !p.archived && !p.in_trash && p.properties?.['공개']?.checkbox === true).map(p => {
    const props = p.properties;
    const title = Object.values(props).find(x => x.type === 'title');
    const file = props['대표사진']?.files?.[0];
    return {
      title: plain(title?.title),
      summary: plain(props['요약']?.rich_text),
      date: props[db.date]?.date?.start || '',
      image: imageURL(file?.file?.url || file?.external?.url || ''),
    };
  }).filter(p => p.title);
  // Short per-isolate cache; failures are never cached and signed image URLs are refreshed.
  if (memo.size >= 8) memo.clear();
  memo.set(key, { value, until: Date.now() + 60000 });
  return value;
}
function render(db, cards) {
  if (!cards.length) return '';
  return '<section class="wrap notion-updates" id="' + db.anchor + '" aria-labelledby="' + db.anchor + '-title">' +
    '<h2 id="' + db.anchor + '-title">' + db.title + '</h2><div class="notion-cards">' + cards.map(card =>
      '<article class="notion-card">' +
      (card.image ? '<img src="' + escape(card.image) + '" alt="' + escape(card.title) + '" width="640" height="480" loading="lazy" referrerpolicy="no-referrer">' : '') +
      '<div class="notion-card-text"><h3>' + escape(card.title) + '</h3>' +
      (card.date ? '<p class="notion-date">' + escape(card.date.slice(0, 10)) + '</p>' : '') +
      (card.summary ? '<p class="notion-summary">' + escape(card.summary) + '</p>' : '') +
      '</div></article>'
    ).join('') + '</div></section>';
}
const styles = '<style>.notion-updates{padding-top:48px;padding-bottom:48px}.notion-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:24px}.notion-card{min-width:0;border:1px solid #e6e2db;border-radius:16px;overflow:hidden;background:#fff}.notion-card img{display:block;width:100%;height:auto;aspect-ratio:4/3;object-fit:cover}.notion-card-text{padding:20px}.notion-card h3{margin:0;font-size:1.2rem}.notion-date{color:#666;font-size:.9rem}.notion-summary{white-space:pre-wrap;overflow-wrap:anywhere}</style>';
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  // Static images, scripts, styles and every other route remain untouched.
  if (request.method !== 'GET' || !['/', '/index.html'].includes(url.pathname) || env.NOTION_ENABLED !== 'true' || !env.NOTION_TOKEN) return context.next();
  const original = await context.next();
  if (original.status !== 200 || !original.headers.get('content-type')?.includes('text/html')) return original;
  try {
    const groups = await Promise.all(DATABASES.map(async db => {
      try { return render(db, await load(env.NOTION_TOKEN, db)); }
      catch { console.warn('Website Notion feed unavailable: ' + db.anchor); return ''; }
    }));
    const content = groups.join('');
    if (!content) return original;
    const response = new Response(original.body, original);
    // Do not leave an old validator or edge-cached copy after an item is unpublished.
    response.headers.delete('etag');
    response.headers.delete('last-modified');
    response.headers.delete('content-length');
    response.headers.set('Cache-Control', 'no-store');
    return new HTMLRewriter().on('head', { element(el) { el.append(styles, { html: true }); } })
      .on('main', { element(el) { el.append(content, { html: true }); } }).transform(response);
  } catch {
    // Existing homepage stays available even when Notion or the feed rendering fails.
    console.warn('Website Notion rendering unavailable');
    return original;
  }
}
