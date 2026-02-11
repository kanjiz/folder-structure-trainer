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
    it('should render all question cards', () => {
      renderSelectView(container, mockQuestions, onSelect)

      const cards = container.querySelectorAll('.question-card')
      expect(cards).toHaveLength(3)
    })

    it('should display question titles correctly', () => {
      renderSelectView(container, mockQuestions, onSelect)

      const cards = container.querySelectorAll('.question-card')
      expect(cards[0].textContent).toContain('練習問題1')
      expect(cards[1].textContent).toContain('演習問題1')
      expect(cards[2].textContent).toContain('練習問題2')
    })

    it('should render empty list when no questions', () => {
      renderSelectView(container, [], onSelect)

      const cards = container.querySelectorAll('.question-card')
      expect(cards).toHaveLength(0)
    })
  })

  describe('モードバッジ表示', () => {
    it('should display practice badge for practice mode', () => {
      renderSelectView(container, mockQuestions, onSelect)

      const badges = container.querySelectorAll('.mode-practice')
      expect(badges).toHaveLength(2) // q1 and q3
      expect(badges[0].textContent).toBe('練習')
    })

    it('should display exercise badge for exercise mode', () => {
      renderSelectView(container, mockQuestions, onSelect)

      const badges = container.querySelectorAll('.mode-exercise')
      expect(badges).toHaveLength(1) // q2
      expect(badges[0].textContent).toBe('演習')
    })

    it('should apply correct CSS class to badges', () => {
      renderSelectView(container, mockQuestions, onSelect)

      const practiceBadge = container.querySelector('.mode-badge.mode-practice')
      expect(practiceBadge).toBeTruthy()

      const exerciseBadge = container.querySelector('.mode-badge.mode-exercise')
      expect(exerciseBadge).toBeTruthy()
    })
  })

  describe('カードクリックイベント', () => {
    it('should call onSelect when card is clicked', () => {
      renderSelectView(container, mockQuestions, onSelect)

      const cards = container.querySelectorAll('.question-card')
      const firstCard = cards[0] as HTMLButtonElement

      firstCard.click()

      expect(onSelect).toHaveBeenCalledTimes(1)
      expect(onSelect).toHaveBeenCalledWith(mockQuestions[0])
    })

    it('should call onSelect with correct question for each card', () => {
      renderSelectView(container, mockQuestions, onSelect)

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
    it('should render title and description', () => {
      renderSelectView(container, mockQuestions, onSelect)

      const title = container.querySelector('h1')
      expect(title?.textContent).toBe('フォルダ構造トレーナー')

      const description = container.querySelector('p')
      expect(description?.textContent).toBe('問題を選んでください')
    })

    it('should have select-view class on wrapper', () => {
      renderSelectView(container, mockQuestions, onSelect)

      const wrapper = container.querySelector('.select-view')
      expect(wrapper).toBeTruthy()
    })

    it('should have question-list container', () => {
      renderSelectView(container, mockQuestions, onSelect)

      const list = container.querySelector('.question-list')
      expect(list).toBeTruthy()
    })
  })
})
