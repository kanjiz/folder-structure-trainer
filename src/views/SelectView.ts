import type { Question } from '../models/FileSystem'

export function renderSelectView(
  container: HTMLElement,
  questions: Question[],
  onSelect: (question: Question) => void,
): void {
  const wrapper = document.createElement('div')
  wrapper.className = 'select-view'
  wrapper.innerHTML = `<h1>フォルダ構造トレーナー</h1><p>問題を選んでください</p>`

  const list = document.createElement('div')
  list.className = 'question-list'

  for (const q of questions) {
    const card = document.createElement('button')
    card.className = 'question-card'
    const modeLabel = q.mode === 'practice' ? '練習' : '演習'
    card.innerHTML = `
      <span class="mode-badge mode-${q.mode}">${modeLabel}</span>
      <span class="question-title">${q.title}</span>
    `
    card.addEventListener('click', () => onSelect(q))
    list.appendChild(card)
  }

  wrapper.appendChild(list)
  container.appendChild(wrapper)
}
