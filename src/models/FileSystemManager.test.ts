import { describe, it, expect, beforeEach } from 'vitest'
import { FileSystemManager } from './FileSystemManager'
import type { Question } from './FileSystem'

const sampleQuestion: Question = {
  id: 'q001',
  title: '仕事のファイルを整理しよう',
  mode: 'practice',
  instructions: [
    '「報告書.docx」を「仕事」フォルダに入れてください',
    '「議事録.txt」を「仕事」フォルダの中の「会議」フォルダに入れてください',
    '「猫.jpg」を「プライベート」フォルダに入れてください',
  ],
  items: [
    { id: 'f1', name: '仕事', type: 'folder' },
    { id: 'f2', name: '会議', type: 'folder' },
    { id: 'f3', name: 'プライベート', type: 'folder' },
    { id: 'd1', name: '報告書.docx', type: 'file' },
    { id: 'd2', name: '議事録.txt', type: 'file' },
    { id: 'd3', name: '猫.jpg', type: 'file' },
  ],
  answer: {
    '仕事': {
      '会議': { '議事録.txt': null },
      '報告書.docx': null,
    },
    'プライベート': {
      '猫.jpg': null,
    },
  },
}

describe('FileSystemManager', () => {
  let manager: FileSystemManager

  beforeEach(() => {
    manager = new FileSystemManager()
    manager.loadQuestion(sampleQuestion)
  })

  it('should load question items as root children', () => {
    expect(manager.root.children).toHaveLength(6)
  })

  it('should move a node to a folder', () => {
    const result = manager.moveNode('d1', 'f1')
    expect(result).toBe(true)
    const folder = manager.allNodes.get('f1')!
    expect(folder.children.map(c => c.id)).toContain('d1')
  })

  it('should not move to a file', () => {
    const result = manager.moveNode('d2', 'd1')
    expect(result).toBe(false)
  })

  it('should check full answer - all correct', () => {
    manager.moveNode('d1', 'f1')  // 報告書 → 仕事
    manager.moveNode('f2', 'f1')  // 会議 → 仕事
    manager.moveNode('d2', 'f2')  // 議事録 → 会議
    manager.moveNode('d3', 'f3')  // 猫 → プライベート

    const result = manager.checkAnswer(sampleQuestion.answer)
    expect(result.correct).toHaveLength(6)
    expect(result.incorrect).toHaveLength(0)
  })

  it('should check full answer - some incorrect', () => {
    const result = manager.checkAnswer(sampleQuestion.answer)
    expect(result.incorrect.length).toBeGreaterThan(0)
  })

  it('should check single move in practice mode - correct', () => {
    manager.moveNode('d1', 'f1')
    const isCorrect = manager.checkSingleMove('d1', sampleQuestion.answer)
    expect(isCorrect).toBe(true)
  })

  it('should check single move in practice mode - incorrect', () => {
    manager.moveNode('d1', 'f3') // 報告書 → プライベート（不正解）
    const isCorrect = manager.checkSingleMove('d1', sampleQuestion.answer)
    expect(isCorrect).toBe(false)
  })

  it('should check nested move correctly', () => {
    manager.moveNode('f2', 'f1')  // 会議 → 仕事
    manager.moveNode('d2', 'f2')  // 議事録 → 会議
    const isCorrect = manager.checkSingleMove('d2', sampleQuestion.answer)
    expect(isCorrect).toBe(true)
  })

  it('should build current tree correctly', () => {
    manager.moveNode('d1', 'f1')
    manager.moveNode('f2', 'f1')
    manager.moveNode('d2', 'f2')
    manager.moveNode('d3', 'f3')

    const tree = manager.buildCurrentTree()
    expect(tree).toEqual(sampleQuestion.answer)
  })
})
