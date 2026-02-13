import { describe, it, expect, vi } from 'vitest'
import { QuestionService } from './QuestionService'
import type { IQuestionDataSource } from './types'
import type { Question } from '../models/FileSystem'

/**
 * モックのデータソースを作成
 */
function createMockDataSource(): IQuestionDataSource {
  const mockQuestions: Question[] = [
    {
      id: 'test1',
      title: 'テスト問題1',
      mode: 'practice',
      instructions: ['指示1'],
      items: [],
      answer: {}
    },
    {
      id: 'test2',
      title: 'テスト問題2',
      mode: 'exercise',
      instructions: ['指示2'],
      items: [],
      answer: {}
    }
  ]

  return {
    getQuestions: vi.fn().mockResolvedValue(mockQuestions),
    getQuestionById: vi.fn().mockImplementation((id: string) =>
      Promise.resolve(mockQuestions.find(q => q.id === id) || null)
    ),
    saveResult: vi.fn().mockResolvedValue(undefined)
  }
}

describe('QuestionService', () => {
  describe('getQuestions', () => {
    it('データソースから問題を取得できる', async () => {
      const dataSource = createMockDataSource()
      const service = new QuestionService(dataSource)

      const questions = await service.getQuestions()

      expect(questions).toHaveLength(2)
      expect(dataSource.getQuestions).toHaveBeenCalledTimes(1)
    })
  })

  describe('getQuestionById', () => {
    it('データソースから特定の問題を取得できる', async () => {
      const dataSource = createMockDataSource()
      const service = new QuestionService(dataSource)

      const question = await service.getQuestionById('test1')

      expect(question).toBeDefined()
      expect(question?.id).toBe('test1')
      expect(dataSource.getQuestionById).toHaveBeenCalledWith('test1')
    })

    it('存在しない問題IDの場合nullを返す', async () => {
      const dataSource = createMockDataSource()
      const service = new QuestionService(dataSource)

      const question = await service.getQuestionById('nonexistent')

      expect(question).toBeNull()
    })
  })

  describe('saveResult', () => {
    it('データソースがsaveResultを持つ場合、結果を保存できる', async () => {
      const dataSource = createMockDataSource()
      const service = new QuestionService(dataSource)

      await service.saveResult('user1', 'test1', { score: 100 })

      expect(dataSource.saveResult).toHaveBeenCalledWith('user1', 'test1', { score: 100 })
    })

    it('データソースがsaveResultを持たない場合、エラーなく無視される', async () => {
      const dataSource: IQuestionDataSource = {
        getQuestions: vi.fn().mockResolvedValue([]),
        getQuestionById: vi.fn().mockResolvedValue(null)
        // saveResultなし
      }
      const service = new QuestionService(dataSource)

      // エラーがスローされないことを確認
      await expect(service.saveResult('user1', 'test1', { score: 100 })).resolves.toBeUndefined()
    })
  })
})
