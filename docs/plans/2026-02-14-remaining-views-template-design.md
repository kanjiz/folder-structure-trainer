# 残りのビューのテンプレート分離設計書

**日付:** 2026-02-14
**ステータス:** 設計完了
**フェーズ:** Phase 3 - 残りのビューのテンプレート化

## 概要

Phase 1（SelectView）とPhase 2（ResultView）のテンプレート分離が完了したため、Phase 3として残りのビュー（ContextMenu, BreadcrumbView, TreeView, IconViewDOM, GameView）のテンプレート化とセマンティックHTML化を実施する。

## 背景

- **Phase 1（完了）:** SelectView のテンプレート分離とセマンティックHTML化
- **Phase 2（完了）:** ResultView のテンプレート分離とセマンティックHTML化
- **Phase 3（本設計）:** 残りのビューのテンプレート化
- **Phase 4（未着手）:** Google Apps Script (GAS) によるデータ管理

## 目標

1. **テンプレート分離:** Handlebars を使用して HTML 構造をテンプレート化
2. **セマンティックHTML化:** `<nav>`, `<main>`, `<section>`, `<footer>` などの適切な要素とARIA属性を使用
3. **テストの日本語化:** 全ての `it()` ブロックを日本語に統一
4. **セマンティックHTMLのテスト追加:** role, aria-label などの検証を追加
5. **新しいテスト問題の追加:** 空フォルダ判定をテストするシンプルな問題を追加

## アプローチ: 段階的・順次実装

各ビューを完全に実装してから次のビューに進む。各ビューの実装順序:

1. **テンプレート作成:** Handlebars テンプレートを作成
2. **TypeScript 修正:** テンプレートを読み込んでレンダリング
3. **テスト更新:** 日本語化 + セマンティックHTML テスト追加
4. **手動テスト:** ユーザーによる動作確認

**実装順序:**
1. ContextMenu
2. BreadcrumbView
3. TreeView
4. IconViewDOM
5. GameView

## 設計詳細

### 1. 新しいテスト問題

空フォルダ検出をテストするためのシンプルな問題を追加。

**questions.ts への追加内容:**

```typescript
{
  id: 'q003',
  title: 'シンプルな整理（練習）',
  mode: 'practice',
  instructions: [
    '「ファイルx」を「フォルダa」に入れてください',
    '「フォルダb」は空のままにしてください',
  ],
  items: [
    { id: 'fa', name: 'フォルダa', type: 'folder' },
    { id: 'fb', name: 'フォルダb', type: 'folder' },
    { id: 'fx', name: 'ファイルx', type: 'file' },
  ],
  answer: {
    'フォルダa': {
      type: 'folder',
      children: {
        'ファイルx': { type: 'file' }
      }
    },
    'フォルダb': {
      type: 'folder',
      children: {}  // 空フォルダを明示的に定義
    }
  }
},
{
  id: 'q004',
  title: 'シンプルな整理（演習）',
  mode: 'exercise',
  instructions: [
    '以下のファイルを正しいフォルダに整理してください',
    '「ファイルx」を「フォルダa」に入れてください',
    '「フォルダb」は空のままにしてください',
  ],
  items: [
    { id: 'fa', name: 'フォルダa', type: 'folder' },
    { id: 'fb', name: 'フォルダb', type: 'folder' },
    { id: 'fx', name: 'ファイルx', type: 'file' },
  ],
  answer: {
    'フォルダa': {
      type: 'folder',
      children: {
        'ファイルx': { type: 'file' }
      }
    },
    'フォルダb': {
      type: 'folder',
      children: {}
    }
  }
}
```

**ポイント:**
- 練習モード（q003）と演習モード（q004）の2問を追加
- `answer` オブジェクトで空フォルダを `children: {}` として明示的に定義
- シンプルな構成（フォルダ2つ、ファイル1つ）で空フォルダ判定をテストできる

### 2. セマンティックHTML構造

#### 2-1. GameView 全体構造（breadcrumb 分離版）

**重要な設計決定:** breadcrumb を main-area から分離し、独立したナビゲーション要素とする。

**理由:**
- セマンティック的に明確: breadcrumb は「現在位置を示すグローバルナビゲーション」、tree/icon は「作業エリア」
- HTML構造がシンプル: main-area は純粋に「左右2分割の作業エリア」になる
- レイアウト変更が容易: breadcrumb の位置変更時に main-area に影響しない

**HTML 構造:**

```html
<div class="game-view">
  <!-- 指示エリア -->
  <section class="instruction-area" aria-label="問題の指示">
    <h2>問題タイトル</h2>
    <ul class="instructions" role="list">
      <li role="listitem">指示1</li>
      <li role="listitem">指示2</li>
    </ul>
  </section>

  <!-- パンくずナビゲーション（独立） -->
  <nav class="breadcrumb-panel" aria-label="フォルダの階層">
    <!-- BreadcrumbView がここに描画 -->
  </nav>

  <!-- 作業エリア（tree と icon のみ） -->
  <div class="main-area">
    <!-- ツリーナビゲーション -->
    <nav class="tree-panel" aria-label="フォルダツリー">
      <!-- TreeView がここに描画 -->
    </nav>

    <!-- メインの作業エリア -->
    <main class="icon-panel" aria-label="ファイル一覧">
      <!-- IconViewDOM がここに描画 -->
    </main>
  </div>

  <!-- アクションエリア -->
  <footer class="action-area">
    <button type="button" id="check-btn">答え合わせ</button>
    <button type="button" id="back-btn">問題選択に戻る</button>
  </footer>
</div>
```

**レイアウト構造:**

```
┌─────────────────────────────┐
│ instruction-area            │
├─────────────────────────────┤
│ breadcrumb-panel (独立)     │
├──────────┬──────────────────┤
│ tree     │ icon             │
│ panel    │ panel            │
│          │                  │
└──────────┴──────────────────┘
│ action-area                 │
└─────────────────────────────┘
```

#### 2-2. CSS 修正内容

```css
/* main-area: 2行から1行のグリッドに変更 */
.main-area {
  display: grid;
  grid-template-columns: 260px 1fr;
  grid-template-rows: 1fr;  /* auto 1fr → 1fr に変更 */
  gap: 8px;
  flex: 1;
  min-height: 0;
}

/* breadcrumb-panel: grid-column 指定を削除 */
.breadcrumb-panel {
  /* grid-column: 1 / -1; を削除 */
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 0;
  overflow: hidden;
  margin-bottom: 8px;  /* 下に余白を追加 */
}

/* tree-panel: grid-row 指定を削除 */
.tree-panel {
  grid-column: 1;
  /* grid-row: 2; を削除 */
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 12px;
  overflow-y: auto;
}

/* icon-panel: grid-row 指定を削除 */
.icon-panel {
  grid-column: 2;
  /* grid-row: 2; を削除 */
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}
```

#### 2-3. ContextMenu 構造

```html
<nav class="context-menu" role="menu" aria-label="コンテキストメニュー">
  <button type="button" class="context-menu-item" role="menuitem">
    切り取り
  </button>
  <button type="button" class="context-menu-item" role="menuitem" aria-disabled="true">
    貼り付け
  </button>
</nav>
```

**セマンティックHTMLの選択理由:**
- **`<nav role="menu">`**: メニュー項目のナビゲーション
- **`type="button"`**: フォーム送信を防ぐため明示的に指定
- **ARIA attributes**: スクリーンリーダーのための補助情報を提供

### 3. 各ビューのテンプレート化詳細

#### 3-1. テンプレート化の共通パターン

**ファイル構成:**
```
src/templates/
├── ContextMenu.hbs
├── BreadcrumbView.hbs
├── TreeView.hbs
├── IconViewDOM.hbs
└── GameView.hbs
```

**TypeScript 修正パターン:**
```typescript
// Before: 文字列連結でHTML生成
element.innerHTML = `<div class="...">`

// After: テンプレートローダーを使用
import contextMenuTemplate from '../templates/ContextMenu.hbs?raw'
const html = contextMenuTemplate({ items: [...] })
element.innerHTML = html
```

#### 3-2. ContextMenu

**テンプレート (src/templates/ContextMenu.hbs):**
```handlebars
<nav class="context-menu" role="menu" aria-label="コンテキストメニュー">
  {{#each items}}
    <button
      type="button"
      class="context-menu-item {{#if disabled}}disabled{{/if}}"
      role="menuitem"
      {{#if disabled}}aria-disabled="true"{{/if}}
      data-index="{{@index}}"
    >
      {{label}}
    </button>
  {{/each}}
</nav>
```

**TypeScript 修正 (src/views/ContextMenu.ts):**
```typescript
import contextMenuTemplate from '../templates/ContextMenu.hbs?raw'

export function showContextMenu(options: ContextMenuOptions): void {
  hideContextMenu()

  const menuHtml = contextMenuTemplate({ items: options.items })
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = menuHtml
  const menu = tempDiv.firstElementChild as HTMLElement

  menu.style.left = `${options.x}px`
  menu.style.top = `${options.y}px`

  // イベントリスナー設定
  menu.querySelectorAll('.context-menu-item').forEach((item, index) => {
    if (!options.items[index].disabled) {
      item.addEventListener('click', () => {
        options.items[index].onClick()
        hideContextMenu()
      })
    }
  })

  document.body.appendChild(menu)
  // ... 既存のクリック外し処理
}
```

#### 3-3. BreadcrumbView

**テンプレート (src/templates/BreadcrumbView.hbs):**
```handlebars
<nav class="breadcrumb-view" aria-label="フォルダの階層">
  {{#each path}}
    <span
      class="breadcrumb-item"
      role="button"
      tabindex="0"
      aria-label="{{name}}に移動"
      data-node-id="{{id}}"
    >
      {{name}}
    </span>
    {{#unless @last}}
      <span class="breadcrumb-separator" aria-hidden="true">&gt;</span>
    {{/unless}}
  {{/each}}
</nav>
```

**TypeScript 修正 (src/views/BreadcrumbView.ts):**
```typescript
import breadcrumbTemplate from '../templates/BreadcrumbView.hbs?raw'

export function renderBreadcrumbView(
  container: HTMLElement,
  currentFolder: FSNode,
  manager: FileSystemManager,
  onNavigate: (folder: FSNode) => void,
  onUpdate: () => void
): void {
  const path = manager.getPath(currentFolder.id)
  const html = breadcrumbTemplate({
    path: path.map(node => ({ id: node.id, name: node.name }))
  })

  container.innerHTML = html

  // イベントリスナー設定
  container.querySelectorAll('.breadcrumb-item').forEach((item) => {
    const nodeId = (item as HTMLElement).dataset.nodeId!
    const node = path.find(n => n.id === nodeId)!

    item.addEventListener('click', () => onNavigate(node))
    // ... drag & drop イベント
  })
}
```

#### 3-4. TreeView

**テンプレート (src/templates/TreeView.hbs):**
```handlebars
<nav class="tree-view" aria-label="フォルダツリー">
  {{> treeNode nodes=root}}
</nav>

{{!-- パーシャル: 再帰的なツリーノード --}}
{{#*inline "treeNode"}}
  <ul class="tree-list" role="tree">
    {{#each nodes}}
      <li
        class="tree-item"
        role="treeitem"
        aria-label="{{name}}"
        data-node-id="{{id}}"
      >
        <span class="tree-icon">{{#if (eq type 'folder')}}📁{{else}}📄{{/if}}</span>
        <span class="tree-name">{{name}}</span>
        {{#if children}}
          {{> treeNode nodes=children}}
        {{/if}}
      </li>
    {{/each}}
  </ul>
{{/inline}}
```

**注:** Handlebars の `eq` ヘルパーは vite.config.ts に登録が必要。

#### 3-5. IconViewDOM

**テンプレート (src/templates/IconViewDOM.hbs):**
```handlebars
<main class="icon-view-dom" aria-label="ファイル一覧" tabindex="0">
  {{#each items}}
    <div
      class="icon-item {{#if selected}}selected{{/if}}"
      role="button"
      tabindex="0"
      aria-label="{{name}} ({{#if (eq type 'folder')}}フォルダ{{else}}ファイル{{/if}})"
      aria-selected="{{selected}}"
      data-node-id="{{id}}"
      draggable="true"
    >
      <div class="icon-symbol">{{#if (eq type 'folder')}}📁{{else}}📄{{/if}}</div>
      <div class="icon-name">{{name}}</div>
    </div>
  {{/each}}
</main>
```

**TypeScript 修正 (src/views/IconViewDOM.ts):**
```typescript
import iconViewTemplate from '../templates/IconViewDOM.hbs?raw'

function renderIconViewDOM(...): void {
  const items = uiState.currentFolder.children.map(node => ({
    id: node.id,
    name: node.name,
    type: node.type,
    selected: uiState.isSelected(node.id)
  }))

  const html = iconViewTemplate({ items })
  container.innerHTML = html

  // イベントリスナーを一括設定
  container.querySelectorAll('.icon-item').forEach(itemEl => {
    const nodeId = (itemEl as HTMLElement).dataset.nodeId!
    const node = uiState.currentFolder.children.find(n => n.id === nodeId)!

    itemEl.addEventListener('click', (e) => { ... })
    itemEl.addEventListener('dblclick', () => { ... })
    // ... その他のイベント
  })

  // フォーカス復元処理
  // ...
}
```

#### 3-6. GameView

**テンプレート (src/templates/GameView.hbs):**
```handlebars
<div class="game-view">
  <section class="instruction-area" aria-label="問題の指示">
    <h2>{{title}}</h2>
    <ul class="instructions" role="list">
      {{#each instructions}}
        <li role="listitem">{{this}}</li>
      {{/each}}
    </ul>
  </section>

  <nav class="breadcrumb-panel" aria-label="フォルダの階層" id="breadcrumb-panel"></nav>

  <div class="main-area">
    <nav class="tree-panel" aria-label="フォルダツリー" id="tree-panel"></nav>
    <main class="icon-panel" aria-label="ファイル一覧" id="icon-panel"></main>
  </div>

  <footer class="action-area">
    {{#if showCheckButton}}
      <button type="button" id="check-btn" class="btn-primary">答え合わせ</button>
    {{/if}}
    <button type="button" id="back-btn" class="btn-secondary">問題選択に戻る</button>
  </footer>
</div>
```

**TypeScript 修正 (src/views/GameView.ts):**
```typescript
import gameViewTemplate from '../templates/GameView.hbs?raw'

export function renderGameView(...): void {
  const html = gameViewTemplate({
    title: question.title,
    instructions: question.instructions,
    showCheckButton: question.mode === 'exercise'
  })

  container.innerHTML = html
  const wrapper = container.firstElementChild as HTMLElement

  // パネル要素を取得
  const breadcrumbPanel = wrapper.querySelector('#breadcrumb-panel') as HTMLElement
  const treePanel = wrapper.querySelector('#tree-panel') as HTMLElement
  const iconPanel = wrapper.querySelector('#icon-panel') as HTMLElement

  // ... 既存の処理
}
```

### 4. テスト戦略

#### 4-1. テストの日本語化

**現状:**
- ContextMenu.test.ts: describe() は一部日本語、it() は英語
- IconViewDOM.test.ts: describe() は一部日本語、it() は英語

**目標:**
- SelectView.test.ts / ResultView.test.ts と同様に、**全ての it() を日本語化**

**パターン:**
```typescript
// Before (英語)
it('should create and display context menu', () => { ... })
it('should set menu position correctly', () => { ... })

// After (日本語)
it('コンテキストメニューを作成して表示できる', () => { ... })
it('メニューの位置を正しく設定できる', () => { ... })
```

#### 4-2. セマンティックHTMLのテスト追加

**ContextMenu.test.ts に追加:**
```typescript
describe('セマンティック構造', () => {
  it('nav要素とrole=menuを持つ', () => {
    showContextMenu({ x: 0, y: 0, items: [...] })

    const menu = document.querySelector('nav.context-menu')
    expect(menu).toBeTruthy()
    expect(menu?.getAttribute('role')).toBe('menu')
    expect(menu?.getAttribute('aria-label')).toBe('コンテキストメニュー')
  })

  it('メニューアイテムがbutton要素でrole=menuitemを持つ', () => {
    showContextMenu({ x: 0, y: 0, items: [{ label: 'Item', onClick: vi.fn() }] })

    const item = document.querySelector('button.context-menu-item')
    expect(item).toBeTruthy()
    expect(item?.getAttribute('role')).toBe('menuitem')
    expect(item?.getAttribute('type')).toBe('button')
  })

  it('無効化されたアイテムにaria-disabled属性を設定する', () => {
    showContextMenu({
      x: 0, y: 0,
      items: [{ label: 'Disabled', disabled: true, onClick: vi.fn() }]
    })

    const item = document.querySelector('.context-menu-item')
    expect(item?.getAttribute('aria-disabled')).toBe('true')
  })
})
```

**IconViewDOM.test.ts に追加:**
```typescript
describe('セマンティック構造', () => {
  it('main要素でaria-labelを持つ', () => {
    const main = container.querySelector('main.icon-view-dom')
    expect(main).toBeTruthy()
    expect(main?.getAttribute('aria-label')).toBe('ファイル一覧')
  })

  it('アイコンアイテムがrole=buttonとaria-selected属性を持つ', () => {
    const item = container.querySelector('.icon-item')
    expect(item?.getAttribute('role')).toBe('button')
    expect(item?.hasAttribute('aria-selected')).toBe(true)
    expect(item?.hasAttribute('aria-label')).toBe(true)
  })

  it('選択されたアイテムのaria-selectedがtrueになる', () => {
    uiState.toggleSelection('file1')
    createIconViewDOM(container, manager, uiState, onUpdate)

    const items = container.querySelectorAll('.icon-item')
    const selectedItem = Array.from(items).find(item =>
      (item as HTMLElement).dataset.nodeId === 'file1'
    )

    expect(selectedItem?.getAttribute('aria-selected')).toBe('true')
  })
})
```

#### 4-3. 新規テストファイル作成

**BreadcrumbView.test.ts (新規作成):**
- パンくずリスト表示
- ナビゲーション
- セマンティック構造（nav要素、role=button、aria-hidden）

**TreeView.test.ts (新規作成):**
- ツリー表示
- ネストされたフォルダ表示
- セマンティック構造（nav要素、role=tree、role=treeitem）

**GameView.test.ts (新規作成):**
- 画面構成（指示エリア、パンくずパネル、作業エリア、アクションエリア）
- セマンティック構造（section、nav、main、footer、button type）

## 実装順序

1. **新しいテスト問題の追加** (questions.ts)
2. **ContextMenu のテンプレート化**
   - テンプレート作成 → TypeScript 修正 → テスト更新 → 手動テスト
3. **BreadcrumbView のテンプレート化**
   - テンプレート作成 → TypeScript 修正 → テスト作成 → 手動テスト
4. **TreeView のテンプレート化**
   - テンプレート作成 → TypeScript 修正 → テスト作成 → 手動テスト
5. **IconViewDOM のテンプレート化**
   - テンプレート作成 → TypeScript 修正 → テスト更新 → 手動テスト
6. **GameView のテンプレート化**
   - GameView.ts の HTML 構造修正（breadcrumb 分離）
   - style.css の修正
   - テンプレート作成 → TypeScript 修正 → テスト作成 → 手動テスト

## 期待される成果

1. **保守性の向上:** HTML 構造がテンプレートファイルに分離され、変更が容易
2. **アクセシビリティの向上:** セマンティックHTML と ARIA 属性によりスクリーンリーダー対応
3. **テストの充実:** 日本語化により可読性向上、セマンティック構造の検証
4. **空フォルダ判定のテスト:** 新しい問題により空フォルダの正常動作を確認可能
5. **一貫性の向上:** 全てのビューで同じパターンのテンプレート化を実現

## 技術的な注意点

1. **Handlebars ヘルパー登録:** `eq` ヘルパーを vite.config.ts に登録する必要がある
2. **イベントリスナーの再設定:** テンプレートレンダリング後、イベントリスナーを再設定する
3. **フォーカス管理:** IconViewDOM では DOM 再描画時にフォーカスを復元する処理を維持
4. **CSS Grid レイアウト:** breadcrumb 分離に伴う CSS 修正が必要
5. **型安全性:** TypeScript の型定義を活用し、テンプレートに渡すデータの型を明確にする
