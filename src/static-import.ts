import type { Options } from './index'

export function staticImport(fallbackMap: Options['map']) {
  enum LinkEnum {
    SCRIPT = 'SCRIPT',
    LINK = 'LINK'
  }

  interface Fallback {
    sourcePath: string
    fallbackPath: string
  }

  function createElement(url: string, type: LinkEnum, fallback?: Fallback) {
    let el = null
    const urlReplaced = fallback
      ? url.replace(fallback.sourcePath, fallback.fallbackPath)
      : url
    if (type === LinkEnum.SCRIPT) {
      el = document.createElement('script')
      el.src = urlReplaced + '?t=' + Date.now()
      el.type = 'module'
    } else if (type === LinkEnum.LINK) {
      el = document.createElement('link')
      el.setAttribute('rel', 'stylesheet')
      el.href = urlReplaced
    }
    return el
  }

  function fallbackCdn(url: string, type: LinkEnum) {
    const sourcePath = url ? new URL(url).origin : ''
    const fallbackPath = fallbackMap?.[sourcePath] || ''
    if (!fallbackPath) {
      return
    }
    const el = createElement(url, type, {
      sourcePath,
      fallbackPath
    })
    if (el) {
      const head = document.querySelector('head')
      el.setAttribute('reload', '2')
      head?.appendChild(el)
    }
  }

  function reloadAsset(url: string, type: LinkEnum) {
    const el = createElement(url, type)
    if (el) {
      const head = document.querySelector('head')
      el.setAttribute('reload', '1')
      head?.appendChild(el)
    }
  }

  // 同步资源加载失败
  window.addEventListener(
    'error',
    function (e: Event) {
      const target = e.target as HTMLElement
      if (!target) {
        return
      }
      const tagName = (target as HTMLElement).tagName as LinkEnum
      if (!(e instanceof ErrorEvent) && target instanceof HTMLElement) {
        let url = ''
        if (tagName === LinkEnum.SCRIPT) {
          url = (target as HTMLScriptElement).src
        } else if (tagName === LinkEnum.LINK) {
          url = (target as HTMLLinkElement).href
        }
        const reload = target.getAttribute('reload')
        if (!reload) {
          reloadAsset(url, tagName)
          return
        }
        if (Number(reload) === 1) {
          fallbackCdn(url, tagName)
          return
        }
      }
    },
    true
  )
}
