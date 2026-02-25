# 設問データのJSON外部化設計

- 日付: 2026-02-25
- ステータス: 提案中

## 背景・動機

現在、設問データは `src/data/questions.ts` にTypeScript配列として直接埋め込まれており、
ソースコードとデータが混在している。

将来的にはGAS版で `google.script.run` API経由でスプレッドシートから設問を取得する構成を
取るため、その移行を見据えてデータ取得を抽象化する。

## スコープ

### 対象（このPR）

- `IQuestionDataSource` → `QuestionDataSource` へのリネーム（全参照箇所）
- `public/questions.json` の作成（`questions.ts` のデータを移植）
- `JsonFetchDataSource` の新規作成
- `main.ts` の非同期化（`QuestionService` + `JsonFetchDataSource` 経由に変更）
- ローディング・エラー状態の簡易UI

### 対象外（将来のGAS統合時）

- `GasDataSource` の実装
- `saveResult` シグネチャの統一
- `QuestionResult` 型の定義

## アーキテクチャ設計

### ファイル構成

```text
public/
  questions.json                     ← 新規（設問データ）
src/
  data/
    questions.ts                     ← 残す（StaticDataSourceが参照、テスト用途）
  services/
    types.ts       ← IQuestionDataSource → QuestionDataSource にリネーム
    StaticDataSource.ts              ← 型参照のリネームのみ
    StaticDataSource.test.ts         ← 型参照のリネームのみ
    JsonFetchDataSource.ts           ← 新規
    JsonFetchDataSource.test.ts      ← 新規
    QuestionService.ts               ← 型参照のリネームのみ
    QuestionService.test.ts          ← 型参照のリネームのみ
  main.ts                            ← 非同期化
```

### 型定義の変更（`src/services/types.ts`）

```typescript
// 変更前
export interface IQuestionDataSource { ... }

// 変更後
export interface QuestionDataSource { ... }
```

`saveResult` の任意プロパティのシグネチャは現状維持とする。

### `JsonFetchDataSource` の設計

```typescript
export class JsonFetchDataSource implements QuestionDataSource {
  constructor(private readonly url: string) {}

  async getQuestions(): Promise<Question[]> {
    const response = await fetch(this.url)
    if (!response.ok) {
      throw new Error(`設問データの取得に失敗しました: ${response.status}`)
    }
    return response.json() as Promise<Question[]>
  }

  async getQuestionById(id: string): Promise<Question | null> {
    const questions = await this.getQuestions()
    return questions.find(q => q.id === id) ?? null
  }
}
```

### `main.ts` の変更方針

初期化時に設問を一度だけ取得してモジュールスコープ変数に保持する。
ローディング中・エラー時のUIはシンプルなテキスト表示とする。

```typescript
import { QuestionService } from './services/QuestionService'
import { JsonFetchDataSource } from './services/JsonFetchDataSource'

const dataSource = new JsonFetchDataSource('/questions.json')
const questionService = new QuestionService(dataSource)

let questions: Question[] = []

async function init(): Promise<void> {
  app.innerHTML = '<p>読み込み中...</p>'
  try {
    questions = await questionService.getQuestions()
    navigateTo('select')
  } catch {
    app.innerHTML = '<p>設問データの読み込みに失敗しました。</p>'
  }
}
```

既存の `navigateTo` 内ではモジュールスコープの `questions` 変数をそのまま使う。

### `public/questions.json` の構造

`src/data/questions.ts` の配列をそのままJSONに変換したもの。
型は `Question[]` と一致させる。

```json
[
  {
    "id": "q001",
    "title": "仕事のファイルを整理しよう",
    "mode": "practice",
    "instructions": ["..."],
    "items": [...],
    "answer": { ... }
  }
]
```

## テスト方針

### `JsonFetchDataSource.test.ts`

- `fetch` をモックし、正常レスポンス時に `Question[]` が返ることを確認
- `fetch` が `ok: false` のレスポンスを返した場合に `Error` がスローされることを確認
- `getQuestionById` が存在するIDで正しい設問を返すことを確認
- `getQuestionById` が存在しないIDで `null` を返すことを確認

### 既存テストの修正

- `IQuestionDataSource` → `QuestionDataSource` のリネームに伴う参照修正のみ

## 実装順序（TDD）

1. `src/services/types.ts` のリネーム → 型エラーを確認
2. 全参照箇所の修正（`StaticDataSource`、`QuestionService`、各テストファイル）
3. `JsonFetchDataSource.test.ts` を作成（失敗することを確認）
4. `JsonFetchDataSource.ts` を実装（テストが通ることを確認）
5. `public/questions.json` を作成
6. `main.ts` を非同期化
7. 手動動作確認
