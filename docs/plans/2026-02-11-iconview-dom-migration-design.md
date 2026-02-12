# IconView DOM化設計

**作成日**: 2026-02-11
**ステータス**: 承認済み

## 概要と目的

### 背景

現在のIconViewはp5.js（canvas）で実装されており、DOM要素（TreeView、パンくずリスト）との連携が困難です。特に、アイテムを上の階層に移動させる手段がないという課題があります。

### 目的

IconViewをDOMベースに移行することで：

- TreeViewやパンくずリストへのドラッグ&ドロップを実現
- Windows標準の操作（Ctrl+X/V、右クリックメニュー）を容易に実装
- Windowsエクスプローラーに忠実な操作感を提供し、教育効果を高める

### 段階的な実装アプローチ

- **第1段階**: 基本的な移動操作（ドラッグ&ドロップ、切り取り・貼り付け）
- **第2段階**: 問題作成機能向けの拡張（コピー、削除、名前変更、新規作成、重複チェック）

## アーキテクチャ概要

### 新規コンポーネント

#### 1. BreadcrumbView（パンくずリスト）

- Windows準拠のレイアウト：画面上部に横断配置
- クリック可能なパス表示（`Desktop > フォルダ1 > フォルダ2`）
- ドロップターゲットとして機能

**責任**:

- 現在のフォルダパスを表示
- パス要素のクリックでナビゲーション
- ドロップ受付とアイテム移動処理

#### 2. UIStateManager（UI状態管理）

FileSystemManagerから分離した責任設計により、データ層とUI層を明確に分離します。

**管理する状態**:

```typescript
class UIStateManager {
  clipboard: Set<string>      // 切り取り中のノードID
  selection: Set<string>       // 選択中のノードID
  currentFolder: FSNode        // IconViewで表示中のフォルダ
}
```

**設計判断の理由**:

- FileSystemManagerはデータ層に専念
- UI状態とデータ状態を明確に分離
- 将来の拡張性（問題作成機能など）を考慮
- テストしやすい構造

### 既存コンポーネントの変更

#### IconView

- p5.jsからDOM実装へ完全移行
- CSS Gridでアイコン配置
- HTML5 Drag and Drop API使用

#### TreeView

- ドロップ受付機能を追加
- **ドラッグ元にはならない**（仕様として明記）
  - 理由：循環参照の問題を回避、実装をシンプルに保つ
  - 現時点ではこの仕様で十分と判断

#### GameView

- 3つのビュー（Breadcrumb、Tree、Icon）を統合
- レイアウト変更（Windows準拠）

### レイアウト構成

```text
┌─────────────────────────────────────┐
│  Desktop > フォルダ1 > フォルダ2     │ ← BreadcrumbView
├──────────┬──────────────────────────┤
│          │                          │
│ TreeView │      IconView            │
│          │                          │
│          │                          │
└──────────┴──────────────────────────┘
```

### データフロー

1. ユーザー操作（ドラッグ、クリック、キーボード）
2. UIStateManagerの状態更新
3. FileSystemManager.moveNode()でデータ層を更新
4. 各ビューを再描画（TreeView, IconView, BreadcrumbView）

## 第1段階：実装する機能

### 複数選択

- **Ctrl+クリック**: 個別に追加選択/解除
- **Shift+クリック**: 範囲選択
- **ドラッグ矩形選択**: マウスドラッグで複数囲む
- 選択状態はCSSクラス（`.selected`）で視覚化

**実装方法**:

```typescript
// UIStateManager.selection: Set<string>で管理
function handleItemClick(nodeId: string, event: MouseEvent) {
  if (event.ctrlKey) {
    // Ctrl+クリック：トグル選択
    if (uiState.selection.has(nodeId)) {
      uiState.selection.delete(nodeId)
    } else {
      uiState.selection.add(nodeId)
    }
  } else if (event.shiftKey) {
    // Shift+クリック：範囲選択
    selectRange(lastSelectedId, nodeId)
  } else {
    // 通常クリック：単一選択
    uiState.selection.clear()
    uiState.selection.add(nodeId)
  }
  updateView()
}
```

### ドラッグ&ドロップ

#### ドラッグ元

- IconViewのアイテムのみ
- TreeViewはドラッグ元にならない（仕様）

#### ドロップ先

- IconView内のフォルダ
- TreeViewのフォルダ
- BreadcrumbViewのパス要素

#### 視覚フィードバック

**ドラッグ中のプレビュー**:

- Windows風の半透明プレビュー
- 複数アイテム選択時は重ねて表示
- `setDragImage()`で実装

```typescript
element.addEventListener('dragstart', (e) => {
  // 半透明プレビューを生成
  const preview = createDragPreview(selectedNodes)
  preview.style.opacity = '0.5'
  e.dataTransfer?.setDragImage(preview, offsetX, offsetY)
})
```

**ドロップターゲットのハイライト**:

- ドロップ可能な場所はホバー時にハイライト
- ファイルやドロップ不可能な場所はカーソルを「禁止」マークに変更

**アニメーション**:

- CSS transitionでの滑らかなフィードバック
- ホバー、選択、ドロップ時の視覚効果

```css
.icon-item {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.icon-item:hover {
  transform: scale(1.05);
}

.icon-item.selected {
  background-color: rgba(0, 120, 215, 0.3);
}
```

#### Ctrl対応（将来のコピー機能への準備）

- Ctrl押下時のドラッグを検知
- 現時点では「コピー機能は未実装です」と表示
- 第2段階でコピー機能を実装しやすくする

### キーボードショートカット

- **Ctrl+X**: 切り取り（クリップボードに保存）
- **Ctrl+V**: 貼り付け（現在のフォルダに移動）
- **Tab/Shift+Tab**: フォーカス移動
- **Enter/Space**: 選択、フォルダを開く
- **矢印キー**: アイテム間移動

### 右クリックメニュー

#### アイテム選択時

- **切り取り**: クリップボードに保存（Ctrl+Xと同等）
- **貼り付け**: クリップボードから移動（Ctrl+Vと同等）

#### 空白部分を右クリック時

- **貼り付け**: クリップボードから現在のフォルダに移動

**第2段階で追加予定**:

- コピー
- 削除
- 名前変更
- 新規作成（フォルダ/ファイル）

### エラーハンドリング

Windows準拠の組み合わせアプローチを採用します。

#### 視覚的にブロック（事前防止）

明らかに無効な操作は実行前に防止：

- ファイルをドロップ先にできない（ホバー時にハイライトしない）
- カーソルを「禁止」マークに変更
- ドロップしても何も起きない

```typescript
function canDrop(targetNode: FSNode): boolean {
  return targetNode.type === 'folder'
}

element.addEventListener('dragover', (e) => {
  if (canDrop(targetNode)) {
    e.preventDefault() // ドロップ許可
    element.classList.add('drop-target')
  } else {
    e.dataTransfer!.dropEffect = 'none' // 禁止カーソル
  }
})
```

#### 警告メッセージ表示（実行時エラー）

実行してみないと分からないエラー：

- 貼り付け先が存在しない場合
- その他のランタイムエラー
- 「この操作は実行できません」などのメッセージを表示

### アクセシビリティ対応

#### 第1段階で実装する範囲

**基本的なキーボード操作**:

- Tab/Shift+Tabでのフォーカス移動（`tabindex`属性）
- Enter/Spaceでの選択・実行
- 矢印キーでのアイテム間移動
- Ctrl+X, Ctrl+Vのショートカット

**ARIA属性の追加**:

FSNodeが既に持つ情報（name, type）を活用して、ARIA属性を動的に生成します。

```typescript
// IconView
function renderIconItem(node: FSNode, isSelected: boolean): string {
  return `
    <div
      role="button"
      aria-label="${node.name}（${node.type === 'folder' ? 'フォルダ' : 'ファイル'}）"
      aria-selected="${isSelected}"
      data-node-id="${node.id}"
      tabindex="0"
    >
      ${node.type === 'folder' ? '📁' : '📄'} ${node.name}
    </div>
  `
}

// TreeView
function renderTreeNode(node: FSNode): string {
  return `
    <div
      role="treeitem"
      aria-expanded="${node.type === 'folder' ? 'true' : undefined}"
      aria-label="${node.name}"
    >
      ${node.name}
    </div>
  `
}
```

#### 第2段階以降で実装

- `aria-live`による動的な状態変化の通知
- より高度なスクリーンリーダー対応

## 第2段階以降：将来実装する機能

### 問題作成機能向けの拡張

#### 右クリックメニューの追加機能

- **コピー**: アイテムを複製（Ctrl+Cと同等）
- **削除**: アイテムを削除（Delete/Backspaceキー）
- **名前変更**: アイテム名を変更（F2キー）
- **新規作成**: フォルダ/ファイルを新規作成

#### 重複チェック機能

**現状の不具合を修正**:

- 同じ階層に同じ名前のファイル/フォルダを作成できないようにする
- Windows準拠の挙動を実装

**実装方針**:

- 重複時は「(2)」などの連番を自動付与
- またはエラーメッセージを表示してユーザーに再入力を促す

### その他の拡張機能

- **TreeViewのドラッグ中自動展開**: フォルダ上でホバーすると自動的に展開
- **より凝ったアニメーション**: アイテムがスライド移動する効果（Web Animations API使用）
- **aria-liveによる高度なアクセシビリティ対応**: 状態変化の動的な通知

## 実装の技術詳細

### IconViewの実装

**レイアウト**:

```css
.icon-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 16px;
  padding: 20px;
}
```

**ドラッグ&ドロップ**:

- HTML5 Drag and Drop API使用
- `dragstart`, `dragover`, `drop`イベント
- `setDragImage()`で複数アイテムの半透明プレビュー生成

**選択管理**:

- UIStateManagerの`selection: Set<string>`で管理
- CSSクラス（`.selected`）で視覚化

### BreadcrumbViewの実装

```typescript
function renderBreadcrumb(currentFolder: FSNode, manager: FileSystemManager): string {
  const path = getPath(currentFolder, manager) // 既存関数を再利用
  const parts = path.split(' > ')

  return parts.map((part, index) => `
    <span
      class="breadcrumb-item"
      data-depth="${index}"
      draggable="false"
    >
      ${part}
    </span>
  `).join(' > ')
}
```

各パス部分がドロップターゲットとして機能：

```typescript
breadcrumbItem.addEventListener('drop', (e) => {
  const targetDepth = parseInt(e.currentTarget.dataset.depth)
  const targetFolder = getFolderAtDepth(targetDepth)
  moveSelectedItems(targetFolder)
})
```

### TreeViewの拡張

既存のDOM実装に以下を追加：

- `dragover`, `drop`イベントリスナー
- フォルダノードにホバー時、CSSクラスでハイライト表示
- ドラッグ機能は追加しない（仕様として明記）

```typescript
treeItem.addEventListener('dragover', (e) => {
  if (node.type === 'folder') {
    e.preventDefault()
    treeItem.classList.add('drop-target')
  }
})

treeItem.addEventListener('drop', (e) => {
  e.preventDefault()
  moveSelectedItems(node)
  treeItem.classList.remove('drop-target')
})
```

## テスト方針

### テスト項目

#### 基本操作

- 単一/複数アイテムの選択（Ctrl+クリック、Shift+クリック、ドラッグ矩形）
- ドラッグ&ドロップ（IconView内、TreeViewへ、Breadcrumbへ）
- 切り取り・貼り付け（Ctrl+X/V、右クリックメニュー）
- キーボードナビゲーション（Tab, 矢印キー）

#### エラーケース

- ファイルへのドロップ（ブロックされる）
- 無効な貼り付け（警告表示）
- Ctrl押下時のドラッグ（「未実装」表示）

#### アクセシビリティ

- キーボードのみでの操作可能性
- ARIA属性の正確性（スクリーンリーダーでの確認）
- フォーカス管理の正確性

#### ブラウザ互換性

- Chrome, Firefox, Safari, Edgeでの動作確認
- ドラッグ&ドロップの挙動確認

### テスト方法

**手動テスト**:

- 各操作パターンの動作確認
- スクリーンリーダー（VoiceOver, NVDA）での確認
- 視覚的なフィードバックの確認

**自動テスト**:

- UIStateManagerの単体テスト
- FileSystemManager.moveNode()との統合テスト

## 実装計画

### 実装順序

1. **UIStateManagerクラスの作成**
   - 状態管理ロジックの実装
   - 単体テストの作成

2. **BreadcrumbViewの実装**
   - パス表示とクリックナビゲーション
   - ドロップ受付機能

3. **IconViewのDOM化**
   - CSS Gridレイアウト
   - 基本的なアイテム表示
   - 選択機能（単一・複数）

4. **ドラッグ&ドロップ機能**
   - IconView内でのドラッグ&ドロップ
   - 半透明プレビューの実装
   - ドロップターゲットのハイライト

5. **TreeViewへのドロップ対応**
   - イベントリスナーの追加
   - ドロップ処理の実装

6. **右クリックメニュー**
   - コンテキストメニューの表示
   - 切り取り・貼り付けの実装

7. **キーボードショートカット**
   - Ctrl+X, Ctrl+Vの実装
   - 矢印キーナビゲーション
   - Tab/Enterの実装

8. **ARIA属性の追加**
   - 各ビューにARIA属性を付与
   - キーボードアクセシビリティの確認

9. **視覚フィードバックの調整**
   - CSS transitionの微調整
   - アニメーションの最適化

### 移行戦略

1. 既存のp5.js実装を残しながら、新しいDOM実装を並行開発
2. 機能単位で動作確認を行う
3. すべての機能が完成したら、GameViewで切り替え
4. 十分なテストを実施後、p5.js実装を削除

### 推定工数

- UIStateManager: 0.5日
- BreadcrumbView: 1日
- IconView DOM化: 2-3日
- ドラッグ&ドロップ: 2-3日
- TreeView拡張: 0.5日
- 右クリックメニュー: 1日
- キーボードショートカット: 1-2日
- アクセシビリティ: 1日
- テスト・調整: 2日

**合計**: 11-15日（個人開発想定）

## まとめ

この設計により、IconViewをp5.jsからDOMベースに移行し、Windows準拠の操作感を実現します。段階的な実装アプローチにより、リスクを最小化しながら、将来の問題作成機能にも対応できる拡張性の高いアーキテクチャを構築します。

**主な利点**:

- Windows標準の操作方法を忠実に再現（教育効果の向上）
- DOM要素間のシームレスな連携
- アクセシビリティ対応による幅広いユーザーへの対応
- 将来の機能拡張に備えた設計

**技術的な判断**:

- UIStateManagerによる責任分離
- TreeViewはドロップ先のみ（循環参照問題の回避）
- 段階的な実装（第1段階：移動、第2段階：問題作成）
