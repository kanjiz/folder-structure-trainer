import { describe, it, expect, vi } from 'vitest'
import { QuestionService } from './QuestionService'
import type { QuestionDataSource, ResultRepository } from './types'
import type { Question } from '../models/types'

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

function createMockDataSource(): QuestionDataSource {
  return {
    getQuestions: vi.fn().mockResolvedValue(mockQuestions)
  }
}

function createMockResultRepo(): ResultRepository {
  return {
    saveResult: vi.fn().mockResolvedValue(undefined)
  }
}

describe('QuestionService', () => {
  describe('getQuestions', () => {
    it('データソースから設問を取得できる', async () => {
      const dataSource = createMockDataSource()
      const service = new QuestionService(dataSource)

      const questions = await service.getQuestions()

      expect(questions).toHaveLength(2)
      expect(dataSource.getQuestions).toHaveBeenCalledTimes(1)
    })
  })

  describe('saveResult', () => {
    it('resultRepoがある場合、結果を保存できる', async () => {
      const dataSource = createMockDataSource()
      const resultRepo = createMockResultRepo()
      const service = new QuestionService(dataSource, resultRepo)

      await service.saveResult('user1', 'test1', { score: 100 })

      expect(resultRepo.saveResult).toHaveBeenCalledWith('user1', 'test1', { score: 100 })
    })

    it('resultRepoがない場合、エラーなく無視される', async () => {
      const dataSource = createMockDataSource()
      const service = new QuestionService(dataSource)

      await expect(service.saveResult('user1', 'test1', { score: 100 })).resolves.toBeUndefined()
    })
  })
})
