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
    it('should display correct score when all items are correct', async () => {
      const result = {
        correct: ['file1', 'file2', 'file3', 'folder1', 'folder2'],
        incorrect: []
      }

      await renderResultView(container, mockQuestion, result, onBackToSelect, onRetry)

      const scoreElement = container.querySelector('.score')
      expect(scoreElement?.textContent).toBe('5 / 5 正解')
    })

    it('should display correct score when some items are incorrect', async () => {
      const result = {
        correct: ['file1', 'file2', 'folder1'],
        incorrect: ['file3', 'folder2']
      }

      await renderResultView(container, mockQuestion, result, onBackToSelect, onRetry)

      const scoreElement = container.querySelector('.score')
      expect(scoreElement?.textContent).toBe('3 / 5 正解')
    })

    it('should display correct score when all items are incorrect', async () => {
      const result = {
        correct: [],
        incorrect: ['file1', 'file2', 'file3', 'folder1', 'folder2']
      }

      await renderResultView(container, mockQuestion, result, onBackToSelect, onRetry)

      const scoreElement = container.querySelector('.score')
      expect(scoreElement?.textContent).toBe('0 / 5 正解')
    })
  })

  describe('正誤表示', () => {
    it('should mark correct items with check mark', async () => {
      const result = {
        correct: ['file1'],
        incorrect: ['file2', 'file3', 'folder1', 'folder2']
      }

      await renderResultView(container, mockQuestion, result, onBackToSelect, onRetry)

      const correctItems = container.querySelectorAll('.result-correct')
      expect(correctItems).toHaveLength(1)
      expect(correctItems[0].textContent).toContain('✓')
      expect(correctItems[0].textContent).toContain('ファイル1.txt')
    })

    it('should mark incorrect items with X mark', async () => {
      const result = {
        correct: ['file1'],
        incorrect: ['file2', 'file3', 'folder1', 'folder2']
      }

      await renderResultView(container, mockQuestion, result, onBackToSelect, onRetry)

      const incorrectItems = container.querySelectorAll('.result-incorrect')
      expect(incorrectItems).toHaveLength(4)
      expect(incorrectItems[0].textContent).toContain('✗')
    })

    it('should display all items in order', async () => {
      const result = {
        correct: ['file1', 'folder1'],
        incorrect: ['file2', 'file3', 'folder2']
      }

      await renderResultView(container, mockQuestion, result, onBackToSelect, onRetry)

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
    it('should call onRetry when retry button is clicked', async () => {
      const result = {
        correct: ['file1'],
        incorrect: ['file2', 'file3', 'folder1', 'folder2']
      }

      await renderResultView(container, mockQuestion, result, onBackToSelect, onRetry)

      const retryButton = container.querySelector('#retry-btn') as HTMLButtonElement
      expect(retryButton).toBeTruthy()

      retryButton.click()
      expect(onRetry).toHaveBeenCalledTimes(1)
    })

    it('should call onBackToSelect when select button is clicked', async () => {
      const result = {
        correct: ['file1'],
        incorrect: ['file2', 'file3', 'folder1', 'folder2']
      }

      await renderResultView(container, mockQuestion, result, onBackToSelect, onRetry)

      const selectButton = container.querySelector('#select-btn') as HTMLButtonElement
      expect(selectButton).toBeTruthy()

      selectButton.click()
      expect(onBackToSelect).toHaveBeenCalledTimes(1)
    })
  })

  describe('セマンティック構造', () => {
    it('should render semantic HTML structure', async () => {
      const result = {
        correct: ['file1'],
        incorrect: ['file2', 'file3', 'folder1', 'folder2']
      }

      await renderResultView(container, mockQuestion, result, onBackToSelect, onRetry)

      // main要素
      const main = container.querySelector('main[role="main"]')
      expect(main).toBeTruthy()
      expect(main?.className).toBe('result-view')

      // header要素
      const header = container.querySelector('header.result-view__header')
      expect(header).toBeTruthy()

      // section要素（スコア）
      const scoreSection = container.querySelector('section[aria-label="スコア"]')
      expect(scoreSection).toBeTruthy()

      // section要素（詳細結果）
      const itemsSection = container.querySelector('section[aria-label="詳細結果"]')
      expect(itemsSection).toBeTruthy()

      // ul要素
      const list = container.querySelector('ul[role="list"]')
      expect(list).toBeTruthy()

      // li要素
      const listItems = container.querySelectorAll('li[role="listitem"]')
      expect(listItems.length).toBe(5)

      // footer要素
      const footer = container.querySelector('footer.result-actions')
      expect(footer).toBeTruthy()
    })

    it('should have proper button types', async () => {
      const result = {
        correct: ['file1'],
        incorrect: ['file2', 'file3', 'folder1', 'folder2']
      }

      await renderResultView(container, mockQuestion, result, onBackToSelect, onRetry)

      const retryButton = container.querySelector('#retry-btn') as HTMLButtonElement
      expect(retryButton.type).toBe('button')

      const selectButton = container.querySelector('#select-btn') as HTMLButtonElement
      expect(selectButton.type).toBe('button')
    })

    it('should hide decorative marks from screen readers', async () => {
      const result = {
        correct: ['file1'],
        incorrect: ['file2', 'file3', 'folder1', 'folder2']
      }

      await renderResultView(container, mockQuestion, result, onBackToSelect, onRetry)

      const resultItems = container.querySelectorAll('.result-item')
      resultItems.forEach(item => {
        const mark = item.querySelector('span[aria-hidden="true"]')
        expect(mark).toBeTruthy()
      })
    })

    it('should provide accessible labels for result items', async () => {
      const result = {
        correct: ['file1', 'folder1'],
        incorrect: ['file2', 'file3', 'folder2']
      }

      await renderResultView(container, mockQuestion, result, onBackToSelect, onRetry)

      const resultItems = container.querySelectorAll('.result-item')

      // 正解アイテムのaria-label確認
      const correctItem = Array.from(resultItems).find(item =>
        item.textContent?.includes('ファイル1.txt')
      )
      expect(correctItem?.getAttribute('aria-label')).toBe('正解: ファイル1.txt')

      // 不正解アイテムのaria-label確認
      const incorrectItem = Array.from(resultItems).find(item =>
        item.textContent?.includes('ファイル2.txt')
      )
      expect(incorrectItem?.getAttribute('aria-label')).toBe('不正解: ファイル2.txt')
    })
  })
})
