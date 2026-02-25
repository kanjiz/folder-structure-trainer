# 開発ガイド

## 技術スタック

- **Node.js**: JavaScript 実行環境
- **TypeScript**: 型安全な JavaScript 拡張言語
- **Vite**: 高速な開発サーバーとビルドツール
- **Vitest**: Vite ベースのテストフレームワーク
- **Handlebars**: テンプレートエンジン（ビュー層の HTML 生成）

## 必要な環境

- Node.js 22.12.0 以上
- npm 10.0.0 以上

> **注意**: Node.js 20 は 2026年4月30日に EOL を迎えるため、Node.js 22 以上を要件としています。

## セットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/kanjiz/folder-structure-trainer.git
cd folder-structure-trainer
```

### 2. 依存関係のインストール

```bash
npm install
```

これにより、以下のパッケージがインストールされます：

- `typescript`: TypeScript コンパイラ
- `vite`: 開発サーバーとビルドツール
- `vitest`: テストランナー
- `jsdom`: DOM 環境のシミュレーション（テスト用）
- `handlebars`: テンプレートエンジン

## 開発

### 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:5173](http://localhost:5173) を開きます。
ファイルを編集すると、ブラウザが自動的にリロードされます（ホットリロード）。

### ビルド

```bash
npm run build
```

本番用の最適化されたファイルが `dist/` ディレクトリに生成されます。

### ビルドのプレビュー

```bash
npm run preview
```

ビルドされたファイルをローカルサーバーで確認できます。

## テスト

### すべてのテストを実行

```bash
npm test
```

### 監視モードでテストを実行

```bash
npm run test:watch
```

ファイルを編集すると、関連するテストが自動的に再実行されます。

### テスト対象

すべての `.test.ts` ファイルがテスト対象です：

- `src/models/*.test.ts`: モデル層のテスト
- `src/services/*.test.ts`: サービス層のテスト
- `src/config/*.test.ts`: 環境設定のテスト
- `src/lib/*.test.ts`: ユーティリティのテスト
- `src/views/*.test.ts`: ビュー層のテスト

## プロジェクト構造

```tree
folder-structure-trainer/
├── public/
│   └── questions.json             # 設問データ（JSONファイル）
├── src/
│   ├── config/         # 環境設定
│   │   └── environment.ts         # 環境判定・データソースファクトリー
│   ├── data/           # 静的設問データ（TypeScript）
│   │   └── questions.ts           # StaticDataSource 用データ
│   ├── lib/            # ユーティリティ
│   │   └── handlebarsHelpers.ts   # Handlebars カスタムヘルパー
│   ├── models/         # データモデル
│   │   ├── FileSystem.ts          # 型定義と FSNode クラス
│   │   ├── FileSystemManager.ts   # ファイルシステム管理
│   │   ├── UIStateManager.ts      # UI 状態管理
│   │   └── types.ts               # Question・AnswerTree 等の型定義
│   ├── services/       # サービス層
│   │   ├── types.ts               # QuestionDataSource・ResultRepository インターフェース
│   │   ├── StaticDataSource.ts    # 静的データソース（TypeScript データ）
│   │   ├── JsonFetchDataSource.ts # JSON フェッチデータソース
│   │   └── QuestionService.ts     # 設問取得・結果保存サービス
│   ├── templates/      # Handlebars テンプレート
│   │   ├── BreadcrumbView.hbs     # パンくずリストの HTML
│   │   ├── ContextMenu.hbs        # コンテキストメニューの HTML
│   │   ├── GameView.hbs           # ゲーム画面の HTML
│   │   ├── IconView.hbs           # アイコンビューの HTML
│   │   ├── ResultView.hbs         # 結果画面の HTML
│   │   ├── SelectView.hbs         # 設問選択画面の HTML
│   │   └── TreeView.hbs           # ツリービューの HTML
│   ├── test/           # テスト共通設定
│   │   └── setup.ts               # Vitest セットアップファイル
│   ├── views/          # ビューコンポーネント
│   │   ├── GameView.ts            # ゲーム画面
│   │   ├── SelectView.ts          # 設問選択画面
│   │   ├── ResultView.ts          # 結果画面
│   │   ├── BreadcrumbView.ts      # パンくずリスト
│   │   ├── TreeView.ts            # ツリー表示
│   │   ├── IconView.ts            # アイコンビュー
│   │   └── ContextMenu.ts         # コンテキストメニュー
│   ├── main.ts         # エントリーポイント
│   └── style.css       # スタイルシート
├── docs/
│   ├── architecture.md            # アーキテクチャドキュメント
│   ├── development.md             # 開発ガイド（このファイル）
│   └── plans/                     # 設計ドキュメント
├── index.html          # HTML テンプレート
├── package.json        # プロジェクト設定とスクリプト
├── tsconfig.json       # TypeScript 設定
└── vite.config.ts      # Vite 設定
```

## TypeScript 設定

`tsconfig.json` の主な設定：

- **target**: ES2022（最新のJavaScript機能を使用）
- **module**: ESNext（ES Modules）
- **strict**: true（厳密な型チェック）
- **noEmit**: true（型チェックのみ、Viteがビルドを担当）

## コーディング規約

### ファイル命名規則

- コンポーネント: `PascalCase.ts`（例: `GameView.ts`）
- テスト: `PascalCase.test.ts`（例: `GameView.test.ts`）
- データ: `camelCase.ts`（例: `questions.ts`）

### インポート順序

1. 型インポート（`import type`）
2. 外部ライブラリ
3. 内部モジュール

例：

```typescript
import type { Question, FSNode } from './FileSystem'
import { FileSystemManager } from './FileSystemManager'
```

## よくある問題と解決方法

### ポート 5173 が既に使用されている

別のアプリケーションがポート 5173 を使用している場合、Vite は自動的に別のポートを使用します。
ターミナルに表示される URL を確認してください。

### テストが失敗する

1. 依存関係が最新か確認:

   ```bash
   npm install
   ```

2. キャッシュをクリア:

   ```bash
   rm -rf node_modules/.vite
   ```

### TypeScript エラー

型チェックを明示的に実行:

```bash
npx tsc --noEmit
```

## データソース

設問データは `public/questions.json` に JSON 形式で保存されており、`fetch` API で取得します。

### データフロー

```text
public/questions.json
  └─ fetch API
       └─ JsonFetchDataSource
            └─ QuestionService
                 └─ main.ts → SelectView
```

### 環境とデータソースの切り替え

`src/config/environment.ts` の `createDataSource()` が環境変数 `VITE_ENV` に応じて実装を切り替えます：

| `VITE_ENV` の値               | 使用するデータソース  | 説明                                       |
| ----------------------------- | --------------------- | ------------------------------------------ |
| `development`（デフォルト）   | `JsonFetchDataSource` | `public/questions.json` を `fetch` で取得  |
| `gas`                         | （将来実装）          | Google Apps Script から取得                |

### 設問データの追加・編集

`public/questions.json` を直接編集します。スキーマは `src/models/types.ts` の `Question` 型に準拠します。

## テンプレートシステム

すべてのビューは、Handlebars テンプレートエンジンを使用して HTML を生成します。テンプレートファイルは `src/templates/` ディレクトリに配置されており、各ビューが Vite の `?raw` インポートで直接読み込んで使用します。

**利点**:

1. **関心の分離**: HTML 構造（テンプレート）とロジック（TypeScript）を分離
2. **セマンティック HTML**: テンプレート内でセマンティック HTML を記述
3. **ARIA 属性の管理**: アクセシビリティ属性を一元管理
4. **保守性**: HTML 構造の変更がテンプレートファイルのみで完結

## 参考資料

- [Vite ドキュメント](https://ja.vite.dev/)
- [Vitest ドキュメント](https://vitest.dev/)
- [TypeScript ドキュメント](https://www.typescriptlang.org/ja/)
- [Handlebars ドキュメント](https://handlebarsjs.com/)
