/**
 * ファイルシステムアイテムの種類
 *
 * フォルダとファイルを区別するためのリテラル型。
 * この型により、TypeScriptの型システムで厳密な判定が可能になります。
 */
export type ItemType = 'folder' | 'file'

/**
 * 設問で使用されるファイルまたはフォルダのアイテム
 *
 * 設問データ（JSON）から読み込まれる各アイテムの定義。
 * これらのアイテムは初期状態でルート直下に配置され、
 * ユーザーが正しいフォルダ構造に整理します。
 */
export interface QuestionItem {
  /**
   * アイテムの一意識別子
   * ドラッグ&ドロップ操作やDOM要素の識別に使用されます
   */
  id: string

  /**
   * アイテムの表示名
   * UI上でユーザーに表示される名前です
   */
  name: string

  /**
   * アイテムの種類（フォルダまたはファイル）
   * この値により、アイコンや動作が変わります
   */
  type: ItemType
}

/**
 * フォルダ構造トレーニングの設問定義
 *
 * 1つの設問を構成するすべての情報を含みます。
 * 設問データはJSONファイルとして保存され、実行時に読み込まれます。
 */
export interface Question {
  /**
   * 設問の一意識別子
   * 設問の選択や進捗管理に使用されます
   */
  id: string

  /**
   * 設問のタイトル
   * 設問選択画面や実行中の画面に表示されます
   */
  title: string

  /**
   * 設問のモード
   * - 'practice': 練習モード（移動直後に即座にフィードバック）
   * - 'exercise': 演習モード（すべて配置後に一括判定）
   */
  mode: 'practice' | 'exercise'

  /**
   * 設問の指示文のリスト
   * 各要素が1つの指示として表示されます。
   * 複数の指示を段階的に提示できます。
   */
  instructions: string[]

  /**
   * 設問で使用するアイテムのリスト
   * これらのアイテムが初期状態でルート直下に配置されます
   */
  items: QuestionItem[]

  /**
   * 正解のツリー構造
   * ユーザーの配置と比較して正誤判定を行います
   */
  answer: AnswerTree
}

/**
 * フォルダ構造の正解を表すノード型
 *
 * 正解データ（JSON）の各ノードを表現します。
 * 再帰的な構造により、深い階層も表現できます。
 */
export interface AnswerNode {
  /**
   * アイテムの種類
   * 'folder' または 'file'
   */
  type: ItemType

  /**
   * 子要素（フォルダの場合のみ存在）
   * ファイルの場合はこのプロパティは存在しません。
   * フォルダの場合、中身が空でも空オブジェクト {} として定義されます。
   */
  children?: AnswerTree
}

/**
 * フォルダ構造の正解を表すツリー型
 *
 * ネストされたオブジェクト構造により、階層的なフォルダ構造を表現します。
 * キーはアイテム名、値はノード情報（タイプと子要素）です。
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
