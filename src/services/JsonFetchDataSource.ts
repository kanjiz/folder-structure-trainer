import type { Question } from '../models/types'
import type { QuestionDataSource } from './types'

/**
 * JSONファイルから設問を取得するデータソース
 *
 * `public/` ディレクトリに配置したJSONファイルを `fetch` APIで取得します。
 * URLには `${import.meta.env.BASE_URL}questions.json` のように `BASE_URL` を起点にすることで、
 * 開発・本番両環境で正しく動作します。
 */
export class JsonFetchDataSource implements QuestionDataSource {
  /** JSONファイルのURL */
  private readonly url: string

  /**
   * @param url - JSONファイルのURL（例: `${import.meta.env.BASE_URL}questions.json`）
   */
  constructor(url: string) {
    this.url = url
  }

  /**
   * 全ての設問を取得
   *
   * @returns 設問のリスト
   * @throws HTTPステータスが200番台以外の場合（例: 404, 500）
   */
  async getQuestions(): Promise<Question[]> {
    const response = await fetch(this.url)
    if (!response.ok) {
      throw new Error(`設問データの取得に失敗しました: ${response.status}`)
    }
    return response.json() as Promise<Question[]>
  }
}
