// Service Worker - 오프라인 지원 v5
const CACHE_NAME = 'dc-tracker-v5';
const FILES_TO_CACHE = [
  './',
  './index.html',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
];

// 설치 - 파일 캐시
self.addEventListener('install', (e) => {
  console.log('[SW] 설치 중...');
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] 파일 캐싱 시작');
      return cache.addAll(FILES_TO_CACHE).catch(() => {
        console.log('[SW] 일부 원격 파일 캐시 실패 (오프라인 상태) - 무시됨');
      });
    })
  );
  self.skipWaiting();
});

// 활성화 - 이전 캐시 정리
self.addEventListener('activate', (e) => {
  console.log('[SW] 활성화 중...');
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[SW] 이전 캐시 삭제:', key);
          return caches.delete(key);
        }
      }))
    )
  );
  self.clients.claim();
});

// Fetch - 캐시 우선 전략
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then((response) => {
      if (response) return response;
      return fetch(e.request).then((response) => {
        if (!response || response.status !== 200 || response.type === 'error') return response;
        const resClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, resClone));
        return response;
      }).catch(() => {
        console.log('[SW] 오프라인 모드:', e.request.url);
        return caches.match('./index.html') || new Response('오프라인 상태입니다', { status: 503 });
      });
    })
  );
});
