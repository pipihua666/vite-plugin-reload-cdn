"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reloadCdnPlugin = reloadCdnPlugin;
function watch(fallbackMap) {
    console.log('fallbackMap: ', fallbackMap);
    var LinkEnum;
    (function (LinkEnum) {
        LinkEnum["SCRIPT"] = "SCRIPT";
        LinkEnum["LINK"] = "LINK";
    })(LinkEnum || (LinkEnum = {}));
    function fallbackCdn(src, type) {
        var el = null;
        var publicPath = src ? new URL(src).origin : '';
        var fallbackPath = (fallbackMap === null || fallbackMap === void 0 ? void 0 : fallbackMap[src]) || '';
        if (type === LinkEnum.SCRIPT) {
            el = document.createElement('script');
            el.src = src.replace(publicPath, fallbackPath);
        }
        else if (type === LinkEnum.LINK) {
            el = document.createElement('link');
            el.setAttribute('rel', 'stylesheet');
            el.href = src.replace(publicPath, fallbackPath);
        }
        if (el) {
            var head = document.querySelector('head');
            el.setAttribute('reload', 'true');
            head === null || head === void 0 ? void 0 : head.appendChild(el);
        }
    }
    window.addEventListener('error', function (e) {
        if (!(e instanceof ErrorEvent) && e.target instanceof HTMLElement) {
            var type = e.target.tagName;
            var src = '';
            if (type === LinkEnum.SCRIPT) {
                src = e.target.src;
            }
            else if (type === LinkEnum.LINK) {
                src = e.target.href;
            }
            var reload = e.target.getAttribute('reload');
            if (!reload) {
                fallbackCdn(src, type);
            }
            else if (reload || src.includes('reloadAssets=2')) {
                // 同步资源请求失败或者异步资源请求失败
            }
        }
    }, true);
}
function reloadCdnPlugin(options) {
    var map = options.map;
    console.log('map: ', map);
    return {
        name: 'vite-plugin-reload-cdn',
        transformIndexHtml: function (html) {
            var tags = [];
            tags.push({
                tag: 'script',
                children: "(".concat(watch, ")(").concat(JSON.stringify(map), ");")
            });
            return tags;
        }
    };
}
