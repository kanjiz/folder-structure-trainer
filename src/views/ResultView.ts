import type { Question } from '../models/FileSystem'

/**
 * 結果画面をレンダリングします
 * @param container - レンダリング先のコンテナ要素
 * @param question - 実施した問題データ
 * @param result - 答え合わせの結果（正解・不正解のIDリスト）
 * @param onBackToSelect - 問題選択に戻るボタンのコールバック
 * @param onRetry - もう一度ボタンのコールバック
 */
export function renderResultView(
  container: HTMLElement,
  question: Question,
  result: { correct: string[]; incorrect: string[] },
  onBackToSelect: () => void,
  onRetry: () => void,
): void {
  const total = result.correct.length + result.incorrect.length
  const score = result.correct.length

  const wrapper = document.createElement('div')
  wrapper.className = 'result-view'

  wrapper.innerHTML = `
    <h2>結果</h2>
    <p class="score">${score} / ${total} 正解</p>
    <div class="result-items">
      ${question.items.map(item => {
        const isCorrect = result.correct.includes(item.id)
        const cls = isCorrect ? 'result-correct' : 'result-incorrect'
        const mark = isCorrect ? '\u2713' : '\u2717'
        return `<div class="result-item ${cls}"><span>${mark}</span> ${item.name}</div>`
      }).join('')}
    </div>
    <div class="result-actions">
      <button id="retry-btn" class="btn-primary">もう一度</button>
      <button id="select-btn" class="btn-secondary">問題選択に戻る</button>
    </div>
  `

  container.appendChild(wrapper)

  wrapper.querySelector('#retry-btn')!.addEventListener('click', onRetry)
  wrapper.querySelector('#select-btn')!.addEventListener('click', onBackToSelect)
}
