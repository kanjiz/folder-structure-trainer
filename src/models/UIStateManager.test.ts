import { describe, it, expect, beforeEach } from 'vitest'
import { UIStateManager } from './UIStateManager'
import { FSNode } from './FileSystem'

describe('UIStateManager', () => {
  let uiState: UIStateManager
  let mockRoot: FSNode

  beforeEach(() => {
    mockRoot = {
      id: 'root',
      name: 'Desktop',
      type: 'folder',
      parent: null,
      children: [],
      addChild: () => {},
      removeChild: () => {},
    }
    uiState = new UIStateManager(mockRoot)
  })

  describe('selection', () => {
    it('should initialize with empty selection', () => {
      expect(uiState.selection.size).toBe(0)
    })

    it('should add items to selection', () => {
      uiState.toggleSelection('item1')
      expect(uiState.isSelected('item1')).toBe(true)
    })

    it('should remove items from selection when toggled again', () => {
      uiState.toggleSelection('item1')
      uiState.toggleSelection('item1')
      expect(uiState.isSelected('item1')).toBe(false)
    })

    it('should clear all selections', () => {
      uiState.toggleSelection('item1')
      uiState.toggleSelection('item2')
      uiState.clearSelection()
      expect(uiState.selection.size).toBe(0)
    })
  })

  describe('clipboard', () => {
    it('should initialize with empty clipboard', () => {
      expect(uiState.clipboard.size).toBe(0)
    })

    it('should cut items to clipboard', () => {
      uiState.toggleSelection('item1')
      uiState.cut()
      expect(uiState.clipboard.has('item1')).toBe(true)
      expect(uiState.selection.size).toBe(0)
    })

    it('should clear clipboard', () => {
      uiState.toggleSelection('item1')
      uiState.cut()
      uiState.clearClipboard()
      expect(uiState.clipboard.size).toBe(0)
    })
  })

  describe('currentFolder', () => {
    it('should initialize with root folder', () => {
      expect(uiState.currentFolder).toBe(mockRoot)
    })

    it('should navigate to folder', () => {
      const childFolder: FSNode = {
        id: 'child',
        name: 'Child',
        type: 'folder',
        parent: mockRoot,
        children: [],
        addChild: () => {},
        removeChild: () => {},
      }
      uiState.navigateToFolder(childFolder)
      expect(uiState.currentFolder).toBe(childFolder)
    })
  })
})
