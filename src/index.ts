import { staticImport } from './static-import'
import { preloadError } from './preload-error'
import { dynamicImport } from './dynamic-import'

export interface Options {
  map: Record<string, string>
}

export function reloadCdnPlugin(options: Options) {
  const cdnMap = options.map
  return {
    name: 'vite-plugin-reload-cdn',
    apply: 'build',
    transformIndexHtml() {
      const tags = []
      tags.push(
        {
          tag: 'script',
          children: `(${staticImport})(${JSON.stringify(cdnMap)});`
        },
        {
          tag: 'script',
          children: `(${preloadError})()`
        }
      )
      return tags
    },
    transform(code: string, id: string) {
      const preloadHelperId = '\0vite/preload-helper.js'
      const __vitePreload = 'const __vitePreload ='
      if (id === preloadHelperId) {
        const newCodeArr = code.split(__vitePreload)
        const newCode = `${
          newCodeArr[0]
        }${__vitePreload}${dynamicImport.toString()}`
        return newCode
      }
    }
  }
}
