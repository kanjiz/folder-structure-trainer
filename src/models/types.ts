/**
 * ファイルシステムアイテムの種類
 */
export type ItemType = 'folder' | 'file'

/**
 * 設問で使用されるファイルまたはフォルダのアイテム
 */
export interface QuestionItem {
  id: string
  name: string
  type: ItemType
}

/**
 * フォルダ構造トレーニングの設問定義
 */
export interface Question {
  id: string
  title: string
  mode: 'practice' | 'exercise'
  instructions: string[]
  items: QuestionItem[]
  answer: AnswerTree
}

/**
 * フォルダ構造の正解を表すノード型
 *
 * AnswerTree の各値として使用される。
 * 1つのアイテム（フォルダまたはファイル）を表現し、
 * フォルダの場合は子要素を持つことができる。
 */
export interface AnswerNode {
  /** アイテムの種類（'folder' または 'file'） */
  type: ItemType
  /** 子要素（フォルダの場合のみ存在） */
  children?: AnswerTree
}

/**
 * フォルダ構造の正解を表すツリー型
 *
 * ネストされたオブジェクト構造により、階層的なフォルダ構造を表現する。
 * キーはアイテム名、値は AnswerNode（タイプと子要素）。
 *
 * @example
 * const answerTree: AnswerTree = {
 *   'Documents': {
 *     type: 'folder',
 *     children: {
 *       'report.pdf': { type: 'file' }
 *     }
 *   },
 *   'readme.txt': { type: 'file' }
 * }
 */
export type AnswerTree = { [name: string]: AnswerNode }
