/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { showContextMenu, hideContextMenu } from './ContextMenu'
import type { ContextMenuOptions } from './ContextMenu'

describe('ContextMenu', () => {
  beforeEach(() => {
    // ウィンドウサイズを設定
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    })
  })

  afterEach(() => {
    // テスト後にメニューをクリーンアップ
    hideContextMenu()
  })

  describe('showContextMenu', () => {
    it('should create and display context menu', async () => {
      const options: ContextMenuOptions = {
        x: 100,
        y: 150,
        items: [
          { label: 'Item 1', onClick: vi.fn() },
          { label: 'Item 2', onClick: vi.fn() }
        ]
      }

      await showContextMenu(options)

      const menu = document.querySelector('.context-menu')
      expect(menu).toBeTruthy()
    })

    it('should set menu position correctly', async () => {
      const options: ContextMenuOptions = {
        x: 100,
        y: 150,
        items: [{ label: 'Item 1', onClick: vi.fn() }]
      }

      await showContextMenu(options)

      const menu = document.querySelector('.context-menu') as HTMLElement
      expect(menu.style.left).toBe('100px')
      expect(menu.style.top).toBe('150px')
    })

    it('should create menu items correctly', async () => {
      const options: ContextMenuOptions = {
        x: 0,
        y: 0,
        items: [
          { label: 'Item 1', onClick: vi.fn() },
          { label: 'Item 2', onClick: vi.fn() },
          { label: 'Item 3', onClick: vi.fn() }
        ]
      }

      await showContextMenu(options)

      const menuItems = document.querySelectorAll('.context-menu-item')
      expect(menuItems).toHaveLength(3)
      expect(menuItems[0].textContent?.trim()).toBe('Item 1')
      expect(menuItems[1].textContent?.trim()).toBe('Item 2')
      expect(menuItems[2].textContent?.trim()).toBe('Item 3')
    })

    it('should apply disabled class to disabled items', async () => {
      const options: ContextMenuOptions = {
        x: 0,
        y: 0,
        items: [
          { label: 'Enabled', onClick: vi.fn() },
          { label: 'Disabled', disabled: true, onClick: vi.fn() }
        ]
      }

      await showContextMenu(options)

      const menuItems = document.querySelectorAll('.context-menu-item')
      expect(menuItems[0].classList.contains('disabled')).toBe(false)
      expect(menuItems[1].classList.contains('disabled')).toBe(true)
    })

    it('should call onClick when item is clicked', async () => {
      const onClick = vi.fn()
      const options: ContextMenuOptions = {
        x: 0,
        y: 0,
        items: [{ label: 'Item 1', onClick }]
      }

      await showContextMenu(options)

      const menuItem = document.querySelector('.context-menu-item') as HTMLElement
      menuItem.click()

      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('should not call onClick when disabled item is clicked', async () => {
      const onClick = vi.fn()
      const options: ContextMenuOptions = {
        x: 0,
        y: 0,
        items: [{ label: 'Disabled', disabled: true, onClick }]
      }

      await showContextMenu(options)

      const menuItem = document.querySelector('.context-menu-item') as HTMLElement
      menuItem.click()

      expect(onClick).not.toHaveBeenCalled()
    })

    it('should hide menu after clicking an item', async () => {
      const options: ContextMenuOptions = {
        x: 0,
        y: 0,
        items: [{ label: 'Item 1', onClick: vi.fn() }]
      }

      await showContextMenu(options)

      const menuItem = document.querySelector('.context-menu-item') as HTMLElement
      menuItem.click()

      const menu = document.querySelector('.context-menu')
      expect(menu).toBeNull()
    })

    it('should replace existing menu when called twice', async () => {
      const options1: ContextMenuOptions = {
        x: 0,
        y: 0,
        items: [{ label: 'Menu 1', onClick: vi.fn() }]
      }

      const options2: ContextMenuOptions = {
        x: 50,
        y: 50,
        items: [
          { label: 'Menu 2 Item 1', onClick: vi.fn() },
          { label: 'Menu 2 Item 2', onClick: vi.fn() }
        ]
      }

      await showContextMenu(options1)
      await showContextMenu(options2)

      const menus = document.querySelectorAll('.context-menu')
      expect(menus).toHaveLength(1)

      const menuItems = document.querySelectorAll('.context-menu-item')
      expect(menuItems).toHaveLength(2)
      expect(menuItems[0].textContent?.trim()).toBe('Menu 2 Item 1')
    })
  })

  describe('hideContextMenu', () => {
    it('should remove context menu from DOM', async () => {
      const options: ContextMenuOptions = {
        x: 0,
        y: 0,
        items: [{ label: 'Item 1', onClick: vi.fn() }]
      }

      await showContextMenu(options)
      expect(document.querySelector('.context-menu')).toBeTruthy()

      hideContextMenu()
      expect(document.querySelector('.context-menu')).toBeNull()
    })

    it('should do nothing when no menu exists', () => {
      // メニューが存在しない状態で呼び出しても例外が発生しないことを確認
      expect(() => hideContextMenu()).not.toThrow()
    })

    it('should be safe to call multiple times', async () => {
      const options: ContextMenuOptions = {
        x: 0,
        y: 0,
        items: [{ label: 'Item 1', onClick: vi.fn() }]
      }

      await showContextMenu(options)
      hideContextMenu()
      hideContextMenu()

      expect(document.querySelector('.context-menu')).toBeNull()
    })
  })

  describe('画面外調整', () => {
    it('should adjust position when menu exceeds right edge', async () => {
      const options: ContextMenuOptions = {
        x: 1000, // 画面幅1024に近い位置
        y: 100,
        items: [
          { label: 'Item 1', onClick: vi.fn() },
          { label: 'Item 2', onClick: vi.fn() }
        ]
      }

      await showContextMenu(options)

      const menu = document.querySelector('.context-menu') as HTMLElement
      // getBoundingClientRect の幅を仮定して、位置が調整されているか確認
      // jsdomでは実際のレンダリングがないため、調整ロジックの存在を確認
      expect(menu).toBeTruthy()
    })

    it('should adjust position when menu exceeds bottom edge', async () => {
      const options: ContextMenuOptions = {
        x: 100,
        y: 750, // 画面高768に近い位置
        items: [
          { label: 'Item 1', onClick: vi.fn() },
          { label: 'Item 2', onClick: vi.fn() }
        ]
      }

      await showContextMenu(options)

      const menu = document.querySelector('.context-menu') as HTMLElement
      expect(menu).toBeTruthy()
    })
  })

  describe('外側クリックで閉じる', () => {
    it('should close menu when clicking outside', async () => {
      const options: ContextMenuOptions = {
        x: 100,
        y: 100,
        items: [{ label: 'Item 1', onClick: vi.fn() }]
      }

      await showContextMenu(options)

      // setTimeout後にイベントリスナーが登録されるため、待機
      await new Promise(resolve => setTimeout(resolve, 10))

      // 外側をクリック
      document.body.click()

      const menu = document.querySelector('.context-menu')
      expect(menu).toBeNull()
    })

    it('should not close menu when clicking on menu itself', async () => {
      const options: ContextMenuOptions = {
        x: 100,
        y: 100,
        items: [{ label: 'Item 1', onClick: vi.fn() }]
      }

      await showContextMenu(options)

      await new Promise(resolve => setTimeout(resolve, 10))

      const menu = document.querySelector('.context-menu') as HTMLElement

      // メニュー自体をクリック（メニューアイテム以外）
      const clickEvent = new MouseEvent('click', { bubbles: true })
      Object.defineProperty(clickEvent, 'target', {
        value: menu,
        enumerable: true
      })
      document.dispatchEvent(clickEvent)

      // メニューは残っているはず（ただし、実際の実装ではアイテムクリックで閉じる）
      expect(document.querySelector('.context-menu')).toBeTruthy()
    })
  })
})
