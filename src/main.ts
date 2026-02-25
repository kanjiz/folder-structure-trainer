import type { Question } from './models/types'
import { QuestionService } from './services/QuestionService'
import { createDataSource } from './config/environment'
import { renderSelectView } from './views/SelectView'
import { renderGameView, destroyGameView } from './views/GameView'
import { renderResultView } from './views/ResultView'
import { registerHandlebarsHelpers } from './lib/handlebarsHelpers'

/** 現在選択されている設問 */
let currentQuestion: Question | null = null
/** 最後の答え合わせ結果 */
let lastResult: { correct: string[]; incorrect: string[] } | null = null
/** 取得した設問一覧 */
let questions: Question[] = []

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
        renderResultView(
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

/**
 * アプリケーションを初期化します
 *
 * 設問データを取得し、選択画面に遷移します。
 * 取得に失敗した場合はエラーメッセージを表示します。
 */
async function init(): Promise<void> {
  // Handlebarsヘルパーを初期化
  registerHandlebarsHelpers()

  app.innerHTML = '<p>読み込み中...</p>'

  try {
    const dataSource = createDataSource()
    const questionService = new QuestionService(dataSource)
    questions = await questionService.getQuestions()
    navigateTo('select')
  } catch {
    app.innerHTML = '<p>設問データの読み込みに失敗しました。</p>'
  }
}

init()
