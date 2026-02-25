import type { Question } from '../models/types'

/**
 * 設問取得のインターフェース
 *
 * 環境に応じて実装を切り替える（JsonFetchDataSource / GasDataSource など）
 */
export interface QuestionDataSource {
  /**
   * 全ての問題を取得
   *
   * @returns 問題のリスト
   */
  getQuestions(): Promise<Question[]>
}

/**
 * 結果保存のインターフェース
 *
 * GAS版でのみ実装される。練習モードでは不要。
 */
export interface ResultRepository {
  /**
   * 結果を保存
   *
   * @param userId - ユーザーID
   * @param questionId - 問題ID
   * @param result - 結果データ（構造は環境依存のため型指定なし）
   */
  saveResult(userId: string, questionId: string, result: unknown): Promise<void>
}
