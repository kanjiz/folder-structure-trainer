import type { Question } from '../models/FileSystem'
import type { IQuestionDataSource } from './types'
import { questions } from '../data/questions'

/**
 * 静的データソース
 *
 * TypeScriptコード内の問題データ配列から問題を取得します。
 * 練習モードや開発環境で使用されます。
 */
export class StaticDataSource implements IQuestionDataSource {
  /**
   * 全ての問題を取得
   *
   * @returns 問題のリスト
   */
  async getQuestions(): Promise<Question[]> {
    return questions
  }

  /**
   * 特定の問題を取得
   *
   * @param id - 問題ID
   * @returns 問題（見つからない場合はnull）
   */
  async getQuestionById(id: string): Promise<Question | null> {
    return questions.find(q => q.id === id) || null
  }

  // saveResultは実装しない（練習モードでは保存不要）
}
