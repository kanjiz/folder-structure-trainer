/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createIconViewDOM } from './IconViewDOM'
import { FileSystemManager } from '../models/FileSystemManager'
import { UIStateManager } from '../models/UIStateManager'
import type { Question } from '../models/types'

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
    it('空白エリアをクリックすると選択が解除される', () => {
      // いくつかのアイテムを選択
      uiState.toggleSelection('file1')
      uiState.toggleSelection('file2')
      expect(uiState.selection.size).toBe(2)

      // 空白エリアをクリック（main要素）
      const main = container.querySelector<HTMLElement>('main.icon-view-dom')
      expect(main).toBeTruthy()
      const clickEvent = new MouseEvent('click', { bubbles: true })
      main!.dispatchEvent(clickEvent)

      // 選択が解除されているか確認
      expect(uiState.selection.size).toBe(0)
      expect(onUpdate).toHaveBeenCalled()
    })

    it('アイコンアイテムをクリックしても選択は解除されない', () => {
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

    it('選択がない状態で空白エリアをクリックしても何も起きない', () => {
      // 何も選択していない状態
      expect(uiState.selection.size).toBe(0)

      // onUpdate の呼び出し回数をリセット
      onUpdate.mockClear()

      // 空白エリアをクリック（main要素）
      const main = container.querySelector<HTMLElement>('main.icon-view-dom')
      expect(main).toBeTruthy()
      const clickEvent = new MouseEvent('click', { bubbles: true })
      main!.dispatchEvent(clickEvent)

      // onUpdate は呼ばれない（選択がないので）
      expect(onUpdate).not.toHaveBeenCalled()
      expect(uiState.selection.size).toBe(0)
    })
  })

  describe('キーボードショートカット - 切り取り', () => {
    it('クリックするとアイテムにフォーカスが移る', () => {
      // アイコンアイテムを取得
      const iconItem = container.querySelector<HTMLElement>('.icon-item')
      expect(iconItem).toBeTruthy()

      // クリックイベントをディスパッチ
      const clickEvent = new MouseEvent('click', { bubbles: true })
      iconItem!.dispatchEvent(clickEvent)

      // アイテムにフォーカスが移っているべき
      expect(document.activeElement).toBe(iconItem)
    })

    it('DOM再描画後もフォーカスが保持される', () => {
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

    it('Ctrl+Xで選択したアイテムを切り取る', () => {
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

    it('Cmd+Xで選択したアイテムを切り取る（Mac）', () => {
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

    it('Cmd+Xで複数選択したアイテムを切り取る', () => {
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

    it('選択がない状態でCmd+Xを押しても何も起きない', () => {
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
    it('空のフォルダでコンテナがフォーカス可能になる', () => {
      // フォルダに移動（空のフォルダをシミュレート）
      const folder = manager.root.children.find(n => n.type === 'folder')
      expect(folder).toBeTruthy()
      uiState.navigateToFolder(folder!)

      // DOM再描画（空のフォルダなので子要素なし）
      createIconViewDOM(container, manager, uiState, onUpdate)

      // main要素がフォーカス可能になっているべき（tabIndexが設定されている）
      const main = container.querySelector<HTMLElement>('main.icon-view-dom')
      expect(main).toBeTruthy()
      expect(main!.tabIndex).toBeGreaterThanOrEqual(0)
    })

    it('空のフォルダに移動すると自動的にコンテナにフォーカスが移る', () => {
      // フォルダに移動（空のフォルダをシミュレート）
      const folder = manager.root.children.find(n => n.type === 'folder')
      expect(folder).toBeTruthy()
      uiState.navigateToFolder(folder!)

      // DOM再描画（空のフォルダなので子要素なし）
      createIconViewDOM(container, manager, uiState, onUpdate)

      // 空のフォルダでは自動的にmain要素にフォーカスが移るべき
      const main = container.querySelector<HTMLElement>('main.icon-view-dom')
      expect(document.activeElement).toBe(main)
    })

    it('空のフォルダでクリックなしでCmd+Vでアイテムを貼り付ける', () => {
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

      // 自動的にmain要素にフォーカスが移っているはず（クリック不要）
      const main = container.querySelector<HTMLElement>('main.icon-view-dom')
      expect(document.activeElement).toBe(main)

      // Cmd+V キーイベントをディスパッチ
      const keyEvent = new KeyboardEvent('keydown', {
        key: 'v',
        metaKey: true,
        bubbles: true
      })
      main!.dispatchEvent(keyEvent)

      // 貼り付けが実行されるべき
      expect(onUpdate).toHaveBeenCalled()
      // クリップボードがクリアされるべき
      expect(uiState.clipboard.size).toBe(0)
    })
  })

  describe('セマンティック構造', () => {
    it('main要素でaria-labelを持つ', () => {
      const main = container.querySelector('main.icon-view-dom')
      expect(main).toBeTruthy()
      expect(main?.getAttribute('aria-label')).toBe('ファイル一覧')
    })

    it('アイコンアイテムがrole=buttonとaria-selected属性を持つ', () => {
      const item = container.querySelector('.icon-item')
      expect(item?.getAttribute('role')).toBe('button')
      expect(item?.hasAttribute('aria-selected')).toBe(true)
      expect(item?.hasAttribute('aria-label')).toBe(true)
    })

    it('選択されたアイテムのaria-selectedがtrueになる', () => {
      uiState.toggleSelection('file1')
      createIconViewDOM(container, manager, uiState, onUpdate)

      const items = container.querySelectorAll('.icon-item')
      const selectedItem = Array.from(items).find(item =>
        (item as HTMLElement).dataset.nodeId === 'file1'
      )

      expect(selectedItem?.getAttribute('aria-selected')).toBe('true')
    })
  })
})
