/**
 * コンテキストメニューモジュール
 * 右クリックメニューの表示・非表示を管理
 */

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

  const menu = document.createElement('div')
  menu.className = 'context-menu'
  menu.style.left = `${options.x}px`
  menu.style.top = `${options.y}px`

  options.items.forEach(item => {
    const menuItem = document.createElement('div')
    menuItem.className = 'context-menu-item'
    if (item.disabled) {
      menuItem.classList.add('disabled')
    }
    menuItem.textContent = item.label

    menuItem.addEventListener('click', (e) => {
      e.stopPropagation()
      if (!item.disabled) {
        item.onClick()
        hideContextMenu()
      }
    })

    menu.appendChild(menuItem)
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
