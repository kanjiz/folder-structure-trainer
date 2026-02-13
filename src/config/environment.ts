import type { IQuestionDataSource } from '../services/types'
import { StaticDataSource } from '../services/StaticDataSource'

/**
 * 環境タイプ
 *
 * アプリケーションが動作する環境を識別します。
 * - development: 開発環境
 * - github-pages: GitHub Pagesでの練習モード
 * - gas: Google Apps Scriptでの本番モード
 */
export type Environment = 'development' | 'github-pages' | 'gas'

/**
 * 現在の環境を取得
 *
 * VITE_ENV環境変数から現在の環境を判定します。
 * 未設定の場合はdevelopmentとして扱います。
 *
 * @returns 現在の環境
 */
export function getEnvironment(): Environment {
  const env = import.meta.env.VITE_ENV as Environment
  return env || 'development'
}

/**
 * 環境に応じたデータソースを取得
 *
 * 現在の環境に基づいて適切なデータソース実装を返します。
 * - gas環境: GASDataSource（将来実装）
 * - それ以外: StaticDataSource
 *
 * @returns データソースの実装
 */
export function createDataSource(): IQuestionDataSource {
  const env = getEnvironment()

  switch (env) {
    case 'gas':
      // 将来的にGASDataSourceを実装
      // return new GASDataSource()
      throw new Error('GASDataSource is not implemented yet')
    case 'github-pages':
    case 'development':
    default:
      return new StaticDataSource()
  }
}

/**
 * 結果保存が有効かどうか
 *
 * 現在の環境で問題の結果保存機能が有効かを判定します。
 * gas環境のみtrueを返します。
 *
 * @returns 結果保存が有効な場合true
 */
export function isResultSavingEnabled(): boolean {
  return getEnvironment() === 'gas'
}
