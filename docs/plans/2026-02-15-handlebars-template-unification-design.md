# Handlebarsヘルパーとテンプレート読み込みの統一 - 設計書

## 概要

### 目的

Handlebarsヘルパーの登録とテンプレート読み込み方法を統一し、一貫性のあるコードベースを実現する。

### 背景

現在のコードベースには以下の不整合が存在する：

1. **ヘルパー登録の重複**
   - `TreeView.ts` と `IconViewDOM.ts` でそれぞれ `eq` ヘルパーを登録
   - 登録方法も異なる（無条件登録 vs 条件付き登録）

2. **テンプレート読み込み方法の混在**
   - 静的インポート: `TreeView.ts`, `IconViewDOM.ts`, `BreadcrumbView.ts`, `GameView.ts`
   - 動的インポート: `SelectView.ts`, `ResultView.ts`

### 解決策

#### アプローチ2（完全統一）を採用

- Handlebarsヘルパーを `src/lib/handlebarsHelpers.ts` に集約
- すべてのビューを静的インポート + モジュールレベルコンパイルに統一
- `templateLoader.ts` を削除

## アーキテクチャ

### 変更の全体像

#### 1. ヘルパー登録の集約

- 新規ファイル `src/lib/handlebarsHelpers.ts` を作成
- `eq` ヘルパーを1箇所で定義・登録
- `main.ts` のアプリ起動時に初期化関数を呼び出し

#### 2. テンプレート読み込みの統一

- すべてのビューで静的インポート + モジュールレベルコンパイルに統一
- パターン: `import template from '../templates/Xxx.hbs?raw'` → `Handlebars.compile(template)`
- `SelectView.ts`, `ResultView.ts` を同期関数に変更（async/await 削除）

#### 3. 不要ファイルの削除

- `src/utils/templateLoader.ts` を削除
- 動的インポートとキャッシュ機構を廃止

### 技術的メリット

- **パフォーマンス向上**: 再描画時のasyncオーバーヘッド排除
- **コードの一貫性**: すべて同じパターン
- **起動時初期化**: ヘルパー登録で重複チェック不要
- **ビルド最適化**: Viteの最適化を最大限活用

## 影響を受けるコンポーネント

### 新規作成

#### src/lib/handlebarsHelpers.ts

```typescript
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

### 変更対象ファイル

#### src/main.ts

- `registerHandlebarsHelpers()` をインポートして呼び出し
- アプリ起動時（`navigateTo('select')` の前）に実行

#### src/views/SelectView.ts

- `loadTemplate()` を削除し、静的インポートに変更
- `renderSelectView` を同期関数に変更（`async` 削除）
- モジュールレベルで `Handlebars.compile()` を実行

#### src/views/ResultView.ts

- SelectView と同様の変更を実施

#### src/views/TreeView.ts

- ヘルパー登録コード（7行目）を削除
- インポートとコンパイルのみ残す

#### src/views/IconViewDOM.ts

- ヘルパー登録コード（11-13行目）を削除
- インポートとコンパイルのみ残す

### 削除対象ファイル

#### src/utils/templateLoader.ts

- 全削除（動的インポート機能が不要になるため）

### データフロー

1. **起動時**: `main.ts` → `registerHandlebarsHelpers()` でヘルパー登録
2. **ビュー初期化**: 各ビューモジュール読み込み時にテンプレートコンパイル（1回のみ）
3. **レンダリング**: コンパイル済みテンプレート関数を直接呼び出し（同期・高速）

## エラーハンドリングとテスト戦略

### エラーハンドリング

#### 起動時エラー

- ヘルパー登録は失敗しない（Handlebarsの組み込み機能）
- テンプレートコンパイルは静的インポート時に実行されるため、Viteのビルド時にエラーが検出される
- 実行時エラーは発生しない設計

#### ランタイムエラー

- テンプレート構文エラー: ビルド時に検出（Vite）
- 存在しないヘルパー参照: 起動時に一度登録するため、すべてのビューで利用可能
- 従来の動的インポートで発生し得た「テンプレートが見つからない」エラーは発生しない

### テスト戦略

#### 単体テスト（既存テストの更新が必要）

1. **SelectView.spec.ts / ResultView.spec.ts**
   - `renderSelectView`, `renderResultView` が同期関数に変更されるため、`await` を削除
   - 例: `await renderSelectView(...)` → `renderSelectView(...)`

2. **handlebarsHelpers のテスト** (新規作成を推奨)
   - `src/lib/handlebarsHelpers.spec.ts` を作成
   - `eq` ヘルパーの動作確認（等価性テスト）

#### 手動テスト

- アプリ起動確認（SelectView が表示されること）
- フォルダ/ファイルアイコンの表示確認（eq ヘルパーが機能していること）
- すべてのビュー間の遷移確認

#### 回帰テスト

- 既存のすべてのテストが通ることを確認
- 視覚的な表示に変更がないことを確認

## コミット戦略

### 2つのコミットで段階的に実装

#### コミット1: Handlebarsヘルパーの統一

**目的**: ヘルパー登録を集約し、重複を排除

**変更内容**:

- `src/lib/handlebarsHelpers.ts` を新規作成
- `src/main.ts` にヘルパー初期化を追加
- `src/views/TreeView.ts` からヘルパー登録コード削除（7行目）
- `src/views/IconViewDOM.ts` からヘルパー登録コード削除（11-13行目）

**テスト**: 既存テストが通ること、アプリが起動して表示されること

**コミットメッセージ**: `refactor: Handlebarsヘルパーを集約して重複を排除`

#### コミット2: テンプレート読み込み方法の統一

**目的**: 動的インポートを廃止し、静的インポートに統一してパフォーマンス向上

**変更内容**:

- `src/views/SelectView.ts` を静的インポートに変更（async削除）
- `src/views/ResultView.ts` を静的インポートに変更（async削除）
- `src/utils/templateLoader.ts` を削除
- 関連するテストの `await` を削除

**テスト**: すべてのテストが通ること、画面遷移が正常に動作すること

**コミットメッセージ**: `refactor: テンプレート読み込みを静的インポートに統一`

### 論理的な分割の理由

- コミット1は「ヘルパー登録の責務」の変更
- コミット2は「テンプレート読み込みの方法」の変更
- それぞれ独立した関心事で、レビューや将来のデバッグが容易

## 技術的背景

### 静的 vs 動的インポートの比較

#### 現在の問題点

`SelectView.ts` は `renderSelectView` 関数内で `await loadTemplate('SelectView')` を呼び出している（19行目）。
これは再描画の度に実行され、以下の問題がある：

- 毎回asyncオーバーヘッドが発生
- キャッシュがあっても非同期チェックが必要
- 頻繁な再描画が発生するこのアプリでは特に非効率

#### 静的インポートの利点

- モジュール読み込み時に1回だけコンパイル
- 再描画時は同期的にテンプレート関数を呼び出すだけ
- Viteがバンドル最適化を適用
- テンプレートサイズは全て1KB未満のため、コード分割のメリットなし

### テンプレートサイズ

すべてのテンプレートは1KB未満：

- `SelectView.hbs`: 約500バイト
- `ResultView.hbs`: 約600バイト
- `TreeView.hbs`: 約400バイト
- `IconViewDOM.hbs`: 約300バイト
- その他も同様に小さい

このサイズでは、動的インポートによるコード分割のメリットはない。

## 参考情報

### 影響を受けるテンプレート

以下のテンプレートが `eq` ヘルパーを使用している：

- `src/templates/IconViewDOM.hbs`: 2箇所でフォルダ/ファイル判定
- `src/templates/TreeView.hbs`: 3箇所でフォルダ/ファイル判定

これらのテンプレートは変更不要（ヘルパーが起動時に登録されるため）。
