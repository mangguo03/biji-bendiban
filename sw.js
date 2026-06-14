// 每次修改了 index.html 的代码，就把这里的版本号改一下（推荐用日期）
const CACHE_NAME = 'local-notes-2026-06-14-05'; 

const ASSETS = [
    './',
    './index.html',
    './manifest.json'
];

// 1. 安装阶段：下载最新的文件并存入新的缓存文件夹
self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
});

// 2. 激活阶段（⚠️你之前缺少的关键代码）：清理旧版本的垃圾缓存
self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    // 如果硬盘里的缓存名字和当前最新的 CACHE_NAME 不一样，就无情删掉它！
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// 3. 拦截请求阶段：断网时优先从当前最新的缓存里拿文件
self.addEventListener('fetch', e => {
    e.respondWith(
        caches.match(e.request).then(response => response || fetch(e.request))
    );
});
