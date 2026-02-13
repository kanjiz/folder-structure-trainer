import type { Question } from '../models/FileSystem'
import { loadTemplate } from '../utils/templateLoader'

/**
 * 問題選択画面をレンダリングします
 *
 * Handlebarsテンプレートを使用してセマンティックHTMLを生成します。
 *
 * @param container - レンダリング先のコンテナ要素
 * @param questions - 表示する問題のリスト
 * @param onSelect - 問題選択時のコールバック
 */
export async function renderSelectView(
  container: HTMLElement,
  questions: Question[],
  onSelect: (question: Question) => void,
): Promise<void> {
  // テンプレートを読み込み
  const template = await loadTemplate('SelectView')

  // テンプレートデータを準備
  const templateData = {
    questions: questions.map(q => ({
      id: q.id,
      title: q.title,
      mode: q.mode,
      modeLabel: q.mode === 'practice' ? '練習' : '演習'
    }))
  }

  // HTMLを生成してコンテナに挿入
  const html = template(templateData)
  container.innerHTML = html

  // イベントリスナーを設定
  const buttons = container.querySelectorAll('[data-question-id]')
  buttons.forEach((button) => {
    const questionId = button.getAttribute('data-question-id')
    const question = questions.find(q => q.id === questionId)
    if (question) {
      button.addEventListener('click', () => onSelect(question))
    }
  })
}
