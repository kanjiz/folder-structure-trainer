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
