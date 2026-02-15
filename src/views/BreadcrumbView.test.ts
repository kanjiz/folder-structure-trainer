/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderBreadcrumbView } from './BreadcrumbView'
import { FileSystemManager } from '../models/FileSystemManager'
import type { Question } from '../models/types'

const sampleQuestion: Question = {
  id: 'q001',
  title: 'テスト問題',
  mode: 'practice',
  instructions: ['テスト'],
  items: [
    { id: 'f1', name: '仕事', type: 'folder' },
    { id: 'f2', name: '会議', type: 'folder' },
    { id: 'd1', name: '報告書.docx', type: 'file' },
  ],
  answer: {
    '仕事': {
      type: 'folder',
      children: {
        '会議': {
          type: 'folder',
          children: {
            '報告書.docx': { type: 'file' }
          }
        }
      }
    }
  }
}

describe('BreadcrumbView', () => {
  let container: HTMLElement
  let manager: FileSystemManager
  let onNavigate: ReturnType<typeof vi.fn>
  let onUpdate: ReturnType<typeof vi.fn>

  beforeEach(() => {
    container = document.createElement('div')
    manager = new FileSystemManager()
    manager.loadQuestion(sampleQuestion)
    onNavigate = vi.fn()
    onUpdate = vi.fn()
  })

  describe('パンくずリスト表示', () => {
    it('ルート直下のフォルダの場合、「ルート > フォルダ名」を表示する', () => {
      const folder = manager.allNodes.get('f1')!
      renderBreadcrumbView(container, folder, manager, onNavigate, onUpdate)

      const items = container.querySelectorAll('.breadcrumb-item')
      expect(items).toHaveLength(2)
      expect(items[0].textContent?.trim()).toBe('ルート')
      expect(items[1].textContent?.trim()).toBe('仕事')
    })

    it('深い階層のフォルダの場合、正しいパスを表示する', () => {
      // 会議を仕事に移動し、報告書を会議に移動
      manager.moveNode('f2', 'f1')
      manager.moveNode('d1', 'f2')

      const file = manager.allNodes.get('d1')!
      renderBreadcrumbView(container, file, manager, onNavigate, onUpdate)

      const items = container.querySelectorAll('.breadcrumb-item')
      expect(items).toHaveLength(4)
      expect(items[0].textContent?.trim()).toBe('ルート')
      expect(items[1].textContent?.trim()).toBe('仕事')
      expect(items[2].textContent?.trim()).toBe('会議')
      expect(items[3].textContent?.trim()).toBe('報告書.docx')
    })

    it('セパレータが正しく表示される', () => {
      const folder = manager.allNodes.get('f1')!
      renderBreadcrumbView(container, folder, manager, onNavigate, onUpdate)

      const separators = container.querySelectorAll('.breadcrumb-separator')
      expect(separators).toHaveLength(1)
      expect(separators[0].textContent).toBe('>')
    })

    it('最後のアイテムの後にはセパレータが表示されない', () => {
      manager.moveNode('f2', 'f1')

      const folder = manager.allNodes.get('f2')!
      renderBreadcrumbView(container, folder, manager, onNavigate, onUpdate)

      const items = container.querySelectorAll('.breadcrumb-item')
      const separators = container.querySelectorAll('.breadcrumb-separator')
      expect(separators).toHaveLength(items.length - 1)
    })
  })

  describe('ナビゲーション', () => {
    it('パンくずアイテムをクリックするとonNavigateが呼ばれる', () => {
      manager.moveNode('f2', 'f1')

      const folder = manager.allNodes.get('f2')!
      renderBreadcrumbView(container, folder, manager, onNavigate, onUpdate)

      const items = container.querySelectorAll('.breadcrumb-item')
      const firstItem = items[0] as HTMLElement
      firstItem.click()

      expect(onNavigate).toHaveBeenCalledTimes(1)
      expect(onNavigate).toHaveBeenCalledWith(manager.root)
    })

    it('中間のフォルダをクリックするとそのフォルダに移動する', () => {
      manager.moveNode('f2', 'f1')

      const folder = manager.allNodes.get('f2')!
      renderBreadcrumbView(container, folder, manager, onNavigate, onUpdate)

      const items = container.querySelectorAll('.breadcrumb-item')
      const secondItem = items[1] as HTMLElement
      secondItem.click()

      expect(onNavigate).toHaveBeenCalledTimes(1)
      expect(onNavigate).toHaveBeenCalledWith(manager.allNodes.get('f1'))
    })
  })

  describe('セマンティック構造', () => {
    it('<nav>要素とrole属性が正しく設定される', () => {
      const folder = manager.allNodes.get('f1')!
      renderBreadcrumbView(container, folder, manager, onNavigate, onUpdate)

      const nav = container.querySelector('nav')
      expect(nav).not.toBeNull()
      expect(nav?.getAttribute('aria-label')).toBe('フォルダの階層')
    })

    it('各アイテムにrole="button"とaria-labelが設定される', () => {
      const folder = manager.allNodes.get('f1')!
      renderBreadcrumbView(container, folder, manager, onNavigate, onUpdate)

      const items = container.querySelectorAll('.breadcrumb-item')
      items.forEach(item => {
        expect(item.getAttribute('role')).toBe('button')
        expect(item.getAttribute('aria-label')).toMatch(/に移動$/)
        expect(item.getAttribute('tabindex')).toBe('0')
      })
    })

    it('セパレータにaria-hidden="true"が設定される', () => {
      const folder = manager.allNodes.get('f1')!
      renderBreadcrumbView(container, folder, manager, onNavigate, onUpdate)

      const separators = container.querySelectorAll('.breadcrumb-separator')
      separators.forEach(separator => {
        expect(separator.getAttribute('aria-hidden')).toBe('true')
      })
    })

    it('各アイテムにdata-node-id属性が設定される', () => {
      const folder = manager.allNodes.get('f1')!
      renderBreadcrumbView(container, folder, manager, onNavigate, onUpdate)

      const items = container.querySelectorAll('.breadcrumb-item')
      expect(items[0].getAttribute('data-node-id')).toBe('root')
      expect(items[1].getAttribute('data-node-id')).toBe('f1')
    })
  })

  describe('ドラッグ&ドロップ', () => {
    it('パンくずアイテムにdragoverイベントハンドラが設定される', () => {
      const folder = manager.allNodes.get('f1')!
      renderBreadcrumbView(container, folder, manager, onNavigate, onUpdate)

      const item = container.querySelector('.breadcrumb-item') as HTMLElement

      // dragoverイベントハンドラがpreventDefaultを呼ぶことを確認
      let defaultPrevented = false
      const event = new Event('dragover', { bubbles: true, cancelable: true })
      Object.defineProperty(event, 'dataTransfer', {
        value: { dropEffect: '' },
        writable: true
      })
      const originalPreventDefault = event.preventDefault
      event.preventDefault = function() {
        defaultPrevented = true
        originalPreventDefault.call(this)
      }

      item.dispatchEvent(event)
      expect(defaultPrevented).toBe(true)
    })

    it('ドロップイベントでonUpdateが呼ばれる', () => {
      const folder = manager.allNodes.get('f1')!
      renderBreadcrumbView(container, folder, manager, onNavigate, onUpdate)

      const item = container.querySelector('.breadcrumb-item') as HTMLElement

      // ドロップイベントを作成
      const event = new Event('drop', { bubbles: true, cancelable: true })
      Object.defineProperty(event, 'dataTransfer', {
        value: {
          getData: () => JSON.stringify(['d1'])
        }
      })

      item.dispatchEvent(event)
      expect(onUpdate).toHaveBeenCalledTimes(1)
    })
  })
})
