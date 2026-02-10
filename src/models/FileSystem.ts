/**
 * ファイルシステムアイテムの種類
 */
export type ItemType = 'folder' | 'file'

/**
 * 問題で使用されるファイルまたはフォルダのアイテム
 */
export interface QuestionItem {
  /** アイテムの一意識別子 */
  id: string
  /** アイテムの表示名 */
  name: string
  /** アイテムの種類（フォルダまたはファイル） */
  type: ItemType
}

/**
 * フォルダ構造トレーニングの問題定義
 */
export interface Question {
  /** 問題の一意識別子 */
  id: string
  /** 問題のタイトル */
  title: string
  /** 問題のモード（練習または演習） */
  mode: 'practice' | 'exercise'
  /** 問題の指示文のリスト */
  instructions: string[]
  /** 問題で使用するアイテムのリスト */
  items: QuestionItem[]
  /** 正解のツリー構造 */
  answer: AnswerTree
}

/**
 * フォルダ構造の正解を表すツリー型
 * キーはアイテム名、値は子要素のツリーまたはnull（ファイルの場合）
 */
export type AnswerTree = { [name: string]: AnswerTree | null }

/**
 * ファイルシステムのノードを表すクラス
 * フォルダとファイルの両方を表現し、親子関係を管理します
 */
export class FSNode {
  /** ノードの一意識別子 */
  readonly id: string
  /** ノードの表示名 */
  readonly name: string
  /** ノードの種類（フォルダまたはファイル） */
  readonly type: ItemType
  /** 親ノード（ルートの場合はnull） */
  parent: FSNode | null = null
  /** 子ノードのリスト（フォルダの場合のみ使用） */
  children: FSNode[] = []

  /**
   * FSNodeのコンストラクタ
   * @param id - ノードの一意識別子
   * @param name - ノードの表示名
   * @param type - ノードの種類（'folder' または 'file'）
   */
  constructor(id: string, name: string, type: ItemType) {
    this.id = id
    this.name = name
    this.type = type
  }

  /**
   * 子ノードを追加します
   * @param child - 追加する子ノード
   * @throws {Error} ファイルに子を追加しようとした場合
   */
  addChild(child: FSNode): void {
    if (this.type !== 'folder') throw new Error('Cannot add child to a file')
    child.parent?.removeChild(child)
    child.parent = this
    this.children.push(child)
  }

  /**
   * 子ノードを削除します
   * @param child - 削除する子ノード
   */
  removeChild(child: FSNode): void {
    this.children = this.children.filter(c => c !== child)
    child.parent = null
  }
}
