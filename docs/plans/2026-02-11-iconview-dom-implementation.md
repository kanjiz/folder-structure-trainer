# IconView DOM化 実装計画

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** IconViewをp5.jsからDOMベースに移行し、Windows準拠のドラッグ&ドロップ操作を実現する

**Architecture:** UIStateManagerでUI状態を管理、BreadcrumbViewを新規追加、IconViewをDOM実装に置き換え、TreeViewにドロップ機能を追加。既存のp5.js実装は並行して保持し、完成後に切り替え。

**Tech Stack:** TypeScript, HTML5 Drag and Drop API, CSS Grid, Vitest

---

## Task 1: UIStateManagerの作成

**Files:**
- Create: `src/models/UIStateManager.ts`
- Create: `src/models/UIStateManager.test.ts`

**Step 1: テストファイルを作成**

`src/models/UIStateManager.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { UIStateManager } from './UIStateManager'
import { FSNode } from './FileSystem'

describe('UIStateManager', () => {
  let uiState: UIStateManager
  let mockRoot: FSNode

  beforeEach(() => {
    mockRoot = {
      id: 'root',
      name: 'Desktop',
      type: 'folder',
      parent: null,
      children: [],
      addChild: () => {},
      removeChild: () => {},
    }
    uiState = new UIStateManager(mockRoot)
  })

  describe('selection', () => {
    it('should initialize with empty selection', () => {
      expect(uiState.selection.size).toBe(0)
    })

    it('should add items to selection', () => {
      uiState.toggleSelection('item1')
      expect(uiState.isSelected('item1')).toBe(true)
    })

    it('should remove items from selection when toggled again', () => {
      uiState.toggleSelection('item1')
      uiState.toggleSelection('item1')
      expect(uiState.isSelected('item1')).toBe(false)
    })

    it('should clear all selections', () => {
      uiState.toggleSelection('item1')
      uiState.toggleSelection('item2')
      uiState.clearSelection()
      expect(uiState.selection.size).toBe(0)
    })
  })

  describe('clipboard', () => {
    it('should initialize with empty clipboard', () => {
      expect(uiState.clipboard.size).toBe(0)
    })

    it('should cut items to clipboard', () => {
      uiState.toggleSelection('item1')
      uiState.cut()
      expect(uiState.clipboard.has('item1')).toBe(true)
      expect(uiState.selection.size).toBe(0)
    })

    it('should clear clipboard', () => {
      uiState.toggleSelection('item1')
      uiState.cut()
      uiState.clearClipboard()
      expect(uiState.clipboard.size).toBe(0)
    })
  })

  describe('currentFolder', () => {
    it('should initialize with root folder', () => {
      expect(uiState.currentFolder).toBe(mockRoot)
    })

    it('should navigate to folder', () => {
      const childFolder: FSNode = {
        id: 'child',
        name: 'Child',
        type: 'folder',
        parent: mockRoot,
        children: [],
        addChild: () => {},
        removeChild: () => {},
      }
      uiState.navigateToFolder(childFolder)
      expect(uiState.currentFolder).toBe(childFolder)
    })
  })
})
```

**Step 2: テストを実行して失敗を確認**

Run: `npm test UIStateManager.test.ts`
Expected: FAIL with "Cannot find module './UIStateManager'"

**Step 3: UIStateManagerを実装**

`src/models/UIStateManager.ts`:
```typescript
import type { FSNode } from './FileSystem'

/**
 * UI状態を管理するクラス
 * データ層（FileSystemManager）とUI層を分離
 */
export class UIStateManager {
  /** 選択中のノードID */
  selection: Set<string>

  /** クリップボード（切り取り中のノードID） */
  clipboard: Set<string>

  /** 現在表示中のフォルダ */
  currentFolder: FSNode

  constructor(initialFolder: FSNode) {
    this.selection = new Set()
    this.clipboard = new Set()
    this.currentFolder = initialFolder
  }

  /**
   * 選択状態をトグル
   */
  toggleSelection(nodeId: string): void {
    if (this.selection.has(nodeId)) {
      this.selection.delete(nodeId)
    } else {
      this.selection.add(nodeId)
    }
  }

  /**
   * アイテムが選択されているか確認
   */
  isSelected(nodeId: string): boolean {
    return this.selection.has(nodeId)
  }

  /**
   * 選択を全てクリア
   */
  clearSelection(): void {
    this.selection.clear()
  }

  /**
   * 選択中のアイテムをクリップボードに切り取り
   */
  cut(): void {
    this.clipboard = new Set(this.selection)
    this.selection.clear()
  }

  /**
   * クリップボードをクリア
   */
  clearClipboard(): void {
    this.clipboard.clear()
  }

  /**
   * フォルダに移動
   */
  navigateToFolder(folder: FSNode): void {
    if (folder.type !== 'folder') {
      throw new Error('Cannot navigate to a file')
    }
    this.currentFolder = folder
  }
}
```

**Step 4: テストを実行して成功を確認**

Run: `npm test UIStateManager.test.ts`
Expected: All tests PASS

**Step 5: コミット**

```bash
git add src/models/UIStateManager.ts src/models/UIStateManager.test.ts
git commit -m "feat: add UIStateManager for UI state management

- 選択状態の管理（selection: Set<string>）
- クリップボードの管理（clipboard: Set<string>）
- 現在フォルダの管理（currentFolder: FSNode）
- データ層とUI層を分離する設計

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: BreadcrumbViewの基本実装

**Files:**
- Create: `src/views/BreadcrumbView.ts`
- Modify: `src/style.css` (CSSスタイルを追加)

**Step 1: BreadcrumbViewの骨格を作成**

`src/views/BreadcrumbView.ts`:
```typescript
import type { FSNode } from '../models/FileSystem'
import type { FileSystemManager } from '../models/FileSystemManager'

/**
 * パンくずリストを表示するビュー
 */
export function renderBreadcrumbView(
  container: HTMLElement,
  currentFolder: FSNode,
  manager: FileSystemManager,
  onNavigate: (folder: FSNode) => void
): void {
  container.innerHTML = ''
  container.className = 'breadcrumb-view'

  const path = getPath(currentFolder, manager)
  const parts = path.split(' > ')
  const folders = getFolders(currentFolder, manager)

  parts.forEach((part, index) => {
    const span = document.createElement('span')
    span.className = 'breadcrumb-item'
    span.textContent = part
    span.dataset.depth = index.toString()

    // クリックでナビゲーション
    span.addEventListener('click', () => {
      onNavigate(folders[index])
    })

    container.appendChild(span)

    if (index < parts.length - 1) {
      const separator = document.createElement('span')
      separator.className = 'breadcrumb-separator'
      separator.textContent = ' > '
      container.appendChild(separator)
    }
  })
}

/**
 * 現在のフォルダまでのパスを取得
 */
function getPath(node: FSNode, manager: FileSystemManager): string {
  const parts: string[] = []
  let current: FSNode | null = node
  while (current && current !== manager.root) {
    parts.unshift(current.name)
    current = current.parent
  }
  parts.unshift('Desktop')
  return parts.join(' > ')
}

/**
 * 現在のフォルダまでのフォルダ配列を取得
 */
function getFolders(node: FSNode, manager: FileSystemManager): FSNode[] {
  const folders: FSNode[] = []
  let current: FSNode | null = node
  while (current && current !== manager.root) {
    folders.unshift(current)
    current = current.parent
  }
  folders.unshift(manager.root)
  return folders
}
```

**Step 2: CSSスタイルを追加**

`src/style.css` に追加:
```css
/* Breadcrumb View */
.breadcrumb-view {
  padding: 12px 20px;
  background-color: #f0f0f0;
  border-bottom: 1px solid #ccc;
  font-family: 'BIZ UDPGothic', sans-serif;
  font-size: 14px;
  display: flex;
  align-items: center;
}

.breadcrumb-item {
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.breadcrumb-item:hover {
  background-color: rgba(0, 120, 215, 0.1);
}

.breadcrumb-separator {
  color: #666;
  margin: 0 4px;
}
```

**Step 3: 動作確認のため、一時的にmain.tsで確認**

`src/main.ts` に一時的なテストコードを追加（後で削除）:
```typescript
import { renderBreadcrumbView } from './views/BreadcrumbView'
import { FileSystemManager } from './models/FileSystemManager'

// テスト用の簡単な問題データ
const testQuestion = {
  id: 'test',
  title: 'Test',
  mode: 'practice' as const,
  instructions: [],
  items: [
    { id: 'f1', name: 'Folder1', type: 'folder' as const },
  ],
  answer: {}
}

const manager = new FileSystemManager()
manager.loadQuestion(testQuestion)

const container = document.createElement('div')
document.body.appendChild(container)

renderBreadcrumbView(container, manager.root, manager, (folder) => {
  console.log('Navigated to:', folder.name)
  renderBreadcrumbView(container, folder, manager, () => {})
})
```

Run: `npm run dev`
Expected: ブラウザで「Desktop」のパンくずが表示され、クリックでログが出力される

**Step 4: テストコードを削除**

`src/main.ts` から追加したテストコードを削除

**Step 5: コミット**

```bash
git add src/views/BreadcrumbView.ts src/style.css
git commit -m "feat: add BreadcrumbView for navigation

- パス表示（Desktop > Folder1 > Folder2）
- クリックでナビゲーション
- Windows準拠のデザイン

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: IconViewのDOM化（基本レイアウト）

**Files:**
- Create: `src/views/IconViewDOM.ts`
- Modify: `src/style.css`

**Step 1: IconViewDOMの骨格を作成**

`src/views/IconViewDOM.ts`:
```typescript
import type { FSNode } from '../models/FileSystem'
import type { FileSystemManager } from '../models/FileSystemManager'
import type { UIStateManager } from '../models/UIStateManager'

/**
 * DOM版のIconView
 * 将来的に既存のIconView.tsと置き換える
 */
export function createIconViewDOM(
  container: HTMLElement,
  manager: FileSystemManager,
  uiState: UIStateManager,
  onUpdate: () => void
): void {
  renderIconViewDOM(container, manager, uiState, onUpdate)
}

/**
 * IconViewを再描画
 */
function renderIconViewDOM(
  container: HTMLElement,
  manager: FileSystemManager,
  uiState: UIStateManager,
  onUpdate: () => void
): void {
  container.innerHTML = ''
  container.className = 'icon-view-dom'

  const items = uiState.currentFolder.children

  items.forEach(node => {
    const itemEl = createIconItem(node, uiState, manager, onUpdate)
    container.appendChild(itemEl)
  })
}

/**
 * アイコンアイテムを作成
 */
function createIconItem(
  node: FSNode,
  uiState: UIStateManager,
  manager: FileSystemManager,
  onUpdate: () => void
): HTMLElement {
  const div = document.createElement('div')
  div.className = 'icon-item'
  div.dataset.nodeId = node.id
  div.tabIndex = 0

  if (uiState.isSelected(node.id)) {
    div.classList.add('selected')
  }

  // アイコンと名前
  const icon = document.createElement('div')
  icon.className = 'icon-symbol'
  icon.textContent = node.type === 'folder' ? '📁' : '📄'
  div.appendChild(icon)

  const name = document.createElement('div')
  name.className = 'icon-name'
  name.textContent = node.name
  div.appendChild(name)

  // クリックイベント（選択）
  div.addEventListener('click', (e) => {
    handleItemClick(node.id, e, uiState, manager, onUpdate)
  })

  // ダブルクリックイベント（フォルダを開く）
  div.addEventListener('dblclick', () => {
    if (node.type === 'folder') {
      uiState.navigateToFolder(node)
      onUpdate()
    }
  })

  return div
}

/**
 * アイテムクリックを処理
 */
function handleItemClick(
  nodeId: string,
  event: MouseEvent,
  uiState: UIStateManager,
  manager: FileSystemManager,
  onUpdate: () => void
): void {
  if (event.ctrlKey || event.metaKey) {
    // Ctrl+クリック：トグル選択
    uiState.toggleSelection(nodeId)
  } else {
    // 通常クリック：単一選択
    uiState.clearSelection()
    uiState.toggleSelection(nodeId)
  }
  onUpdate()
}

/**
 * IconViewDOMを破棄
 */
export function destroyIconViewDOM(): void {
  // 現時点では特に何もしない
  // 将来的にイベントリスナーのクリーンアップなどが必要になる可能性
}
```

**Step 2: CSSスタイルを追加**

`src/style.css` に追加:
```css
/* Icon View DOM */
.icon-view-dom {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 16px;
  padding: 20px;
  background-color: white;
  flex: 1;
  overflow-y: auto;
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.2s ease, background-color 0.2s ease;
  outline: none;
}

.icon-item:hover {
  background-color: rgba(0, 0, 0, 0.05);
  transform: scale(1.05);
}

.icon-item.selected {
  background-color: rgba(0, 120, 215, 0.3);
}

.icon-item:focus {
  box-shadow: 0 0 0 2px rgba(0, 120, 215, 0.5);
}

.icon-symbol {
  font-size: 48px;
  margin-bottom: 8px;
}

.icon-name {
  font-family: 'BIZ UDPGothic', sans-serif;
  font-size: 14px;
  text-align: center;
  word-break: break-word;
  max-width: 100px;
}
```

**Step 3: 動作確認**

`src/main.ts` に一時的なテストコード:
```typescript
import { createIconViewDOM } from './views/IconViewDOM'
import { FileSystemManager } from './models/FileSystemManager'
import { UIStateManager } from './models/UIStateManager'

const testQuestion = {
  id: 'test',
  title: 'Test',
  mode: 'practice' as const,
  instructions: [],
  items: [
    { id: 'f1', name: 'Folder1', type: 'folder' as const },
    { id: 'f2', name: 'File1.txt', type: 'file' as const },
  ],
  answer: {}
}

const manager = new FileSystemManager()
manager.loadQuestion(testQuestion)

const uiState = new UIStateManager(manager.root)

const container = document.createElement('div')
container.style.height = '400px'
document.body.appendChild(container)

createIconViewDOM(container, manager, uiState, () => {
  createIconViewDOM(container, manager, uiState, () => {})
})
```

Run: `npm run dev`
Expected: グリッドレイアウトでアイコンが表示され、クリックで選択、ダブルクリックでフォルダを開く

**Step 4: テストコードを削除**

**Step 5: コミット**

```bash
git add src/views/IconViewDOM.ts src/style.css
git commit -m "feat: add IconViewDOM with basic grid layout

- CSS Gridでアイコン配置
- 単一選択（クリック）とCtrl+クリック（トグル選択）
- ダブルクリックでフォルダを開く
- 選択状態の視覚化

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: IconViewの複数選択機能

**Files:**
- Modify: `src/views/IconViewDOM.ts`
- Modify: `src/models/UIStateManager.ts`

**Step 1: UIStateManagerにShift+クリック範囲選択を追加**

`src/models/UIStateManager.ts` に追加:
```typescript
  /** 最後に選択したノードID（範囲選択用） */
  private lastSelectedId: string | null = null

  /**
   * 範囲選択
   */
  selectRange(nodeIds: string[], startId: string, endId: string): void {
    const startIndex = nodeIds.indexOf(startId)
    const endIndex = nodeIds.indexOf(endId)

    if (startIndex === -1 || endIndex === -1) {
      return
    }

    const [begin, end] = startIndex < endIndex
      ? [startIndex, endIndex]
      : [endIndex, startIndex]

    this.selection.clear()
    for (let i = begin; i <= end; i++) {
      this.selection.add(nodeIds[i])
    }
  }

  /**
   * 最後に選択したIDを記録
   */
  setLastSelected(nodeId: string): void {
    this.lastSelectedId = nodeId
  }

  /**
   * 最後に選択したIDを取得
   */
  getLastSelected(): string | null {
    return this.lastSelectedId
  }
```

**Step 2: IconViewDOMにShift+クリック処理を追加**

`src/views/IconViewDOM.ts` の `handleItemClick` を修正:
```typescript
function handleItemClick(
  nodeId: string,
  event: MouseEvent,
  uiState: UIStateManager,
  manager: FileSystemManager,
  onUpdate: () => void
): void {
  const items = uiState.currentFolder.children
  const nodeIds = items.map(n => n.id)

  if (event.ctrlKey || event.metaKey) {
    // Ctrl+クリック：トグル選択
    uiState.toggleSelection(nodeId)
    uiState.setLastSelected(nodeId)
  } else if (event.shiftKey) {
    // Shift+クリック：範囲選択
    const lastSelected = uiState.getLastSelected()
    if (lastSelected) {
      uiState.selectRange(nodeIds, lastSelected, nodeId)
    } else {
      uiState.clearSelection()
      uiState.toggleSelection(nodeId)
    }
    uiState.setLastSelected(nodeId)
  } else {
    // 通常クリック：単一選択
    uiState.clearSelection()
    uiState.toggleSelection(nodeId)
    uiState.setLastSelected(nodeId)
  }
  onUpdate()
}
```

**Step 3: UIStateManagerのテストを更新**

`src/models/UIStateManager.test.ts` に追加:
```typescript
  describe('range selection', () => {
    it('should select range between two items', () => {
      const nodeIds = ['item1', 'item2', 'item3', 'item4']
      uiState.setLastSelected('item1')
      uiState.selectRange(nodeIds, 'item1', 'item3')

      expect(uiState.isSelected('item1')).toBe(true)
      expect(uiState.isSelected('item2')).toBe(true)
      expect(uiState.isSelected('item3')).toBe(true)
      expect(uiState.isSelected('item4')).toBe(false)
    })

    it('should select range in reverse order', () => {
      const nodeIds = ['item1', 'item2', 'item3', 'item4']
      uiState.selectRange(nodeIds, 'item3', 'item1')

      expect(uiState.isSelected('item1')).toBe(true)
      expect(uiState.isSelected('item2')).toBe(true)
      expect(uiState.isSelected('item3')).toBe(true)
    })
  })
```

Run: `npm test UIStateManager.test.ts`
Expected: All tests PASS

**Step 4: 動作確認**

Run: `npm run dev`
Expected: Shift+クリックで範囲選択が動作

**Step 5: コミット**

```bash
git add src/views/IconViewDOM.ts src/models/UIStateManager.ts src/models/UIStateManager.test.ts
git commit -m "feat: add Shift+click range selection

- UIStateManagerにselectRange()メソッド追加
- Shift+クリックで範囲選択を実装
- 最後に選択したアイテムを記憶

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: IconViewのドラッグ&ドロップ（基本）

**Files:**
- Modify: `src/views/IconViewDOM.ts`

**Step 1: ドラッグ可能属性を追加**

`src/views/IconViewDOM.ts` の `createIconItem` 関数を修正:
```typescript
function createIconItem(
  node: FSNode,
  uiState: UIStateManager,
  manager: FileSystemManager,
  onUpdate: () => void
): HTMLElement {
  const div = document.createElement('div')
  div.className = 'icon-item'
  div.dataset.nodeId = node.id
  div.tabIndex = 0
  div.draggable = true  // ドラッグ可能に

  // ... 既存のコード ...

  // ドラッグ開始
  div.addEventListener('dragstart', (e) => {
    handleDragStart(e, node, uiState)
  })

  // ドラッグオーバー（ドロップ先の判定）
  div.addEventListener('dragover', (e) => {
    handleDragOver(e, node)
  })

  // ドラッグ離脱
  div.addEventListener('dragleave', (e) => {
    handleDragLeave(e)
  })

  // ドロップ
  div.addEventListener('drop', (e) => {
    handleDrop(e, node, manager, uiState, onUpdate)
  })

  return div
}
```

**Step 2: ドラッグイベントハンドラーを実装**

`src/views/IconViewDOM.ts` に追加:
```typescript
/**
 * ドラッグ開始
 */
function handleDragStart(
  event: DragEvent,
  node: FSNode,
  uiState: UIStateManager
): void {
  if (!event.dataTransfer) return

  // ドラッグ中のアイテムが選択されていない場合は選択
  if (!uiState.isSelected(node.id)) {
    uiState.clearSelection()
    uiState.toggleSelection(node.id)
  }

  // 選択中のアイテムIDをデータ転送
  const selectedIds = Array.from(uiState.selection)
  event.dataTransfer.setData('text/plain', JSON.stringify(selectedIds))
  event.dataTransfer.effectAllowed = 'move'

  // TODO: Task 6で半透明プレビューを実装
}

/**
 * ドラッグオーバー（ドロップ可否の判定）
 */
function handleDragOver(event: DragEvent, targetNode: FSNode): void {
  // フォルダのみドロップ可能
  if (targetNode.type === 'folder') {
    event.preventDefault()
    event.dataTransfer!.dropEffect = 'move'
    ;(event.currentTarget as HTMLElement).classList.add('drop-target')
  } else {
    event.dataTransfer!.dropEffect = 'none'
  }
}

/**
 * ドラッグ離脱
 */
function handleDragLeave(event: DragEvent): void {
  ;(event.currentTarget as HTMLElement).classList.remove('drop-target')
}

/**
 * ドロップ
 */
function handleDrop(
  event: DragEvent,
  targetNode: FSNode,
  manager: FileSystemManager,
  uiState: UIStateManager,
  onUpdate: () => void
): void {
  event.preventDefault()
  ;(event.currentTarget as HTMLElement).classList.remove('drop-target')

  if (targetNode.type !== 'folder') {
    return
  }

  const data = event.dataTransfer?.getData('text/plain')
  if (!data) return

  try {
    const nodeIds: string[] = JSON.parse(data)

    // 各アイテムを移動
    nodeIds.forEach(nodeId => {
      manager.moveNode(nodeId, targetNode.id)
    })

    uiState.clearSelection()
    onUpdate()
  } catch (error) {
    console.error('Drop failed:', error)
  }
}
```

**Step 3: ドロップターゲットのCSSを追加**

`src/style.css` に追加:
```css
.icon-item.drop-target {
  background-color: rgba(0, 120, 215, 0.2);
  box-shadow: 0 0 0 2px rgba(0, 120, 215, 0.8);
}
```

**Step 4: 動作確認**

Run: `npm run dev`
Expected: アイテムをフォルダにドラッグ&ドロップできる。フォルダにホバー時、ハイライト表示される。

**Step 5: コミット**

```bash
git add src/views/IconViewDOM.ts src/style.css
git commit -m "feat: add basic drag and drop functionality

- アイテムをドラッグ可能に
- フォルダへのドロップを実装
- ドロップターゲットのハイライト表示
- 複数選択アイテムをまとめてドロップ

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: ドラッグプレビューの実装

**Files:**
- Modify: `src/views/IconViewDOM.ts`
- Modify: `src/style.css`

**Step 1: ドラッグプレビュー生成関数を追加**

`src/views/IconViewDOM.ts` に追加:
```typescript
/**
 * ドラッグプレビューを作成
 */
function createDragPreview(
  nodeIds: string[],
  manager: FileSystemManager
): HTMLElement {
  const preview = document.createElement('div')
  preview.className = 'drag-preview'

  const maxPreview = 3 // 最大3つまでプレビュー表示

  nodeIds.slice(0, maxPreview).forEach((nodeId, index) => {
    const node = manager.allNodes.get(nodeId)
    if (!node) return

    const item = document.createElement('div')
    item.className = 'drag-preview-item'
    item.style.transform = `translate(${index * 4}px, ${index * 4}px)`

    const icon = document.createElement('span')
    icon.className = 'drag-preview-icon'
    icon.textContent = node.type === 'folder' ? '📁' : '📄'
    item.appendChild(icon)

    const name = document.createElement('span')
    name.className = 'drag-preview-name'
    name.textContent = node.name
    item.appendChild(name)

    preview.appendChild(item)
  })

  // 4つ以上の場合、カウントを表示
  if (nodeIds.length > maxPreview) {
    const badge = document.createElement('div')
    badge.className = 'drag-preview-badge'
    badge.textContent = `+${nodeIds.length - maxPreview}`
    preview.appendChild(badge)
  }

  // プレビューをDOMに一時的に追加（setDragImageのために必要）
  document.body.appendChild(preview)

  return preview
}
```

**Step 2: handleDragStartを修正してプレビューを設定**

`src/views/IconViewDOM.ts` の `handleDragStart` を修正:
```typescript
function handleDragStart(
  event: DragEvent,
  node: FSNode,
  uiState: UIStateManager,
  manager: FileSystemManager
): void {
  if (!event.dataTransfer) return

  // ドラッグ中のアイテムが選択されていない場合は選択
  if (!uiState.isSelected(node.id)) {
    uiState.clearSelection()
    uiState.toggleSelection(node.id)
  }

  // 選択中のアイテムIDをデータ転送
  const selectedIds = Array.from(uiState.selection)
  event.dataTransfer.setData('text/plain', JSON.stringify(selectedIds))
  event.dataTransfer.effectAllowed = 'move'

  // ドラッグプレビューを設定
  const preview = createDragPreview(selectedIds, manager)
  event.dataTransfer.setDragImage(preview, 10, 10)

  // プレビューは即座に削除（ブラウザがキャプチャ済み）
  setTimeout(() => {
    document.body.removeChild(preview)
  }, 0)
}
```

`createIconItem` の `dragstart` イベントリスナーも修正:
```typescript
  div.addEventListener('dragstart', (e) => {
    handleDragStart(e, node, uiState, manager)
  })
```

**Step 3: CSSスタイルを追加**

`src/style.css` に追加:
```css
/* Drag Preview */
.drag-preview {
  position: absolute;
  top: -9999px;
  left: -9999px;
  opacity: 0.8;
  pointer-events: none;
}

.drag-preview-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  margin-bottom: 4px;
  position: relative;
}

.drag-preview-icon {
  font-size: 20px;
}

.drag-preview-name {
  font-family: 'BIZ UDPGothic', sans-serif;
  font-size: 14px;
  white-space: nowrap;
}

.drag-preview-badge {
  position: absolute;
  bottom: -8px;
  right: -8px;
  background-color: #0078d7;
  color: white;
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: bold;
}
```

**Step 4: 動作確認**

Run: `npm run dev`
Expected: ドラッグ時に半透明のプレビューが表示される。複数選択時は重ねて表示され、4つ以上の場合はカウントバッジが表示される。

**Step 5: コミット**

```bash
git add src/views/IconViewDOM.ts src/style.css
git commit -m "feat: add Windows-style drag preview

- 半透明のプレビュー表示
- 複数アイテムを重ねて表示
- 4つ以上の場合はカウントバッジ表示

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: BreadcrumbViewのドロップ対応

**Files:**
- Modify: `src/views/BreadcrumbView.ts`
- Modify: `src/style.css`

**Step 1: BreadcrumbViewにドロップイベントを追加**

`src/views/BreadcrumbView.ts` の `renderBreadcrumbView` 関数を修正:
```typescript
export function renderBreadcrumbView(
  container: HTMLElement,
  currentFolder: FSNode,
  manager: FileSystemManager,
  uiState: UIStateManager,
  onNavigate: (folder: FSNode) => void,
  onUpdate: () => void
): void {
  container.innerHTML = ''
  container.className = 'breadcrumb-view'

  const path = getPath(currentFolder, manager)
  const parts = path.split(' > ')
  const folders = getFolders(currentFolder, manager)

  parts.forEach((part, index) => {
    const span = document.createElement('span')
    span.className = 'breadcrumb-item'
    span.textContent = part
    span.dataset.depth = index.toString()

    // クリックでナビゲーション
    span.addEventListener('click', () => {
      onNavigate(folders[index])
    })

    // ドラッグオーバー
    span.addEventListener('dragover', (e) => {
      e.preventDefault()
      e.dataTransfer!.dropEffect = 'move'
      span.classList.add('drop-target')
    })

    // ドラッグ離脱
    span.addEventListener('dragleave', () => {
      span.classList.remove('drop-target')
    })

    // ドロップ
    span.addEventListener('drop', (e) => {
      e.preventDefault()
      span.classList.remove('drop-target')

      const data = e.dataTransfer?.getData('text/plain')
      if (!data) return

      try {
        const nodeIds: string[] = JSON.parse(data)
        const targetFolder = folders[index]

        // 各アイテムを移動
        nodeIds.forEach(nodeId => {
          manager.moveNode(nodeId, targetFolder.id)
        })

        uiState.clearSelection()
        onUpdate()
      } catch (error) {
        console.error('Drop to breadcrumb failed:', error)
      }
    })

    container.appendChild(span)

    if (index < parts.length - 1) {
      const separator = document.createElement('span')
      separator.className = 'breadcrumb-separator'
      separator.textContent = ' > '
      container.appendChild(separator)
    }
  })
}
```

**Step 2: CSSスタイルを追加**

`src/style.css` の `.breadcrumb-item` セクションに追加:
```css
.breadcrumb-item.drop-target {
  background-color: rgba(0, 120, 215, 0.3);
  box-shadow: 0 0 0 2px rgba(0, 120, 215, 0.8);
}
```

**Step 3: 型定義を更新**

`src/views/BreadcrumbView.ts` のインポートに追加:
```typescript
import type { UIStateManager } from '../models/UIStateManager'
```

**Step 4: 動作確認**

Run: `npm run dev`
Expected: アイテムをパンくずリストの各パス部分にドロップできる。ホバー時にハイライト表示される。

**Step 5: コミット**

```bash
git add src/views/BreadcrumbView.ts src/style.css
git commit -m "feat: add drop functionality to BreadcrumbView

- パンくずリストの各パスにドロップ可能
- ドロップで上の階層に移動できる
- ドロップターゲットのハイライト表示

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 8: TreeViewのドロップ対応

**Files:**
- Modify: `src/views/TreeView.ts`
- Modify: `src/style.css`

**Step 1: TreeViewにドロップイベントを追加**

`src/views/TreeView.ts` の `buildTreeList` 関数を修正:
```typescript
import type { UIStateManager } from '../models/UIStateManager'

function buildTreeList(
  node: FSNode,
  manager: FileSystemManager,
  uiState: UIStateManager,
  onUpdate: () => void
): HTMLUListElement {
  const ul = document.createElement('ul')

  node.children.forEach((child) => {
    const li = document.createElement('li')
    li.textContent = child.type === 'folder' ? `📁 ${child.name}` : `📄 ${child.name}`
    li.dataset.nodeId = child.id

    // フォルダの場合、ドロップイベントを追加
    if (child.type === 'folder') {
      li.classList.add('droppable')

      // ドラッグオーバー
      li.addEventListener('dragover', (e) => {
        e.preventDefault()
        e.stopPropagation()
        e.dataTransfer!.dropEffect = 'move'
        li.classList.add('drop-target')
      })

      // ドラッグ離脱
      li.addEventListener('dragleave', (e) => {
        e.stopPropagation()
        li.classList.remove('drop-target')
      })

      // ドロップ
      li.addEventListener('drop', (e) => {
        e.preventDefault()
        e.stopPropagation()
        li.classList.remove('drop-target')

        const data = e.dataTransfer?.getData('text/plain')
        if (!data) return

        try {
          const nodeIds: string[] = JSON.parse(data)

          // 各アイテムを移動
          nodeIds.forEach(nodeId => {
            manager.moveNode(nodeId, child.id)
          })

          uiState.clearSelection()
          onUpdate()
        } catch (error) {
          console.error('Drop to tree failed:', error)
        }
      })

      // 子ノードを再帰的に追加
      li.appendChild(buildTreeList(child, manager, uiState, onUpdate))
    }

    ul.appendChild(li)
  })

  return ul
}

export function renderTreeView(
  container: HTMLElement,
  manager: FileSystemManager,
  uiState: UIStateManager,
  onUpdate: () => void
): void {
  updateTreeView(container, manager, uiState, onUpdate)
}

export function updateTreeView(
  container: HTMLElement,
  manager: FileSystemManager,
  uiState: UIStateManager,
  onUpdate: () => void
): void {
  container.innerHTML = ''
  const ul = buildTreeList(manager.root, manager, uiState, onUpdate)
  container.appendChild(ul)
}
```

**Step 2: CSSスタイルを追加**

`src/style.css` に追加:
```css
/* Tree View Drop Target */
#tree-panel li.droppable {
  cursor: pointer;
  padding: 4px;
  margin: 2px 0;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

#tree-panel li.droppable:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

#tree-panel li.drop-target {
  background-color: rgba(0, 120, 215, 0.3);
  box-shadow: 0 0 0 2px rgba(0, 120, 215, 0.8);
}
```

**Step 3: 動作確認**

Run: `npm run dev`
Expected: アイテムをTreeViewのフォルダにドロップできる。ホバー時にハイライト表示される。

**Step 4: コミット**

```bash
git add src/views/TreeView.ts src/style.css
git commit -m "feat: add drop functionality to TreeView

- TreeViewの各フォルダにドロップ可能
- ドロップターゲットのハイライト表示
- TreeViewはドラッグ元にはならない（仕様）

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 9: 右クリックメニューの実装

**Files:**
- Create: `src/views/ContextMenu.ts`
- Modify: `src/views/IconViewDOM.ts`
- Modify: `src/style.css`

**Step 1: ContextMenuモジュールを作成**

`src/views/ContextMenu.ts`:
```typescript
export type ContextMenuAction = 'cut' | 'paste'

/**
 * コンテキストメニューを表示
 */
export function showContextMenu(
  x: number,
  y: number,
  items: Array<{ label: string; action: ContextMenuAction; disabled?: boolean }>,
  onAction: (action: ContextMenuAction) => void
): void {
  // 既存のメニューを削除
  hideContextMenu()

  const menu = document.createElement('div')
  menu.className = 'context-menu'
  menu.id = 'context-menu'
  menu.style.left = `${x}px`
  menu.style.top = `${y}px`

  items.forEach(item => {
    const menuItem = document.createElement('div')
    menuItem.className = 'context-menu-item'
    if (item.disabled) {
      menuItem.classList.add('disabled')
    }
    menuItem.textContent = item.label

    if (!item.disabled) {
      menuItem.addEventListener('click', () => {
        onAction(item.action)
        hideContextMenu()
      })
    }

    menu.appendChild(menuItem)
  })

  document.body.appendChild(menu)

  // 外側クリックで閉じる
  setTimeout(() => {
    document.addEventListener('click', hideContextMenu, { once: true })
  }, 0)
}

/**
 * コンテキストメニューを非表示
 */
export function hideContextMenu(): void {
  const menu = document.getElementById('context-menu')
  if (menu) {
    menu.remove()
  }
}
```

**Step 2: IconViewDOMに右クリック処理を追加**

`src/views/IconViewDOM.ts` に追加:
```typescript
import { showContextMenu } from './ContextMenu'

// createIconItem 関数内に追加
  // 右クリックメニュー
  div.addEventListener('contextmenu', (e) => {
    e.preventDefault()

    // 右クリックしたアイテムが選択されていない場合は選択
    if (!uiState.isSelected(node.id)) {
      uiState.clearSelection()
      uiState.toggleSelection(node.id)
      onUpdate()
    }

    showContextMenu(
      e.clientX,
      e.clientY,
      [
        { label: '切り取り', action: 'cut' },
        { label: '貼り付け', action: 'paste', disabled: uiState.clipboard.size === 0 },
      ],
      (action) => {
        if (action === 'cut') {
          uiState.cut()
          onUpdate()
        } else if (action === 'paste') {
          pasteItems(uiState, manager, node.id, onUpdate)
        }
      }
    )
  })

// 空白部分の右クリックを処理（renderIconViewDOM関数内に追加）
  container.addEventListener('contextmenu', (e) => {
    // アイテム以外の部分をクリックした場合
    if ((e.target as HTMLElement).classList.contains('icon-view-dom')) {
      e.preventDefault()

      showContextMenu(
        e.clientX,
        e.clientY,
        [
          { label: '貼り付け', action: 'paste', disabled: uiState.clipboard.size === 0 },
        ],
        (action) => {
          if (action === 'paste') {
            pasteItems(uiState, manager, uiState.currentFolder.id, onUpdate)
          }
        }
      )
    }
  })

// pasteItems 関数を追加
function pasteItems(
  uiState: UIStateManager,
  manager: FileSystemManager,
  targetFolderId: string,
  onUpdate: () => void
): void {
  const clipboardIds = Array.from(uiState.clipboard)

  try {
    clipboardIds.forEach(nodeId => {
      manager.moveNode(nodeId, targetFolderId)
    })

    uiState.clearClipboard()
    onUpdate()
  } catch (error) {
    console.error('Paste failed:', error)
    alert('貼り付けに失敗しました')
  }
}
```

**Step 3: CSSスタイルを追加**

`src/style.css` に追加:
```css
/* Context Menu */
.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  padding: 4px 0;
  min-width: 150px;
  z-index: 1000;
  font-family: 'BIZ UDPGothic', sans-serif;
  font-size: 14px;
}

.context-menu-item {
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.context-menu-item:hover:not(.disabled) {
  background-color: rgba(0, 120, 215, 0.1);
}

.context-menu-item.disabled {
  color: #999;
  cursor: not-allowed;
}
```

**Step 4: 動作確認**

Run: `npm run dev`
Expected: 右クリックでメニューが表示され、切り取り・貼り付けが動作する

**Step 5: コミット**

```bash
git add src/views/ContextMenu.ts src/views/IconViewDOM.ts src/style.css
git commit -m "feat: add context menu for cut and paste

- 右クリックメニューの表示
- 切り取り・貼り付けの実装
- 空白部分の右クリックで貼り付け

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 10: キーボードショートカット（Ctrl+X, Ctrl+V）

**Files:**
- Modify: `src/views/IconViewDOM.ts`

**Step 1: キーボードイベントハンドラーを追加**

`src/views/IconViewDOM.ts` の `createIconViewDOM` 関数を修正:
```typescript
export function createIconViewDOM(
  container: HTMLElement,
  manager: FileSystemManager,
  uiState: UIStateManager,
  onUpdate: () => void
): void {
  renderIconViewDOM(container, manager, uiState, onUpdate)

  // キーボードショートカット
  const handleKeyDown = (e: KeyboardEvent) => {
    // Ctrl+X: 切り取り
    if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
      e.preventDefault()
      if (uiState.selection.size > 0) {
        uiState.cut()
        onUpdate()
      }
    }

    // Ctrl+V: 貼り付け
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      e.preventDefault()
      if (uiState.clipboard.size > 0) {
        pasteItems(uiState, manager, uiState.currentFolder.id, onUpdate)
      }
    }
  }

  container.addEventListener('keydown', handleKeyDown)
  container.tabIndex = 0 // キーボードフォーカスを受け取れるように
}
```

**Step 2: destroyIconViewDOMを更新してイベントリスナーを削除**

`src/views/IconViewDOM.ts`:
```typescript
let currentKeyDownHandler: ((e: KeyboardEvent) => void) | null = null

export function createIconViewDOM(
  container: HTMLElement,
  manager: FileSystemManager,
  uiState: UIStateManager,
  onUpdate: () => void
): void {
  // 既存のハンドラーを削除
  if (currentKeyDownHandler) {
    container.removeEventListener('keydown', currentKeyDownHandler)
  }

  renderIconViewDOM(container, manager, uiState, onUpdate)

  // キーボードショートカット
  currentKeyDownHandler = (e: KeyboardEvent) => {
    // Ctrl+X: 切り取り
    if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
      e.preventDefault()
      if (uiState.selection.size > 0) {
        uiState.cut()
        onUpdate()
      }
    }

    // Ctrl+V: 貼り付け
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      e.preventDefault()
      if (uiState.clipboard.size > 0) {
        pasteItems(uiState, manager, uiState.currentFolder.id, onUpdate)
      }
    }
  }

  container.addEventListener('keydown', currentKeyDownHandler)
  container.tabIndex = 0
}

export function destroyIconViewDOM(container: HTMLElement): void {
  if (currentKeyDownHandler) {
    container.removeEventListener('keydown', currentKeyDownHandler)
    currentKeyDownHandler = null
  }
}
```

**Step 3: 動作確認**

Run: `npm run dev`
Expected: Ctrl+Xで切り取り、Ctrl+Vで貼り付けが動作する

**Step 4: コミット**

```bash
git add src/views/IconViewDOM.ts
git commit -m "feat: add keyboard shortcuts (Ctrl+X, Ctrl+V)

- Ctrl+X: 切り取り
- Ctrl+V: 貼り付け
- イベントリスナーの適切なクリーンアップ

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 11: ARIA属性とアクセシビリティ

**Files:**
- Modify: `src/views/IconViewDOM.ts`
- Modify: `src/views/TreeView.ts`
- Modify: `src/views/BreadcrumbView.ts`

**Step 1: IconViewDOMにARIA属性を追加**

`src/views/IconViewDOM.ts` の `createIconItem` を修正:
```typescript
function createIconItem(
  node: FSNode,
  uiState: UIStateManager,
  manager: FileSystemManager,
  onUpdate: () => void
): HTMLElement {
  const div = document.createElement('div')
  div.className = 'icon-item'
  div.dataset.nodeId = node.id
  div.tabIndex = 0
  div.draggable = true

  // ARIA属性
  div.setAttribute('role', 'button')
  div.setAttribute('aria-label', `${node.name}（${node.type === 'folder' ? 'フォルダ' : 'ファイル'}）`)
  div.setAttribute('aria-selected', uiState.isSelected(node.id).toString())

  if (uiState.isSelected(node.id)) {
    div.classList.add('selected')
  }

  // ... 既存のコード ...

  return div
}
```

**Step 2: TreeViewにARIA属性を追加**

`src/views/TreeView.ts` の `buildTreeList` を修正:
```typescript
function buildTreeList(
  node: FSNode,
  manager: FileSystemManager,
  uiState: UIStateManager,
  onUpdate: () => void
): HTMLUListElement {
  const ul = document.createElement('ul')
  ul.setAttribute('role', 'tree')

  node.children.forEach((child) => {
    const li = document.createElement('li')
    li.setAttribute('role', 'treeitem')
    li.setAttribute('aria-label', child.name)

    if (child.type === 'folder') {
      li.setAttribute('aria-expanded', 'true')
    }

    li.textContent = child.type === 'folder' ? `📁 ${child.name}` : `📄 ${child.name}`
    li.dataset.nodeId = child.id

    // ... 既存のドロップコード ...

    if (child.type === 'folder') {
      li.appendChild(buildTreeList(child, manager, uiState, onUpdate))
    }

    ul.appendChild(li)
  })

  return ul
}
```

**Step 3: BreadcrumbViewにARIA属性を追加**

`src/views/BreadcrumbView.ts` を修正:
```typescript
export function renderBreadcrumbView(
  container: HTMLElement,
  currentFolder: FSNode,
  manager: FileSystemManager,
  uiState: UIStateManager,
  onNavigate: (folder: FSNode) => void,
  onUpdate: () => void
): void {
  container.innerHTML = ''
  container.className = 'breadcrumb-view'
  container.setAttribute('role', 'navigation')
  container.setAttribute('aria-label', 'パンくずナビゲーション')

  // ... 既存のコード ...

  parts.forEach((part, index) => {
    const span = document.createElement('span')
    span.className = 'breadcrumb-item'
    span.textContent = part
    span.dataset.depth = index.toString()
    span.setAttribute('role', 'button')
    span.setAttribute('aria-label', `${part}へ移動`)
    span.tabIndex = 0

    // ... 既存のコード ...
  })
}
```

**Step 4: 動作確認**

Run: `npm run dev`
Expected: スクリーンリーダー（VoiceOver）でARIA属性が読み上げられる

**Step 5: コミット**

```bash
git add src/views/IconViewDOM.ts src/views/TreeView.ts src/views/BreadcrumbView.ts
git commit -m "feat: add ARIA attributes for accessibility

- IconViewにrole, aria-label, aria-selected属性
- TreeViewにrole=tree, treeitem, aria-expanded属性
- Breadcrumbにrole=navigation, aria-label属性

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 12: GameViewの統合とDOM版への切り替え

**Files:**
- Modify: `src/views/GameView.ts`

**Step 1: GameViewにDOM版を統合**

`src/views/GameView.ts`:
```typescript
import type { Question } from '../models/FileSystem'
import { FileSystemManager } from '../models/FileSystemManager'
import { UIStateManager } from '../models/UIStateManager'
import { renderTreeView, updateTreeView } from './TreeView'
import { renderBreadcrumbView } from './BreadcrumbView'
import { createIconView, destroyIconView } from './IconView'
import { createIconViewDOM, destroyIconViewDOM } from './IconViewDOM'

/** 現在のゲームセッションで使用中のFileSystemManagerインスタンス */
let manager: FileSystemManager | null = null

/** UI状態管理 */
let uiState: UIStateManager | null = null

/** DOM版を使用するかどうか */
const USE_DOM_VERSION = true // ←ここをtrueにしてDOM版に切り替え

export function renderGameView(
  container: HTMLElement,
  question: Question,
  onComplete: (result: { correct: string[]; incorrect: string[] }) => void,
  onBack: () => void,
): void {
  manager = new FileSystemManager()
  manager.loadQuestion(question)

  uiState = new UIStateManager(manager.root)

  const wrapper = document.createElement('div')
  wrapper.className = 'game-view'

  wrapper.innerHTML = `
    <div class="instruction-area">
      <h2>${question.title}</h2>
      <ul class="instructions">
        ${question.instructions.map(i => `<li>${i}</li>`).join('')}
      </ul>
    </div>
    <div class="breadcrumb-container" id="breadcrumb-container"></div>
    <div class="main-area">
      <div class="tree-panel" id="tree-panel"></div>
      <div class="icon-panel" id="icon-panel"></div>
    </div>
    <div class="action-area">
      ${question.mode === 'exercise'
        ? '<button id="check-btn" class="btn-primary">答え合わせ</button>'
        : ''}
      <button id="back-btn" class="btn-secondary">問題選択に戻る</button>
    </div>
  `

  container.appendChild(wrapper)

  const breadcrumbContainer = wrapper.querySelector<HTMLElement>('#breadcrumb-container')!
  const treePanel = wrapper.querySelector<HTMLElement>('#tree-panel')!
  const iconPanel = wrapper.querySelector<HTMLElement>('#icon-panel')!

  const onMove = () => {
    if (USE_DOM_VERSION) {
      updateTreeView(treePanel, manager!, uiState!, onMove)
      renderBreadcrumbView(breadcrumbContainer, uiState!.currentFolder, manager!, uiState!, (folder) => {
        uiState!.navigateToFolder(folder)
        onMove()
      }, onMove)
      createIconViewDOM(iconPanel, manager!, uiState!, onMove)
    } else {
      updateTreeView(treePanel, manager!, uiState!, onMove)
    }

    // Practice mode: auto-complete when all items are correctly placed
    if (question.mode === 'practice') {
      const result = manager!.checkAnswer(question.answer)
      if (result.incorrect.length === 0 && result.correct.length > 0) {
        onComplete(result)
      }
    }
  }

  if (USE_DOM_VERSION) {
    // DOM版
    renderBreadcrumbView(breadcrumbContainer, uiState.currentFolder, manager, uiState, (folder) => {
      uiState!.navigateToFolder(folder)
      onMove()
    }, onMove)
    renderTreeView(treePanel, manager, uiState, onMove)
    createIconViewDOM(iconPanel, manager, uiState, onMove)
  } else {
    // p5.js版
    renderTreeView(treePanel, manager, uiState, onMove)
    createIconView(iconPanel, manager, question, onMove)
  }

  if (question.mode === 'exercise') {
    wrapper.querySelector('#check-btn')!.addEventListener('click', () => {
      const result = manager!.checkAnswer(question.answer)
      onComplete(result)
    })
  }

  wrapper.querySelector('#back-btn')!.addEventListener('click', onBack)
}

export function destroyGameView(): void {
  if (USE_DOM_VERSION) {
    const iconPanel = document.querySelector<HTMLElement>('#icon-panel')
    if (iconPanel) {
      destroyIconViewDOM(iconPanel)
    }
  } else {
    destroyIconView()
  }
  manager = null
  uiState = null
}

export function getManager(): FileSystemManager | null {
  return manager
}
```

**Step 2: CSSレイアウトを調整**

`src/style.css` に追加:
```css
.breadcrumb-container {
  /* すでにBreadcrumbViewのスタイルが適用される */
}

.game-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.main-area {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.tree-panel {
  width: 250px;
  border-right: 1px solid #ccc;
  overflow-y: auto;
}

.icon-panel {
  flex: 1;
  overflow-y: auto;
}
```

**Step 3: 動作確認**

Run: `npm run dev`
Expected: DOM版が表示され、すべての機能（ドラッグ&ドロップ、右クリック、キーボードショートカット）が動作する

**Step 4: コミット**

```bash
git add src/views/GameView.ts src/style.css
git commit -m "feat: integrate DOM version into GameView

- BreadcrumbView、TreeView、IconViewDOMを統合
- USE_DOM_VERSIONフラグでDOM版に切り替え
- レイアウト調整（3段構成）

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 13: p5.js実装の削除

**Files:**
- Delete: `src/views/IconView.ts`
- Modify: `src/views/GameView.ts`
- Modify: `package.json`

**Step 1: GameViewからp5.js版のコードを削除**

`src/views/GameView.ts`:
```typescript
import type { Question } from '../models/FileSystem'
import { FileSystemManager } from '../models/FileSystemManager'
import { UIStateManager } from '../models/UIStateManager'
import { renderTreeView, updateTreeView } from './TreeView'
import { renderBreadcrumbView } from './BreadcrumbView'
import { createIconViewDOM, destroyIconViewDOM } from './IconViewDOM'

/** 現在のゲームセッションで使用中のFileSystemManagerインスタンス */
let manager: FileSystemManager | null = null

/** UI状態管理 */
let uiState: UIStateManager | null = null

export function renderGameView(
  container: HTMLElement,
  question: Question,
  onComplete: (result: { correct: string[]; incorrect: string[] }) => void,
  onBack: () => void,
): void {
  manager = new FileSystemManager()
  manager.loadQuestion(question)

  uiState = new UIStateManager(manager.root)

  const wrapper = document.createElement('div')
  wrapper.className = 'game-view'

  wrapper.innerHTML = `
    <div class="instruction-area">
      <h2>${question.title}</h2>
      <ul class="instructions">
        ${question.instructions.map(i => `<li>${i}</li>`).join('')}
      </ul>
    </div>
    <div class="breadcrumb-container" id="breadcrumb-container"></div>
    <div class="main-area">
      <div class="tree-panel" id="tree-panel"></div>
      <div class="icon-panel" id="icon-panel"></div>
    </div>
    <div class="action-area">
      ${question.mode === 'exercise'
        ? '<button id="check-btn" class="btn-primary">答え合わせ</button>'
        : ''}
      <button id="back-btn" class="btn-secondary">問題選択に戻る</button>
    </div>
  `

  container.appendChild(wrapper)

  const breadcrumbContainer = wrapper.querySelector<HTMLElement>('#breadcrumb-container')!
  const treePanel = wrapper.querySelector<HTMLElement>('#tree-panel')!
  const iconPanel = wrapper.querySelector<HTMLElement>('#icon-panel')!

  const onMove = () => {
    updateTreeView(treePanel, manager!, uiState!, onMove)
    renderBreadcrumbView(breadcrumbContainer, uiState!.currentFolder, manager!, uiState!, (folder) => {
      uiState!.navigateToFolder(folder)
      onMove()
    }, onMove)
    createIconViewDOM(iconPanel, manager!, uiState!, onMove)

    // Practice mode: auto-complete when all items are correctly placed
    if (question.mode === 'practice') {
      const result = manager!.checkAnswer(question.answer)
      if (result.incorrect.length === 0 && result.correct.length > 0) {
        onComplete(result)
      }
    }
  }

  renderBreadcrumbView(breadcrumbContainer, uiState.currentFolder, manager, uiState, (folder) => {
    uiState!.navigateToFolder(folder)
    onMove()
  }, onMove)
  renderTreeView(treePanel, manager, uiState, onMove)
  createIconViewDOM(iconPanel, manager, uiState, onMove)

  if (question.mode === 'exercise') {
    wrapper.querySelector('#check-btn')!.addEventListener('click', () => {
      const result = manager!.checkAnswer(question.answer)
      onComplete(result)
    })
  }

  wrapper.querySelector('#back-btn')!.addEventListener('click', onBack)
}

export function destroyGameView(): void {
  const iconPanel = document.querySelector<HTMLElement>('#icon-panel')
  if (iconPanel) {
    destroyIconViewDOM(iconPanel)
  }
  manager = null
  uiState = null
}

export function getManager(): FileSystemManager | null {
  return manager
}
```

**Step 2: IconView.tsファイルを削除**

```bash
git rm src/views/IconView.ts
```

**Step 3: p5.js依存関係を削除**

`package.json`:
```json
{
  "name": "folder-structure-trainer",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "typescript": "~5.9.3",
    "vite": "^7.3.1",
    "vitest": "^3.0.0"
  },
  "dependencies": {}
}
```

**Step 4: node_modulesを再インストール**

```bash
npm install
```

**Step 5: 動作確認**

Run: `npm run dev`
Expected: DOM版のみで動作し、p5.jsへの参照エラーがない

**Step 6: コミット**

```bash
git add src/views/GameView.ts package.json
git commit -m "refactor: remove p5.js implementation

- IconView.tsを削除
- p5.js依存関係を削除
- DOM版のみに統一

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 14: 最終テストと調整

**Files:**
- Modify: `src/style.css` (必要に応じて)

**Step 1: 全機能の手動テスト**

以下をテスト:
- [ ] 単一選択（クリック）
- [ ] 複数選択（Ctrl+クリック、Shift+クリック）
- [ ] ドラッグ&ドロップ（IconView内、TreeViewへ、Breadcrumbへ）
- [ ] ドラッグプレビュー
- [ ] 右クリックメニュー（切り取り、貼り付け）
- [ ] Ctrl+X、Ctrl+V
- [ ] パンくずリストでのナビゲーション
- [ ] ダブルクリックでフォルダを開く
- [ ] ARIA属性（スクリーンリーダー）

**Step 2: ブラウザ互換性テスト**

Test on:
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

**Step 3: CSSの微調整**

必要に応じて、視覚フィードバックやレイアウトを調整

**Step 4: 自動テストの実行**

Run: `npm test`
Expected: All tests PASS

**Step 5: ビルドテスト**

Run: `npm run build`
Expected: ビルド成功

**Step 6: 最終コミット**

```bash
git add .
git commit -m "test: final adjustments and testing

- 全機能の動作確認
- ブラウザ互換性確認
- 視覚フィードバックの調整

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## 完了

すべてのタスクが完了したら、mainブランチにマージする準備ができています。

```bash
git checkout main
git merge feature/iconview-dom
git push origin main
```

**次のステップ:**
- 第2段階の機能実装（コピー、削除、名前変更、新規作成、重複チェック）
- より凝ったアニメーション
- aria-liveなどの高度なアクセシビリティ対応
