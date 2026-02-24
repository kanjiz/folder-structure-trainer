/**
 * コンテキストメニューモジュール
 * 右クリックメニューの表示・非表示を管理
 */

import Handlebars from 'handlebars'
import contextMenuTemplate from '../templates/ContextMenu.hbs?raw'

// テンプレートをコンパイル
const compiledTemplate = Handlebars.compile(contextMenuTemplate)

let currentMenu: HTMLElement | null = null

export interface ContextMenuOptions {
  x: number
  y: number
  items: ContextMenuItem[]
}

export interface ContextMenuItem {
  label: string
  disabled?: boolean
  onClick: () => void
}

/**
 * コンテキストメニューを表示
 */
export function showContextMenu(options: ContextMenuOptions): void {
  // 既存のメニューがあれば削除
  hideContextMenu()

  // テンプレートを描画
  const menuHtml = compiledTemplate({ items: options.items })

  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = menuHtml
  const menu = tempDiv.firstElementChild as HTMLElement

  menu.style.left = `${options.x}px`
  menu.style.top = `${options.y}px`

  // イベントリスナー設定
  menu.querySelectorAll('.context-menu-item').forEach((item, index) => {
    if (!options.items[index].disabled) {
      item.addEventListener('click', (e) => {
        e.stopPropagation()
        options.items[index].onClick()
        hideContextMenu()
      })
    }
  })

  document.body.appendChild(menu)
  currentMenu = menu

  // 画面外に出ないように調整
  const rect = menu.getBoundingClientRect()
  if (rect.right > window.innerWidth) {
    menu.style.left = `${window.innerWidth - rect.width - 10}px`
  }
  if (rect.bottom > window.innerHeight) {
    menu.style.top = `${window.innerHeight - rect.height - 10}px`
  }

  // クリックでメニューを閉じる
  const closeHandler = (e: MouseEvent) => {
    if (!menu.contains(e.target as Node)) {
      hideContextMenu()
      document.removeEventListener('click', closeHandler)
    }
  }
  setTimeout(() => {
    document.addEventListener('click', closeHandler)
  }, 0)
}

/**
 * コンテキストメニューを非表示
 */
export function hideContextMenu(): void {
  if (currentMenu && currentMenu.parentNode) {
    currentMenu.parentNode.removeChild(currentMenu)
    currentMenu = null
  }
}
