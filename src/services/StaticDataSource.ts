import type { Question } from '../models/types'
import type { QuestionDataSource } from './types'
import { questions } from '../data/questions'

/**
 * 静的データソース
 *
 * TypeScriptコード内の問題データ配列から問題を取得します。
 * 練習モードや開発環境で使用されます。
 */
export class StaticDataSource implements QuestionDataSource {
  /**
   * 全ての問題を取得
   *
   * @returns 問題のリスト
   */
  async getQuestions(): Promise<Question[]> {
    return questions
  }

  // saveResultは実装しない（練習モードでは保存不要）
}
