/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderGameView, destroyGameView } from './GameView'
import type { Question } from '../models/types'

describe('GameView', () => {
  let container: HTMLElement

  const mockQuestion: Question = {
    id: 'test-1',
    title: 'テスト問題',
    mode: 'exercise',
    instructions: ['指示1', '指示2'],
    items: [
      { id: 'folder1', name: 'フォルダ1', type: 'folder' },
    ],
    answer: {}
  }

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    destroyGameView()
    document.body.removeChild(container)
  })

  describe('画面構成', () => {
    it('指示エリアを表示する', () => {
      const onComplete = vi.fn()
      const onBack = vi.fn()
      renderGameView(container, mockQuestion, onComplete, onBack)

      const instructionArea = container.querySelector('.instruction-area')
      expect(instructionArea).toBeTruthy()
      expect(instructionArea?.textContent).toContain('テスト問題')
      expect(instructionArea?.textContent).toContain('指示1')
      expect(instructionArea?.textContent).toContain('指示2')
    })

    it('パンくずパネルを表示する', () => {
      const onComplete = vi.fn()
      const onBack = vi.fn()
      renderGameView(container, mockQuestion, onComplete, onBack)

      const breadcrumbPanel = container.querySelector('.breadcrumb-panel')
      expect(breadcrumbPanel).toBeTruthy()
    })

    it('作業エリア（tree + icon）を表示する', () => {
      const onComplete = vi.fn()
      const onBack = vi.fn()
      renderGameView(container, mockQuestion, onComplete, onBack)

      const treePanel = container.querySelector('.tree-panel')
      const iconPanel = container.querySelector('.icon-panel')
      expect(treePanel).toBeTruthy()
      expect(iconPanel).toBeTruthy()
    })

    it('アクションエリアを表示する', () => {
      const onComplete = vi.fn()
      const onBack = vi.fn()
      renderGameView(container, mockQuestion, onComplete, onBack)

      const actionArea = container.querySelector('.action-area')
      expect(actionArea).toBeTruthy()
    })
  })

  describe('ボタン表示', () => {
    it('演習モードでは答え合わせボタンを表示する', () => {
      const onComplete = vi.fn()
      const onBack = vi.fn()
      renderGameView(container, mockQuestion, onComplete, onBack)

      const checkBtn = container.querySelector('#check-btn')
      expect(checkBtn).toBeTruthy()
      expect(checkBtn?.textContent).toBe('答え合わせ')
    })

    it('練習モードでは答え合わせボタンを表示しない', () => {
      const practiceQuestion = { ...mockQuestion, mode: 'practice' as const }
      const onComplete = vi.fn()
      const onBack = vi.fn()
      renderGameView(container, practiceQuestion, onComplete, onBack)

      const checkBtn = container.querySelector('#check-btn')
      expect(checkBtn).toBeFalsy()
    })

    it('常に戻るボタンを表示する', () => {
      const onComplete = vi.fn()
      const onBack = vi.fn()
      renderGameView(container, mockQuestion, onComplete, onBack)

      const backBtn = container.querySelector('#back-btn')
      expect(backBtn).toBeTruthy()
      expect(backBtn?.textContent).toBe('問題選択に戻る')
    })
  })

  describe('セマンティック構造', () => {
    it('指示エリアがsection要素でaria-labelを持つ', () => {
      const onComplete = vi.fn()
      const onBack = vi.fn()
      renderGameView(container, mockQuestion, onComplete, onBack)

      const section = container.querySelector('section.instruction-area')
      expect(section).toBeTruthy()
      expect(section?.getAttribute('aria-label')).toBe('問題の指示')
    })

    it('パンくずパネルがnav要素でaria-labelを持つ', () => {
      const onComplete = vi.fn()
      const onBack = vi.fn()
      renderGameView(container, mockQuestion, onComplete, onBack)

      const nav = container.querySelector('nav.breadcrumb-panel')
      expect(nav).toBeTruthy()
      expect(nav?.getAttribute('aria-label')).toBe('フォルダの階層')
    })

    it('ツリーパネルがnav要素でaria-labelを持つ', () => {
      const onComplete = vi.fn()
      const onBack = vi.fn()
      renderGameView(container, mockQuestion, onComplete, onBack)

      const nav = container.querySelector('nav.tree-panel')
      expect(nav).toBeTruthy()
      expect(nav?.getAttribute('aria-label')).toBe('フォルダツリー')
    })

    it('アイコンパネルがmain要素でaria-labelを持つ', () => {
      const onComplete = vi.fn()
      const onBack = vi.fn()
      renderGameView(container, mockQuestion, onComplete, onBack)

      const main = container.querySelector('main.icon-panel')
      expect(main).toBeTruthy()
      expect(main?.getAttribute('aria-label')).toBe('ファイル一覧')
    })

    it('アクションエリアがfooter要素である', () => {
      const onComplete = vi.fn()
      const onBack = vi.fn()
      renderGameView(container, mockQuestion, onComplete, onBack)

      const footer = container.querySelector('footer.action-area')
      expect(footer).toBeTruthy()
    })

    it('ボタンがtype=button属性を持つ', () => {
      const onComplete = vi.fn()
      const onBack = vi.fn()
      renderGameView(container, mockQuestion, onComplete, onBack)

      const buttons = container.querySelectorAll('button')
      buttons.forEach(button => {
        expect(button.getAttribute('type')).toBe('button')
      })
    })
  })
})
