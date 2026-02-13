import type { Question } from '../models/FileSystem'
import { loadTemplate } from '../utils/templateLoader'

/**
 * 結果画面をレンダリングします
 *
 * Handlebarsテンプレートを使用してセマンティックHTMLを生成します。
 *
 * @param container - レンダリング先のコンテナ要素
 * @param question - 実施した問題データ
 * @param result - 答え合わせの結果（正解・不正解のIDリスト）
 * @param onBackToSelect - 問題選択に戻るボタンのコールバック
 * @param onRetry - もう一度ボタンのコールバック
 */
export async function renderResultView(
  container: HTMLElement,
  question: Question,
  result: { correct: string[]; incorrect: string[] },
  onBackToSelect: () => void,
  onRetry: () => void,
): Promise<void> {
  // テンプレートを読み込み
  const template = await loadTemplate('ResultView')

  // スコア計算
  const total = result.correct.length + result.incorrect.length
  const score = result.correct.length

  // テンプレートデータを準備
  const templateData = {
    score,
    total,
    items: question.items.map(item => {
      const isCorrect = result.correct.includes(item.id)
      return {
        name: item.name,
        cssClass: isCorrect ? 'result-correct' : 'result-incorrect',
        mark: isCorrect ? '\u2713' : '\u2717'
      }
    })
  }

  // HTMLを生成してコンテナに挿入
  const html = template(templateData)
  container.innerHTML = html

  // イベントリスナーを設定
  const retryBtn = container.querySelector('#retry-btn')
  const selectBtn = container.querySelector('#select-btn')

  if (retryBtn) {
    retryBtn.addEventListener('click', onRetry)
  }
  if (selectBtn) {
    selectBtn.addEventListener('click', onBackToSelect)
  }
}
