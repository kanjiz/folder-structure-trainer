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
        { id: 'file1', name: 'ファイル1.txt', type: 'file' },
        { id: 'file2', name: 'ファイル2.txt', type: 'file' },
        { id: 'folder1', name: 'フォルダ1', type: 'folder' },
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

  describe('キーボードショートカット - 切り取り', () => {
    it('should focus item when clicked', () => {
      // アイコンアイテムを取得
      const iconItem = container.querySelector<HTMLElement>('.icon-item')
      expect(iconItem).toBeTruthy()

      // クリックイベントをディスパッチ
      const clickEvent = new MouseEvent('click', { bubbles: true })
      iconItem!.dispatchEvent(clickEvent)

      // アイテムにフォーカスが移っているべき
      expect(document.activeElement).toBe(iconItem)
    })

    it('should preserve focus after DOM re-render', () => {
      // アイテムをクリックしてフォーカス
      const iconItem = container.querySelector<HTMLElement>('.icon-item')
      expect(iconItem).toBeTruthy()
      const nodeId = iconItem!.dataset.nodeId

      iconItem!.click()
      expect(document.activeElement).toBe(iconItem)

      // DOM再描画（createIconViewDOMを再実行）
      createIconViewDOM(container, manager, uiState, onUpdate)

      // 同じnodeIdの要素にフォーカスが保持されているべき
      const newIconItem = container.querySelector<HTMLElement>(`[data-node-id="${nodeId}"]`)
      expect(document.activeElement).toBe(newIconItem)
    })

    it('should cut selected item with Ctrl+X', () => {
      // アイテムをクリックして選択
      const iconItem = container.querySelector<HTMLElement>('.icon-item')
      expect(iconItem).toBeTruthy()
      iconItem!.click()

      // 選択されていることを確認
      expect(uiState.selection.size).toBe(1)
      expect(uiState.clipboard.size).toBe(0)

      // Ctrl+X キーイベントをディスパッチ
      const keyEvent = new KeyboardEvent('keydown', {
        key: 'x',
        ctrlKey: true,
        bubbles: true
      })
      iconItem!.dispatchEvent(keyEvent)

      // クリップボードに入っているべき
      expect(uiState.clipboard.size).toBe(1)
      expect(onUpdate).toHaveBeenCalled()
    })

    it('should cut selected item with Cmd+X on Mac', () => {
      // アイテムをクリックして選択
      const iconItem = container.querySelector<HTMLElement>('.icon-item')
      expect(iconItem).toBeTruthy()
      iconItem!.click()

      // 選択されていることを確認
      expect(uiState.selection.size).toBe(1)
      expect(uiState.clipboard.size).toBe(0)

      // Cmd+X キーイベントをディスパッチ
      const keyEvent = new KeyboardEvent('keydown', {
        key: 'x',
        metaKey: true,
        bubbles: true
      })
      iconItem!.dispatchEvent(keyEvent)

      // クリップボードに入っているべき
      expect(uiState.clipboard.size).toBe(1)
      expect(onUpdate).toHaveBeenCalled()
    })

    it('should cut multiple selected items with Cmd+X', () => {
      // 複数のアイテムを選択
      uiState.toggleSelection('file1')
      uiState.toggleSelection('file2')
      expect(uiState.selection.size).toBe(2)

      // アイテムをクリック（フォーカスを移すため）
      const iconItem = container.querySelector<HTMLElement>('.icon-item')
      iconItem!.click()

      // Cmd+X キーイベントをディスパッチ
      const keyEvent = new KeyboardEvent('keydown', {
        key: 'x',
        metaKey: true,
        bubbles: true
      })
      iconItem!.dispatchEvent(keyEvent)

      // 複数アイテムがクリップボードに入っているべき
      expect(uiState.clipboard.size).toBeGreaterThan(0)
      expect(onUpdate).toHaveBeenCalled()
    })

    it('should do nothing when pressing Cmd+X without selection', () => {
      // 何も選択していない状態
      expect(uiState.selection.size).toBe(0)

      // onUpdate の呼び出し回数をリセット
      onUpdate.mockClear()

      // アイテムをクリック（選択しない）
      const iconItem = container.querySelector<HTMLElement>('.icon-item')
      const clickEvent = new MouseEvent('click', { bubbles: true })
      iconItem!.dispatchEvent(clickEvent)

      // 選択をクリア
      uiState.clearSelection()
      onUpdate.mockClear()

      // Cmd+X キーイベントをディスパッチ
      const keyEvent = new KeyboardEvent('keydown', {
        key: 'x',
        metaKey: true,
        bubbles: true
      })
      iconItem!.dispatchEvent(keyEvent)

      // 何も起きないべき
      expect(uiState.clipboard.size).toBe(0)
      expect(onUpdate).not.toHaveBeenCalled()
    })
  })

  describe('キーボードショートカット - 貼り付け（空のフォルダ）', () => {
    it('should make container focusable for empty folders', () => {
      // フォルダに移動（空のフォルダをシミュレート）
      const folder = manager.root.children.find(n => n.type === 'folder')
      expect(folder).toBeTruthy()
      uiState.navigateToFolder(folder!)

      // DOM再描画（空のフォルダなので子要素なし）
      createIconViewDOM(container, manager, uiState, onUpdate)

      // コンテナがフォーカス可能になっているべき（tabIndexが設定されている）
      expect(container.tabIndex).toBeGreaterThanOrEqual(0)
    })

    it('should paste items in empty folder with Cmd+V', () => {
      // アイテムをクリップボードに入れる
      uiState.toggleSelection('file1')
      uiState.cut()
      expect(uiState.clipboard.size).toBe(1)

      // フォルダに移動（空のフォルダをシミュレート）
      const folder = manager.root.children.find(n => n.type === 'folder')
      expect(folder).toBeTruthy()
      uiState.navigateToFolder(folder!)

      // DOM再描画（空のフォルダなので子要素なし）
      createIconViewDOM(container, manager, uiState, onUpdate)
      onUpdate.mockClear()

      // コンテナ自体にフォーカスを移す
      container.focus()
      expect(document.activeElement).toBe(container)

      // Cmd+V キーイベントをディスパッチ
      const keyEvent = new KeyboardEvent('keydown', {
        key: 'v',
        metaKey: true,
        bubbles: true
      })
      container.dispatchEvent(keyEvent)

      // 貼り付けが実行されるべき
      expect(onUpdate).toHaveBeenCalled()
      // クリップボードがクリアされるべき
      expect(uiState.clipboard.size).toBe(0)
    })
  })
})
