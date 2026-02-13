/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderSelectView } from './SelectView'
import type { Question } from '../models/FileSystem'

describe('SelectView', () => {
  let container: HTMLElement
  let mockQuestions: Question[]
  let onSelect: ReturnType<typeof vi.fn>

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)

    mockQuestions = [
      {
        id: 'q1',
        title: '練習問題1',
        mode: 'practice',
        instructions: [],
        items: [],
        answer: {}
      },
      {
        id: 'q2',
        title: '演習問題1',
        mode: 'exercise',
        instructions: [],
        items: [],
        answer: {}
      },
      {
        id: 'q3',
        title: '練習問題2',
        mode: 'practice',
        instructions: [],
        items: [],
        answer: {}
      }
    ]

    onSelect = vi.fn()
  })

  afterEach(() => {
    document.body.removeChild(container)
  })

  describe('問題カード表示', () => {
    it('全ての問題カードをレンダリングできる', async () => {
      await renderSelectView(container, mockQuestions, onSelect)

      const cards = container.querySelectorAll('.question-card')
      expect(cards).toHaveLength(3)
    })

    it('問題タイトルを正しく表示できる', async () => {
      await renderSelectView(container, mockQuestions, onSelect)

      const cards = container.querySelectorAll('.question-card')
      expect(cards[0].textContent).toContain('練習問題1')
      expect(cards[1].textContent).toContain('演習問題1')
      expect(cards[2].textContent).toContain('練習問題2')
    })

    it('問題がない場合は空のリストをレンダリングできる', async () => {
      await renderSelectView(container, [], onSelect)

      const cards = container.querySelectorAll('.question-card')
      expect(cards).toHaveLength(0)
    })
  })

  describe('モードバッジ表示', () => {
    it('練習モードの場合は練習バッジを表示できる', async () => {
      await renderSelectView(container, mockQuestions, onSelect)

      const badges = container.querySelectorAll('.mode-practice')
      expect(badges).toHaveLength(2) // q1 and q3
      expect(badges[0].textContent).toContain('練習')
    })

    it('演習モードの場合は演習バッジを表示できる', async () => {
      await renderSelectView(container, mockQuestions, onSelect)

      const badges = container.querySelectorAll('.mode-exercise')
      expect(badges).toHaveLength(1) // q2
      expect(badges[0].textContent).toContain('演習')
    })

    it('バッジに正しいCSSクラスを適用できる', async () => {
      await renderSelectView(container, mockQuestions, onSelect)

      const practiceBadge = container.querySelector('.mode-badge.mode-practice')
      expect(practiceBadge).toBeTruthy()

      const exerciseBadge = container.querySelector('.mode-badge.mode-exercise')
      expect(exerciseBadge).toBeTruthy()
    })
  })

  describe('カードクリックイベント', () => {
    it('カードがクリックされた時にonSelectを呼び出せる', async () => {
      await renderSelectView(container, mockQuestions, onSelect)

      const cards = container.querySelectorAll('.question-card')
      const firstCard = cards[0] as HTMLButtonElement

      firstCard.click()

      expect(onSelect).toHaveBeenCalledTimes(1)
      expect(onSelect).toHaveBeenCalledWith(mockQuestions[0])
    })

    it('各カードに対して正しい問題でonSelectを呼び出せる', async () => {
      await renderSelectView(container, mockQuestions, onSelect)

      const cards = container.querySelectorAll('.question-card')

      ;(cards[0] as HTMLButtonElement).click()
      expect(onSelect).toHaveBeenCalledWith(mockQuestions[0])

      ;(cards[1] as HTMLButtonElement).click()
      expect(onSelect).toHaveBeenCalledWith(mockQuestions[1])

      ;(cards[2] as HTMLButtonElement).click()
      expect(onSelect).toHaveBeenCalledWith(mockQuestions[2])

      expect(onSelect).toHaveBeenCalledTimes(3)
    })
  })

  describe('構造とタイトル', () => {
    it('タイトルと説明をレンダリングできる', async () => {
      await renderSelectView(container, mockQuestions, onSelect)

      const title = container.querySelector('h1')
      expect(title?.textContent).toBe('フォルダ構造トレーナー')

      const description = container.querySelector('p')
      expect(description?.textContent).toBe('問題を選んでください')
    })

    it('ラッパー要素にselect-viewクラスを持つ', async () => {
      await renderSelectView(container, mockQuestions, onSelect)

      const wrapper = container.querySelector('.select-view')
      expect(wrapper).toBeTruthy()
    })

    it('question-listコンテナを持つ', async () => {
      await renderSelectView(container, mockQuestions, onSelect)

      const list = container.querySelector('.question-list')
      expect(list).toBeTruthy()
    })
  })
})
