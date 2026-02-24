import { defineConfig } from 'vitest/config'

export default defineConfig({
  /**
   * ベースパス設定
   * GitHub Pagesなどのサブディレクトリでホスティングする際に必要
   * ビルド時のアセットパスがこのベースに基づいて生成される
   */
  base: '/folder-structure-trainer/',

  /**
   * Vitestのテスト設定
   */
  test: {
    /**
     * テスト実行環境
     * デフォルトはnode環境（DOM不要のユニットテスト向け）
     * DOM操作が必要なViewテストは各ファイルで @vitest-environment jsdom を指定する
     */
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
  },
})
