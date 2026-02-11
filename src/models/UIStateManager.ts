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

  /** 最後に選択したノードID（範囲選択用） */
  private lastSelectedId: string | null = null

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

  /**
   * 選択中のノードIDリストを取得
   */
  getSelectedIds(): string[] {
    return Array.from(this.selection)
  }
}
