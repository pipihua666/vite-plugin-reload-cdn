type PromiseSettledResult<T> =
  | { status: 'fulfilled'; value: T }
  | { status: 'rejected'; reason: any }

type VitePreloadErrorEvent = Event & { payload: Error }

declare const scriptRel: string
declare const seen: Record<string, boolean>

export function dynamicImport(
  baseModule: () => Promise<unknown>,
  deps?: string[],
  importerUrl?: string
) {
  let promise: Promise<PromiseSettledResult<unknown>[] | void> =
    Promise.resolve()
  // @ts-expect-error __VITE_IS_MODERN__ will be replaced with boolean later
  if (__VITE_IS_MODERN__ && deps && deps.length > 0) {
    const links = document.getElementsByTagName('link')
    const cspNonceMeta = document.querySelector<HTMLMetaElement>(
      'meta[property=csp-nonce]'
    )
    // `.nonce` should be used to get along with nonce hiding (https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/nonce#accessing_nonces_and_nonce_hiding)
    // Firefox 67-74 uses modern chunks and supports CSP nonce, but does not support `.nonce`
    // in that case fallback to getAttribute
    const cspNonce = cspNonceMeta?.nonce || cspNonceMeta?.getAttribute('nonce')

    promise = Promise.allSettled(
      deps.map((dep) => {
        // @ts-expect-error assetsURL is declared before preload.toString()
        dep = assetsURL(dep, importerUrl)
        if (dep in seen) return
        seen[dep] = true
        const isCss = dep.endsWith('.css')
        const cssSelector = isCss ? '[rel="stylesheet"]' : ''
        const isBaseRelative = !!importerUrl

        // check if the file is already preloaded by SSR markup
        if (isBaseRelative) {
          // When isBaseRelative is true then we have `importerUrl` and `dep` is
          // already converted to an absolute URL by the `assetsURL` function
          for (let i = links.length - 1; i >= 0; i--) {
            const link = links[i]
            // The `links[i].href` is an absolute URL thanks to browser doing the work
            // for us. See https://html.spec.whatwg.org/multipage/common-dom-interfaces.html#reflecting-content-attributes-in-idl-attributes:idl-domstring-5
            if (link.href === dep && (!isCss || link.rel === 'stylesheet')) {
              return
            }
          }
        } else if (
          document.querySelector(`link[href="${dep}"]${cssSelector}`)
        ) {
          return
        }

        const link = document.createElement('link')
        link.rel = isCss ? 'stylesheet' : scriptRel
        if (!isCss) {
          link.as = 'script'
        }
        link.crossOrigin = ''
        link.href = dep
        if (cspNonce) {
          link.setAttribute('nonce', cspNonce)
        }
        document.head.appendChild(link)
        if (isCss) {
          return new Promise((res, rej) => {
            link.addEventListener('load', res)
            link.addEventListener('error', () =>
              rej(new Error(`Unable to preload CSS for ${dep}`))
            )
          })
        }
      })
    )
  }

  function handlePreloadError(err: Error) {
    const e = new Event('vite:preloadError', {
      cancelable: true
    }) as VitePreloadErrorEvent
    e.payload = err
    window.dispatchEvent(e)
    if (!e.defaultPrevented) {
      throw err
    }
  }

  /**
   * 深拷贝函数
   */
  function deepCopyFunction<T extends (...args: any[]) => any>(fn: T): T {
    return new Function('return ' + fn.toString())() as T
  }

  /**
   * @description: 定义异步重试逻辑
   * TODO: cdn fallback
   */
  function retry(fn: () => Promise<unknown>, retries = 2, delay = 1000) {
    let attempt = 0
    function attemptRetry(): Promise<unknown> {
      const func = deepCopyFunction(fn)
      return func().catch((error) => {
        if (++attempt < retries) {
          return new Promise((resolve) => setTimeout(resolve, delay)).then(
            attemptRetry
          )
        } else {
          return Promise.reject(error)
        }
      })
    }
    return attemptRetry()
  }

  return promise.then((res) => {
    for (const item of res || []) {
      if (item.status !== 'rejected') continue
      handlePreloadError(item.reason)
    }
    return retry(baseModule).catch(handlePreloadError)
  })
}
