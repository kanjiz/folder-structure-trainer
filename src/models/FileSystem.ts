/**
 * ファイルシステムアイテムの種類
 *
 * フォルダとファイルを区別するためのリテラル型。
 * この型により、TypeScriptの型システムで厳密な判定が可能になります。
 */
export type ItemType = 'folder' | 'file'

/**
 * 問題で使用されるファイルまたはフォルダのアイテム
 *
 * 問題データ（JSON）から読み込まれる各アイテムの定義。
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
 * フォルダ構造トレーニングの問題定義
 *
 * 1つの問題を構成するすべての情報を含みます。
 * 問題データはJSONファイルとして保存され、実行時に読み込まれます。
 */
export interface Question {
  /**
   * 問題の一意識別子
   * 問題の選択や進捗管理に使用されます
   */
  id: string

  /**
   * 問題のタイトル
   * 問題選択画面や実行中の画面に表示されます
   */
  title: string

  /**
   * 問題のモード
   * - 'practice': 練習モード（移動直後に即座にフィードバック）
   * - 'exercise': 演習モード（すべて配置後に一括判定）
   */
  mode: 'practice' | 'exercise'

  /**
   * 問題の指示文のリスト
   * 各要素が1つの指示として表示されます。
   * 複数の指示を段階的に提示できます。
   */
  instructions: string[]

  /**
   * 問題で使用するアイテムのリスト
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
export interface AnswerTreeNode {
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
export type AnswerTree = { [name: string]: AnswerTreeNode }

/**
 * ファイルシステムのノードを表すクラス
 *
 * フォルダとファイルの両方を表現し、親子関係を管理します。
 * ツリー構造のノードとして機能し、ドラッグ&ドロップによる
 * 階層構造の変更を実現します。
 *
 * 設計上の特徴：
 * - 親ノードへの参照を持つ双方向リンク構造
 * - 子ノードの追加時、自動的に元の親から削除される
 * - 不変プロパティ（id, name, type）により、ノードの同一性を保証
 */
export class FSNode {
  /**
   * ノードの一意識別子
   * DOM要素のdata属性やMap検索に使用されます。
   * 一度設定されたら変更されません（readonly）。
   */
  readonly id: string

  /**
   * ノードの表示名
   * UI上でユーザーに表示される名前です。
   * 一度設定されたら変更されません（readonly）。
   */
  readonly name: string

  /**
   * ノードの種類（フォルダまたはファイル）
   * この値により、子を持てるか、アイコンの種類などが決まります。
   * 一度設定されたら変更されません（readonly）。
   */
  readonly type: ItemType

  /**
   * 親ノード
   * - ルートノードの場合は null
   * - それ以外の場合は親フォルダへの参照
   * 移動操作により動的に変更されます。
   */
  parent: FSNode | null = null

  /**
   * 子ノードのリスト
   * - フォルダの場合、子となるファイルやフォルダを格納
   * - ファイルの場合も配列として初期化されますが、使用されません
   * addChild/removeChildメソッドにより動的に変更されます。
   */
  children: FSNode[] = []

  /**
   * FSNodeのコンストラクタ
   *
   * 新しいファイルシステムノードを作成します。
   * 初期状態では親も子も持ちません。
   *
   * @param id - ノードの一意識別子（変更不可）
   * @param name - ノードの表示名（変更不可）
   * @param type - ノードの種類（'folder' または 'file'、変更不可）
   *
   * @example
   * // フォルダノードを作成
   * const folder = new FSNode('f1', 'Documents', 'folder')
   *
   * // ファイルノードを作成
   * const file = new FSNode('f2', 'report.pdf', 'file')
   */
  constructor(id: string, name: string, type: ItemType) {
    this.id = id
    this.name = name
    this.type = type
  }

  /**
   * 子ノードを追加します
   *
   * ドラッグ&ドロップ操作の中核となるメソッド。
   * 子ノードを現在のノード配下に移動させます。
   *
   * 動作：
   * 1. このノードがフォルダでない場合、エラーをスロー
   * 2. 既に自分の子である場合は何もしない（早期リターン）
   * 3. 循環参照チェック：childが自分の祖先でないか確認
   * 4. 子ノードが既に別の親を持っている場合、元の親から自動的に削除
   * 5. 子ノードの親参照を自分に設定
   * 6. 自分の子リストに追加
   *
   * 循環参照の防止：
   * - 親フォルダを子孫フォルダに移動しようとすると、エラーをスロー
   * - 例：A > B > C という階層で、AをCに移動しようとするとエラー
   * - これにより、ツリー構造の整合性が保たれます
   *
   * @param child - 追加する子ノード
   * @throws {Error} このノードがファイルの場合（ファイルは子を持てない）
   * @throws {Error} 循環参照が発生する場合（childが自分の祖先の場合）
   *
   * @example
   * const folder = new FSNode('f1', 'Documents', 'folder')
   * const file = new FSNode('f2', 'report.pdf', 'file')
   *
   * // ファイルをフォルダに追加
   * folder.addChild(file)
   * console.log(file.parent === folder) // true
   * console.log(folder.children.includes(file)) // true
   *
   * @example
   * // ファイルに子を追加しようとするとエラー
   * const file = new FSNode('f1', 'file.txt', 'file')
   * const child = new FSNode('f2', 'child.txt', 'file')
   * file.addChild(child) // Error: Cannot add child to a file
   *
   * @example
   * // 循環参照を作ろうとするとエラー
   * const folderA = new FSNode('a', 'A', 'folder')
   * const folderB = new FSNode('b', 'B', 'folder')
   * const folderC = new FSNode('c', 'C', 'folder')
   * folderA.addChild(folderB)
   * folderB.addChild(folderC)
   * folderC.addChild(folderA) // Error: Cannot create circular reference
   */
  addChild(child: FSNode): void {
    if (this.type !== 'folder') throw new Error('Cannot add child to a file')
    if (child.parent === this) return  // 既に自分の子なら何もしない

    // 循環参照チェック：childが自分の祖先でないか確認
    let ancestor: FSNode | null = this.parent
    while (ancestor) {
      if (ancestor === child) {
        throw new Error('Cannot create circular reference')
      }
      ancestor = ancestor.parent
    }

    child.parent?.removeChild(child)
    child.parent = this
    this.children.push(child)
  }

  /**
   * 子ノードを削除します
   *
   * 指定された子ノードを自分の子リストから削除し、
   * その子ノードの親参照もクリアします。
   *
   * 動作：
   * 1. 子リストから指定されたノードを除外（filter）
   * 2. 子ノードの親参照を null に設定
   *
   * 重要な点：
   * - 指定されたノードが子でない場合でも、エラーにはなりません
   *   （単に何も変わらないだけです）
   * - 削除後、子ノードは親を持たない状態になります
   *
   * @param child - 削除する子ノード
   *
   * @example
   * const folder = new FSNode('f1', 'Documents', 'folder')
   * const file = new FSNode('f2', 'report.pdf', 'file')
   * folder.addChild(file)
   *
   * // 子を削除
   * folder.removeChild(file)
   * console.log(file.parent) // null
   * console.log(folder.children.includes(file)) // false
   *
   * @example
   * // 子でないノードを削除しようとしても、エラーにはならない
   * const folder = new FSNode('f1', 'Documents', 'folder')
   * const file = new FSNode('f2', 'report.pdf', 'file')
   * folder.removeChild(file) // 何も起こらない
   */
  removeChild(child: FSNode): void {
    this.children = this.children.filter(c => c !== child)
    child.parent = null
  }
}
