import type { FSNode } from '../models/FileSystem'
import type { FileSystemManager } from '../models/FileSystemManager'

/**
 * パンくずリストを表示するビュー
 */
export function renderBreadcrumbView(
  container: HTMLElement,
  currentFolder: FSNode,
  manager: FileSystemManager,
  onNavigate: (folder: FSNode) => void,
  onUpdate?: () => void
): void {
  container.innerHTML = ''
  container.className = 'breadcrumb-view'

  // ARIA attributes for navigation
  container.setAttribute('role', 'navigation')
  container.setAttribute('aria-label', 'パンくずリスト')

  const path = getPath(currentFolder, manager)
  const parts = path.split(' > ')
  const folders = getFolders(currentFolder, manager)

  parts.forEach((part, index) => {
    const span = document.createElement('span')
    span.className = 'breadcrumb-item'
    span.textContent = part
    span.dataset.depth = index.toString()
    span.dataset.folderId = folders[index].id

    // ARIA attributes for breadcrumb item
    span.setAttribute('role', 'button')
    span.setAttribute('aria-label', `${part}に移動`)
    span.tabIndex = 0

    // クリックでナビゲーション
    span.addEventListener('click', () => {
      onNavigate(folders[index])
    })

    // ドラッグオーバーイベント
    span.addEventListener('dragover', (e) => {
      handleBreadcrumbDragOver(e, span)
    })

    // ドラッグリーブイベント
    span.addEventListener('dragleave', (e) => {
      handleBreadcrumbDragLeave(e, span)
    })

    // ドロップイベント
    span.addEventListener('drop', (e) => {
      handleBreadcrumbDrop(e, folders[index].id, span, manager, onUpdate)
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

/**
 * パンくずリストのドラッグオーバーハンドラ
 */
function handleBreadcrumbDragOver(event: DragEvent, element: HTMLElement): void {
  event.preventDefault()
  if (!event.dataTransfer) return

  event.dataTransfer.dropEffect = 'move'
  element.classList.add('drop-target')
}

/**
 * パンくずリストのドラッグリーブハンドラ
 */
function handleBreadcrumbDragLeave(_event: DragEvent, element: HTMLElement): void {
  element.classList.remove('drop-target')
}

/**
 * パンくずリストのドロップハンドラ
 */
function handleBreadcrumbDrop(
  event: DragEvent,
  targetFolderId: string,
  element: HTMLElement,
  manager: FileSystemManager,
  onUpdate?: () => void
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

    if (onUpdate) {
      onUpdate()
    }
  } catch (error) {
    console.error('Breadcrumb drop failed:', error)
  }
}
