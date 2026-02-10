import type { FileSystemManager } from '../models/FileSystemManager'
import type { FSNode } from '../models/FileSystem'

/**
 * ツリービューを初期レンダリングします
 * @param container - レンダリング先のコンテナ要素
 * @param manager - ファイルシステムマネージャー
 */
export function renderTreeView(container: HTMLElement, manager: FileSystemManager): void {
  updateTreeView(container, manager)
}

/**
 * ツリービューを更新します（ノード移動後などに呼ばれる）
 * @param container - レンダリング先のコンテナ要素
 * @param manager - ファイルシステムマネージャー
 */
export function updateTreeView(container: HTMLElement, manager: FileSystemManager): void {
  container.innerHTML = ''
  const ul = buildTreeList(manager.root)
  container.appendChild(ul)
}

/**
 * ノードから再帰的にツリー構造のHTMLリストを構築します
 * @param node - ツリー構築の起点となるノード
 * @returns 構築されたulタグ要素
 */
function buildTreeList(node: FSNode): HTMLUListElement {
  const ul = document.createElement('ul')
  ul.className = 'tree-list'

  for (const child of node.children) {
    const li = document.createElement('li')
    li.className = `tree-item tree-${child.type}`
    const icon = child.type === 'folder' ? '\u{1F4C1}' : '\u{1F4C4}'
    li.textContent = `${icon} ${child.name}`

    if (child.type === 'folder' && child.children.length > 0) {
      li.appendChild(buildTreeList(child))
    }

    ul.appendChild(li)
  }

  return ul
}
