# テンプレート分離とセマンティックHTML化 - 設計書

**作成日**: 2026-02-13
**ステータス**: 承認済み

## 目的

1. **テンプレート分離**: HTMLをTypeScriptコードから分離し、エンジニア以外でも編集可能にする
2. **セマンティックHTML化**: ランドマーク要素やARIA属性を追加し、アクセシビリティを向上させる
3. **GAS対応の準備**: 将来的なGoogle Apps Script + Spreadsheet移行を見据えた設計

## 背景

### 現在の課題

- HTMLがTypeScriptコード内に埋め込まれており、非エンジニアが編集困難
- `<div>` 中心の構造で、セマンティックなHTML要素が不足
- 問題データや成績データが静的で、職業訓練の受講生管理に対応できない

### 将来的な要件

- **練習モード**: GitHub Pages（全世界公開、何度でも練習可能）
- **本番モード**: GAS HtmlService（Google Workspace認証、受講生と紐づけ、成績をSpreadsheetに保存）

## アーキテクチャ概要

### 全体構成

```text
┌─────────────────────────────────────────┐
│  フロントエンド（共通）                      │
│  ├─ Templates（Handlebars）              │
│  ├─ Views（TypeScript）                  │
│  └─ Services（データソース抽象化）          │
└─────────────────────────────────────────┘
           ↓ 環境変数で切り替え
    ┌──────────┴──────────┐
    ↓                     ↓
【練習モード】          【本番モード】
GitHub Pages          GAS HtmlService
    ↓                     ↓
StaticDataSource      GASDataSource
    ↓                     ↓
questions.ts          Spreadsheet
```

### 設計原則

1. **関心の分離**
   - テンプレート（見た目）
   - ビュー（DOM操作・イベント）
   - サービス（データ取得）

2. **データソース抽象化**
   - インターフェース定義で依存性を逆転
   - 環境に応じて実装を差し替え
   - テストも容易に

3. **段階的な移行**
   - SelectView → ResultView → 他のビュー
   - 既存コードへの影響を最小化

## ディレクトリ構造

### フロントエンド（現在のsrc/）

```text
src/
├── templates/                    # 新規：Handlebarsテンプレート
│   ├── SelectView.hbs           # 問題選択画面
│   └── ResultView.hbs           # 結果画面
│
├── views/                        # 既存：ビューロジック（修正）
│   ├── SelectView.ts            # テンプレートを使うように修正
│   ├── ResultView.ts            # テンプレートを使うように修正
│   ├── GameView.ts              # 将来対応
│   └── ...
│
├── services/                     # 新規：データソース抽象化
│   ├── types.ts                 # インターフェース定義
│   ├── QuestionService.ts       # データ取得サービス
│   ├── StaticDataSource.ts      # 静的データソース（現在）
│   └── GASDataSource.ts         # GASデータソース（将来）
│
├── config/                       # 新規：環境設定
│   └── environment.ts           # 環境変数管理
│
├── data/                         # 既存：静的データ（そのまま）
│   └── questions.ts
│
└── utils/                        # 新規：テンプレートユーティリティ
    └── templateLoader.ts        # テンプレート読み込み
```

### GAS（将来）

```text
gas/
├── src/
│   ├── api.ts                   # APIエンドポイント
│   ├── spreadsheet.ts           # Spreadsheet操作
│   └── auth.ts                  # 認証
├── package.json
└── .clasp.json                  # GASデプロイ設定
```

### 型定義の共有

- `src/models/types.ts` をフロントエンド/GASで共通利用
- Question、QuestionResult等の型をエクスポート

## テンプレート設計（セマンティックHTML）

### SelectView.hbs

```handlebars
<main class="select-view" role="main">
  <header class="select-view__header">
    <h1>フォルダ構造トレーナー</h1>
    <p class="select-view__description">問題を選んでください</p>
  </header>

  <section class="select-view__content" aria-label="問題リスト">
    <ul class="question-list" role="list">
      {{#each questions}}
        <li class="question-list__item">
          <button
            class="question-card"
            type="button"
            aria-label="{{modeLabel}}: {{title}}"
            data-question-id="{{id}}">
            <span class="mode-badge mode-{{mode}}" aria-hidden="true">
              {{modeLabel}}
            </span>
            <span class="question-title">{{title}}</span>
          </button>
        </li>
      {{/each}}
    </ul>
  </section>
</main>
```

### セマンティック改善ポイント

1. **ランドマーク要素**
   - `<main>`: メインコンテンツ
   - `<header>`: ヘッダーセクション
   - `<section>`: 問題リストセクション

2. **リスト構造**
   - `<ul>` + `<li>`: 問題のリスト
   - `role="list"`: スクリーンリーダー対応

3. **アクセシビリティ**
   - `aria-label`: セクションとボタンの説明
   - `aria-hidden="true"`: 装飾的なバッジを読み上げから除外
   - `type="button"`: ボタンの明示

## データソース抽象化

### インターフェース定義（services/types.ts）

```typescript
/**
 * 問題データソースのインターフェース
 */
export interface IQuestionDataSource {
  /**
   * 全ての問題を取得
   */
  getQuestions(): Promise<Question[]>

  /**
   * 特定の問題を取得
   */
  getQuestionById(id: string): Promise<Question | null>

  /**
   * 結果を保存（本番モードのみ）
   */
  saveResult?(userId: string, questionId: string, result: QuestionResult): Promise<void>
}
```

### StaticDataSource（練習モード）

```typescript
import { questions } from '../data/questions'

export class StaticDataSource implements IQuestionDataSource {
  async getQuestions(): Promise<Question[]> {
    return questions
  }

  async getQuestionById(id: string): Promise<Question | null> {
    return questions.find(q => q.id === id) || null
  }

  // saveResult は実装しない（練習モードでは保存不要）
}
```

### GASDataSource（本番モード、将来）

```typescript
export class GASDataSource implements IQuestionDataSource {
  async getQuestions(): Promise<Question[]> {
    const response = await fetch('/api/questions')
    return response.json()
  }

  async getQuestionById(id: string): Promise<Question | null> {
    const response = await fetch(`/api/questions/${id}`)
    return response.json()
  }

  async saveResult(userId: string, questionId: string, result: QuestionResult): Promise<void> {
    await fetch('/api/results', {
      method: 'POST',
      body: JSON.stringify({ userId, questionId, result })
    })
  }
}
```

### QuestionService

```typescript
export class QuestionService {
  constructor(private dataSource: IQuestionDataSource) {}

  async getQuestions(): Promise<Question[]> {
    return this.dataSource.getQuestions()
  }

  async getQuestionById(id: string): Promise<Question | null> {
    return this.dataSource.getQuestionById(id)
  }

  async saveResult(userId: string, questionId: string, result: QuestionResult): Promise<void> {
    if (this.dataSource.saveResult) {
      await this.dataSource.saveResult(userId, questionId, result)
    }
  }
}
```

## 環境切り替え

### 環境設定（config/environment.ts）

```typescript
/**
 * 環境タイプ
 */
export type Environment = 'development' | 'github-pages' | 'gas'

/**
 * 現在の環境を取得
 */
export function getEnvironment(): Environment {
  const env = import.meta.env.VITE_ENV as Environment
  return env || 'development'
}

/**
 * 環境に応じたデータソースを取得
 */
export function createDataSource(): IQuestionDataSource {
  const env = getEnvironment()

  switch (env) {
    case 'gas':
      return new GASDataSource()
    case 'github-pages':
    case 'development':
    default:
      return new StaticDataSource()
  }
}

/**
 * 結果保存が有効かどうか
 */
export function isResultSavingEnabled(): boolean {
  return getEnvironment() === 'gas'
}
```

### 環境変数ファイル

#### .env.development

```bash
VITE_ENV=development
```

#### .env.production

```bash
VITE_ENV=github-pages
```

#### .env.gas

```bash
VITE_ENV=gas
```

### ビルドコマンド

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:gas": "vite build --mode gas"
  }
}
```

## ビルドプロセス

### Vite設定

```typescript
import { defineConfig } from 'vite'
import handlebars from 'vite-plugin-handlebars'

export default defineConfig({
  plugins: [
    handlebars({
      partialDirectory: 'src/templates',
    })
  ],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html'
      }
    }
  }
})
```

### テンプレートローダー

```typescript
import Handlebars from 'handlebars'

const templateCache = new Map<string, HandlebarsTemplateDelegate>()

export async function loadTemplate(name: string): Promise<HandlebarsTemplateDelegate> {
  if (templateCache.has(name)) {
    return templateCache.get(name)!
  }

  const templateModule = await import(`../templates/${name}.hbs?raw`)
  const templateSource = templateModule.default
  const template = Handlebars.compile(templateSource)

  templateCache.set(name, template)
  return template
}
```

### ビュー修正例

```typescript
import { loadTemplate } from '../utils/templateLoader'

export async function renderSelectView(
  container: HTMLElement,
  questions: Question[],
  onSelect: (question: Question) => void,
): Promise<void> {
  const template = await loadTemplate('SelectView')

  const data = {
    questions: questions.map(q => ({
      ...q,
      modeLabel: q.mode === 'practice' ? '練習' : '演習'
    }))
  }

  const html = template(data)
  container.innerHTML = html

  container.querySelectorAll('.question-card').forEach(card => {
    const questionId = card.getAttribute('data-question-id')!
    const question = questions.find(q => q.id === questionId)!
    card.addEventListener('click', () => onSelect(question))
  })
}
```

## 段階的な移行計画

### フェーズ1: 基盤構築 + SelectView

**目標**: テンプレートシステムの基盤を構築し、SelectViewで検証

**作業内容:**

1. 依存関係の追加（Handlebars、vite-plugin-handlebars）
2. ディレクトリ構造の作成
3. データソース抽象化の実装（インターフェース + StaticDataSource）
4. 環境設定の実装
5. テンプレートローダーの実装
6. SelectView.hbs の作成（セマンティックHTML）
7. SelectView.ts の修正（テンプレート使用）
8. 既存テストの修正・追加

**完了条件:**

- `npm run dev` でSelectViewが正常に表示される
- テンプレート修正 → 自動リロードが動作する
- 既存テストが全てパスする

### フェーズ2: ResultView

**目標**: 2つ目のビューで汎用性を検証

**作業内容:**

1. ResultView.hbs の作成（セマンティックHTML）
2. ResultView.ts の修正
3. テストの修正・追加

**完了条件:**

- ResultViewが正常に動作する
- SelectView → ゲーム → ResultView の一連の流れが動作する

### フェーズ3: 他のビュー（将来）

**対象:**

- GameView（最も複雑）
- TreeView、BreadcrumbView、IconViewDOM
- ContextMenu

**段階:**

1. シンプルなビュー（BreadcrumbView、ContextMenu）
2. 中程度のビュー（TreeView、IconViewDOM）
3. 複雑なビュー（GameView）

### フェーズ4: GAS対応（将来）

**作業内容:**

1. GASDataSource の実装
2. GAS側のAPIエンドポイント作成（Spreadsheet連携）
3. 認証機能の追加
4. ビルドスクリプトの整備（`npm run build:gas`）
5. デプロイフローの確立

## テスト戦略

### ビューのテスト

```typescript
describe('SelectView', () => {
  it('セマンティックなHTML構造をレンダリングする', async () => {
    const questions: Question[] = [
      { id: '1', title: 'テスト問題', mode: 'practice', /* ... */ }
    ]

    await renderSelectView(container, questions, () => {})

    expect(container.querySelector('main[role="main"]')).toBeTruthy()
    expect(container.querySelector('ul[role="list"]')).toBeTruthy()

    const button = container.querySelector('.question-card')
    expect(button?.getAttribute('aria-label')).toBe('練習: テスト問題')
  })
})
```

### データソースのテスト

```typescript
describe('QuestionService', () => {
  it('StaticDataSourceから問題を取得できる', async () => {
    const dataSource = new StaticDataSource()
    const service = new QuestionService(dataSource)

    const questions = await service.getQuestions()
    expect(questions.length).toBeGreaterThan(0)
  })
})
```

### GASDataSourceのテスト（将来）

```typescript
describe('GASDataSource', () => {
  it('API経由で問題を取得できる', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => [{ id: '1', title: 'テスト' }]
    })

    const dataSource = new GASDataSource()
    const questions = await dataSource.getQuestions()

    expect(questions).toHaveLength(1)
  })
})
```

## 依存関係

### 追加するパッケージ

```json
{
  "devDependencies": {
    "handlebars": "^4.7.8",
    "vite-plugin-handlebars": "^2.0.0"
  }
}
```

## 成功基準

### フェーズ1完了時

- [ ] SelectViewがHandlebarsテンプレートを使用している
- [ ] セマンティックなHTML構造になっている
- [ ] テンプレート修正でホットリロードが動作する
- [ ] 既存のテストが全てパスする
- [ ] 新しいテスト（セマンティック構造、アクセシビリティ）がパスする

### フェーズ2完了時

- [ ] ResultViewがHandlebarsテンプレートを使用している
- [ ] SelectView → ゲーム → ResultView の流れが正常に動作する
- [ ] コードの重複が削減されている

### 将来のGAS対応完了時

- [ ] GASDataSourceが実装されている
- [ ] Spreadsheetからの問題取得が動作する
- [ ] 受講生の成績保存が動作する
- [ ] 認証機能が実装されている
- [ ] `npm run build:gas` でGAS用ビルドが成功する

## まとめ

この設計により：

1. **テンプレートとロジックの分離** - 非エンジニアでも編集可能
2. **セマンティックHTML** - アクセシビリティの向上
3. **GAS対応の準備** - 将来の本番運用に向けた基盤
4. **段階的な移行** - リスクを最小化しながら進行

を実現します。
