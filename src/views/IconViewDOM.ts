import type { FileSystemManager } from '../models/FileSystemManager'
import type { UIStateManager } from '../models/UIStateManager'
import { showContextMenu, hideContextMenu } from './ContextMenu'
import Handlebars from 'handlebars'
import iconViewTemplate from '../templates/IconViewDOM.hbs?raw'

// キーボードイベントハンドラの参照を保持
let keydownHandler: ((e: KeyboardEvent) => void) | null = null

// テンプレートをコンパイル
const compiledTemplate = Handlebars.compile(iconViewTemplate)

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

  const main = container.querySelector<HTMLElement>('main.icon-view-dom')
  if (!main) return

  setupKeyboardShortcuts(main, manager, uiState, onUpdate)
  setupContextMenuForEmptyArea(main, uiState, manager, onUpdate)
  setupEmptyAreaClick(main, uiState, onUpdate)
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
  // フォーカスされている要素のIDを保存
  const activeElement = document.activeElement as HTMLElement
  const focusedNodeId = activeElement?.dataset?.nodeId

  // テンプレートデータ準備
  const items = uiState.currentFolder.children.map(node => ({
    id: node.id,
    name: node.name,
    type: node.type,
    selected: uiState.isSelected(node.id)
  }))

  // テンプレートからHTML生成
  const html = compiledTemplate({ items })
  container.innerHTML = html

  // イベントリスナーをアタッチ
  attachEventListeners(container, manager, uiState, onUpdate)

  // フォーカスを復元
  if (focusedNodeId) {
    const itemToFocus = container.querySelector<HTMLElement>(`[data-node-id="${focusedNodeId}"]`)
    if (itemToFocus) {
      itemToFocus.focus()
      return // フォーカス復元成功
    }
  }

  // フォーカス復元に失敗、または初回レンダリングの場合
  // コンテナにフォーカスを移す（どこからナビゲーションしてもキーボード操作可能に）
  const main = container.querySelector<HTMLElement>('main.icon-view-dom')
  if (main) {
    main.focus()
  }
}

/**
 * イベントリスナーをアタッチ
 */
function attachEventListeners(
  container: HTMLElement,
  manager: FileSystemManager,
  uiState: UIStateManager,
  onUpdate: () => void
): void {
  container.querySelectorAll('.icon-item').forEach(itemEl => {
    const element = itemEl as HTMLElement
    const nodeId = element.dataset.nodeId!
    const node = uiState.currentFolder.children.find(n => n.id === nodeId)!

    // クリックイベント
    element.addEventListener('click', (e) => {
      element.focus()
      handleItemClick(nodeId, e as MouseEvent, uiState, manager, onUpdate)
    })

    // ダブルクリックイベント
    element.addEventListener('dblclick', () => {
      if (node.type === 'folder') {
        uiState.navigateToFolder(node)
        onUpdate()
      }
    })

    // ドラッグ開始
    element.addEventListener('dragstart', (e) => {
      handleDragStart(e as DragEvent, nodeId, uiState)
    })

    // コンテキストメニュー
    element.addEventListener('contextmenu', async (e) => {
      e.preventDefault()
      await showItemContextMenu(e as MouseEvent, nodeId, uiState, manager, onUpdate)
    })

    // フォルダのみ: ドラッグ&ドロップ
    if (node.type === 'folder') {
      element.addEventListener('dragover', (e) => {
        handleDragOver(e as DragEvent, element)
      })
      element.addEventListener('dragleave', (e) => {
        handleDragLeave(e as DragEvent, element)
      })
      element.addEventListener('drop', (e) => {
        handleDrop(e as DragEvent, nodeId, element, manager, onUpdate)
      })
    }
  })
}

/**
 * アイテムクリックを処理
 */
function handleItemClick(
  nodeId: string,
  event: MouseEvent,
  uiState: UIStateManager,
  _manager: FileSystemManager,
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

/**
 * ドラッグプレビューを作成
 */
function createDragPreview(
  draggedIds: string[],
  uiState: UIStateManager
): HTMLElement {
  const preview = document.createElement('div')
  preview.className = 'drag-preview'

  const maxVisibleItems = 3
  const visibleCount = Math.min(draggedIds.length, maxVisibleItems)

  // 最大3つのアイテムを表示
  for (let i = 0; i < visibleCount; i++) {
    const node = uiState.currentFolder.children.find(n => n.id === draggedIds[i])
    if (!node) continue

    const item = document.createElement('div')
    item.className = 'drag-preview-item'
    item.style.top = `${i * 4}px`
    item.style.left = `${i * 4}px`

    const icon = document.createElement('span')
    icon.className = 'drag-preview-icon'
    icon.textContent = node.type === 'folder' ? '📁' : '📄'
    item.appendChild(icon)

    const name = document.createElement('span')
    name.className = 'drag-preview-name'
    name.textContent = node.name
    item.appendChild(name)

    preview.appendChild(item)
  }

  // 4つ以上の場合はバッジを表示
  if (draggedIds.length > maxVisibleItems) {
    const badge = document.createElement('div')
    badge.className = 'drag-preview-badge'
    badge.textContent = `+${draggedIds.length - maxVisibleItems}`
    preview.appendChild(badge)
  }

  return preview
}

/**
 * ドラッグ開始ハンドラ
 */
function handleDragStart(
  event: DragEvent,
  nodeId: string,
  uiState: UIStateManager
): void {
  if (!event.dataTransfer) return

  // 選択されているアイテムのIDリストを取得
  let draggedIds: string[]
  if (uiState.isSelected(nodeId)) {
    // ドラッグ中のアイテムが選択済みなら、全選択アイテムをドラッグ
    draggedIds = uiState.getSelectedIds()
  } else {
    // そうでなければこのアイテムのみをドラッグ
    draggedIds = [nodeId]
  }

  // dataTransferにIDリストを保存
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', JSON.stringify(draggedIds))

  // ドラッグプレビューを設定
  const preview = createDragPreview(draggedIds, uiState)
  document.body.appendChild(preview)
  event.dataTransfer.setDragImage(preview, 10, 10)

  // プレビューを少し遅延してから削除（ドラッグイメージが作成された後）
  setTimeout(() => {
    if (preview.parentNode) {
      preview.parentNode.removeChild(preview)
    }
  }, 0)
}

/**
 * ドラッグオーバーハンドラ
 */
function handleDragOver(event: DragEvent, element: HTMLElement): void {
  event.preventDefault()
  if (!event.dataTransfer) return

  event.dataTransfer.dropEffect = 'move'
  element.classList.add('drop-target')
}

/**
 * ドラッグリーブハンドラ
 */
function handleDragLeave(event: DragEvent, element: HTMLElement): void {
  // イベントが子要素に移動した場合は無視
  const rect = element.getBoundingClientRect()
  const x = event.clientX
  const y = event.clientY

  if (x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom) {
    element.classList.remove('drop-target')
  }
}

/**
 * ドロップハンドラ
 */
function handleDrop(
  event: DragEvent,
  targetFolderId: string,
  element: HTMLElement,
  manager: FileSystemManager,
  onUpdate: () => void
): void {
  event.preventDefault()
  element.classList.remove('drop-target')

  if (!event.dataTransfer) return

  try {
    const draggedIds = JSON.parse(event.dataTransfer.getData('text/plain')) as string[]

    // ドラッグされた各アイテムを移動
    for (const nodeId of draggedIds) {
      // 自分自身へのドロップは無視
      if (nodeId === targetFolderId) continue

      manager.moveNode(nodeId, targetFolderId)
    }

    onUpdate()
  } catch (error) {
    console.error('Drop failed:', error)
  }
}

/**
 * アイテムのコンテキストメニューを表示
 */
async function showItemContextMenu(
  event: MouseEvent,
  nodeId: string,
  uiState: UIStateManager,
  manager: FileSystemManager,
  onUpdate: () => void
): Promise<void> {
  // クリックされたアイテムが選択されていない場合は選択する
  if (!uiState.isSelected(nodeId)) {
    uiState.clearSelection()
    uiState.toggleSelection(nodeId)
    uiState.setLastSelected(nodeId)
    onUpdate()
  }

  await showContextMenu({
    x: event.clientX,
    y: event.clientY,
    items: [
      {
        label: '切り取り',
        onClick: () => {
          uiState.cut()
          onUpdate()
        }
      },
      {
        label: '貼り付け',
        disabled: uiState.clipboard.size === 0,
        onClick: () => {
          pasteItems(uiState, manager, onUpdate)
        }
      }
    ]
  })
}

/**
 * 空白エリアのコンテキストメニューを設定
 */
function setupContextMenuForEmptyArea(
  container: HTMLElement,
  uiState: UIStateManager,
  manager: FileSystemManager,
  onUpdate: () => void
): void {
  container.addEventListener('contextmenu', async (e) => {
    // アイコンアイテム上でのクリックは無視
    const target = e.target as HTMLElement
    if (target.closest('.icon-item')) {
      return
    }

    e.preventDefault()
    await showContextMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        {
          label: '貼り付け',
          disabled: uiState.clipboard.size === 0,
          onClick: () => {
            pasteItems(uiState, manager, onUpdate)
          }
        }
      ]
    })
  })
}

/**
 * 空白エリアクリックで選択解除を設定
 */
function setupEmptyAreaClick(
  container: HTMLElement,
  uiState: UIStateManager,
  onUpdate: () => void
): void {
  container.addEventListener('click', (e) => {
    // アイコンアイテム上でのクリックは無視
    const target = e.target as HTMLElement
    if (target.closest('.icon-item')) {
      return
    }

    // 空白エリアをクリックした場合、選択を解除
    if (uiState.selection.size > 0) {
      uiState.clearSelection()
      onUpdate()
    }
  })
}

/**
 * キーボードショートカットを設定
 */
function setupKeyboardShortcuts(
  container: HTMLElement,
  manager: FileSystemManager,
  uiState: UIStateManager,
  onUpdate: () => void
): void {
  // 既存のハンドラを削除
  if (keydownHandler) {
    container.removeEventListener('keydown', keydownHandler)
  }

  // 新しいハンドラを作成
  keydownHandler = (e: KeyboardEvent) => {
    // Ctrl+X または Cmd+X (Mac)
    if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
      e.preventDefault()
      if (uiState.selection.size > 0) {
        uiState.cut()
        onUpdate()
      }
    }

    // Ctrl+V または Cmd+V (Mac)
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      e.preventDefault()
      if (uiState.clipboard.size > 0) {
        pasteItems(uiState, manager, onUpdate)
      }
    }
  }

  container.addEventListener('keydown', keydownHandler)
}

/**
 * クリップボードのアイテムを現在のフォルダに貼り付け
 */
function pasteItems(
  uiState: UIStateManager,
  manager: FileSystemManager,
  onUpdate: () => void
): void {
  const clipboardIds = Array.from(uiState.clipboard)
  const targetFolderId = uiState.currentFolder.id === 'root' ? 'root' : uiState.currentFolder.id

  for (const nodeId of clipboardIds) {
    manager.moveNode(nodeId, targetFolderId)
  }

  uiState.clearClipboard()
  onUpdate()
}

/**
 * IconViewDOMを破棄
 */
export function destroyIconViewDOM(container: HTMLElement): void {
  // キーボードイベントハンドラをクリーンアップ
  if (keydownHandler) {
    const main = container.querySelector<HTMLElement>('main.icon-view-dom')
    if (main) {
      main.removeEventListener('keydown', keydownHandler)
    }
    keydownHandler = null
  }
  // コンテキストメニューを閉じる
  hideContextMenu()
}
