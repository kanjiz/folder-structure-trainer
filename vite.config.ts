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
     * 'node': Node.js環境（DOM不要のユニットテスト向け）
     * 'jsdom': ブラウザ環境をシミュレート（DOM操作が必要な場合）
     * 'happy-dom': jsdomより高速なブラウザ環境シミュレート
     *
     * ViewコンポーネントのテストではDOM操作が必要なためjsdom環境を使用
     */
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
