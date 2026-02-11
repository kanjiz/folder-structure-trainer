import type { FileSystemManager } from '../models/FileSystemManager'
import type { FSNode } from '../models/FileSystem'

/**
 * ツリービューを初期レンダリングします
 * @param container - レンダリング先のコンテナ要素
 * @param manager - ファイルシステムマネージャー
 * @param onUpdate - ノード移動時のコールバック（オプション）
 */
export function renderTreeView(
  container: HTMLElement,
  manager: FileSystemManager,
  onUpdate?: () => void
): void {
  updateTreeView(container, manager, onUpdate)
}

/**
 * ツリービューを更新します（ノード移動後などに呼ばれる）
 * @param container - レンダリング先のコンテナ要素
 * @param manager - ファイルシステムマネージャー
 * @param onUpdate - ノード移動時のコールバック（オプション）
 */
export function updateTreeView(
  container: HTMLElement,
  manager: FileSystemManager,
  onUpdate?: () => void
): void {
  container.innerHTML = ''

  // ルートノード（Desktop）を作成
  const rootUl = document.createElement('ul')
  rootUl.className = 'tree-list'
  rootUl.setAttribute('role', 'tree')

  const rootLi = document.createElement('li')
  rootLi.className = 'tree-item tree-folder'
  rootLi.dataset.nodeId = manager.root.id
  rootLi.setAttribute('role', 'treeitem')
  rootLi.setAttribute('aria-label', 'Desktop (フォルダ)')
  rootLi.setAttribute('aria-expanded', 'true')

  const icon = '\u{1F4C1}'
  rootLi.textContent = `${icon} Desktop`

  // ルートへのドロップイベントを追加
  rootLi.addEventListener('dragover', (e) => {
    handleTreeDragOver(e, rootLi)
  })

  rootLi.addEventListener('dragleave', (e) => {
    handleTreeDragLeave(e, rootLi)
  })

  rootLi.addEventListener('drop', (e) => {
    handleTreeDrop(e, manager.root.id, rootLi, manager, onUpdate)
  })

  // ルートの子要素を追加
  if (manager.root.children.length > 0) {
    rootLi.appendChild(buildTreeList(manager.root, manager, onUpdate))
  }

  rootUl.appendChild(rootLi)
  container.appendChild(rootUl)
}

/**
 * ノードから再帰的にツリー構造のHTMLリストを構築します
 * @param node - ツリー構築の起点となるノード
 * @param manager - ファイルシステムマネージャー
 * @param onUpdate - ノード移動時のコールバック（オプション）
 * @returns 構築されたulタグ要素
 */
function buildTreeList(
  node: FSNode,
  manager: FileSystemManager,
  onUpdate?: () => void
): HTMLUListElement {
  const ul = document.createElement('ul')
  ul.className = 'tree-list'
  // ARIA attributes for tree
  ul.setAttribute('role', 'tree')

  for (const child of node.children) {
    const li = document.createElement('li')
    li.className = `tree-item tree-${child.type}`
    li.dataset.nodeId = child.id

    // ARIA attributes for tree item
    li.setAttribute('role', 'treeitem')
    li.setAttribute('aria-label', `${child.name} (${child.type === 'folder' ? 'フォルダ' : 'ファイル'})`)
    if (child.type === 'folder') {
      li.setAttribute('aria-expanded', child.children.length > 0 ? 'true' : 'false')
    }

    const icon = child.type === 'folder' ? '\u{1F4C1}' : '\u{1F4C4}'
    li.textContent = `${icon} ${child.name}`

    // フォルダの場合はドロップイベントを追加
    if (child.type === 'folder') {
      li.addEventListener('dragover', (e) => {
        handleTreeDragOver(e, li)
      })

      li.addEventListener('dragleave', (e) => {
        handleTreeDragLeave(e, li)
      })

      li.addEventListener('drop', (e) => {
        handleTreeDrop(e, child.id, li, manager, onUpdate)
      })

      if (child.children.length > 0) {
        li.appendChild(buildTreeList(child, manager, onUpdate))
      }
    }

    ul.appendChild(li)
  }

  return ul
}

/**
 * ツリービューのドラッグオーバーハンドラ
 */
function handleTreeDragOver(event: DragEvent, element: HTMLElement): void {
  event.preventDefault()
  event.stopPropagation()
  if (!event.dataTransfer) return

  event.dataTransfer.dropEffect = 'move'
  element.classList.add('drop-target')
}

/**
 * ツリービューのドラッグリーブハンドラ
 */
function handleTreeDragLeave(event: DragEvent, element: HTMLElement): void {
  event.stopPropagation()

  // イベントが子要素に移動した場合は無視
  const rect = element.getBoundingClientRect()
  const x = event.clientX
  const y = event.clientY

  if (x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom) {
    element.classList.remove('drop-target')
  }
}

/**
 * ツリービューのドロップハンドラ
 */
function handleTreeDrop(
  event: DragEvent,
  targetFolderId: string,
  element: HTMLElement,
  manager: FileSystemManager,
  onUpdate?: () => void
): void {
  event.preventDefault()
  event.stopPropagation()
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

    if (onUpdate) {
      onUpdate()
    }
  } catch (error) {
    console.error('Tree drop failed:', error)
  }
}
