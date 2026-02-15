import Handlebars from 'handlebars'
import type { FSNode } from '../models/FileSystem'
import type { FileSystemManager } from '../models/FileSystemManager'
import breadcrumbTemplate from '../templates/BreadcrumbView.hbs?raw'

const compiledTemplate = Handlebars.compile(breadcrumbTemplate)

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
  // パス情報を取得
  const pathNodes = manager.getPath(currentFolder.id)

  // テンプレートデータを準備（ルートノードの名前を「ルート」にマッピング）
  const templateData = {
    path: pathNodes.map(node => ({
      id: node.id,
      name: node.name === 'root' ? 'ルート' : node.name
    }))
  }

  // テンプレートからHTMLを生成
  const html = compiledTemplate(templateData)
  container.innerHTML = html

  // 各パンくずアイテムにイベントハンドラをアタッチ
  const items = container.querySelectorAll('.breadcrumb-item')
  items.forEach((item, index) => {
    const span = item as HTMLElement
    const folder = pathNodes[index]

    // クリックでナビゲーション
    span.addEventListener('click', () => {
      onNavigate(folder)
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
      handleBreadcrumbDrop(e, folder.id, span, manager, onUpdate)
    })
  })
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
