import { describe, it, expect, vi, afterEach } from 'vitest'
import { JsonFetchDataSource } from './JsonFetchDataSource'
import type { Question } from '../models/types'

const mockQuestion: Question = {
  id: 'q001',
  title: 'テスト',
  mode: 'practice',
  instructions: ['指示'],
  items: [],
  answer: {}
}

describe('JsonFetchDataSource', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('getQuestions', () => {
    it('正常レスポンス時にQuestion[]を返す', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([mockQuestion])
      }))

      const dataSource = new JsonFetchDataSource('/questions.json')
      const result = await dataSource.getQuestions()

      expect(result).toEqual([mockQuestion])
      expect(fetch).toHaveBeenCalledWith('/questions.json')
    })

    it('ok: falseのレスポンス時にErrorをスローする', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 404
      }))

      const dataSource = new JsonFetchDataSource('/questions.json')

      await expect(dataSource.getQuestions()).rejects.toThrow('設問データの取得に失敗しました: 404')
    })
  })
})
