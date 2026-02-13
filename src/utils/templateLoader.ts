import Handlebars from 'handlebars'

/**
 * テンプレートキャッシュ
 *
 * コンパイル済みテンプレートをキャッシュし、
 * 再コンパイルのコストを削減します。
 */
const templateCache = new Map<string, HandlebarsTemplateDelegate>()

/**
 * テンプレートを読み込んでコンパイルする
 *
 * 指定された名前のHandlebarsテンプレートを読み込み、コンパイルします。
 * 一度読み込んだテンプレートはキャッシュされ、次回以降はキャッシュから返されます。
 *
 * Viteの`?raw`サフィックスを使用してテンプレートソースを文字列として読み込みます。
 *
 * @param name - テンプレート名（拡張子なし）
 * @returns コンパイル済みのHandlebarsテンプレート
 *
 * @example
 * const template = await loadTemplate('SelectView')
 * const html = template({ questions: [...] })
 */
export async function loadTemplate(name: string): Promise<HandlebarsTemplateDelegate> {
  // キャッシュに存在する場合はキャッシュから返す
  if (templateCache.has(name)) {
    return templateCache.get(name)!
  }

  // テンプレートファイルを動的にインポート
  // Viteの`?raw`サフィックスで、ファイル内容を文字列として取得
  const templateModule = await import(`../templates/${name}.hbs?raw`)
  const templateSource = templateModule.default

  // Handlebarsでコンパイル
  const template = Handlebars.compile(templateSource)

  // キャッシュに保存
  templateCache.set(name, template)

  return template
}

/**
 * テンプレートキャッシュをクリアする
 *
 * テスト用のユーティリティ関数。
 * すべてのキャッシュされたテンプレートを削除します。
 */
export function clearTemplateCache(): void {
  templateCache.clear()
}
