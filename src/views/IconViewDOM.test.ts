/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createIconViewDOM } from './IconViewDOM'
import { FileSystemManager } from '../models/FileSystemManager'
import { UIStateManager } from '../models/UIStateManager'
import type { Question } from '../models/FileSystem'

describe('IconViewDOM', () => {
  let container: HTMLElement
  let manager: FileSystemManager
  let uiState: UIStateManager
  let onUpdate: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // コンテナ要素を作成
    container = document.createElement('div')
    document.body.appendChild(container)

    // FileSystemManager をセットアップ
    manager = new FileSystemManager()
    const mockQuestion: Question = {
      id: 'test-1',
      title: 'テスト問題',
      mode: 'practice',
      instructions: [],
      items: [
        { id: 'file1', name: 'ファイル1.txt', type: 'file', path: 'Desktop' },
        { id: 'file2', name: 'ファイル2.txt', type: 'file', path: 'Desktop' },
        { id: 'folder1', name: 'フォルダ1', type: 'folder', path: 'Desktop' },
      ],
      answer: {}
    }
    manager.loadQuestion(mockQuestion)

    // UIStateManager をセットアップ
    uiState = new UIStateManager(manager.root)

    // モックコールバック
    onUpdate = vi.fn()

    // IconViewDOM を作成
    createIconViewDOM(container, manager, uiState, onUpdate)
  })

  describe('空白エリアクリックで選択解除', () => {
    it('should clear selection when clicking on empty area', () => {
      // いくつかのアイテムを選択
      uiState.toggleSelection('file1')
      uiState.toggleSelection('file2')
      expect(uiState.selection.size).toBe(2)

      // 空白エリアをクリック（コンテナ直接）
      const clickEvent = new MouseEvent('click', { bubbles: true })
      container.dispatchEvent(clickEvent)

      // 選択が解除されているか確認
      expect(uiState.selection.size).toBe(0)
      expect(onUpdate).toHaveBeenCalled()
    })

    it('should not clear selection when clicking on an icon item', () => {
      // アイテムを選択
      uiState.toggleSelection('file1')
      expect(uiState.selection.size).toBe(1)

      // アイコンアイテムをクリック
      const iconItem = container.querySelector('.icon-item')
      expect(iconItem).toBeTruthy()

      const clickEvent = new MouseEvent('click', { bubbles: true })
      iconItem!.dispatchEvent(clickEvent)

      // 選択が変わらない（または通常のクリック処理）
      // この場合、通常クリックで単一選択になるので、まだ1つ選択されている
      expect(uiState.selection.size).toBeGreaterThanOrEqual(1)
    })

    it('should do nothing when clicking empty area with no selection', () => {
      // 何も選択していない状態
      expect(uiState.selection.size).toBe(0)

      // onUpdate の呼び出し回数をリセット
      onUpdate.mockClear()

      // 空白エリアをクリック
      const clickEvent = new MouseEvent('click', { bubbles: true })
      container.dispatchEvent(clickEvent)

      // onUpdate は呼ばれない（選択がないので）
      expect(onUpdate).not.toHaveBeenCalled()
      expect(uiState.selection.size).toBe(0)
    })
  })
})
