import { describe, it, expect, beforeEach } from 'vitest'
import { FileSystemManager } from '../models/FileSystemManager'
import { renderTreeView } from './TreeView'
import type { Question } from '../models/types'

describe('TreeView', () => {
  let container: HTMLElement
  let manager: FileSystemManager

  beforeEach(() => {
    container = document.createElement('div')
    container.id = 'tree-container'
    document.body.appendChild(container)
    manager = new FileSystemManager()
  })

  describe('ツリー表示', () => {
    it('ルートフォルダを表示できる', () => {
      renderTreeView(container, manager)

      const nav = container.querySelector('nav.tree-view')
      expect(nav).toBeTruthy()
      expect(nav?.getAttribute('aria-label')).toBe('フォルダツリー')

      const rootItem = container.querySelector('.tree-item[data-node-id="root"]')
      expect(rootItem).toBeTruthy()
      expect(rootItem?.textContent).toContain('ルート')
    })

    it('子要素を表示できる', () => {
      // 子要素を追加
      const question: Question = {
        id: 'test-1',
        title: 'テスト問題',
        mode: 'practice',
        instructions: ['テスト'],
        items: [
          { id: 'f1', name: 'Documents', type: 'folder' },
          { id: 'f2', name: 'readme.txt', type: 'file' }
        ],
        answer: {}
      }
      manager.loadQuestion(question)

      renderTreeView(container, manager)

      const items = container.querySelectorAll('.tree-item')
      // ルート + Documents + readme.txt = 3つ
      expect(items.length).toBe(3)

      const folderItem = container.querySelector('.tree-item[data-node-id]')
      expect(folderItem?.classList.contains('tree-folder') || folderItem?.classList.contains('tree-file')).toBe(true)
    })
  })

  describe('ネストされたフォルダ表示', () => {
    it('ネストされたフォルダ構造を表示できる', () => {
      const question: Question = {
        id: 'test-2',
        title: 'テスト問題2',
        mode: 'practice',
        instructions: ['テスト'],
        items: [
          { id: 'f1', name: 'Documents', type: 'folder' },
          { id: 'f2', name: 'report.txt', type: 'file' }
        ],
        answer: {}
      }
      manager.loadQuestion(question)

      // Documentsの下にreport.txtを移動
      manager.moveNode('f2', 'f1')

      renderTreeView(container, manager)

      const items = container.querySelectorAll('.tree-item')
      // ルート + Documents + report.txt = 3つ
      expect(items.length).toBe(3)

      // Documents内にreport.txtがネストされている
      const docFolder = Array.from(items).find(item =>
        item.textContent?.includes('Documents')
      )
      expect(docFolder).toBeTruthy()

      const nestedList = docFolder?.querySelector('ul.tree-list')
      expect(nestedList).toBeTruthy()
    })
  })

  describe('セマンティック構造', () => {
    it('nav要素でaria-labelを持つ', () => {
      renderTreeView(container, manager)

      const nav = container.querySelector('nav')
      expect(nav).toBeTruthy()
      expect(nav?.getAttribute('aria-label')).toBe('フォルダツリー')
    })

    it('ツリーリストがrole=treeを持つ', () => {
      renderTreeView(container, manager)

      const treeList = container.querySelector('ul.tree-list')
      expect(treeList).toBeTruthy()
      expect(treeList?.getAttribute('role')).toBe('tree')
    })

    it('ツリーアイテムがrole=treeitemとaria-labelを持つ', () => {
      const question: Question = {
        id: 'test-3',
        title: 'テスト問題3',
        mode: 'practice',
        instructions: ['テスト'],
        items: [
          { id: 'f1', name: 'Documents', type: 'folder' }
        ],
        answer: {}
      }
      manager.loadQuestion(question)

      renderTreeView(container, manager)

      const treeItems = container.querySelectorAll('.tree-item')
      expect(treeItems.length).toBeGreaterThan(0)

      treeItems.forEach(item => {
        expect(item.getAttribute('role')).toBe('treeitem')
        expect(item.getAttribute('aria-label')).toBeTruthy()
      })
    })
  })
})
