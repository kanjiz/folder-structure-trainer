import type { Question } from '../models/types'
import type { QuestionDataSource, ResultRepository } from './types'

/**
 * 問題データ取得サービス
 *
 * データソースを抽象化し、環境に応じて適切なデータソースから問題を取得します。
 * Dependency Injectionパターンにより、テストも容易になります。
 */
export class QuestionService {
  /** 設問取得の実装 */
  private readonly dataSource: QuestionDataSource
  /** 結果保存の実装（省略時はsaveResultが何もしない） */
  private readonly resultRepo: ResultRepository | undefined

  /**
   * QuestionServiceのコンストラクタ
   *
   * @param dataSource - 設問取得の実装
   * @param resultRepo - 結果保存の実装（省略時はsaveResultが何もしない）
   */
  constructor(dataSource: QuestionDataSource, resultRepo?: ResultRepository) {
    this.dataSource = dataSource
    this.resultRepo = resultRepo
  }

  /**
   * 全ての問題を取得
   *
   * @returns 問題のリスト
   */
  async getQuestions(): Promise<Question[]> {
    return this.dataSource.getQuestions()
  }

  /**
   * 結果を保存
   *
   * resultRepoが渡されている場合のみ保存します。
   * 練習モード（resultRepoなし）では何もしません。
   *
   * @param userId - ユーザーID
   * @param questionId - 問題ID
   * @param result - 結果データ
   */
  async saveResult(userId: string, questionId: string, result: unknown): Promise<void> {
    if (this.resultRepo) {
      await this.resultRepo.saveResult(userId, questionId, result)
    }
  }
}
