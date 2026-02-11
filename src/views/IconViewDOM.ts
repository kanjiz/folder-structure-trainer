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
