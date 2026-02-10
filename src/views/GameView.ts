import type { Question } from '../models/FileSystem'
import { FileSystemManager } from '../models/FileSystemManager'
import { renderTreeView, updateTreeView } from './TreeView'
import { createIconView, destroyIconView } from './IconView'

/** 現在のゲームセッションで使用中のFileSystemManagerインスタンス */
let manager: FileSystemManager | null = null

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

  const wrapper = document.createElement('div')
  wrapper.className = 'game-view'

  wrapper.innerHTML = `
    <div class="instruction-area">
      <h2>${question.title}</h2>
      <ul class="instructions">
        ${question.instructions.map(i => `<li>${i}</li>`).join('')}
      </ul>
    </div>
    <div class="main-area">
      <div class="tree-panel" id="tree-panel"></div>
      <div class="icon-panel" id="icon-panel"></div>
    </div>
    <div class="action-area">
      ${question.mode === 'exercise'
        ? '<button id="check-btn" class="btn-primary">答え合わせ</button>'
        : ''}
      <button id="back-btn" class="btn-secondary">問題選択に戻る</button>
    </div>
  `

  container.appendChild(wrapper)

  const treePanel = wrapper.querySelector<HTMLElement>('#tree-panel')!
  const iconPanel = wrapper.querySelector<HTMLElement>('#icon-panel')!

  renderTreeView(treePanel, manager)

  const onMove = () => {
    updateTreeView(treePanel, manager!)
    // Practice mode: auto-complete when all items are correctly placed
    if (question.mode === 'practice') {
      const result = manager!.checkAnswer(question.answer)
      if (result.incorrect.length === 0 && result.correct.length > 0) {
        onComplete(result)
      }
    }
  }
  createIconView(iconPanel, manager, question, onMove)

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
  destroyIconView()
  manager = null
}

/**
 * 現在のFileSystemManagerインスタンスを取得します
 * @returns 現在のmanagerインスタンス、またはnull
 */
export function getManager(): FileSystemManager | null {
  return manager
}
