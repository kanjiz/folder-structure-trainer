import type { Question } from '../models/FileSystem'
import type { IQuestionDataSource } from './types'

/**
 * 問題データ取得サービス
 *
 * データソースを抽象化し、環境に応じて適切なデータソースから問題を取得します。
 * Dependency Injectionパターンにより、テストも容易になります。
 */
export class QuestionService {
  /**
   * データソースの実装
   */
  private dataSource: IQuestionDataSource

  /**
   * QuestionServiceのコンストラクタ
   *
   * @param dataSource - データソースの実装
   */
  constructor(dataSource: IQuestionDataSource) {
    this.dataSource = dataSource
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
   * 特定の問題を取得
   *
   * @param id - 問題ID
   * @returns 問題（見つからない場合はnull）
   */
  async getQuestionById(id: string): Promise<Question | null> {
    return this.dataSource.getQuestionById(id)
  }

  /**
   * 結果を保存
   *
   * データソースがsaveResultを実装している場合のみ保存します。
   * 練習モードではこのメソッドは何もしません。
   *
   * @param userId - ユーザーID
   * @param questionId - 問題ID
   * @param result - 結果データ
   */
  async saveResult(userId: string, questionId: string, result: unknown): Promise<void> {
    if (this.dataSource.saveResult) {
      await this.dataSource.saveResult(userId, questionId, result)
    }
  }
}
