import type { Question } from '../models/types'
import type { QuestionDataSource } from './types'

/**
 * JSONファイルから設問を取得するデータソース
 *
 * `fetch` APIを使用してJSONファイルを取得します。
 * Viteの開発サーバー・本番ビルド両方で `public/questions.json` を参照します。
 */
export class JsonFetchDataSource implements QuestionDataSource {
  /** JSONファイルのURL */
  private readonly url: string

  /**
   * @param url - JSONファイルのURL（例: '/questions.json'）
   */
  constructor(url: string) {
    this.url = url
  }

  /**
   * 全ての問題を取得
   *
   * @returns 問題のリスト
   * @throws 取得に失敗した場合
   */
  async getQuestions(): Promise<Question[]> {
    const response = await fetch(this.url)
    if (!response.ok) {
      throw new Error(`設問データの取得に失敗しました: ${response.status}`)
    }
    return response.json() as Promise<Question[]>
  }
}
