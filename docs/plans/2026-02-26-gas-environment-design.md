# GAS版 環境整備設計

- 日付: 2026-02-26
- ステータス: 承認済み

## 背景・動機

現在、アプリケーションは `JsonFetchDataSource` を使った開発環境（Vite + GitHub Pages）のみで動作する。
`VITE_ENV=gas` を指定すると `throw new Error('GASDataSource is not implemented yet')` が発生する状態であり、
GAS版を動作させるための環境が整っていない。

GAS版では以下を実現する：

- Google Apps Script の HTML Service でクライアントを配信
- `google.script.run` 経由でサーバー側 GAS 関数を呼び出し、設問を取得・結果を保存
- Google Workspace の組織ドメイン設定と `appsscript.json` の `access: "DOMAIN"` により GAS レベルでアクセス制御する（アプリコードでのメールアドレス検証は不要）
- 「いつ・誰が（メールアドレス）・どの問題を・どんな結果か」を記録

## スコープ

### 対象（このPR）

1. **`GasDataSource` の実装** (`src/services/GasDataSource.ts`)
   - `QuestionDataSource` と `ResultRepository` を実装
   - `google.script.run` を Promise でラップ

2. **`environment.ts` の刷新**
   - `createDataSource()` と `isResultSavingEnabled()` を廃止
   - `createServices()` を新設（`{ dataSource, resultRepo? }` を返す）
   - GAS環境では `GasDataSource` の同一インスタンスを両方の役割に渡す

3. **`main.ts` の更新**
   - `createServices()` を使うよう変更
   - 「答え合わせ」コールバックで `questionService.saveResult()` を呼び出す（GAS環境では保存、それ以外は no-op）

4. **Vite ビルド設定の GAS 対応**
   - `vite-plugin-singlefile` でシングル HTML 出力
   - `npm run build:gas` スクリプト追加
   - `.env.gas` ファイル追加

5. **型定義の追加**
   - `@types/google-apps-script` パッケージの追加

6. **GAS プロジェクトの雛形** (`src/gas/`)
   - `Code.ts` — エントリーポイント（`doGet`・グローバル関数）
   - `QuestionRepository.ts` — 設問シートの CRUD（今回は読み取りのみ実装）
   - `ResultRepository.ts` — 結果シートへの書き込み

7. **clasp 設定**
   - `.clasp.json` の追加（`.gitignore` 対象）
   - `appsscript.json` の追加
   - `npm run deploy:gas` スクリプト追加

8. **`.gitignore` の更新**
   - `src/gas/index.html`（Vite ビルド成果物）を追加

### 対象外（将来対応）

- `QuestionRepository` への設問追加・更新・削除の実装（スケルトンのみ用意）
- 設問作成用管理ページ（`admin.html`）の実装
- スプレッドシートの具体的なシート設計・初期化スクリプト
- GAS スクリプト ID の設定（実際の GAS プロジェクト作成は手動）

## アーキテクチャ設計

### ファイル構成（差分）

```text
folder-structure-trainer/
├── .env.gas                              ← 新規（GAS ビルド用環境変数）
├── .clasp.json                           ← 新規（gitignore 対象）
├── .gitignore                            ← src/gas/index.html を追加
├── src/
│   ├── gas/                              ← 新規（GAS サーバーサイドコード）
│   │   ├── appsscript.json              ← GAS マニフェスト
│   │   ├── Code.ts                      ← エントリーポイント
│   │   ├── QuestionRepository.ts        ← 設問シートの CRUD
│   │   └── ResultRepository.ts          ← 結果シートへの書き込み
│   ├── config/
│   │   └── environment.ts               ← createServices() に刷新
│   ├── services/
│   │   ├── GasDataSource.ts             ← 新規（クライアントサイド）
│   │   └── GasDataSource.test.ts        ← 新規
│   └── main.ts                          ← createServices() + saveResult 呼び出しに更新
├── package.json                          ← build:gas, deploy:gas スクリプト追加
└── vite.config.ts                        ← GAS ビルド設定追加
```

> `src/gas/` は Vite のバンドル対象外。`main.ts` からインポートされないため、
> 除外設定なしでクライアントバンドルに含まれない。

### クライアントサイド：`GasDataSource`

`QuestionDataSource` と `ResultRepository` の両インターフェースを実装し、
`createServices()` で1つのインスタンスを両方の役割に渡す。

```typescript
export class GasDataSource implements QuestionDataSource, ResultRepository {
  /** 設問を GAS サーバーから取得 */
  async getQuestions(): Promise<Question[]> {
    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler((data: Question[]) => resolve(data))
        .withFailureHandler((error: Error) => reject(error))
        .getQuestions()
    })
  }

  /**
   * 結果を GAS サーバーに保存
   * userId はサーバーサイドでセッションから取得するため使用しない
   */
  async saveResult(_userId: string, questionId: string, result: unknown): Promise<void> {
    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler(() => resolve())
        .withFailureHandler((error: Error) => reject(error))
        .saveResult(questionId, result)
    })
  }
}
```

### `environment.ts` の変更

`createDataSource()` と `isResultSavingEnabled()` を廃止し、`createServices()` に一本化する。

```typescript
import { GasDataSource } from '../services/GasDataSource'
import type { QuestionDataSource, ResultRepository } from '../services/types'

export function createServices(): {
  dataSource: QuestionDataSource
  resultRepo?: ResultRepository
} {
  switch (getEnvironment()) {
    case 'gas': {
      const gas = new GasDataSource()
      return { dataSource: gas, resultRepo: gas }
    }
    case 'development':
    default:
      return {
        dataSource: new JsonFetchDataSource(`${import.meta.env.BASE_URL}questions.json`),
      }
  }
}
```

`resultRepo` の有無が環境判定を兼ねるため、`isResultSavingEnabled()` は不要になる。

### `main.ts` の変更

`createServices()` を使い、「答え合わせ」コールバックで `saveResult` を呼び出す。
`resultRepo` が `undefined`（development / GitHub Pages）の場合、`QuestionService.saveResult` は no-op になる。

```typescript
const { dataSource, resultRepo } = createServices()
const questionService = new QuestionService(dataSource, resultRepo)

// 答え合わせコールバック
async (result) => {
  lastResult = result
  await questionService.saveResult('', currentQuestion.id, result)
  // userId はサーバー側で Session から取得するため空文字を渡す
  navigateTo('result')
}
```

### GAS サーバーサイド：`Code.ts`

グローバル関数として定義。将来の管理ページに備え `doGet` はページルーティングを担う。

```typescript
/**
 * WebアプリのエントリーポイントHTMLを返す
 * ?page=admin で管理ページを返す（将来実装）
 */
function doGet(e: GoogleAppsScript.Events.DoGet): GoogleAppsScript.HTML.HtmlOutput {
  const page = e.parameter['page'] ?? 'trainer'
  if (page === 'admin') {
    // 将来：管理ページを返す
    // return HtmlService.createHtmlOutputFromFile('admin')
    return HtmlService.createHtmlOutput('<p>管理ページは未実装です</p>')
  }
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('フォルダ構造トレーナー')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
}

/** 設問一覧を返す */
function getQuestions(): Question[] {
  return new QuestionRepository().findAll()
}

/**
 * 結果を保存する
 * userId はクライアントから受け取らず、サーバーサイドでセッションから取得する
 */
function saveResult(questionId: string, result: QuestionResult): void {
  const email = Session.getActiveUser().getEmail()
  new ResultRepository().save(email, questionId, result)
}
```

### GAS サーバーサイド：`QuestionRepository.ts`

将来の設問追加に備え CRUD のスケルトンを定義。今回は `findAll()` のみ実装する。

```typescript
class QuestionRepository {
  /** 設問シートから全設問を取得 */
  findAll(): Question[] {
    // TODO: スプレッドシートから取得する実装
    throw new Error('QuestionRepository.findAll は未実装です')
  }

  /** 設問を追加（将来実装） */
  add(_question: Question): void {
    throw new Error('QuestionRepository.add は未実装です')
  }

  /** 設問を更新（将来実装） */
  update(_question: Question): void {
    throw new Error('QuestionRepository.update は未実装です')
  }

  /** 設問を削除（将来実装） */
  remove(_questionId: string): void {
    throw new Error('QuestionRepository.remove は未実装です')
  }
}
```

### GAS サーバーサイド：`ResultRepository.ts`

記録する内容：タイムスタンプ・メールアドレス・問題 ID・正解数・不正解数。
メールアドレスはサーバーサイドでセッションから取得するため、クライアントから受け取らない。

```typescript
/** 結果レコードの型 */
interface QuestionResult {
  correct: string[]   // 正しく配置されたノードのIDリスト
  incorrect: string[] // 誤って配置されたノードのIDリスト
}

class ResultRepository {
  /**
   * 結果をスプレッドシートに記録
   * @param email - 受講生のメールアドレス（Session から取得済み）
   * @param questionId - 設問 ID
   * @param result - 正誤結果
   */
  save(email: string, questionId: string, result: QuestionResult): void {
    // TODO: スプレッドシートへの書き込み実装
    // カラム: タイムスタンプ | メールアドレス | 問題ID | 正解数 | 不正解数
    throw new Error('ResultRepository.save は未実装です')
  }
}
```

### Vite ビルド設定

`.env.gas`:

```env
VITE_ENV=gas
BASE_URL=/
```

`vite.config.ts` 追加部分（`vite-plugin-singlefile` でシングル HTML 出力）:

```typescript
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig(({ mode }) => ({
  plugins: [
    ...(mode === 'gas' ? [viteSingleFile()] : []),
  ],
  build: {
    outDir: mode === 'gas' ? 'src/gas' : 'dist',
  },
}))
```

`package.json` 追加スクリプト:

```json
{
  "scripts": {
    "build:gas": "vite build --mode gas",
    "deploy:gas": "npm run build:gas && clasp push"
  }
}
```

### clasp 設定

`.clasp.json`（`.gitignore` に追加）:

```json
{
  "scriptId": "YOUR_SCRIPT_ID_HERE",
  "rootDir": "./src/gas"
}
```

`src/gas/appsscript.json`:

```json
{
  "timeZone": "Asia/Tokyo",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "webapp": {
    "executeAs": "USER_ACCESSING",
    "access": "DOMAIN"
  }
}
```

> `access: "DOMAIN"` により Google Workspace の組織ドメインユーザーのみアクセス可能となる。
> アプリコードでのメールアドレス検証は不要。

## テスト方針

### `GasDataSource.test.ts`

GAS ランタイム外でのテストのため `google.script.run` をモックする。

```typescript
const mockRun = {
  withSuccessHandler: vi.fn().mockReturnThis(),
  withFailureHandler: vi.fn().mockReturnThis(),
  getQuestions: vi.fn(),
  saveResult: vi.fn(),
}
vi.stubGlobal('google', { script: { run: mockRun } })
```

テストケース：

- `getQuestions()`: `withSuccessHandler` が `Question[]` で resolve することを確認
- `getQuestions()`: `withFailureHandler` が reject することを確認
- `saveResult()`: `withSuccessHandler` が resolve することを確認
- `saveResult()`: `withFailureHandler` が reject することを確認

### `environment.test.ts` の更新

`createDataSource()` → `createServices()` に変更する。

```typescript
describe('createServices', () => {
  it('development環境: dataSourceがJsonFetchDataSourceで、resultRepoがundefined', () => {
    import.meta.env.VITE_ENV = 'development'
    const { dataSource, resultRepo } = createServices()
    expect(dataSource).toBeInstanceOf(JsonFetchDataSource)
    expect(resultRepo).toBeUndefined()
  })

  it('gas環境: dataSourceとresultRepoが同一のGasDataSourceインスタンス', () => {
    import.meta.env.VITE_ENV = 'gas'
    const { dataSource, resultRepo } = createServices()
    expect(dataSource).toBeInstanceOf(GasDataSource)
    expect(dataSource).toBe(resultRepo) // 同一インスタンス
  })
})
```

## 実装順序（TDD）

1. `@types/google-apps-script` と `vite-plugin-singlefile` をインストール
2. `GasDataSource.test.ts` を作成（失敗を確認）
3. `GasDataSource.ts` を実装（テスト通過を確認）
4. `environment.test.ts` を `createServices()` に更新（失敗を確認）
5. `environment.ts` を `createServices()` に置き換え（テスト通過を確認）
6. `main.ts` を `createServices()` + `saveResult` 呼び出しに更新
7. `vite.config.ts` に GAS ビルド設定を追加
8. `.env.gas` を作成
9. `package.json` にスクリプトを追加
10. `src/gas/` にサーバーサイドの雛形ファイルを作成
11. `.gitignore` に `.clasp.json` と `src/gas/index.html` を追加
12. `npm run build:gas` で動作確認
