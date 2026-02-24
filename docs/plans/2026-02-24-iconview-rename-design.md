# IconViewDOM → IconView リネーム設計

## 日付

2026-02-24

## 背景

アイコンビューの実装は当初 p5.js を使用していたが、DOM操作による実装に移行した際に
`IconViewDOM` という命名が導入された。現在 p5.js の痕跡はプロジェクトに存在しないため、
`DOM` サフィックスは実装の特徴を表すものではなくなっている。これを除去して命名を整理する。

## 目的

`IconViewDOM` という名称から `DOM` を取り除き、`IconView` に統一することで、
実態と一致した命名にする。

## 変更対象

### ファイルのリネーム

| 変更前 | 変更後 |
| --- | --- |
| `src/views/IconViewDOM.ts` | `src/views/IconView.ts` |
| `src/views/IconViewDOM.test.ts` | `src/views/IconView.test.ts` |
| `src/templates/IconViewDOM.hbs` | `src/templates/IconView.hbs` |

### 関数名の変更

| 変更前 | 変更後 | 種別 |
| --- | --- | --- |
| `createIconViewDOM` | `createIconView` | export |
| `destroyIconViewDOM` | `destroyIconView` | export |
| `renderIconViewDOM` | `renderIconView` | 内部関数 |

### 参照元の更新

| ファイル | 変更内容 |
| --- | --- |
| `src/views/GameView.ts` | import文・関数呼び出しを更新 |
| `src/views/IconView.test.ts` | import文・describe名・関数呼び出し・コメントを更新 |
| `src/views/IconView.ts` | テンプレートのimport文を更新 |

### ドキュメントの更新

| ファイル | 変更内容 |
| --- | --- |
| `docs/development.md` | `IconViewDOM` の記述を `IconView` に更新 |
| `docs/architecture.md` | `IconViewDOM` の記述・アーキテクチャ図を更新 |

## 設計方針

- 振る舞いの変更はなし。純粋なリネームのみ
- 既存の148テストが全通過することでリグレッションなしと確認する
- 新規テストの追加は不要

## 除外対象

- `docs/plans/2026-02-11-iconview-dom-migration-design.md`
  過去の移行経緯を記録した設計書のため変更しない
