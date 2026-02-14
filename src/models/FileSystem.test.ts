import { describe, it, expect } from 'vitest'
import { FSNode } from './FileSystem'
import type { AnswerNode, AnswerTree } from './types'

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

  it('should not duplicate child when adding same child twice', () => {
    const folder = new FSNode('f1', 'A', 'folder')
    const file = new FSNode('d1', 'test.txt', 'file')
    folder.addChild(file)
    folder.addChild(file) // 同じ子を再度追加
    expect(folder.children).toHaveLength(1)
    expect(folder.children[0]).toBe(file)
  })

  it('should throw when creating direct circular reference', () => {
    const folderA = new FSNode('f1', 'A', 'folder')
    const folderB = new FSNode('f2', 'B', 'folder')
    folderA.addChild(folderB)
    // BにAを追加しようとすると循環参照エラー
    expect(() => folderB.addChild(folderA)).toThrow('Cannot create circular reference')
  })

  it('should throw when creating 3-level circular reference', () => {
    const folderA = new FSNode('f1', 'A', 'folder')
    const folderB = new FSNode('f2', 'B', 'folder')
    const folderC = new FSNode('f3', 'C', 'folder')
    folderA.addChild(folderB)
    folderB.addChild(folderC)
    // CにAを追加しようとすると循環参照エラー
    expect(() => folderC.addChild(folderA)).toThrow('Cannot create circular reference')
  })

  it('should throw when creating deep circular reference', () => {
    const folderA = new FSNode('f1', 'A', 'folder')
    const folderB = new FSNode('f2', 'B', 'folder')
    const folderC = new FSNode('f3', 'C', 'folder')
    const folderD = new FSNode('f4', 'D', 'folder')
    folderA.addChild(folderB)
    folderB.addChild(folderC)
    folderC.addChild(folderD)
    // DにAを追加しようとすると循環参照エラー（4階層）
    expect(() => folderD.addChild(folderA)).toThrow('Cannot create circular reference')
    // DにBを追加しようとしても循環参照エラー
    expect(() => folderD.addChild(folderB)).toThrow('Cannot create circular reference')
  })

  it('should throw when adding self as child', () => {
    const folder = new FSNode('f1', 'Folder', 'folder')
    // 自分自身を子として追加しようとすると循環参照エラー
    expect(() => folder.addChild(folder)).toThrow('Cannot create circular reference')
  })
})

describe('AnswerNode', () => {
  it('should create a file node', () => {
    const fileNode: AnswerNode = { type: 'file' }
    expect(fileNode.type).toBe('file')
    expect(fileNode.children).toBeUndefined()
  })

  it('should create a folder node with children', () => {
    const folderNode: AnswerNode = {
      type: 'folder',
      children: {
        'test.txt': { type: 'file' }
      }
    }
    expect(folderNode.type).toBe('folder')
    expect(folderNode.children).toBeDefined()
    expect(folderNode.children!['test.txt'].type).toBe('file')
  })

  it('should create nested folder structure', () => {
    const tree: AnswerTree = {
      'src': {
        type: 'folder',
        children: {
          'main.ts': { type: 'file' },
          'utils': {
            type: 'folder',
            children: {
              'helper.ts': { type: 'file' }
            }
          }
        }
      }
    }
    expect(tree['src'].type).toBe('folder')
    expect(tree['src'].children!['main.ts'].type).toBe('file')
    expect(tree['src'].children!['utils'].type).toBe('folder')
    expect(tree['src'].children!['utils'].children!['helper.ts'].type).toBe('file')
  })
})
