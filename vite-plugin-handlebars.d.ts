declare module 'vite-plugin-handlebars' {
  import type { Plugin } from 'vite'

  interface HandlebarsPluginOptions {
    helpers?: Record<string, (...args: unknown[]) => unknown>
    partialDirectory?: string | string[]
    context?: Record<string, unknown>
  }

  function handlebarsPlugin(options?: HandlebarsPluginOptions): Plugin

  export default handlebarsPlugin
}
