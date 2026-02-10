import type { FileSystemManager } from '../models/FileSystemManager'
import type { FSNode } from '../models/FileSystem'

export function renderTreeView(container: HTMLElement, manager: FileSystemManager): void {
  updateTreeView(container, manager)
}

export function updateTreeView(container: HTMLElement, manager: FileSystemManager): void {
  container.innerHTML = ''
  const ul = buildTreeList(manager.root)
  container.appendChild(ul)
}

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
