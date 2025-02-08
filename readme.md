# vite 插件 CDN 容灾处理

当资源出现资源加载错误时，重载资源，最终回源 oss

## 使用

> npm install vite-plugin-reload-cdn -D

如下在`vite.config.js`中添加该插件

```ts
import { reloadCdnPlugin } from 'vite-plugin-reload-cdn'

plugins: [
  reloadCdnPlugin({
    map: {
      'https://baidu.com': 'http://google.com'
    }
  })
]
```

## 签名

```ts
// cdn域名
type CDN = string
// oss源站域名
type OSS = string

interface Options {
  map: Record<CDN, OSS>
}

declare function reloadCdnPlugin(options: Options)
```

## 前置知识

window.onerror 和 window.addEventListener('error')的区别

#### window.onerror

> 全局监听 js 异常

1. 只能绑定一个，后面的绑定会覆盖前面的
2. 无法全局捕获资源加载异常
3. 可以捕获异步错误
4. 不可以捕获 forEach 中抛出的异常

#### window.addEventListener('error')

> 全局监听资源加载异常

1. 可以绑定多个，多个回调按照绑定顺序执行
2. 比 window.onerror 先执行
3. 由于网络请求异常不会事件冒泡到 window，因此必须在捕获阶段将其捕捉到才行，于是 window.addEventListener 设置为 true 在捕获阶段进行，网络请求错误可以捕获
4. 可以全局捕获资源加载异常的错误
5. 可以捕获异步错误
6. 可以捕获 forEach 中抛出的异常

#### 共同点

1. 都可以捕获 js 运行时错误，前提都是未被 try-catch 捕获

## 同步资源

通过监听`window.addEventListener('error')`实现资源重载

## 异步资源

> vite 使用原生支持的`import()`函数进行资源懒加载

改写 vite 插件`vite:build-import-analysis`中的`__vitePreload`方法，这个方法主要做两件事

1. 资源预加载
2. 资源按需加载

## 动态资源

> 手动通过 document.createElement('script') 加载的资源

手动处理资源重载逻辑
