import { FSNode } from './FileSystem'
import type { AnswerTree, Question } from './types'

/**
 * ファイルシステムの状態を管理するクラス
 *
 * フォルダ構造トレーナーのコアロジックを提供します。
 * ノードの移動、ツリー構造の構築、正誤判定などを行い、
 * ユーザーのドラッグ&ドロップ操作とフィードバックを実現します。
 */
export class FileSystemManager {
  /**
   * ルートノード（デスクトップを表す）
   * すべてのファイルとフォルダはこのルート配下に配置されます
   */
  root: FSNode

  /**
   * すべてのノードをIDで管理するマップ
   * IDによる高速な検索を可能にし、ドラッグ&ドロップ時の
   * ノード参照に使用されます
   */
  allNodes: Map<string, FSNode>

  /**
   * FileSystemManagerのコンストラクタ
   *
   * 空のファイルシステムを初期化します。
   * 実際の問題データは loadQuestion() で読み込みます。
   */
  constructor() {
    this.root = new FSNode('root', 'root', 'folder')
    this.allNodes = new Map()
  }

  /**
   * 問題データを読み込み、ファイルシステムを初期化します
   *
   * 既存のツリー構造をリセットし、問題データから新しいノードを生成します。
   * すべてのアイテムは最初、ルート直下に配置されます（未整理状態）。
   * ユーザーはこれらを正しいフォルダに移動させることで問題を解きます。
   *
   * @param question - 読み込む問題データ（アイテムリストを含む）
   *
   * @example
   * const question = {
   *   items: [
   *     { id: 'f1', name: 'Documents', type: 'folder' },
   *     { id: 'f2', name: 'report.pdf', type: 'file' }
   *   ]
   * }
   * manager.loadQuestion(question)
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
   *
   * ドラッグ&ドロップ操作を実装するための中核メソッド。
   * ノードは自動的に元の親から削除され、新しい親に追加されます。
   * 同じフォルダ内での移動も可能です（実質的に何も変わりませんが）。
   *
   * @param nodeId - 移動するノードのID
   * @param targetFolderId - 移動先フォルダのID（'root'でルートに移動）
   * @returns 移動が成功した場合はtrue、以下の場合はfalse
   *   - nodeIdのノードが存在しない
   *   - targetFolderIdのフォルダが存在しない
   *   - 移動先がフォルダではない（ファイルに移動しようとした場合）
   *
   * @example
   * // ファイルをフォルダに移動
   * manager.moveNode('file1', 'folder1') // true
   *
   * // ファイルをルートに移動
   * manager.moveNode('file1', 'root') // true
   *
   * // 存在しないノードを移動しようとする
   * manager.moveNode('invalid', 'folder1') // false
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
   *
   * 再帰的にツリーを走査し、正解データと同じ形式のオブジェクトを生成します。
   * これにより、現在のユーザーの配置を正解と比較可能な形式に変換できます。
   *
   * @param node - 構築を開始するノード（デフォルトはroot）
   * @returns 現在のツリー構造をAnswerTree形式で表現したオブジェクト
   *
   * @example
   * // ルートから全体のツリーを取得
   * const tree = manager.buildCurrentTree()
   * // { 'Documents': { type: 'folder', children: { ... } } }
   *
   * // 特定のノードからサブツリーを取得
   * const subTree = manager.buildCurrentTree(folderNode)
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
   *
   * テストモード用のメソッド。すべてのノードを一度に判定します。
   * 正解ツリーに存在し、かつ正しい位置にあるノードを「正解」、
   * それ以外を「不正解」として分類します。
   *
   * 判定基準：
   * - ノード名が正解ツリーに存在する
   * - ノードのタイプ（file/folder）が一致する
   * - 親子関係が正解ツリーと一致する
   * - フォルダの場合、子要素も再帰的にチェック
   *
   * @param answer - 正解のツリー構造
   * @returns 正解・不正解のアイテムIDリスト
   *   - correct: 正しく配置されているノードのIDリスト
   *   - incorrect: 誤って配置されているノードのIDリスト
   *
   * @example
   * const result = manager.checkAnswer(answerTree)
   * console.log(`正解: ${result.correct.length}個`)
   * console.log(`不正解: ${result.incorrect.length}個`)
   */
  checkAnswer(answer: AnswerTree): { correct: string[]; incorrect: string[] } {
    const correct: string[] = []
    const incorrect: string[] = []
    this.compareTree(this.root, answer, correct, incorrect)
    return { correct, incorrect }
  }

  /**
   * 現在のツリーと期待されるツリーを再帰的に比較します
   *
   * checkAnswer()の内部実装。再帰的にツリーを走査し、
   * 各ノードが正解ツリーの期待される位置にあるかを判定します。
   *
   * 判定ロジック：
   * 1. ノード名が正解ツリーに存在するかチェック
   * 2. 存在する場合、タイプ（file/folder）が一致するかチェック
   * 3. 一致すれば正解リストに追加し、フォルダなら子要素も再帰的にチェック
   * 4. 不一致または存在しない場合は不正解リストに追加
   *
   * @param currentNode - 現在比較中のノード
   * @param expectedTree - 期待されるツリー構造
   * @param correct - 正解IDを格納する配列（参照渡し）
   * @param incorrect - 不正解IDを格納する配列（参照渡し）
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
   *
   * 練習モードで使用されるメソッド。移動直後に即座にフィードバックを
   * 提供するため、指定されたノード1つだけの正誤を判定します。
   *
   * 判定方法：
   * 1. ノードの現在の親を取得
   * 2. 正解ツリーからそのノードの正しい親候補を取得
   * 3. 現在の親が候補に含まれていればtrue
   *
   * @param nodeId - チェックするノードのID
   * @param answer - 正解のツリー構造
   * @returns 配置が正しい場合はtrue、以下の場合はfalse
   *   - ノードが存在しない
   *   - ノードに親がない
   *   - 現在の親が正解ツリーの期待する位置ではない
   *
   * @example
   * // ファイルを移動後、すぐに判定
   * manager.moveNode('file1', 'folder1')
   * const isCorrect = manager.checkSingleMove('file1', answerTree)
   * if (isCorrect) {
   *   showSuccessAnimation()
   * }
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
   *
   * checkSingleMove()の内部実装。正解ツリーを再帰的に探索し、
   * 指定されたノードがどの親の下に存在すべきかを特定します。
   *
   * 探索アルゴリズム：
   * 1. ツリーを深さ優先で探索
   * 2. 名前とタイプが一致するノードを発見したら、現在のパスを返す
   * 3. 見つからない場合は空配列を返す
   *
   * @param name - 検索するノードの名前
   * @param type - 検索するノードのタイプ（'file' | 'folder'）
   * @param tree - 検索対象のツリー
   * @param path - 現在のパス（再帰的に構築、nullはルートを表す）
   * @returns 見つかった場合は親のパス、見つからない場合は空配列
   *
   * @example
   * // 内部的な使用例（通常は直接呼び出さない）
   * const path = this.getAnswerAncestors('report.pdf', 'file', answerTree, [null])
   * // path = [null, 'Documents'] なら、report.pdfはDocumentsフォルダ内にあるべき
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
