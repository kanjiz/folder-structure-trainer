# 開発ガイド

## 技術スタック

- **Node.js**: JavaScript 実行環境
- **TypeScript**: 型安全な JavaScript 拡張言語
- **Vite**: 高速な開発サーバーとビルドツール
- **Vitest**: Vite ベースのテストフレームワーク

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
- `src/views/*.test.ts`: ビュー層のテスト

## プロジェクト構造

```tree
folder-structure-trainer/
├── src/
│   ├── data/           # 問題データ
│   │   └── questions.ts
│   ├── models/         # データモデル
│   │   ├── FileSystem.ts          # 型定義とFSNodeクラス
│   │   ├── FileSystemManager.ts   # ファイルシステム管理
│   │   └── UIStateManager.ts      # UI状態管理
│   ├── views/          # ビューコンポーネント
│   │   ├── GameView.ts            # ゲーム画面
│   │   ├── SelectView.ts          # 問題選択画面
│   │   ├── ResultView.ts          # 結果画面
│   │   ├── BreadcrumbView.ts      # パンくずリスト
│   │   ├── TreeView.ts            # ツリー表示
│   │   ├── IconViewDOM.ts         # アイコンビュー（DOM実装）
│   │   └── ContextMenu.ts         # コンテキストメニュー
│   ├── main.ts         # エントリーポイント
│   └── style.css       # スタイルシート
├── docs/
│   ├── architecture.md # アーキテクチャドキュメント
│   └── plans/          # 設計ドキュメント
├── index.html          # HTMLテンプレート
├── package.json        # プロジェクト設定とスクリプト
├── tsconfig.json       # TypeScript設定
└── vite.config.ts      # Vite設定
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

## 参考資料

- [Vite ドキュメント](https://ja.vite.dev/)
- [Vitest ドキュメント](https://vitest.dev/)
- [TypeScript ドキュメント](https://www.typescriptlang.org/ja/)
