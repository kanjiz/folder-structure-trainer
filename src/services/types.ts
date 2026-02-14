import type { Question } from '../models/types'

/**
 * 問題データソースのインターフェース
 *
 * 環境に応じてデータソースの実装を切り替えるための抽象化。
 * - 練習モード: StaticDataSource（静的データ）
 * - 本番モード: GASDataSource（Spreadsheet連携）
 */
export interface IQuestionDataSource {
  /**
   * 全ての問題を取得
   *
   * @returns 問題のリスト
   */
  getQuestions(): Promise<Question[]>

  /**
   * 特定の問題を取得
   *
   * @param id - 問題ID
   * @returns 問題（見つからない場合はnull）
   */
  getQuestionById(id: string): Promise<Question | null>

  /**
   * 結果を保存（本番モードのみ）
   *
   * オプショナルメソッド。練習モードでは実装不要。
   *
   * @param userId - ユーザーID
   * @param questionId - 問題ID
   * @param result - 結果データ（構造は環境依存のため型指定なし）
   */
  saveResult?(userId: string, questionId: string, result: unknown): Promise<void>
}
