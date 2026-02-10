import p5 from 'p5'
import type { FileSystemManager } from '../models/FileSystemManager'
import type { FSNode } from '../models/FileSystem'
import type { Question } from '../models/FileSystem'

let p5Instance: p5 | null = null

const ICON_W = 80
const ICON_H = 80
const ICON_GAP = 16
const COLS = 6
const PADDING = 24
const NAV_BAR_H = 40

interface IconItem {
  node: FSNode
  x: number
  y: number
}

export function createIconView(
  container: HTMLElement,
  manager: FileSystemManager,
  question: Question,
  onMove: () => void,
): void {
  p5Instance = new p5((p: p5) => {
    let currentFolder: FSNode = manager.root
    let icons: IconItem[] = []
    let dragging: IconItem | null = null
    let dragOffsetX = 0
    let dragOffsetY = 0
    let hoverTarget: IconItem | null = null
    let feedbackIcon: { node: FSNode; correct: boolean; timer: number } | null = null
    let lastClickTime = 0
    let lastClickId = ''

    function layoutIcons(): void {
      icons = []
      const children = currentFolder.children
      for (let i = 0; i < children.length; i++) {
        const col = i % COLS
        const row = Math.floor(i / COLS)
        icons.push({
          node: children[i],
          x: PADDING + col * (ICON_W + ICON_GAP),
          y: NAV_BAR_H + PADDING + row * (ICON_H + ICON_GAP),
        })
      }
    }

    p.setup = () => {
      const canvas = p.createCanvas(container.clientWidth, container.clientHeight)
      canvas.parent(container)
      p.textAlign(p.CENTER, p.CENTER)
      p.textSize(16)
      layoutIcons()
    }

    p.windowResized = () => {
      p.resizeCanvas(container.clientWidth, container.clientHeight)
    }

    p.draw = () => {
      p.background(255)

      // Navigation bar
      drawNavBar(p, currentFolder, manager)

      // Drop zone hint
      if (dragging) {
        for (const icon of icons) {
          if (icon.node.type === 'folder' && icon !== dragging) {
            const isHover = icon === hoverTarget
            p.noFill()
            p.stroke(isHover ? p.color(33, 150, 243) : p.color(200))
            p.strokeWeight(isHover ? 3 : 1)
            p.drawingContext.setLineDash(isHover ? [] : [4, 4])
            p.rect(icon.x - 4, icon.y - 4, ICON_W + 8, ICON_H + 8, 6)
            p.drawingContext.setLineDash([])
            p.strokeWeight(1)
          }
        }
      }

      // Icons
      for (const icon of icons) {
        if (icon === dragging) continue
        drawIcon(p, icon, feedbackIcon)
      }

      // Dragging icon on top
      if (dragging) {
        p.push()
        p.translate(p.mouseX - dragOffsetX, p.mouseY - dragOffsetY)
        drawIconShape(p, dragging.node, 0, 0, 180)
        p.pop()
      }

      // Feedback timer
      if (feedbackIcon) {
        feedbackIcon.timer--
        if (feedbackIcon.timer <= 0) feedbackIcon = null
      }
    }

    p.mousePressed = () => {
      if (p.mouseY < NAV_BAR_H) return

      for (let i = icons.length - 1; i >= 0; i--) {
        const icon = icons[i]
        if (
          p.mouseX >= icon.x &&
          p.mouseX <= icon.x + ICON_W &&
          p.mouseY >= icon.y &&
          p.mouseY <= icon.y + ICON_H
        ) {
          // Double-click detection
          const now = Date.now()
          if (icon.node.type === 'folder' && icon.node.id === lastClickId && now - lastClickTime < 400) {
            currentFolder = icon.node
            layoutIcons()
            lastClickTime = 0
            lastClickId = ''
            return
          }
          lastClickTime = now
          lastClickId = icon.node.id

          dragging = icon
          dragOffsetX = p.mouseX - icon.x
          dragOffsetY = p.mouseY - icon.y
          return
        }
      }
    }

    p.mouseMoved = () => {
      updateHoverTarget(p)
    }

    p.mouseDragged = () => {
      updateHoverTarget(p)
    }

    function updateHoverTarget(p: p5): void {
      hoverTarget = null
      if (!dragging) return
      const dragX = p.mouseX - dragOffsetX
      const dragY = p.mouseY - dragOffsetY
      for (const icon of icons) {
        if (icon === dragging) continue
        if (icon.node.type !== 'folder') continue
        if (
          dragX + ICON_W > icon.x &&
          dragX < icon.x + ICON_W &&
          dragY + ICON_H > icon.y &&
          dragY < icon.y + ICON_H
        ) {
          hoverTarget = icon
          return
        }
      }
    }

    p.mouseReleased = () => {
      if (!dragging) return

      if (hoverTarget && hoverTarget.node.type === 'folder') {
        const targetId = hoverTarget.node.id
        const draggedId = dragging.node.id

        if (question.mode === 'practice') {
          // Practice mode: check before committing
          manager.moveNode(draggedId, targetId)
          const isCorrect = manager.checkSingleMove(draggedId, question.answer)
          if (!isCorrect) {
            // Revert: move back to currentFolder
            manager.moveNode(draggedId, currentFolder.id === 'root' ? 'root' : currentFolder.id)
            feedbackIcon = { node: dragging.node, correct: false, timer: 30 }
          } else {
            feedbackIcon = { node: dragging.node, correct: true, timer: 30 }
            onMove()
          }
        } else {
          // Exercise mode: allow all moves
          manager.moveNode(draggedId, targetId)
          onMove()
        }
        layoutIcons()
      }

      dragging = null
      hoverTarget = null
    }

    // Navigation: click "up" button
    (container as HTMLElement & { _navClick?: () => void })._navClick = () => {
      if (currentFolder !== manager.root && currentFolder.parent) {
        currentFolder = currentFolder.parent
        layoutIcons()
      }
    }
  }, container)

  // Add "up" button as DOM overlay
  const navBtn = document.createElement('button')
  navBtn.className = 'icon-nav-btn'
  navBtn.textContent = '\u2191 \u4E0A\u3078'
  navBtn.addEventListener('click', () => {
    const ext = container as HTMLElement & { _navClick?: () => void }
    ext._navClick?.()
  })
  container.appendChild(navBtn)
}

export function destroyIconView(): void {
  if (p5Instance) {
    p5Instance.remove()
    p5Instance = null
  }
}

function drawNavBar(p: p5, currentFolder: FSNode, manager: FileSystemManager): void {
  p.fill(240)
  p.noStroke()
  p.rect(0, 0, p.width, NAV_BAR_H)

  p.fill(100)
  p.noStroke()
  p.textAlign(p.LEFT, p.CENTER)
  p.textSize(14)

  const path = getPath(currentFolder, manager)
  p.text(path, 80, NAV_BAR_H / 2)

  p.textAlign(p.CENTER, p.CENTER)
  p.textSize(12)
}

function getPath(node: FSNode, manager: FileSystemManager): string {
  const parts: string[] = []
  let current: FSNode | null = node
  while (current && current !== manager.root) {
    parts.unshift(current.name)
    current = current.parent
  }
  parts.unshift('Desktop')
  return parts.join(' > ')
}

function drawIcon(
  p: p5,
  icon: IconItem,
  feedback: { node: FSNode; correct: boolean; timer: number } | null,
): void {
  let alpha = 255
  if (feedback && feedback.node.id === icon.node.id) {
    if (feedback.correct) {
      p.fill(76, 175, 80, 60)
      p.noStroke()
      p.rect(icon.x - 4, icon.y - 4, ICON_W + 8, ICON_H + 8, 6)
    } else {
      p.fill(244, 67, 54, 60)
      p.noStroke()
      p.rect(icon.x - 4, icon.y - 4, ICON_W + 8, ICON_H + 8, 6)
      alpha = 150 + 105 * Math.sin(feedback.timer * 0.5)
    }
  }
  drawIconShape(p, icon.node, icon.x, icon.y, alpha)
}

function drawIconShape(p: p5, node: FSNode, x: number, y: number, alpha: number): void {
  p.push()
  if (node.type === 'folder') {
    // Folder icon
    p.fill(255, 193, 7, alpha)
    p.stroke(200, 150, 0, alpha)
    p.strokeWeight(1)
    // Tab
    p.rect(x + 8, y + 8, 24, 8, 3, 3, 0, 0)
    // Body
    p.rect(x + 8, y + 14, ICON_W - 16, ICON_H - 34, 0, 4, 4, 4)
  } else {
    // File icon
    p.fill(255, 255, 255, alpha)
    p.stroke(180, 180, 180, alpha)
    p.strokeWeight(1)
    p.rect(x + 14, y + 6, ICON_W - 28, ICON_H - 24, 2)
    // Dog ear
    p.fill(220, 220, 220, alpha)
    p.triangle(
      x + ICON_W - 14 - 12, y + 6,
      x + ICON_W - 14, y + 6,
      x + ICON_W - 14, y + 6 + 12,
    )
  }

  // Label
  p.noStroke()
  p.fill(60, 60, 60, alpha)
  p.textSize(16)
  p.textAlign(p.CENTER, p.TOP)

  const label = node.name.length > 8 ? node.name.substring(0, 7) + '\u2026' : node.name
  p.text(label, x + ICON_W / 2, y + ICON_H - 14)
  p.pop()
}
