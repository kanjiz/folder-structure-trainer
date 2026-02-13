import { questions } from './data/questions'
import type { Question } from './models/FileSystem'
import { renderSelectView } from './views/SelectView'
import { renderGameView, destroyGameView } from './views/GameView'
import { renderResultView } from './views/ResultView'

/** 現在選択されている問題 */
let currentQuestion: Question | null = null
/** 最後の答え合わせ結果 */
let lastResult: { correct: string[]; incorrect: string[] } | null = null

/** アプリケーションのルートDOM要素 */
const app = document.querySelector<HTMLDivElement>('#app')!

/**
 * 指定された画面に遷移します
 * @param screen - 遷移先の画面（'select' | 'game' | 'result'）
 */
async function navigateTo(screen: 'select' | 'game' | 'result'): Promise<void> {
  destroyGameView()
  app.innerHTML = ''

  switch (screen) {
    case 'select':
      renderSelectView(app, questions, (q) => {
        currentQuestion = q
        navigateTo('game')
      })
      break
    case 'game':
      if (currentQuestion) {
        renderGameView(
          app,
          currentQuestion,
          (result) => {
            lastResult = result
            navigateTo('result')
          },
          () => navigateTo('select'),
        )
      }
      break
    case 'result':
      if (currentQuestion && lastResult) {
        await renderResultView(
          app,
          currentQuestion,
          lastResult,
          () => navigateTo('select'),
          () => navigateTo('game'),
        )
      }
      break
  }
}

navigateTo('select')
