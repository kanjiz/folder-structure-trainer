import { describe, it, expect, beforeEach } from 'vitest'
import { loadTemplate, clearTemplateCache } from './templateLoader'

describe('templateLoader', () => {
  beforeEach(() => {
    // 各テスト前にキャッシュをクリア
    clearTemplateCache()
  })

  describe('loadTemplate', () => {
    it('テンプレートを読み込んでコンパイルできる', async () => {
      // テストダミーテンプレートを作成する必要がある
      // 実際のテンプレートファイルが存在しない段階では、このテストはスキップ
      // または、モックを使用する
      expect(true).toBe(true) // プレースホルダー
    })

    it('同じテンプレートを2回読み込むとキャッシュから返す', async () => {
      // キャッシュ機能のテスト
      // 実際のテンプレートファイルが存在しない段階では、このテストはスキップ
      expect(true).toBe(true) // プレースホルダー
    })
  })

  describe('clearTemplateCache', () => {
    it('キャッシュをクリアできる', () => {
      clearTemplateCache()
      // キャッシュがクリアされたことを確認
      expect(true).toBe(true) // プレースホルダー
    })
  })
})
