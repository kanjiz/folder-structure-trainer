# folder-structure-trainer

フォルダ構造を学ぶためのインタラクティブなトレーニングアプリケーション

## アーキテクチャ

### クラス図

```mermaid
classDiagram
    %% 型定義
    class ItemType {
        <<type>>
        'folder' | 'file'
    }

    %% モデル層
    class FSNode {
        +string id
        +string name
        +ItemType type
        +FSNode|null parent
        +FSNode[] children
        +addChild(child: FSNode): void
        +removeChild(child: FSNode): void
    }

    class FileSystemManager {
        +FSNode root
        +Map~string,FSNode~ allNodes
        +loadQuestion(question: Question): void
        +moveNode(nodeId: string, targetFolderId: string): boolean
        +buildCurrentTree(node?: FSNode): AnswerTree
        +checkAnswer(answer: AnswerTree): CheckResult
        +checkSingleMove(nodeId: string, answer: AnswerTree): boolean
        -compareTree(currentNode: FSNode, expectedTree: AnswerTree, correct: string[], incorrect: string[]): void
        -getAnswerAncestors(name: string, type: ItemType, tree: AnswerTree, path: Array): Array
    }

    class QuestionItem {
        <<interface>>
        +string id
        +string name
        +ItemType type
    }

    class Question {
        <<interface>>
        +string id
        +string title
        +string mode
        +string[] instructions
        +QuestionItem[] items
        +AnswerTree answer
    }

    class AnswerTreeNode {
        <<interface>>
        +ItemType type
        +AnswerTree? children
    }

    class AnswerTree {
        <<type>>
        Record~string,AnswerTreeNode~
    }

    %% ビュー層
    class GameView {
        <<module>>
        +renderGameView(container, question, onComplete, onBack): void
        +destroyGameView(): void
        +getManager(): FileSystemManager|null
    }

    class TreeView {
        <<module>>
        +renderTreeView(container, manager): void
        +updateTreeView(container, manager): void
    }

    class IconView {
        <<module>>
        +createIconView(container, manager, question, onMove): void
        +destroyIconView(): void
    }

    class SelectView {
        <<module>>
        +renderSelectView(container, onSelect): void
    }

    class ResultView {
        <<module>>
        +renderResultView(container, result, onRetry, onBack): void
    }

    %% 関係
    FSNode --o FSNode : parent/children
    FileSystemManager *-- FSNode : root
    FileSystemManager o-- FSNode : allNodes
    Question *-- QuestionItem : items
    Question *-- AnswerTree : answer
    AnswerTree *-- AnswerTreeNode : nodes
    AnswerTreeNode *-- AnswerTree : children
    FSNode ..> ItemType : uses
    QuestionItem ..> ItemType : uses
    AnswerTreeNode ..> ItemType : uses
    GameView ..> FileSystemManager : manages
    GameView ..> Question : uses
    GameView ..> TreeView : renders
    GameView ..> IconView : renders
    TreeView ..> FileSystemManager : displays
    IconView ..> FileSystemManager : interacts
    SelectView ..> Question : selects
    ResultView ..> CheckResult : displays
```

### 主要コンポーネント

#### モデル層

- **FSNode**: ファイルシステムのノードを表現。親子関係を管理し、ツリー構造を構築
- **FileSystemManager**: ファイルシステムの状態管理、ノードの移動、正誤判定を担当
- **Question**: 問題データの定義（アイテム、指示、正解ツリーを含む）
- **AnswerTree**: 正解のフォルダ構造を明示的な型フィールドで表現

#### ビュー層

- **GameView**: ゲーム画面全体を管理
- **TreeView**: フォルダ構造のツリー表示
- **IconView**: ドラッグ可能なアイテムアイコンの表示
- **SelectView**: 問題選択画面
- **ResultView**: 答え合わせ結果の表示

## アクセシビリティ

- **フォント:** BIZ UDPゴシック（ユニバーサルデザイン）
- **基本サイズ:** 24px

### 文字を拡大したい場合

ブラウザのズーム機能を使用してください：

- **Windows/Linux:** `Ctrl` + `+` で拡大、`Ctrl` + `-` で縮小
- **macOS:** `Cmd` + `+` で拡大、`Cmd` + `-` で縮小
- **リセット:** `Ctrl/Cmd` + `0`
