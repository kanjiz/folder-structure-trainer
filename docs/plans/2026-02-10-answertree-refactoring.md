# AnswerTree型のリファクタリング設計

## 日付

2026-02-10

## 概要

現在の`AnswerTree`型は`null`を使用してファイルを暗黙的に表現しているため、可読性と型安全性に課題がある。`ItemType`を活用した明示的なデータ構造へのリファクタリングを提案する。

## 現状の問題点

### 現在の型定義

```typescript
export type AnswerTree = { [name: string]: AnswerTree | null }
```

### 問題点

1. **暗黙的な型判定**: `null`がファイルを意味するという暗黙の了解に依存
2. **ItemTypeの未活用**: せっかく定義されている`ItemType`が`AnswerTree`では使用されていない
3. **可読性の低下**: コード内で`=== null`による判定が散在し、意図が分かりにくい
4. **型安全性の不足**: nullチェックに依存した型判定

### 影響箇所

- [FileSystem.ts:40](../../src/models/FileSystem.ts#L40) - 型定義
- [FileSystemManager.ts:66](../../src/models/FileSystemManager.ts#L66) - `buildCurrentTree`メソッドで`null`を代入
- [FileSystemManager.ts:99](../../src/models/FileSystemManager.ts#L99) - `compareTree`メソッドで`null`チェック
- [FileSystemManager.ts:144](../../src/models/FileSystemManager.ts#L144) - `getAnswerAncestors`メソッドで`null`チェック

## 改善提案

### 新しい型定義

```typescript
/**
 * フォルダ構造の正解を表すノード型
 */
export interface AnswerTreeNode {
  /** アイテムの種類 */
  type: ItemType
  /** 子要素（フォルダの場合のみ存在） */
  children?: AnswerTree
}

/**
 * フォルダ構造の正解を表すツリー型
 * キーはアイテム名、値はノード情報
 */
export type AnswerTree = { [name: string]: AnswerTreeNode }
```

### 改善点

1. ✅ **明示的な型判定**: `type`フィールドで明確にファイル/フォルダを判別
2. ✅ **ItemTypeの活用**: 既存の`ItemType`を一貫して使用
3. ✅ **型安全性の向上**: nullチェック不要、TypeScriptの型システムを最大限活用
4. ✅ **可読性の向上**: コードの意図が明確になる
5. ✅ **拡張性**: 将来的にノードに追加のプロパティを持たせやすい

### データ構造の例

**現在**:

```typescript
{
  "src": {
    "main.ts": null,
    "utils": {
      "helper.ts": null
    }
  }
}
```

**改善後**:

```typescript
{
  "src": {
    type: "folder",
    children: {
      "main.ts": { type: "file" },
      "utils": {
        type: "folder",
        children: {
          "helper.ts": { type: "file" }
        }
      }
    }
  }
}
```

## 実装への影響

### 修正が必要なファイル

#### 1. FileSystem.ts

- `AnswerTree`型定義の変更
- `AnswerTreeNode`インターフェースの追加

#### 2. FileSystemManager.ts

**buildCurrentTreeメソッド（line 60-70）**:

```typescript
// 現在
buildCurrentTree(node: FSNode = this.root): AnswerTree {
  const tree: AnswerTree = {}
  for (const child of node.children) {
    if (child.type === 'folder') {
      tree[child.name] = this.buildCurrentTree(child)
    } else {
      tree[child.name] = null  // ← 暗黙的
    }
  }
  return tree
}

// 改善後
buildCurrentTree(node: FSNode = this.root): AnswerTree {
  const tree: AnswerTree = {}
  for (const child of node.children) {
    if (child.type === 'folder') {
      tree[child.name] = {
        type: 'folder',
        children: this.buildCurrentTree(child)
      }
    } else {
      tree[child.name] = { type: 'file' }  // ← 明示的
    }
  }
  return tree
}
```

**compareTreeメソッド（line 91-111）**:

```typescript
// 現在（line 99-106）
if (child.name in expectedTree) {
  if (child.type === 'file' && expectedTree[child.name] === null) {
    correct.push(child.id)
  } else if (child.type === 'folder' && expectedTree[child.name] !== null) {
    correct.push(child.id)
    this.compareTree(child, expectedTree[child.name] as AnswerTree, correct, incorrect)
  } else {
    incorrect.push(child.id)
  }
}

// 改善後
if (child.name in expectedTree) {
  const expected = expectedTree[child.name]
  if (child.type === expected.type) {
    correct.push(child.id)
    if (child.type === 'folder' && expected.children) {
      this.compareTree(child, expected.children, correct, incorrect)
    }
  } else {
    incorrect.push(child.id)
  }
}
```

**getAnswerAncestorsメソッド（line 136-153）**:

```typescript
// 現在（line 142-150）
for (const [key, value] of Object.entries(tree)) {
  if (key === name) {
    const isMatch = type === 'file' ? value === null : value !== null
    if (isMatch) return path
  }
  if (value !== null) {
    const result = this.getAnswerAncestors(name, type, value, [...path, key])
    if (result.length > 0) return result
  }
}

// 改善後
for (const [key, node] of Object.entries(tree)) {
  if (key === name && node.type === type) {
    return path
  }
  if (node.type === 'folder' && node.children) {
    const result = this.getAnswerAncestors(name, type, node.children, [...path, key])
    if (result.length > 0) return result
  }
}
```

#### 3. 問題データファイル

- 既存の問題データ（JSONファイルなど）の形式変更が必要
- マイグレーションスクリプトの作成を推奨

### テスト

- 既存のテストケースの更新
- 型の変更による回帰テストの実施

## 実装の優先度

**高**: このリファクタリングはコードベース全体の可読性と保守性を大幅に改善する基盤的な変更である。

## 備考

- 既存の問題データとの互換性を保つため、マイグレーション処理を検討
- 将来的に、ノードに追加情報（パーミッション、メタデータなど）を持たせる拡張も容易になる
