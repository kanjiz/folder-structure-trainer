import type { Question } from '../models/FileSystem'
import { FileSystemManager } from '../models/FileSystemManager'
import { renderTreeView, updateTreeView } from './TreeView'
import { createIconView, destroyIconView } from './IconView'

let manager: FileSystemManager | null = null

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

  const onMove = () => updateTreeView(treePanel, manager!)
  createIconView(iconPanel, manager, question, onMove)

  if (question.mode === 'exercise') {
    wrapper.querySelector('#check-btn')!.addEventListener('click', () => {
      const result = manager!.checkAnswer(question.answer)
      onComplete(result)
    })
  }

  wrapper.querySelector('#back-btn')!.addEventListener('click', onBack)
}

export function destroyGameView(): void {
  destroyIconView()
  manager = null
}

export function getManager(): FileSystemManager | null {
  return manager
}
