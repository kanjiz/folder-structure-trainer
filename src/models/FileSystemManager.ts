import type { AnswerTree, Question } from './FileSystem'
import { FSNode } from './FileSystem'

export class FileSystemManager {
  root: FSNode
  allNodes: Map<string, FSNode>

  constructor() {
    this.root = new FSNode('root', 'root', 'folder')
    this.allNodes = new Map()
  }

  loadQuestion(question: Question): void {
    this.root = new FSNode('root', 'root', 'folder')
    this.allNodes = new Map()

    for (const item of question.items) {
      const node = new FSNode(item.id, item.name, item.type)
      this.allNodes.set(item.id, node)
      this.root.addChild(node)
    }
  }

  moveNode(nodeId: string, targetFolderId: string): boolean {
    const node = this.allNodes.get(nodeId)
    const target = targetFolderId === 'root'
      ? this.root
      : this.allNodes.get(targetFolderId)

    if (!node || !target || target.type !== 'folder') return false
    target.addChild(node)
    return true
  }

  buildCurrentTree(node: FSNode = this.root): AnswerTree {
    const tree: AnswerTree = {}
    for (const child of node.children) {
      if (child.type === 'folder') {
        tree[child.name] = this.buildCurrentTree(child)
      } else {
        tree[child.name] = null
      }
    }
    return tree
  }

  checkAnswer(answer: AnswerTree): { correct: string[]; incorrect: string[] } {
    const correct: string[] = []
    const incorrect: string[] = []
    this.compareTree(this.root, answer, correct, incorrect)
    return { correct, incorrect }
  }

  private compareTree(
    currentNode: FSNode,
    expectedTree: AnswerTree,
    correct: string[],
    incorrect: string[],
  ): void {
    for (const child of currentNode.children) {
      if (child.name in expectedTree) {
        if (child.type === 'file' && expectedTree[child.name] === null) {
          correct.push(child.id)
        } else if (child.type === 'folder' && expectedTree[child.name] !== null) {
          correct.push(child.id)
          this.compareTree(child, expectedTree[child.name] as AnswerTree, correct, incorrect)
        } else {
          incorrect.push(child.id)
        }
      } else {
        incorrect.push(child.id)
      }
    }
  }

  checkSingleMove(nodeId: string, answer: AnswerTree): boolean {
    const node = this.allNodes.get(nodeId)
    if (!node || !node.parent) return false

    const path = this.getPathFromRoot(node.parent)
    let subtree: AnswerTree | null = answer

    for (const segment of path) {
      if (subtree === null || !(segment in subtree)) return false
      subtree = subtree[segment] as AnswerTree
    }

    if (subtree === null) return false
    if (node.type === 'file') return node.name in subtree && subtree[node.name] === null
    return node.name in subtree && subtree[node.name] !== null
  }

  private getPathFromRoot(node: FSNode): string[] {
    const path: string[] = []
    let current: FSNode | null = node
    while (current && current !== this.root) {
      path.unshift(current.name)
      current = current.parent
    }
    return path
  }
}
