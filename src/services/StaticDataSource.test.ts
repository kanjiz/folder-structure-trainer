import { describe, it, expect } from 'vitest'
import { StaticDataSource } from './StaticDataSource'

describe('StaticDataSource', () => {
  describe('getQuestions', () => {
    it('全ての問題を取得できる', async () => {
      const dataSource = new StaticDataSource()
      const questions = await dataSource.getQuestions()

      expect(questions).toBeDefined()
      expect(questions.length).toBeGreaterThan(0)
    })

    it('取得した問題が正しい形式を持つ', async () => {
      const dataSource = new StaticDataSource()
      const questions = await dataSource.getQuestions()

      const firstQuestion = questions[0]
      expect(firstQuestion).toHaveProperty('id')
      expect(firstQuestion).toHaveProperty('title')
      expect(firstQuestion).toHaveProperty('mode')
      expect(firstQuestion).toHaveProperty('instructions')
      expect(firstQuestion).toHaveProperty('items')
      expect(firstQuestion).toHaveProperty('answer')
    })
  })

  describe('getQuestionById', () => {
    it('指定したIDの問題を取得できる', async () => {
      const dataSource = new StaticDataSource()
      const question = await dataSource.getQuestionById('q001')

      expect(question).toBeDefined()
      expect(question?.id).toBe('q001')
    })

    it('存在しないIDの場合nullを返す', async () => {
      const dataSource = new StaticDataSource()
      const question = await dataSource.getQuestionById('nonexistent')

      expect(question).toBeNull()
    })
  })
})
