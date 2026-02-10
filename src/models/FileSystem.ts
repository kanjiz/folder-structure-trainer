export type ItemType = 'folder' | 'file'

export interface QuestionItem {
  id: string
  name: string
  type: ItemType
}

export interface Question {
  id: string
  title: string
  mode: 'practice' | 'exercise'
  instructions: string[]
  items: QuestionItem[]
  answer: AnswerTree
}

export type AnswerTree = { [name: string]: AnswerTree | null }

export class FSNode {
  readonly id: string
  readonly name: string
  readonly type: ItemType
  parent: FSNode | null = null
  children: FSNode[] = []

  constructor(id: string, name: string, type: ItemType) {
    this.id = id
    this.name = name
    this.type = type
  }

  addChild(child: FSNode): void {
    if (this.type !== 'folder') throw new Error('Cannot add child to a file')
    child.parent?.removeChild(child)
    child.parent = this
    this.children.push(child)
  }

  removeChild(child: FSNode): void {
    this.children = this.children.filter(c => c !== child)
    child.parent = null
  }
}
