import { describe, it, expect } from 'vitest'
import { FSNode } from './FileSystem'

describe('FSNode', () => {
  it('should create a folder node', () => {
    const node = new FSNode('f1', '仕事', 'folder')
    expect(node.name).toBe('仕事')
    expect(node.type).toBe('folder')
    expect(node.children).toEqual([])
    expect(node.parent).toBeNull()
  })

  it('should add a child to a folder', () => {
    const folder = new FSNode('f1', '仕事', 'folder')
    const file = new FSNode('d1', '報告書.docx', 'file')
    folder.addChild(file)
    expect(folder.children).toContain(file)
    expect(file.parent).toBe(folder)
  })

  it('should throw when adding child to a file', () => {
    const file = new FSNode('d1', '報告書.docx', 'file')
    const other = new FSNode('d2', '猫.jpg', 'file')
    expect(() => file.addChild(other)).toThrow('Cannot add child to a file')
  })

  it('should move child from one folder to another', () => {
    const folderA = new FSNode('f1', 'A', 'folder')
    const folderB = new FSNode('f2', 'B', 'folder')
    const file = new FSNode('d1', 'test.txt', 'file')
    folderA.addChild(file)
    folderB.addChild(file)
    expect(folderA.children).not.toContain(file)
    expect(folderB.children).toContain(file)
    expect(file.parent).toBe(folderB)
  })

  it('should remove a child', () => {
    const folder = new FSNode('f1', 'A', 'folder')
    const file = new FSNode('d1', 'test.txt', 'file')
    folder.addChild(file)
    folder.removeChild(file)
    expect(folder.children).toHaveLength(0)
    expect(file.parent).toBeNull()
  })
})
