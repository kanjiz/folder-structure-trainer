# Phase 3: 残りのビューのテンプレート化 実装計画

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 残りの5つのビュー（ContextMenu, BreadcrumbView, TreeView, IconViewDOM, GameView）をHandlebarsテンプレート化し、セマンティックHTMLとARIA属性を適用して、アクセシビリティを向上させる。

**Architecture:** 各ビューごとに、既存の文字列連結によるHTML生成をHandlebarsテンプレートに移行する。TDDアプローチで、テスト作成→実装→検証のサイクルを繰り返す。各ビューを完全に実装してから次のビューに進む段階的な実装を行う。

**Tech Stack:** TypeScript, Handlebars, Vitest, jsdom

---

## Task 1: 新しいテスト問題の追加

**Files:**

- Modify: `src/data/questions.ts`

**Step 1: q003とq004の問題を追加する**

`src/data/questions.ts` の `questions` 配列に、空フォルダ判定をテストするための2つの問題を追加します。

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
      children: {}
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

**Step 2: TypeScriptの型チェックを実行**

Run: `npm run build`
Expected: ビルドが成功し、型エラーがないことを確認

**Step 3: コミット**

```bash
git add src/data/questions.ts
git commit -m "feat: 空フォルダ判定用のテスト問題（q003, q004）を追加"
```

---

## Task 2: ContextMenu のテンプレート化

### Task 2-1: ContextMenu テンプレートの作成

**Files:**

- Create: `src/templates/ContextMenu.hbs`

**Step 1: Handlebars テンプレートを作成する**

セマンティックHTML（`<nav>`, `<button>`）とARIA属性を使用したテンプレートを作成します。

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

**Step 2: コミット**

```bash
git add src/templates/ContextMenu.hbs
git commit -m "feat: ContextMenuのHandlebarsテンプレートを作成"
```

### Task 2-2: ContextMenu.ts の修正

**Files:**

- Modify: `src/views/ContextMenu.ts`

**Step 1: テンプレートをインポートしてレンダリングに使用する**

既存の文字列連結によるHTML生成を、Handlebarsテンプレートに置き換えます。

`src/views/ContextMenu.ts` の `showContextMenu` 関数を以下のように修正:

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

  // 既存のクリック外し処理を維持
  // ...
}
```

**Step 2: テストを実行して動作確認**

Run: `npm run test -- ContextMenu.test.ts`
Expected: 既存のテストがすべて通ることを確認

**Step 3: コミット**

```bash
git add src/views/ContextMenu.ts
git commit -m "feat: ContextMenuでHandlebarsテンプレートを使用"
```

### Task 2-3: ContextMenu テストの日本語化

**Files:**

- Modify: `src/views/ContextMenu.test.ts`

**Step 1: 全ての it() を日本語に変更する**

`src/views/ContextMenu.test.ts` の全ての `it()` ブロックを日本語に変更します。

例:

```typescript
// Before
it('should create and display context menu', () => { ... })

// After
it('コンテキストメニューを作成して表示できる', () => { ... })
```

各テストケースを確認し、以下のパターンで日本語化:

- `should create and display context menu` → `コンテキストメニューを作成して表示できる`
- `should set menu position correctly` → `メニューの位置を正しく設定できる`
- など

**Step 2: テストを実行して動作確認**

Run: `npm run test -- ContextMenu.test.ts`
Expected: すべてのテストが通ることを確認

**Step 3: コミット**

```bash
git add src/views/ContextMenu.test.ts
git commit -m "test: ContextMenu テストを日本語化"
```

### Task 2-4: ContextMenu セマンティックHTML テストの追加

**Files:**

- Modify: `src/views/ContextMenu.test.ts`

**Step 1: セマンティック構造のテストを追加する**

`src/views/ContextMenu.test.ts` に新しい `describe` ブロックを追加:

```typescript
describe('セマンティック構造', () => {
  it('nav要素とrole=menuを持つ', () => {
    const options: ContextMenuOptions = {
      x: 0,
      y: 0,
      items: [{ label: 'Item', onClick: vi.fn() }]
    }
    showContextMenu(options)

    const menu = document.querySelector('nav.context-menu')
    expect(menu).toBeTruthy()
    expect(menu?.getAttribute('role')).toBe('menu')
    expect(menu?.getAttribute('aria-label')).toBe('コンテキストメニュー')
  })

  it('メニューアイテムがbutton要素でrole=menuitemを持つ', () => {
    const options: ContextMenuOptions = {
      x: 0,
      y: 0,
      items: [{ label: 'Item', onClick: vi.fn() }]
    }
    showContextMenu(options)

    const item = document.querySelector('button.context-menu-item')
    expect(item).toBeTruthy()
    expect(item?.getAttribute('role')).toBe('menuitem')
    expect(item?.getAttribute('type')).toBe('button')
  })

  it('無効化されたアイテムにaria-disabled属性を設定する', () => {
    const options: ContextMenuOptions = {
      x: 0,
      y: 0,
      items: [{ label: 'Disabled', disabled: true, onClick: vi.fn() }]
    }
    showContextMenu(options)

    const item = document.querySelector('.context-menu-item')
    expect(item?.getAttribute('aria-disabled')).toBe('true')
  })
})
```

**Step 2: テストを実行して動作確認**

Run: `npm run test -- ContextMenu.test.ts`
Expected: 新しいテストを含めてすべて通ることを確認

**Step 3: コミット**

```bash
git add src/views/ContextMenu.test.ts
git commit -m "test: ContextMenu のセマンティックHTML検証テストを追加"
```

---

## Task 3: BreadcrumbView のテンプレート化

### Task 3-1: BreadcrumbView テンプレートの作成

**Files:**

- Create: `src/templates/BreadcrumbView.hbs`

**Step 1: Handlebars テンプレートを作成する**

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

**Step 2: コミット**

```bash
git add src/templates/BreadcrumbView.hbs
git commit -m "feat: BreadcrumbViewのHandlebarsテンプレートを作成"
```

### Task 3-2: BreadcrumbView.ts の修正

**Files:**

- Modify: `src/views/BreadcrumbView.ts`

**Step 1: テンプレートをインポートしてレンダリングに使用する**

`src/views/BreadcrumbView.ts` の `renderBreadcrumbView` 関数を修正:

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
    // 既存の drag & drop イベントを維持
    // ...
  })
}
```

**Step 2: 既存の使用箇所を確認**

Run: `npm run build`
Expected: ビルドが成功することを確認

**Step 3: コミット**

```bash
git add src/views/BreadcrumbView.ts
git commit -m "feat: BreadcrumbViewでHandlebarsテンプレートを使用"
```

### Task 3-3: BreadcrumbView テストファイルの作成

**Files:**

- Create: `src/views/BreadcrumbView.test.ts`

**Step 1: テストファイルを作成する**

```typescript
/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderBreadcrumbView } from './BreadcrumbView'
import { FileSystemManager } from '../models/FileSystemManager'
import type { Question, FSNode } from '../models/FileSystem'

describe('BreadcrumbView', () => {
  let container: HTMLElement
  let manager: FileSystemManager
  let onNavigate: ReturnType<typeof vi.fn>
  let onUpdate: ReturnType<typeof vi.fn>
  let rootFolder: FSNode
  let childFolder: FSNode

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)

    manager = new FileSystemManager()
    const mockQuestion: Question = {
      id: 'test-1',
      title: 'テスト問題',
      mode: 'practice',
      instructions: [],
      items: [
        { id: 'folder1', name: 'フォルダ1', type: 'folder' },
        { id: 'folder2', name: 'フォルダ2', type: 'folder' },
      ],
      answer: {}
    }
    manager.loadQuestion(mockQuestion)

    rootFolder = manager.root
    childFolder = rootFolder.children[0]

    onNavigate = vi.fn()
    onUpdate = vi.fn()
  })

  describe('パンくずリスト表示', () => {
    it('ルートフォルダのパスを表示できる', () => {
      renderBreadcrumbView(container, rootFolder, manager, onNavigate, onUpdate)

      const items = container.querySelectorAll('.breadcrumb-item')
      expect(items.length).toBe(1)
      expect(items[0].textContent).toBe('ルート')
    })

    it('子フォルダのパスを表示できる', () => {
      renderBreadcrumbView(container, childFolder, manager, onNavigate, onUpdate)

      const items = container.querySelectorAll('.breadcrumb-item')
      expect(items.length).toBe(2)
      expect(items[0].textContent).toBe('ルート')
      expect(items[1].textContent).toBe('フォルダ1')
    })

    it('パンくず間にセパレータを表示する', () => {
      renderBreadcrumbView(container, childFolder, manager, onNavigate, onUpdate)

      const separators = container.querySelectorAll('.breadcrumb-separator')
      expect(separators.length).toBe(1)
      expect(separators[0].textContent).toBe('>')
    })
  })

  describe('ナビゲーション', () => {
    it('パンくずアイテムをクリックするとonNavigateが呼ばれる', () => {
      renderBreadcrumbView(container, childFolder, manager, onNavigate, onUpdate)

      const items = container.querySelectorAll('.breadcrumb-item')
      ;(items[0] as HTMLElement).click()

      expect(onNavigate).toHaveBeenCalledWith(rootFolder)
    })
  })

  describe('セマンティック構造', () => {
    it('nav要素でaria-labelを持つ', () => {
      renderBreadcrumbView(container, rootFolder, manager, onNavigate, onUpdate)

      const nav = container.querySelector('nav.breadcrumb-view')
      expect(nav).toBeTruthy()
      expect(nav?.getAttribute('aria-label')).toBe('フォルダの階層')
    })

    it('パンくずアイテムがrole=buttonとaria-labelを持つ', () => {
      renderBreadcrumbView(container, childFolder, manager, onNavigate, onUpdate)

      const item = container.querySelector('.breadcrumb-item')
      expect(item?.getAttribute('role')).toBe('button')
      expect(item?.getAttribute('tabindex')).toBe('0')
      expect(item?.hasAttribute('aria-label')).toBe(true)
    })

    it('セパレータにaria-hidden属性がある', () => {
      renderBreadcrumbView(container, childFolder, manager, onNavigate, onUpdate)

      const separator = container.querySelector('.breadcrumb-separator')
      expect(separator?.getAttribute('aria-hidden')).toBe('true')
    })
  })
})
```

**Step 2: テストを実行して失敗を確認**

Run: `npm run test -- BreadcrumbView.test.ts`
Expected: テストが失敗する（実装がまだ完全でない可能性がある）

**Step 3: 必要に応じて BreadcrumbView.ts を修正**

テストの失敗内容に応じて、`src/views/BreadcrumbView.ts` を修正します。

**Step 4: テストを実行して成功を確認**

Run: `npm run test -- BreadcrumbView.test.ts`
Expected: すべてのテストが通ることを確認

**Step 5: コミット**

```bash
git add src/views/BreadcrumbView.test.ts
git commit -m "test: BreadcrumbView のテストを作成"
```

---

## Task 4: TreeView のテンプレート化

### Task 4-1: Handlebars の eq ヘルパー登録

**Files:**

- Modify: `vite.config.ts`

**Step 1: vite-plugin-handlebars をインストール**

Run: `npm install -D vite-plugin-handlebars`
Expected: パッケージがインストールされる

**Step 2: vite.config.ts に handlebars プラグインと eq ヘルパーを追加**

```typescript
import { defineConfig } from 'vite'
import handlebars from 'vite-plugin-handlebars'

export default defineConfig({
  base: '/folder-structure-trainer/',

  plugins: [
    handlebars({
      helpers: {
        eq: (a: unknown, b: unknown) => a === b
      }
    })
  ],

  test: {
    environment: 'node',
  },
})
```

**Step 3: ビルドを実行して確認**

Run: `npm run build`
Expected: ビルドが成功することを確認

**Step 4: コミット**

```bash
git add vite.config.ts package.json package-lock.json
git commit -m "feat: Handlebars の eq ヘルパーを vite.config.ts に追加"
```

### Task 4-2: TreeView テンプレートの作成

**Files:**

- Create: `src/templates/TreeView.hbs`

**Step 1: Handlebars テンプレートを作成する**

再帰的なツリー構造を表現するために、パーシャルを使用します。

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

**Step 2: コミット**

```bash
git add src/templates/TreeView.hbs
git commit -m "feat: TreeViewのHandlebarsテンプレートを作成"
```

### Task 4-3: TreeView.ts の修正

**Files:**

- Modify: `src/views/TreeView.ts`

**Step 1: テンプレートをインポートしてレンダリングに使用する**

`src/views/TreeView.ts` の該当関数を修正:

```typescript
import treeViewTemplate from '../templates/TreeView.hbs?raw'

export function renderTreeView(
  container: HTMLElement,
  root: FSNode,
  onNavigate: (folder: FSNode) => void
): void {
  const html = treeViewTemplate({ root: [root] })

  container.innerHTML = html

  // イベントリスナー設定
  container.querySelectorAll('.tree-item').forEach((item) => {
    const nodeId = (item as HTMLElement).dataset.nodeId!
    const node = findNodeById(root, nodeId)

    if (node && node.type === 'folder') {
      item.addEventListener('click', () => onNavigate(node))
    }
  })
}

function findNodeById(node: FSNode, id: string): FSNode | null {
  if (node.id === id) return node
  for (const child of node.children) {
    const found = findNodeById(child, id)
    if (found) return found
  }
  return null
}
```

**Step 2: ビルドを実行して確認**

Run: `npm run build`
Expected: ビルドが成功することを確認

**Step 3: コミット**

```bash
git add src/views/TreeView.ts
git commit -m "feat: TreeViewでHandlebarsテンプレートを使用"
```

### Task 4-4: TreeView テストファイルの作成

**Files:**

- Create: `src/views/TreeView.test.ts`

**Step 1: テストファイルを作成する**

```typescript
/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderTreeView } from './TreeView'
import { FileSystemManager } from '../models/FileSystemManager'
import type { Question, FSNode } from '../models/FileSystem'

describe('TreeView', () => {
  let container: HTMLElement
  let manager: FileSystemManager
  let onNavigate: ReturnType<typeof vi.fn>
  let rootFolder: FSNode

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)

    manager = new FileSystemManager()
    const mockQuestion: Question = {
      id: 'test-1',
      title: 'テスト問題',
      mode: 'practice',
      instructions: [],
      items: [
        { id: 'folder1', name: 'フォルダ1', type: 'folder' },
        { id: 'file1', name: 'ファイル1.txt', type: 'file' },
      ],
      answer: {}
    }
    manager.loadQuestion(mockQuestion)

    rootFolder = manager.root
    onNavigate = vi.fn()
  })

  describe('ツリー表示', () => {
    it('ルートフォルダを表示できる', () => {
      renderTreeView(container, rootFolder, onNavigate)

      const items = container.querySelectorAll('.tree-item')
      expect(items.length).toBeGreaterThan(0)
      expect(items[0].textContent).toContain('ルート')
    })

    it('子要素を表示できる', () => {
      renderTreeView(container, rootFolder, onNavigate)

      const items = container.querySelectorAll('.tree-item')
      const names = Array.from(items).map(item => item.textContent)
      expect(names.some(name => name?.includes('フォルダ1'))).toBe(true)
      expect(names.some(name => name?.includes('ファイル1.txt'))).toBe(true)
    })
  })

  describe('ネストされたフォルダ表示', () => {
    it('ネストされたフォルダ構造を表示できる', () => {
      // 子フォルダに別のフォルダを追加
      const childFolder = rootFolder.children.find(n => n.type === 'folder')!
      childFolder.children.push({
        id: 'nested1',
        name: 'ネストフォルダ',
        type: 'folder',
        children: []
      })

      renderTreeView(container, rootFolder, onNavigate)

      const items = container.querySelectorAll('.tree-item')
      const names = Array.from(items).map(item => item.textContent)
      expect(names.some(name => name?.includes('ネストフォルダ'))).toBe(true)
    })
  })

  describe('セマンティック構造', () => {
    it('nav要素でaria-labelを持つ', () => {
      renderTreeView(container, rootFolder, onNavigate)

      const nav = container.querySelector('nav.tree-view')
      expect(nav).toBeTruthy()
      expect(nav?.getAttribute('aria-label')).toBe('フォルダツリー')
    })

    it('ツリーリストがrole=treeを持つ', () => {
      renderTreeView(container, rootFolder, onNavigate)

      const treeList = container.querySelector('.tree-list')
      expect(treeList?.getAttribute('role')).toBe('tree')
    })

    it('ツリーアイテムがrole=treeitemとaria-labelを持つ', () => {
      renderTreeView(container, rootFolder, onNavigate)

      const item = container.querySelector('.tree-item')
      expect(item?.getAttribute('role')).toBe('treeitem')
      expect(item?.hasAttribute('aria-label')).toBe(true)
    })
  })
})
```

**Step 2: テストを実行して失敗を確認**

Run: `npm run test -- TreeView.test.ts`
Expected: テストが失敗する（実装がまだ完全でない可能性がある）

**Step 3: 必要に応じて TreeView.ts を修正**

テストの失敗内容に応じて、`src/views/TreeView.ts` を修正します。

**Step 4: テストを実行して成功を確認**

Run: `npm run test -- TreeView.test.ts`
Expected: すべてのテストが通ることを確認

**Step 5: コミット**

```bash
git add src/views/TreeView.test.ts
git commit -m "test: TreeView のテストを作成"
```

---

## Task 5: IconViewDOM のテンプレート化

### Task 5-1: IconViewDOM テンプレートの作成

**Files:**

- Create: `src/templates/IconViewDOM.hbs`

**Step 1: Handlebars テンプレートを作成する**

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

**Step 2: コミット**

```bash
git add src/templates/IconViewDOM.hbs
git commit -m "feat: IconViewDOMのHandlebarsテンプレートを作成"
```

### Task 5-2: IconViewDOM.ts の修正

**Files:**

- Modify: `src/views/IconViewDOM.ts`

**Step 1: テンプレートをインポートしてレンダリングに使用する**

`src/views/IconViewDOM.ts` の `renderIconViewDOM` 関数を修正:

```typescript
import iconViewTemplate from '../templates/IconViewDOM.hbs?raw'

function renderIconViewDOM(
  container: HTMLElement,
  manager: FileSystemManager,
  uiState: UIStateManager,
  onUpdate: () => void
): void {
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

    itemEl.addEventListener('click', (e) => {
      // 既存のクリック処理
      // ...
    })
    itemEl.addEventListener('dblclick', () => {
      // 既存のダブルクリック処理
      // ...
    })
    // その他の既存イベントリスナーを維持
    // ...
  })

  // フォーカス復元処理を維持
  // ...
}
```

**Step 2: テストを実行して動作確認**

Run: `npm run test -- IconViewDOM.test.ts`
Expected: 既存のテストがすべて通ることを確認

**Step 3: コミット**

```bash
git add src/views/IconViewDOM.ts
git commit -m "feat: IconViewDOMでHandlebarsテンプレートを使用"
```

### Task 5-3: IconViewDOM テストの日本語化

**Files:**

- Modify: `src/views/IconViewDOM.test.ts`

**Step 1: 全ての it() を日本語に変更する**

`src/views/IconViewDOM.test.ts` の全ての `it()` ブロックを日本語に変更します。

例:

```typescript
// Before
it('should clear selection when clicking on empty area', () => { ... })

// After
it('空白エリアをクリックすると選択が解除される', () => { ... })
```

**Step 2: テストを実行して動作確認**

Run: `npm run test -- IconViewDOM.test.ts`
Expected: すべてのテストが通ることを確認

**Step 3: コミット**

```bash
git add src/views/IconViewDOM.test.ts
git commit -m "test: IconViewDOM テストを日本語化"
```

### Task 5-4: IconViewDOM セマンティックHTML テストの追加

**Files:**

- Modify: `src/views/IconViewDOM.test.ts`

**Step 1: セマンティック構造のテストを追加する**

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

**Step 2: テストを実行して動作確認**

Run: `npm run test -- IconViewDOM.test.ts`
Expected: 新しいテストを含めてすべて通ることを確認

**Step 3: コミット**

```bash
git add src/views/IconViewDOM.test.ts
git commit -m "test: IconViewDOM のセマンティックHTML検証テストを追加"
```

---

## Task 6: GameView のテンプレート化

### Task 6-1: style.css の修正

**Files:**

- Modify: `src/style.css` (または該当するCSSファイル)

**Step 1: breadcrumb 分離に伴う CSS を修正する**

設計書の「2-2. CSS 修正内容」に従って、`.main-area`, `.breadcrumb-panel`, `.tree-panel`, `.icon-panel` のスタイルを修正します。

主な変更点:

- `.main-area` の `grid-template-rows` を `auto 1fr` から `1fr` に変更
- `.breadcrumb-panel` から `grid-column: 1 / -1;` を削除し、`margin-bottom: 8px;` を追加
- `.tree-panel` から `grid-row: 2;` を削除
- `.icon-panel` から `grid-row: 2;` を削除

**Step 2: ビルドを実行して確認**

Run: `npm run build`
Expected: ビルドが成功することを確認

**Step 3: コミット**

```bash
git add src/style.css
git commit -m "feat: breadcrumb分離に伴うCSSレイアウトを修正"
```

### Task 6-2: GameView テンプレートの作成

**Files:**

- Create: `src/templates/GameView.hbs`

**Step 1: Handlebars テンプレートを作成する**

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

**Step 2: コミット**

```bash
git add src/templates/GameView.hbs
git commit -m "feat: GameViewのHandlebarsテンプレートを作成"
```

### Task 6-3: GameView.ts の修正

**Files:**

- Modify: `src/views/GameView.ts`

**Step 1: テンプレートをインポートしてレンダリングに使用する**

`src/views/GameView.ts` の `renderGameView` 関数を修正:

```typescript
import Handlebars from 'handlebars'
import gameViewTemplate from '../templates/GameView.hbs?raw'

const compiledTemplate = Handlebars.compile(gameViewTemplate)

export function renderGameView(
  container: HTMLElement,
  question: Question,
  onComplete: (result: { correct: string[]; incorrect: string[] }) => void,
  onBack: () => void
): void {
  const html = compiledTemplate({
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

  // 既存の処理を維持
  // renderBreadcrumbView, renderTreeView, createIconViewDOM などの呼び出し
  // ...

  // ボタンのイベントリスナー設定
  const checkBtn = wrapper.querySelector('#check-btn')
  const backBtn = wrapper.querySelector('#back-btn')

  if (checkBtn) {
    checkBtn.addEventListener('click', onCheck)
  }
  backBtn?.addEventListener('click', onBack)
}
```

**Step 2: ビルドを実行して確認**

Run: `npm run build`
Expected: ビルドが成功することを確認

**Step 3: コミット**

```bash
git add src/views/GameView.ts
git commit -m "feat: GameViewでHandlebarsテンプレートを使用"
```

### Task 6-4: GameView テストファイルの作成

**Files:**

- Create: `src/views/GameView.test.ts`

**Step 1: テストファイルを作成する**

```typescript
/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderGameView } from './GameView'
import { FileSystemManager } from '../models/FileSystemManager'
import { UIStateManager } from '../models/UIStateManager'
import type { Question } from '../models/FileSystem'

describe('GameView', () => {
  let container: HTMLElement
  let manager: FileSystemManager
  let uiState: UIStateManager
  let onUpdate: ReturnType<typeof vi.fn>
  let onCheck: ReturnType<typeof vi.fn>
  let onBack: ReturnType<typeof vi.fn>

  const mockQuestion: Question = {
    id: 'test-1',
    title: 'テスト問題',
    mode: 'exercise',
    instructions: ['指示1', '指示2'],
    items: [
      { id: 'folder1', name: 'フォルダ1', type: 'folder' },
    ],
    answer: {}
  }

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)

    manager = new FileSystemManager()
    manager.loadQuestion(mockQuestion)

    uiState = new UIStateManager(manager.root)

    onUpdate = vi.fn()
    onCheck = vi.fn()
    onBack = vi.fn()
  })

  describe('画面構成', () => {
    it('指示エリアを表示する', () => {
      renderGameView(container, mockQuestion, manager, uiState, onUpdate, onCheck, onBack)

      const instructionArea = container.querySelector('.instruction-area')
      expect(instructionArea).toBeTruthy()
      expect(instructionArea?.textContent).toContain('テスト問題')
      expect(instructionArea?.textContent).toContain('指示1')
      expect(instructionArea?.textContent).toContain('指示2')
    })

    it('パンくずパネルを表示する', () => {
      renderGameView(container, mockQuestion, manager, uiState, onUpdate, onCheck, onBack)

      const breadcrumbPanel = container.querySelector('.breadcrumb-panel')
      expect(breadcrumbPanel).toBeTruthy()
    })

    it('作業エリア（tree + icon）を表示する', () => {
      renderGameView(container, mockQuestion, manager, uiState, onUpdate, onCheck, onBack)

      const treePanel = container.querySelector('.tree-panel')
      const iconPanel = container.querySelector('.icon-panel')
      expect(treePanel).toBeTruthy()
      expect(iconPanel).toBeTruthy()
    })

    it('アクションエリアを表示する', () => {
      renderGameView(container, mockQuestion, manager, uiState, onUpdate, onCheck, onBack)

      const actionArea = container.querySelector('.action-area')
      expect(actionArea).toBeTruthy()
    })
  })

  describe('ボタン表示', () => {
    it('演習モードでは答え合わせボタンを表示する', () => {
      renderGameView(container, mockQuestion, manager, uiState, onUpdate, onCheck, onBack)

      const checkBtn = container.querySelector('#check-btn')
      expect(checkBtn).toBeTruthy()
      expect(checkBtn?.textContent).toBe('答え合わせ')
    })

    it('練習モードでは答え合わせボタンを表示しない', () => {
      const practiceQuestion = { ...mockQuestion, mode: 'practice' as const }
      renderGameView(container, practiceQuestion, manager, uiState, onUpdate, onCheck, onBack)

      const checkBtn = container.querySelector('#check-btn')
      expect(checkBtn).toBeFalsy()
    })

    it('常に戻るボタンを表示する', () => {
      renderGameView(container, mockQuestion, manager, uiState, onUpdate, onCheck, onBack)

      const backBtn = container.querySelector('#back-btn')
      expect(backBtn).toBeTruthy()
      expect(backBtn?.textContent).toBe('問題選択に戻る')
    })
  })

  describe('セマンティック構造', () => {
    it('指示エリアがsection要素でaria-labelを持つ', () => {
      renderGameView(container, mockQuestion, manager, uiState, onUpdate, onCheck, onBack)

      const section = container.querySelector('section.instruction-area')
      expect(section).toBeTruthy()
      expect(section?.getAttribute('aria-label')).toBe('問題の指示')
    })

    it('パンくずパネルがnav要素でaria-labelを持つ', () => {
      renderGameView(container, mockQuestion, manager, uiState, onUpdate, onCheck, onBack)

      const nav = container.querySelector('nav.breadcrumb-panel')
      expect(nav).toBeTruthy()
      expect(nav?.getAttribute('aria-label')).toBe('フォルダの階層')
    })

    it('ツリーパネルがnav要素でaria-labelを持つ', () => {
      renderGameView(container, mockQuestion, manager, uiState, onUpdate, onCheck, onBack)

      const nav = container.querySelector('nav.tree-panel')
      expect(nav).toBeTruthy()
      expect(nav?.getAttribute('aria-label')).toBe('フォルダツリー')
    })

    it('アイコンパネルがmain要素でaria-labelを持つ', () => {
      renderGameView(container, mockQuestion, manager, uiState, onUpdate, onCheck, onBack)

      const main = container.querySelector('main.icon-panel')
      expect(main).toBeTruthy()
      expect(main?.getAttribute('aria-label')).toBe('ファイル一覧')
    })

    it('アクションエリアがfooter要素である', () => {
      renderGameView(container, mockQuestion, manager, uiState, onUpdate, onCheck, onBack)

      const footer = container.querySelector('footer.action-area')
      expect(footer).toBeTruthy()
    })

    it('ボタンがtype=button属性を持つ', () => {
      renderGameView(container, mockQuestion, manager, uiState, onUpdate, onCheck, onBack)

      const buttons = container.querySelectorAll('button')
      buttons.forEach(button => {
        expect(button.getAttribute('type')).toBe('button')
      })
    })
  })
})
```

**Step 2: テストを実行して失敗を確認**

Run: `npm run test -- GameView.test.ts`
Expected: テストが失敗する（実装がまだ完全でない可能性がある）

**Step 3: 必要に応じて GameView.ts を修正**

テストの失敗内容に応じて、`src/views/GameView.ts` を修正します。

**Step 4: テストを実行して成功を確認**

Run: `npm run test -- GameView.test.ts`
Expected: すべてのテストが通ることを確認

**Step 5: コミット**

```bash
git add src/views/GameView.test.ts
git commit -m "test: GameView のテストを作成"
```

---

## Task 7: 最終確認とクリーンアップ

### Task 7-1: 全テストの実行

**Files:** N/A

**Step 1: 全テストを実行する**

Run: `npm run test`
Expected: すべてのテストが通ることを確認

**Step 2: カバレッジを確認（オプション）**

Run: `npm run test -- --coverage` (package.json にスクリプトがあれば)
Expected: カバレッジレポートを確認

### Task 7-2: ビルドの確認

**Files:** N/A

**Step 1: プロダクションビルドを実行する**

Run: `npm run build`
Expected: ビルドが成功することを確認

**Step 2: プレビューで動作確認**

Run: `npm run preview`
Expected: ブラウザで動作確認し、すべての機能が正常に動作することを確認

### Task 7-3: Markdown リンターの実行

**Files:** N/A

**Step 1: Markdown ファイルをリントする**

Run: `npm run lint:md`
Expected: エラーがないことを確認

**Step 2: エラーがあれば修正する**

設計書や実装計画にエラーがあれば修正します。

**Step 3: 修正があればコミット**

```bash
git add docs/
git commit -m "docs: markdownlint エラーを修正"
```

---

## 実行オプション

実装計画が完成しました。`docs/plans/2026-02-14-phase3-template-implementation.md` に保存されています。

2つの実行オプションがあります:

**1. Subagent-Driven (this session)** - 私がタスクごとに新しいサブエージェントを起動し、タスク間でレビューを行い、高速に反復します

**2. Parallel Session (separate)** - 新しいセッションを開き、executing-plans スキルを使用してバッチ実行とチェックポイントを設けます

どちらのアプローチを選びますか？
