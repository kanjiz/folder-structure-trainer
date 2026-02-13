const e=`<main class="select-view" role="main">
  <header class="select-view__header">
    <h1>フォルダ構造トレーナー</h1>
    <p class="select-view__description">問題を選んでください</p>
  </header>

  <section class="select-view__content" aria-label="問題リスト">
    <ul class="question-list" role="list">
      {{#each questions}}
        <li class="question-list__item">
          <button
            class="question-card"
            type="button"
            aria-label="{{modeLabel}}: {{title}}"
            data-question-id="{{id}}">
            <span class="mode-badge mode-{{mode}}" aria-hidden="true">
              {{modeLabel}}
            </span>
            <span class="question-title">{{title}}</span>
          </button>
        </li>
      {{/each}}
    </ul>
  </section>
</main>
`;export{e as default};
