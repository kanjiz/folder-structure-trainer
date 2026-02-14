/**
 * コンテキストメニューモジュール
 * 右クリックメニューの表示・非表示を管理
 */

import { loadTemplate } from '../utils/templateLoader'

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
export async function showContextMenu(options: ContextMenuOptions): Promise<void> {
  // 既存のメニューがあれば削除
  hideContextMenu()

  // テンプレートを読み込み
  const template = await loadTemplate('ContextMenu')
  const menuHtml = template({ items: options.items })

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
