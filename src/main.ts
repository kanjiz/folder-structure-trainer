import { questions } from './data/questions'
import type { Question } from './models/FileSystem'
import { renderSelectView } from './views/SelectView'
import { renderGameView, destroyGameView } from './views/GameView'
import { renderResultView } from './views/ResultView'

let currentQuestion: Question | null = null
let lastResult: { correct: string[]; incorrect: string[] } | null = null

const app = document.querySelector<HTMLDivElement>('#app')!

function navigateTo(screen: 'select' | 'game' | 'result'): void {
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

navigateTo('select')
