# 設問データのJSON外部化設計

- 日付: 2026-02-25
- ステータス: 承認済み

## 背景・動機

現在、設問データは `src/data/questions.ts` にTypeScript配列として直接埋め込まれており、
ソースコードとデータが混在している。

将来的にはGAS版で `google.script.run` API経由でスプレッドシートから設問を取得し、
結果を保存する構成を取るため、その移行を見据えてデータ取得と結果保存を抽象化する。

## スコープ

### 対象（このPR）

- `IQuestionDataSource` を `QuestionDataSource`（取得専用）と `ResultRepository`（保存専用）に分割
- `getQuestionById` をインターフェース・`StaticDataSource`・`QuestionService` から削除（未使用）
- `public/questions.json` の作成（`questions.ts` のデータを移植）
- `JsonFetchDataSource` の新規作成
- `main.ts` の非同期化（`QuestionService` + `JsonFetchDataSource` 経由に変更）
- `main.ts` から `questions.ts` への直接 import を削除
- ローディング・エラー状態の簡易UI

### 対象外（将来のGAS統合時）

- `GasDataSource` の実装
- `ResultRepository` の具体的な `saveResult` 呼び出し箇所の整備
- `QuestionResult` 型の定義

## アーキテクチャ設計

### ファイル構成

```text
public/
  questions.json                     ← 新規（設問データ）
src/
  data/
    questions.ts       ← 残す（StaticDataSource専用、main.tsは参照しない）
  services/
    types.ts           ← インターフェース分割（下記参照）
    StaticDataSource.ts    ← getQuestionById 削除・型参照更新
    StaticDataSource.test.ts ← getQuestionById テスト削除・型参照更新
    JsonFetchDataSource.ts           ← 新規
    JsonFetchDataSource.test.ts      ← 新規
    QuestionService.ts     ← getQuestionById 削除・コンストラクタ更新
    QuestionService.test.ts ← getQuestionById テスト削除・コンストラクタ更新
  main.ts                            ← 非同期化
```

### 型定義の変更（`src/services/types.ts`）

`IQuestionDataSource` を責務ごとに2つのインターフェースへ分割する。

```typescript
// 設問取得の責務
export interface QuestionDataSource {
  getQuestions(): Promise<Question[]>
}

// 結果保存の責務（GAS版で実装予定）
export interface ResultRepository {
  saveResult(userId: string, questionId: string, result: unknown): Promise<void>
}
```

#### 分割の理由

- `JsonFetchDataSource` は取得専用であり、`saveResult` を実装しない
- `GasDataSource`（将来）は両インターフェースを実装する
- オプショナルメソッド（`saveResult?`）による `if` 分岐を排除し、型安全性を高める

### `QuestionService` の変更

```typescript
export class QuestionService {
  constructor(
    private readonly dataSource: QuestionDataSource,
    private readonly resultRepo?: ResultRepository
  ) {}

  async getQuestions(): Promise<Question[]> {
    return this.dataSource.getQuestions()
  }

  async saveResult(userId: string, questionId: string, result: unknown): Promise<void> {
    if (this.resultRepo) {
      await this.resultRepo.saveResult(userId, questionId, result)
    }
  }
}
```

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
}
```

### 将来の `GasDataSource` イメージ（参考）

`google.script.run` はコールバック型のAPIのため、Promise でラップする。
`QuestionDataSource` と `ResultRepository` の両方を1クラスで実装する。

```typescript
export class GasDataSource implements QuestionDataSource, ResultRepository {
  async getQuestions(): Promise<Question[]> {
    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler(reject)
        .getQuestions()
    })
  }

  async saveResult(userId: string, questionId: string, result: unknown): Promise<void> {
    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler(reject)
        .saveResult(userId, questionId, result)
    })
  }
}
```

GAS版の `main.ts` では1つのインスタンスを両方の役割に渡す：

```typescript
const gas = new GasDataSource()
const service = new QuestionService(gas, gas)
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

### `QuestionService.test.ts`

- `resultRepo` なしで構築した場合、`saveResult` を呼んでも何もしないことを確認
- `resultRepo` ありで構築した場合、`saveResult` が委譲されることを確認

### 既存テストの修正

- `IQuestionDataSource` → `QuestionDataSource` のリネームに伴う参照修正
- `getQuestionById` 関連テストの削除（`StaticDataSource.test.ts`・`QuestionService.test.ts`）

## 実装順序（TDD）

1. `src/services/types.ts` のインターフェース分割 → 型エラーを確認
2. 全参照箇所の修正（`StaticDataSource`、`QuestionService`、各テストファイル）
3. `JsonFetchDataSource.test.ts` を作成（失敗することを確認）
4. `JsonFetchDataSource.ts` を実装（テストが通ることを確認）
5. `public/questions.json` を作成
6. `main.ts` を非同期化
7. 手動動作確認
