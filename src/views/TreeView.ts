import Handlebars from 'handlebars'
import type { FileSystemManager } from '../models/FileSystemManager'
import type { FSNode } from '../models/FileSystem'
import treeViewTemplate from '../templates/TreeView.hbs?raw'

// eqヘルパーを登録（テンプレートで型比較に使用）
Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b)

const compiledTemplate = Handlebars.compile(treeViewTemplate)

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
  // ノードをテンプレートデータに変換する再帰関数
  function nodeToTemplateData(node: FSNode): {
    id: string
    name: string
    type: string
    children?: Array<{ id: string; name: string; type: string; children?: unknown[] }>
  } {
    return {
      id: node.id,
      name: node.name === 'root' ? 'ルート' : node.name,
      type: node.type,
      children: node.children.length > 0
        ? node.children.map(child => nodeToTemplateData(child))
        : undefined
    }
  }

  // テンプレートデータを準備（ルートノードを配列で渡す）
  const templateData = {
    root: [nodeToTemplateData(manager.root)]
  }

  // テンプレートからHTMLを生成
  const html = compiledTemplate(templateData)
  container.innerHTML = html

  // イベントリスナーをアタッチ
  attachEventListeners(container, manager, onUpdate)
}

/**
 * ツリービューの各ノードにイベントリスナーをアタッチします
 */
function attachEventListeners(
  container: HTMLElement,
  manager: FileSystemManager,
  onUpdate?: () => void
): void {
  const folderItems = container.querySelectorAll('.tree-item.tree-folder')

  folderItems.forEach(item => {
    const element = item as HTMLElement
    const nodeId = element.dataset.nodeId

    if (!nodeId) return

    // ドラッグオーバーイベント
    element.addEventListener('dragover', (e) => {
      handleTreeDragOver(e, element)
    })

    // ドラッグリーブイベント
    element.addEventListener('dragleave', (e) => {
      handleTreeDragLeave(e, element)
    })

    // ドロップイベント
    element.addEventListener('drop', (e) => {
      handleTreeDrop(e, nodeId, element, manager, onUpdate)
    })
  })
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
