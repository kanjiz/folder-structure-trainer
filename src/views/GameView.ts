import type { Question } from '../models/types'
import type { FSNode } from '../models/FileSystem'
import { FileSystemManager } from '../models/FileSystemManager'
import { UIStateManager } from '../models/UIStateManager'
import { renderTreeView, updateTreeView } from './TreeView'
import { renderBreadcrumbView } from './BreadcrumbView'
import { createIconViewDOM, destroyIconViewDOM } from './IconViewDOM'
import Handlebars from 'handlebars'
import gameViewTemplate from '../templates/GameView.hbs?raw'

/** 現在のゲームセッションで使用中のFileSystemManagerインスタンス */
let manager: FileSystemManager | null = null

/** 現在のゲームセッションで使用中のUIStateManagerインスタンス */
let uiStateManager: UIStateManager | null = null

/** IconView用のコンテナ要素参照 */
let iconPanelRef: HTMLElement | null = null

/**
 * ゲーム画面をレンダリングします
 * @param container - レンダリング先のコンテナ要素
 * @param question - 表示する問題データ
 * @param onComplete - 答え合わせ完了時のコールバック
 * @param onBack - 戻るボタンクリック時のコールバック
 */
export function renderGameView(
  container: HTMLElement,
  question: Question,
  onComplete: (result: { correct: string[]; incorrect: string[] }) => void,
  onBack: () => void,
): void {
  manager = new FileSystemManager()
  manager.loadQuestion(question)

  // UIStateManagerを初期化
  uiStateManager = new UIStateManager(manager.root)

  // テンプレートをコンパイルしてレンダリング
  const template = Handlebars.compile(gameViewTemplate)
  const html = template({
    title: question.title,
    instructions: question.instructions,
    showCheckButton: question.mode === 'exercise'
  })

  container.innerHTML = html
  const wrapper = container.firstElementChild as HTMLElement

  const breadcrumbPanel = wrapper.querySelector<HTMLElement>('#breadcrumb-panel')!
  const treePanel = wrapper.querySelector<HTMLElement>('#tree-panel')!
  const iconPanel = wrapper.querySelector<HTMLElement>('#icon-panel')!
  iconPanelRef = iconPanel

  // ナビゲーション時のコールバック
  const onNavigate = (folder: FSNode) => {
    uiStateManager!.navigateToFolder(folder)
    onUpdate()
  }

  // 更新時のコールバック
  const onUpdate = () => {
    renderBreadcrumbView(breadcrumbPanel, uiStateManager!.currentFolder, manager!, onNavigate, onUpdate)
    updateTreeView(treePanel, manager!, onUpdate)
    createIconViewDOM(iconPanel, manager!, uiStateManager!, onUpdate)

    // Practice mode: auto-complete when all items are correctly placed
    if (question.mode === 'practice') {
      const result = manager!.checkAnswer(question.answer)
      if (result.incorrect.length === 0 && result.correct.length > 0) {
        onComplete(result)
      }
    }
  }

  // 初期レンダリング
  renderBreadcrumbView(breadcrumbPanel, uiStateManager.currentFolder, manager, onNavigate, onUpdate)
  renderTreeView(treePanel, manager, onUpdate)
  createIconViewDOM(iconPanel, manager, uiStateManager, onUpdate)

  if (question.mode === 'exercise') {
    wrapper.querySelector('#check-btn')!.addEventListener('click', () => {
      const result = manager!.checkAnswer(question.answer)
      onComplete(result)
    })
  }

  wrapper.querySelector('#back-btn')!.addEventListener('click', onBack)
}

/**
 * ゲーム画面を破棄し、リソースをクリーンアップします
 */
export function destroyGameView(): void {
  if (iconPanelRef) {
    destroyIconViewDOM(iconPanelRef)
    iconPanelRef = null
  }
  manager = null
  uiStateManager = null
}

/**
 * 現在のFileSystemManagerインスタンスを取得します
 * @returns 現在のmanagerインスタンス、またはnull
 */
export function getManager(): FileSystemManager | null {
  return manager
}
