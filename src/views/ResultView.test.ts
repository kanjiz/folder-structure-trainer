/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderResultView } from './ResultView'
import type { Question } from '../models/FileSystem'

describe('ResultView', () => {
  let container: HTMLElement
  let mockQuestion: Question
  let onBackToSelect: ReturnType<typeof vi.fn>
  let onRetry: ReturnType<typeof vi.fn>

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)

    mockQuestion = {
      id: 'test-1',
      title: 'テスト問題',
      mode: 'exercise',
      instructions: [],
      items: [
        { id: 'file1', name: 'ファイル1.txt', type: 'file' },
        { id: 'file2', name: 'ファイル2.txt', type: 'file' },
        { id: 'file3', name: 'ファイル3.txt', type: 'file' },
        { id: 'folder1', name: 'フォルダ1', type: 'folder' },
        { id: 'folder2', name: 'フォルダ2', type: 'folder' },
      ],
      answer: {}
    }

    onBackToSelect = vi.fn()
    onRetry = vi.fn()
  })

  afterEach(() => {
    document.body.removeChild(container)
  })

  describe('スコア表示', () => {
    it('should display correct score when all items are correct', () => {
      const result = {
        correct: ['file1', 'file2', 'file3', 'folder1', 'folder2'],
        incorrect: []
      }

      renderResultView(container, mockQuestion, result, onBackToSelect, onRetry)

      const scoreElement = container.querySelector('.score')
      expect(scoreElement?.textContent).toBe('5 / 5 正解')
    })

    it('should display correct score when some items are incorrect', () => {
      const result = {
        correct: ['file1', 'file2', 'folder1'],
        incorrect: ['file3', 'folder2']
      }

      renderResultView(container, mockQuestion, result, onBackToSelect, onRetry)

      const scoreElement = container.querySelector('.score')
      expect(scoreElement?.textContent).toBe('3 / 5 正解')
    })

    it('should display correct score when all items are incorrect', () => {
      const result = {
        correct: [],
        incorrect: ['file1', 'file2', 'file3', 'folder1', 'folder2']
      }

      renderResultView(container, mockQuestion, result, onBackToSelect, onRetry)

      const scoreElement = container.querySelector('.score')
      expect(scoreElement?.textContent).toBe('0 / 5 正解')
    })
  })

  describe('正誤表示', () => {
    it('should mark correct items with check mark', () => {
      const result = {
        correct: ['file1'],
        incorrect: ['file2', 'file3', 'folder1', 'folder2']
      }

      renderResultView(container, mockQuestion, result, onBackToSelect, onRetry)

      const correctItems = container.querySelectorAll('.result-correct')
      expect(correctItems).toHaveLength(1)
      expect(correctItems[0].textContent).toContain('✓')
      expect(correctItems[0].textContent).toContain('ファイル1.txt')
    })

    it('should mark incorrect items with X mark', () => {
      const result = {
        correct: ['file1'],
        incorrect: ['file2', 'file3', 'folder1', 'folder2']
      }

      renderResultView(container, mockQuestion, result, onBackToSelect, onRetry)

      const incorrectItems = container.querySelectorAll('.result-incorrect')
      expect(incorrectItems).toHaveLength(4)
      expect(incorrectItems[0].textContent).toContain('✗')
    })

    it('should display all items in order', () => {
      const result = {
        correct: ['file1', 'folder1'],
        incorrect: ['file2', 'file3', 'folder2']
      }

      renderResultView(container, mockQuestion, result, onBackToSelect, onRetry)

      const allResultItems = container.querySelectorAll('.result-item')
      expect(allResultItems).toHaveLength(5)
      expect(allResultItems[0].textContent).toContain('ファイル1.txt')
      expect(allResultItems[1].textContent).toContain('ファイル2.txt')
      expect(allResultItems[2].textContent).toContain('ファイル3.txt')
      expect(allResultItems[3].textContent).toContain('フォルダ1')
      expect(allResultItems[4].textContent).toContain('フォルダ2')
    })
  })

  describe('ボタンイベント', () => {
    it('should call onRetry when retry button is clicked', () => {
      const result = {
        correct: ['file1'],
        incorrect: ['file2', 'file3', 'folder1', 'folder2']
      }

      renderResultView(container, mockQuestion, result, onBackToSelect, onRetry)

      const retryButton = container.querySelector('#retry-btn') as HTMLButtonElement
      expect(retryButton).toBeTruthy()

      retryButton.click()
      expect(onRetry).toHaveBeenCalledTimes(1)
    })

    it('should call onBackToSelect when select button is clicked', () => {
      const result = {
        correct: ['file1'],
        incorrect: ['file2', 'file3', 'folder1', 'folder2']
      }

      renderResultView(container, mockQuestion, result, onBackToSelect, onRetry)

      const selectButton = container.querySelector('#select-btn') as HTMLButtonElement
      expect(selectButton).toBeTruthy()

      selectButton.click()
      expect(onBackToSelect).toHaveBeenCalledTimes(1)
    })
  })
})
