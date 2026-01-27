
const CACHE_NAME = 'meraki3d-v3';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './index.tsx',
  './App.tsx',
  './types.ts',
  './constants.tsx',
  './manifest.json',
  './services/db.ts',
  './services/syncService.ts',
  './services/pdfExport.ts',
  './services/excelExport.ts',
  './components/FilamentCard.tsx',
  './components/StatsDashboard.tsx',
  './components/ApkGuideModal.tsx',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Montserrat:wght@400;600;700&display=swap',
  'https://fonts.gstatic.com/s/montserrat/v25/JTUSjIg1_i6t8kCHKm4df9WRNYxlW49CA2AVEOTdhvY.woff2'
];

// Instalação: Cacheia todos os arquivos essenciais
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: Pre-caching all application modules');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Ativação: Limpa caches antigos (v1, v2)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('SW: Clearing old cache version', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Estratégia: Stale-While-Revalidate
// Serve do cache imediatamente para velocidade, mas atualiza em background
self.addEventListener('fetch', (event) => {
  // Ignora requisições de API de sincronização externa
  if (event.request.url.includes('/wp-json/') || event.request.url.includes('/sync')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Atualiza o cache se a resposta for válida
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback para cache em caso de erro de rede
        return cachedResponse;
      });

      return cachedResponse || fetchPromise;
    })
  );
});
