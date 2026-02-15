# Handlebarsヘルパーとテンプレート読み込み統一 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Handlebarsヘルパー登録とテンプレート読み込み方法を統一し、一貫性のあるコードベースを実現する

**Architecture:** ヘルパー登録を `src/lib/handlebarsHelpers.ts` に集約してアプリ起動時に初期化。すべてのビューを静的インポート + モジュールレベルコンパイルに統一し、動的インポート機構（templateLoader.ts）を削除する。

**Tech Stack:** TypeScript, Handlebars, Vitest

---

## Task 1: Handlebarsヘルパーの集約とテスト

**Files:**
- Create: `src/lib/handlebarsHelpers.ts`
- Create: `src/lib/handlebarsHelpers.spec.ts`

**Step 1: ヘルパー登録用のテストを作成**

```typescript
// src/lib/handlebarsHelpers.spec.ts
import { describe, it, expect, beforeEach } from 'vitest'
import Handlebars from 'handlebars'
import { registerHandlebarsHelpers } from './handlebarsHelpers'

describe('registerHandlebarsHelpers', () => {
  beforeEach(() => {
    // テストごとにヘルパーをクリア
    // @ts-expect-error - Handlebarsの内部プロパティにアクセス
    Handlebars.helpers = {}
  })

  it('should register eq helper', () => {
    registerHandlebarsHelpers()
    expect(Handlebars.helpers.eq).toBeDefined()
  })

  it('eq helper should return true for equal values', () => {
    registerHandlebarsHelpers()
    const template = Handlebars.compile('{{#if (eq type "folder")}}folder{{else}}file{{/if}}')
    const result = template({ type: 'folder' })
    expect(result).toBe('folder')
  })

  it('eq helper should return false for different values', () => {
    registerHandlebarsHelpers()
    const template = Handlebars.compile('{{#if (eq type "folder")}}folder{{else}}file{{/if}}')
    const result = template({ type: 'file' })
    expect(result).toBe('file')
  })
})
```

**Step 2: テストを実行して失敗を確認**

Run: `npm test src/lib/handlebarsHelpers.spec.ts`
Expected: FAIL with "Cannot find module './handlebarsHelpers'"

**Step 3: handlebarsHelpers.ts を実装**

```typescript
// src/lib/handlebarsHelpers.ts
import Handlebars from 'handlebars'

/**
 * Handlebarsカスタムヘルパーを登録
 * アプリケーション起動時に一度だけ呼び出す
 */
export function registerHandlebarsHelpers(): void {
  // 等価比較ヘルパー（テンプレート内で型比較に使用）
  Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b)
}
```

**Step 4: テストを実行して成功を確認**

Run: `npm test src/lib/handlebarsHelpers.spec.ts`
Expected: PASS (3 tests)

**Step 5: コミット（コミット1の一部）**

```bash
git add src/lib/handlebarsHelpers.ts src/lib/handlebarsHelpers.spec.ts
git commit -m "feat: Handlebarsヘルパーの集約機能を追加

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: main.ts でヘルパー初期化

**Files:**
- Modify: `src/main.ts:1-10`

**Step 1: main.ts にヘルパー初期化を追加**

`src/main.ts` の先頭（インポート部分）に以下を追加：

```typescript
import { registerHandlebarsHelpers } from './lib/handlebarsHelpers'
```

`navigateTo('select')` の直前に以下を追加：

```typescript
// Handlebarsヘルパーを初期化
registerHandlebarsHelpers()

navigateTo('select')
```

完全なコード（該当部分）:

```typescript
import './style.css'
import { renderSelectView } from './views/SelectView'
import { renderGameView } from './views/GameView'
import { renderResultView } from './views/ResultView'
import { questionSets } from './data/questions'
import type { Question } from './models/types'
import { registerHandlebarsHelpers } from './lib/handlebarsHelpers'

const app = document.querySelector<HTMLDivElement>('#app')!

// ... 既存のnavigateToなど ...

// Handlebarsヘルパーを初期化
registerHandlebarsHelpers()

navigateTo('select')
```

**Step 2: 手動テスト - アプリが起動することを確認**

Run: `npm run dev`
Expected: アプリが正常に起動し、SelectViewが表示される

ブラウザで確認:
- SelectViewが表示される
- コンソールにエラーがない

**Step 3: 既存テストが通ることを確認**

Run: `npm test`
Expected: すべてのテストがPASS

**Step 4: コミット（コミット1の一部）**

```bash
git add src/main.ts
git commit -m "feat: main.tsでHandlebarsヘルパーを初期化

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: TreeView.ts からヘルパー登録削除

**Files:**
- Modify: `src/views/TreeView.ts:6-9`

**Step 1: ヘルパー登録コードを削除**

`src/views/TreeView.ts` の7行目のヘルパー登録コメントと登録処理を削除：

削除前（6-9行目）:
```typescript
import treeViewTemplate from '../templates/TreeView.hbs?raw'

// eqヘルパーを登録（テンプレートで型比較に使用）
Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b)

const compiledTemplate = Handlebars.compile(treeViewTemplate)
```

削除後（6-8行目）:
```typescript
import treeViewTemplate from '../templates/TreeView.hbs?raw'

const compiledTemplate = Handlebars.compile(treeViewTemplate)
```

**Step 2: 手動テスト - TreeViewが正常に動作することを確認**

Run: `npm run dev`

ブラウザで確認:
1. SelectViewから問題を選択
2. GameViewが表示される
3. 左側のツリービューにフォルダアイコン（📁）とファイルアイコン（📄）が正しく表示される

**Step 3: 既存テストが通ることを確認**

Run: `npm test`
Expected: すべてのテストがPASS

**Step 4: コミット（コミット1の完了）**

```bash
git add src/views/TreeView.ts
git commit -m "refactor: Handlebarsヘルパーを集約して重複を排除

TreeView.tsからヘルパー登録を削除し、
main.tsで一元管理する形に変更。

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: IconViewDOM.ts からヘルパー登録削除

**Files:**
- Modify: `src/views/IconViewDOM.ts:10-16`

**Step 1: ヘルパー登録コードを削除**

`src/views/IconViewDOM.ts` の10-13行目のヘルパー登録コメントと条件付き登録処理を削除：

削除前（10-16行目）:
```typescript
let keydownHandler: ((e: KeyboardEvent) => void) | null = null

// Handlebars ヘルパーを登録（未登録の場合のみ）
if (!Handlebars.helpers.eq) {
  Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b)
}

// テンプレートをコンパイル
const compiledTemplate = Handlebars.compile(iconViewTemplate)
```

削除後（10-12行目）:
```typescript
let keydownHandler: ((e: KeyboardEvent) => void) | null = null

// テンプレートをコンパイル
const compiledTemplate = Handlebars.compile(iconViewTemplate)
```

**Step 2: 手動テスト - IconViewDOMが正常に動作することを確認**

Run: `npm run dev`

ブラウザで確認:
1. SelectViewから問題を選択
2. GameViewが表示される
3. アイコンビュー（中央エリア）にフォルダアイコン（📁）とファイルアイコン（📄）が正しく表示される
4. フォルダをダブルクリックして移動できる
5. ファイル/フォルダのドラッグ&ドロップが動作する

**Step 3: 既存テストが通ることを確認**

Run: `npm test`
Expected: すべてのテストがPASS

**Step 4: コミット（コミット1の補足）**

```bash
git add src/views/IconViewDOM.ts
git commit -m "refactor: IconViewDOM.tsからもヘルパー登録を削除

main.tsでの一元管理により、各ビューでの
重複登録が不要になった。

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: SelectView.ts を静的インポートに変更

**Files:**
- Modify: `src/views/SelectView.ts:1-30`
- Modify: `tests/views/SelectView.spec.ts` (awaitを削除)

**Step 1: SelectView.ts を静的インポートに変更**

`src/views/SelectView.ts` を以下のように変更：

変更前（1-25行目）:
```typescript
import type { Question } from '../models/types'
import { loadTemplate } from '../utils/templateLoader'

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
  // ... イベントリスナー設定 ...
}
```

変更後（1-25行目）:
```typescript
import type { Question } from '../models/types'
import Handlebars from 'handlebars'
import selectViewTemplate from '../templates/SelectView.hbs?raw'

// テンプレートをコンパイル
const compiledTemplate = Handlebars.compile(selectViewTemplate)

export function renderSelectView(
  container: HTMLElement,
  questions: Question[],
  onSelect: (question: Question) => void,
): void {
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
  const html = compiledTemplate(templateData)
  container.innerHTML = html
  // ... イベントリスナー設定 ...
}
```

**Step 2: SelectView.spec.ts のawaitを削除**

`tests/views/SelectView.spec.ts` (もし存在する場合) で：

変更前:
```typescript
await renderSelectView(container, questions, mockOnSelect)
```

変更後:
```typescript
renderSelectView(container, questions, mockOnSelect)
```

**Step 3: main.ts のawaitを削除**

`src/main.ts` の `navigateTo` 関数内で `renderSelectView` を呼び出している箇所から `await` を削除：

変更前:
```typescript
case 'select':
  await renderSelectView(app, questionSets, ...)
  break
```

変更後:
```typescript
case 'select':
  renderSelectView(app, questionSets, ...)
  break
```

**Step 4: 既存テストが通ることを確認**

Run: `npm test`
Expected: すべてのテストがPASS

**Step 5: 手動テスト - SelectViewが正常に動作することを確認**

Run: `npm run dev`

ブラウザで確認:
1. アプリ起動時にSelectViewが表示される
2. 問題リストが正しく表示される
3. 問題を選択してGameViewに遷移できる

**Step 6: コミット（コミット2の一部）**

```bash
git add src/views/SelectView.ts src/main.ts tests/views/SelectView.spec.ts
git commit -m "refactor: SelectView.tsを静的インポートに変更

動的インポート（async/await）から静的インポートに変更し、
再描画時のパフォーマンスを向上。

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: ResultView.ts を静的インポートに変更

**Files:**
- Modify: `src/views/ResultView.ts:1-30`
- Modify: `tests/views/ResultView.spec.ts` (awaitを削除、もし存在する場合)

**Step 1: ResultView.ts を静的インポートに変更**

`src/views/ResultView.ts` を以下のように変更：

変更前（1-30行目付近）:
```typescript
import type { Question } from '../models/types'
import { loadTemplate } from '../utils/templateLoader'

export async function renderResultView(
  container: HTMLElement,
  question: Question,
  userStructure: /* 型 */,
  correctStructure: /* 型 */,
  onRetry: () => void,
  onBackToSelect: () => void,
): Promise<void> {
  // テンプレートを読み込み
  const template = await loadTemplate('ResultView')

  // テンプレートデータを準備
  const templateData = { /* ... */ }

  // HTMLを生成してコンテナに挿入
  const html = template(templateData)
  container.innerHTML = html
  // ... イベントリスナー設定 ...
}
```

変更後（1-30行目付近）:
```typescript
import type { Question } from '../models/types'
import Handlebars from 'handlebars'
import resultViewTemplate from '../templates/ResultView.hbs?raw'

// テンプレートをコンパイル
const compiledTemplate = Handlebars.compile(resultViewTemplate)

export function renderResultView(
  container: HTMLElement,
  question: Question,
  userStructure: /* 型 */,
  correctStructure: /* 型 */,
  onRetry: () => void,
  onBackToSelect: () => void,
): void {
  // テンプレートデータを準備
  const templateData = { /* ... */ }

  // HTMLを生成してコンテナに挿入
  const html = compiledTemplate(templateData)
  container.innerHTML = html
  // ... イベントリスナー設定 ...
}
```

**Step 2: ResultView.spec.ts のawaitを削除（もし存在する場合）**

`tests/views/ResultView.spec.ts` で：

変更前:
```typescript
await renderResultView(container, ...)
```

変更後:
```typescript
renderResultView(container, ...)
```

**Step 3: main.ts のawaitを削除**

`src/main.ts` の `navigateTo` 関数内で `renderResultView` を呼び出している箇所から `await` を削除：

変更前:
```typescript
case 'result':
  await renderResultView(app, ...)
  break
```

変更後:
```typescript
case 'result':
  renderResultView(app, ...)
  break
```

**Step 4: 既存テストが通ることを確認**

Run: `npm test`
Expected: すべてのテストがPASS

**Step 5: 手動テスト - ResultViewが正常に動作することを確認**

Run: `npm run dev`

ブラウザで確認:
1. SelectViewから問題を選択
2. GameViewでフォルダ構造を作成
3. 提出ボタンをクリック
4. ResultViewが表示される
5. 正解/不正解の判定が表示される
6. 「もう一度」「問題選択に戻る」ボタンが動作する

**Step 6: コミット（コミット2の一部）**

```bash
git add src/views/ResultView.ts src/main.ts tests/views/ResultView.spec.ts
git commit -m "refactor: ResultView.tsを静的インポートに変更

SelectView同様、動的インポートから静的インポートに変更。

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: templateLoader.ts を削除

**Files:**
- Delete: `src/utils/templateLoader.ts`

**Step 1: templateLoader.ts を削除**

```bash
git rm src/utils/templateLoader.ts
```

**Step 2: 既存テストが通ることを確認**

Run: `npm test`
Expected: すべてのテストがPASS（templateLoader.tsを参照するテストがないことを確認）

**Step 3: 手動テスト - アプリ全体が正常に動作することを確認**

Run: `npm run dev`

ブラウザで確認:
1. SelectView → GameView → ResultView の全画面遷移が動作する
2. すべてのビューでHandlebarsテンプレートが正しく描画される
3. フォルダアイコン（📁）とファイルアイコン（📄）が正しく表示される
4. コンソールにエラーがない

**Step 4: コミット（コミット2の完了）**

```bash
git commit -m "refactor: テンプレート読み込みを静的インポートに統一

templateLoader.tsを削除し、すべてのビューで
静的インポート + モジュールレベルコンパイルに統一。
動的インポートのオーバーヘッドを排除してパフォーマンスを向上。

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 8: 最終確認とドキュメント更新

**Files:**
- Review: すべての変更ファイル
- Update: (必要に応じて) `README.md` や関連ドキュメント

**Step 1: すべてのテストを実行**

Run: `npm test`
Expected: すべてのテストがPASS

**Step 2: ビルドが成功することを確認**

Run: `npm run build`
Expected: ビルドが成功し、distフォルダが生成される

**Step 3: 手動での完全な動作確認**

Run: `npm run dev`

ブラウザで以下を確認:
1. SelectViewで問題リストが表示される
2. 各問題を選択してGameViewに遷移できる
3. GameViewで：
   - TreeViewにフォルダ/ファイルアイコンが正しく表示される
   - IconViewDOMにフォルダ/ファイルアイコンが正しく表示される
   - Breadcrumbが正しく表示される
   - ドラッグ&ドロップが動作する
   - フォルダの作成/削除が動作する
4. ResultViewで：
   - 正解/不正解の判定が表示される
   - 「もう一度」「問題選択に戻る」ボタンが動作する

**Step 4: コミット履歴を確認**

Run: `git log --oneline`

期待される履歴（最新から）:
```
refactor: テンプレート読み込みを静的インポートに統一
refactor: ResultView.tsを静的インポートに変更
refactor: SelectView.tsを静的インポートに変更
refactor: IconViewDOM.tsからもヘルパー登録を削除
refactor: Handlebarsヘルパーを集約して重複を排除
feat: main.tsでHandlebarsヘルパーを初期化
feat: Handlebarsヘルパーの集約機能を追加
docs: Handlebarsヘルパーとテンプレート読み込みの統一設計を追加
```

**Step 5: （必要に応じて）ドキュメントの更新**

もし `README.md` や他のドキュメントでテンプレートローダーについて言及している場合は更新：

- templateLoaderの説明を削除
- 静的インポートパターンの説明を追加

変更があった場合:
```bash
git add README.md
git commit -m "docs: テンプレート読み込み方法の変更をドキュメントに反映

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## 完了条件チェックリスト

実装が完了したら、以下をすべて確認してください：

- [ ] すべてのテストがPASS（`npm test`）
- [ ] ビルドが成功（`npm run build`）
- [ ] アプリが正常に起動（`npm run dev`）
- [ ] SelectView → GameView → ResultView の遷移が動作
- [ ] フォルダ/ファイルアイコン（📁📄）が正しく表示
- [ ] ドラッグ&ドロップが動作
- [ ] ヘルパー登録が1箇所（src/lib/handlebarsHelpers.ts）のみ
- [ ] すべてのビューが静的インポートを使用
- [ ] templateLoader.ts が削除されている
- [ ] コミット数が適切（7-8個程度）
- [ ] すべてのコミットメッセージが明確

---

## トラブルシューティング

### テストが失敗する場合

**症状**: `npm test` でエラーが発生

**確認事項**:
1. handlebarsHelpers.spec.ts のbeforeEachが正しく動作しているか
2. main.ts でregisterHandlebarsHelpers()が呼ばれているか
3. SelectView/ResultViewのテストから`await`が削除されているか

### アプリが起動しない場合

**症状**: `npm run dev` でエラーが発生、または画面が真っ白

**確認事項**:
1. ブラウザのコンソールでエラーを確認
2. main.ts でregisterHandlebarsHelpers()がnavigateTo('select')の前に呼ばれているか
3. すべてのビューで静的インポートが正しく記述されているか

### アイコンが表示されない場合

**症状**: フォルダ/ファイルアイコン（📁📄）が表示されない

**確認事項**:
1. main.ts でregisterHandlebarsHelpers()が呼ばれているか
2. ブラウザのコンソールで「Helper 'eq' not found」エラーがないか
3. テンプレート（.hbs）ファイルが正しく読み込まれているか
