// 每次修改了 index.html 的代码，就把这里的版本号改一下（推荐用日期+序号）
const CACHE_NAME = 'local-notes-2026-06-15-03'; 

// 核心清单：先把最重要的骨架文件塞进缓存
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './192.png',
    './512.png'
];

// 1. 安装阶段：下载核心文件，并强制立即生效
self.addEventListener('install', e => {
    // 【融合优势】强制立即接管控制权，不等待旧版页面关闭
    self.skipWaiting(); 
    
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
});

// 2. 激活阶段：清理旧版本垃圾，并立即控制所有打开的页面
self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    // 硬盘里的缓存名字和当前最新 CACHE_NAME 不一样，无情删掉
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim()) // 【融合优势】激活后立刻控制当前所有标签页
    );
});

// 3. 拦截请求阶段：静态缓存优先 + 动态资源智能收集
self.addEventListener('fetch', e => {
    // 忽略非 GET 请求（比如不拦截 POST 提交数据）
    if (e.request.method !== 'GET') return;

    e.respondWith(
        caches.match(e.request).then(cachedResponse => {
            // 💡 策略一：如果缓存里有（不管是写死的还是后来抓的），直接断网秒开！
            if (cachedResponse) {
                return cachedResponse;
            }

            // 💡 策略二：如果缓存没有，去网络请求
            return fetch(e.request).then(networkResponse => {
                // 确保请求成功，且是合法请求（包含普通的 CDN 跨域请求）
                if (!networkResponse || networkResponse.status !== 200 || (networkResponse.type !== 'basic' && networkResponse.type !== 'cors')) {
                    return networkResponse;
                }

                // 【融合优势】动态收集：把刚从网上成功拉取的新文件（比如 Tailwind 样式库），克隆一份存进缓存里
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(e.request, responseToCache);
                });

                return networkResponse;
            }).catch(() => {
                // 断网且没缓存时的兜底（可以在这里加个断网提示页）
                console.log('网络不可用，且未命中缓存:', e.request.url);
            });
        })
    );
});
