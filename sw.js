// 【V101】タイムカードの Service Worker
// 目的: リロード（や起動）のたびに、ブラウザキャッシュに頼らず必ずネットワークから最新の index.html を取得する。
// 通信できないときだけ、最後に成功したコピー(last-good)で開く＝オフラインでも起動できる。
// HTML(画面遷移)以外の通信（Supabase等）には一切触らない。
const CACHE = 'tc-html-v1';
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.mode !== 'navigate') return; // ページ本体の取得だけを扱う
  e.respondWith((async () => {
    try {
      const fresh = await fetch(req.url, { cache: 'no-store' });
      if (fresh && fresh.ok) {
        try { const c = await caches.open(CACHE); await c.put('last-good', fresh.clone()); } catch (_e) {}
        return fresh;
      }
      throw new Error('bad status ' + (fresh && fresh.status));
    } catch (err) {
      const c = await caches.open(CACHE);
      const hit = await c.match('last-good');
      if (hit) return hit; // オフライン時は最後に成功した版で起動
      throw err;
    }
  })());
});
