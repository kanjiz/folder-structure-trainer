import type { AnswerTree, Question } from './FileSystem'
import { FSNode } from './FileSystem'

/**
 * ファイルシステムの状態を管理するクラス
 * ノードの移動、ツリー構造の構築、正誤判定などを行います
 */
export class FileSystemManager {
  /** ルートノード（デスクトップを表す） */
  root: FSNode
  /** すべてのノードをIDで管理するマップ */
  allNodes: Map<string, FSNode>

  /**
   * FileSystemManagerのコンストラクタ
   * ルートノードと空のノードマップを初期化します
   */
  constructor() {
    this.root = new FSNode('root', 'root', 'folder')
    this.allNodes = new Map()
  }

  /**
   * 問題データを読み込み、ファイルシステムを初期化します
   * @param question - 読み込む問題データ
   */
  loadQuestion(question: Question): void {
    this.root = new FSNode('root', 'root', 'folder')
    this.allNodes = new Map()

    for (const item of question.items) {
      const node = new FSNode(item.id, item.name, item.type)
      this.allNodes.set(item.id, node)
      this.root.addChild(node)
    }
  }

  /**
   * ノードを指定したフォルダに移動します
   * @param nodeId - 移動するノードのID
   * @param targetFolderId - 移動先フォルダのID（'root'でルートに移動）
   * @returns 移動が成功した場合はtrue、失敗した場合はfalse
   */
  moveNode(nodeId: string, targetFolderId: string): boolean {
    const node = this.allNodes.get(nodeId)
    const target = targetFolderId === 'root'
      ? this.root
      : this.allNodes.get(targetFolderId)

    if (!node || !target || target.type !== 'folder') return false
    target.addChild(node)
    return true
  }

  /**
   * 現在のフォルダ構造をAnswerTree形式で構築します
   * @param node - 構築を開始するノード（デフォルトはroot）
   * @returns 現在のツリー構造
   */
  buildCurrentTree(node: FSNode = this.root): AnswerTree {
    const tree: AnswerTree = {}
    for (const child of node.children) {
      if (child.type === 'folder') {
        tree[child.name] = {
          type: 'folder',
          children: this.buildCurrentTree(child)
        }
      } else {
        tree[child.name] = { type: 'file' }
      }
    }
    return tree
  }

  /**
   * 現在の配置が正解と一致するかチェックします
   * @param answer - 正解のツリー構造
   * @returns 正解・不正解のアイテムIDリスト
   */
  checkAnswer(answer: AnswerTree): { correct: string[]; incorrect: string[] } {
    const correct: string[] = []
    const incorrect: string[] = []
    this.compareTree(this.root, answer, correct, incorrect)
    return { correct, incorrect }
  }

  /**
   * 現在のツリーと期待されるツリーを再帰的に比較します
   * @param currentNode - 現在比較中のノード
   * @param expectedTree - 期待されるツリー構造
   * @param correct - 正解IDを格納する配列
   * @param incorrect - 不正解IDを格納する配列
   */
  private compareTree(
    currentNode: FSNode,
    expectedTree: AnswerTree,
    correct: string[],
    incorrect: string[],
  ): void {
    for (const child of currentNode.children) {
      if (child.name in expectedTree) {
        const expected = expectedTree[child.name]
        if (child.type === expected.type) {
          correct.push(child.id)
          if (child.type === 'folder' && expected.children) {
            this.compareTree(child, expected.children, correct, incorrect)
          }
        } else {
          incorrect.push(child.id)
        }
      } else {
        incorrect.push(child.id)
      }
    }
  }

  /**
   * 単一のノードの配置が正解かどうかをチェックします（練習モード用）
   * @param nodeId - チェックするノードのID
   * @param answer - 正解のツリー構造
   * @returns 配置が正しい場合はtrue、誤りの場合はfalse
   */
  checkSingleMove(nodeId: string, answer: AnswerTree): boolean {
    const node = this.allNodes.get(nodeId)
    if (!node || !node.parent) return false

    const parentName = node.parent === this.root ? null : node.parent.name
    const ancestors = this.getAnswerAncestors(node.name, node.type, answer, [null])
    return ancestors.includes(parentName)
  }

  /**
   * 正解ツリー内で指定された名前とタイプのノードの親パスを取得します
   * @param name - 検索するノードの名前
   * @param type - 検索するノードのタイプ
   * @param tree - 検索対象のツリー
   * @param path - 現在のパス（再帰的に構築）
   * @returns 見つかった場合は親のパス、見つからない場合は空配列
   */
  private getAnswerAncestors(
    name: string,
    type: 'file' | 'folder',
    tree: AnswerTree,
    path: (string | null)[],
  ): (string | null)[] {
    for (const [key, node] of Object.entries(tree)) {
      if (key === name && node.type === type) {
        return path
      }
      if (node.type === 'folder' && node.children) {
        const result = this.getAnswerAncestors(name, type, node.children, [...path, key])
        if (result.length > 0) return result
      }
    }
    return []
  }
}
