// src/lib/handlebarsHelpers.ts
import Handlebars from 'handlebars'

/**
 * Handlebarsカスタムヘルパーを登録
 * アプリケーション起動時に一度だけ呼び出す
 */
export function registerHandlebarsHelpers(): void {
  // 等価比較ヘルパー（テンプレート内で型比較に使用）
  Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b)
}
