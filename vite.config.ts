import { defineConfig } from 'vite'
import handlebars from 'vite-plugin-handlebars'

export default defineConfig({
  /**
   * ベースパス設定
   * GitHub Pagesなどのサブディレクトリでホスティングする際に必要
   * ビルド時のアセットパスがこのベースに基づいて生成される
   */
  base: '/folder-structure-trainer/',

  /**
   * プラグイン設定
   */
  plugins: [
    handlebars({
      helpers: {
        /**
         * Handlebarsの等価比較ヘルパー
         * テンプレート内で値の比較を行うために使用
         */
        eq: (a: unknown, b: unknown) => a === b
      }
    })
  ],

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
  },
})
