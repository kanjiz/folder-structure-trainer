# FileSystem.ts 型定義分離の設計書

## 日付

2026-02-14

## 1. 概要

### 目的

`src/models/FileSystem.ts` から型定義を分離し、新しい `src/models/types.ts` ファイルに移動する。
これにより、`src/services/types.ts` で確立されたパターンに従い、型定義とクラス実装の責務を明確に分離する。

### スコープ

- **移動対象の型定義**:
  - `ItemType`
  - `QuestionItem`
  - `Question`
  - `AnswerNode`（現在の`AnswerTreeNode`から改名）
  - `AnswerTree`

- **残留対象**:
  - `FSNode` クラス（実装はそのまま）

### 期待される効果

1. **責務の明確化**: 型定義とクラス実装が明確に分離される
2. **メンテナンス性の向上**: 型定義の変更時に影響範囲が明確になる
3. **一貫性の向上**: `services/types.ts` のパターンに従うことで、プロジェクト全体の構造が統一される
4. **インポートの明確化**: 型のインポート元が `types.ts` に統一される

## 2. ファイル構成

### 新規作成: `src/models/types.ts`

```typescript
/**
 * ファイルシステムアイテムの種類
 */
export type ItemType = 'folder' | 'file'

/**
 * 設問で使用されるファイルまたはフォルダのアイテム
 */
export interface QuestionItem {
  id: string
  name: string
  type: ItemType
}

/**
 * フォルダ構造トレーニングの設問定義
 */
export interface Question {
  id: string
  title: string
  mode: 'practice' | 'exercise'
  instructions: string[]
  items: QuestionItem[]
  answer: AnswerTree
}

/**
 * フォルダ構造の正解を表すノード型
 *
 * AnswerTree の各値として使用される。
 * 1つのアイテム（フォルダまたはファイル）を表現し、
 * フォルダの場合は子要素を持つことができる。
 */
export interface AnswerNode {
  /** アイテムの種類（'folder' または 'file'） */
  type: ItemType
  /** 子要素（フォルダの場合のみ存在） */
  children?: AnswerTree
}

/**
 * フォルダ構造の正解を表すツリー型
 *
 * ネストされたオブジェクト構造により、階層的なフォルダ構造を表現する。
 * キーはアイテム名、値は AnswerNode（タイプと子要素）。
 *
 * @example
 * const answerTree: AnswerTree = {
 *   'Documents': {
 *     type: 'folder',
 *     children: {
 *       'report.pdf': { type: 'file' }
 *     }
 *   },
 *   'readme.txt': { type: 'file' }
 * }
 */
export type AnswerTree = { [name: string]: AnswerNode }
```

### 変更: `src/models/FileSystem.ts`

```typescript
import type { ItemType, AnswerTree } from './types'

/**
 * ファイルシステムのノードを表すクラス
 * （実装は変更なし）
 */
export class FSNode {
  readonly id: string
  readonly name: string
  readonly type: ItemType
  // ... 既存の実装
}
```

## 3. 影響を受けるファイル

以下のファイルで `Question` 型のインポートを変更する必要がある：

1. `src/services/QuestionService.ts`
2. `src/services/types.ts`
3. `src/services/StaticDataSource.ts`
4. `src/data/questions.ts`
5. `src/main.ts`
6. `src/views/ResultView.ts`
7. `src/views/SelectView.ts`
8. `src/services/QuestionService.test.ts`
9. `src/views/ResultView.test.ts`
10. `src/views/SelectView.test.ts`
11. `src/views/IconViewDOM.test.ts`
12. `src/views/GameView.ts`

### インポート変更内容

**変更前**:

```typescript
import type { Question } from '../models/FileSystem'
```

**変更後**:

```typescript
import type { Question } from '../models/types'
```

**`FileSystemManager.ts` の場合**:

```typescript
// 変更前
import type { AnswerTree, Question } from './FileSystem'

// 変更後
import type { AnswerTree, Question } from './types'
import { FSNode } from './FileSystem'
```

## 4. 実装手順

### Approach 1: 一括移行（推奨）

1. **新規ファイル作成**: `src/models/types.ts` を作成し、型定義を記述
2. **FileSystem.ts の修正**: 型定義を削除し、必要な型をインポート
3. **全ファイルのインポート修正**: 上記12ファイルのインポート文を一括修正
4. **型チェック**: `npm run type-check` で TypeScript コンパイラエラーがないことを確認
5. **テスト実行**: `npm test` で全テストが通ることを確認
6. **コミット**: 変更を1つのコミットとしてまとめる

### 利点

- TypeScript コンパイラが即座にエラーを検出するため、修正漏れが発生しにくい
- 変更が1つのコミットにまとまり、レビューしやすい
- 実装がシンプルで分かりやすい

### 注意点

- 一度に多くのファイルを変更するため、慎重な確認が必要
- IDE の自動インポート機能を活用して効率的に修正

## 5. テスト戦略

### 既存テストの活用

プロジェクトには既に 108 個のテストが存在し、全てパスしている状態。
このリファクタリングは型定義の移動のみであり、実装ロジックに変更はないため、既存テストで十分に検証可能。

### 検証手順

1. **型チェック**: `npm run type-check` で TypeScript コンパイルエラーがないことを確認
2. **全テスト実行**: `npm test` で全 108 テストが通ることを確認
3. **ビルド確認**: `npm run build` でビルドが成功することを確認

### 追加テストの不要性

- 型定義の移動のみであり、新しいロジックの追加はない
- 既存テストが全てパスすれば、リファクタリングが正しく行われたことが保証される
- TypeScript のコンパイラが型の整合性を静的に検証する

## 6. 実装後の確認事項

- [ ] `npm run type-check` が成功すること
- [ ] `npm test` で全 108 テストが通ること
- [ ] `npm run build` が成功すること
- [ ] インポート文が適切に更新されていること
- [ ] JSDoc コメントが適切に移動されていること
- [ ] `AnswerTreeNode` が `AnswerNode` に改名されていること
- [ ] JSDoc で「問題」が「設問」に統一されていること

## 7. 今後の展望

この変更により、以下の将来的な改善が容易になる：

1. **型定義の拡張**: 新しい型を追加する際、`types.ts` に集約できる
2. **型の再利用**: 他のモジュールから型定義を簡単にインポートできる
3. **ドキュメント生成**: 型定義が1箇所にまとまることで、API ドキュメントの自動生成が容易になる
