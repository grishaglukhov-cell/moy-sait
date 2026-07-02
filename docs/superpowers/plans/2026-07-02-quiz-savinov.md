# Лендинг-квиз для хирурга Савинова Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Построить одностраничный лендинг-квиз для пластического хирурга Александра Савинова (клиника «Основа Силуета», Москва) — от выбора процедуры через ветвящиеся вопросы к персональному результату и форме контактов.

**Architecture:** Один самодостаточный файл `quiz-savinov/index.html` (HTML + `<style>` + `<script>`), без сборки и зависимостей — тот же принцип, что и в основном сайте репозитория. Квиз — SPA-подобная логика на чистом JS: единый объект `state`, четыре HTML-секции (`#cover`, `#quiz`, `#result`, `#contact-form`), переключаемые через `showScreen()`. Вопросы шагов 2–4 рендерятся динамически из объекта `PROCEDURES` в зависимости от выбранной на шаге 1 процедуры.

**Tech Stack:** Чистый HTML/CSS/JS, Google Fonts (Fraunces, Inter, IBM Plex Mono). Нет сборщиков, нет тестового фреймворка — верификация через grep структурных маркеров после каждой правки и финальную визуальную проверку в браузере (проект не содержит тестов, соответствует конвенции репозитория).

**Верификация без тестового фреймворка:** проект — статический сайт без тестов (см. `CLAUDE.md` корня репозитория). После каждой задачи: (1) `grep` на наличие новых идентификаторов/функций — подтверждает, что правка применилась туда, куда нужно; (2) `python3 -c "import html.parser"`-парсинг не требуется, вместо этого — `node --check` не применим к встроенному в HTML `<script>`, поэтому синтаксис JS проверяется через `node -e` с извлечённым содержимым `<script>` (команда есть в каждой JS-задаче). Финальная задача — открыть файл в браузере и пройти все три ветки квиза вручную.

---

## File Structure

- Create: `quiz-savinov/index.html` — единственный файл проекта, всё содержимое (HTML/CSS/JS)

Файл строится инкрементально: задача 1 создаёт полный скелет с тремя якорями-комментариями (`<!-- SCREEN_ANCHOR -->` в HTML, `/* STYLE_ANCHOR */` в CSS, `// SCRIPT_ANCHOR` в JS), каждая следующая задача вставляет свой код непосредственно перед соответствующим якорем (заменяя якорь на «новый код + якорь»), последняя задача убирает все три якоря.

---

### Task 1: Скелет документа, палитра, базовые стили, экран-обложка

**Files:**
- Create: `quiz-savinov/index.html`

- [ ] **Step 1: Создать директорию и файл со скелетом**

```bash
mkdir -p "/Users/grigorijilic/Desktop/Мой сайт /quiz-savinov"
```

Записать в `quiz-savinov/index.html`:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Тест: какая процедура вам подходит — доктор Савинов</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root {
  --bg: #faf8f5;
  --bg-2: #f2efe9;
  --card: #ffffff;
  --line: rgba(20,20,18,0.08);
  --line-2: rgba(20,20,18,0.16);
  --ink: #1c1b19;
  --ink-2: #55524c;
  --muted: #8c887f;
  --radius: 24px;
  --radius-lg: 32px;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: var(--bg);
  color: var(--ink);
  font-family: 'Inter', sans-serif;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3 {
  font-family: 'Fraunces', serif;
  font-weight: 500;
  line-height: 1.05;
  text-wrap: balance;
}

.eyebrow {
  font-family: 'IBM Plex Mono', monospace;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 12px;
  color: var(--muted);
}

.screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  padding: 64px 24px;
}

.container {
  max-width: 720px;
  margin: 0 auto;
  width: 100%;
}

.btn {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 15px;
  padding: 16px 32px;
  border-radius: 100px;
  border: 1px solid var(--ink);
  cursor: pointer;
  transition: .2s;
  background: transparent;
}

.btn-primary {
  background: var(--ink);
  color: var(--bg);
}

.btn-primary:hover { opacity: .85; }
.btn-primary:disabled { opacity: .3; cursor: not-allowed; }

.btn-secondary {
  background: transparent;
  color: var(--ink);
}

.btn-secondary:hover { background: var(--bg-2); }

.card {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--radius);
}

[hidden] { display: none !important; }

/* STYLE_ANCHOR */
</style>
</head>
<body>

<section id="cover" class="screen">
  <div class="container" style="text-align:center;">
    <p class="eyebrow">Клиника «Основа Силуета» · Москва</p>
    <h1 style="font-size: clamp(36px, 6vw, 64px); margin: 20px 0;">Пройдите тест — узнайте, <em style="font-style: italic; color: var(--ink-2);">какая процедура</em> подходит именно вам</h1>
    <p style="color: var(--ink-2); font-size: 17px; max-width: 480px; margin: 0 auto 32px;">Доктор Савинов Александр разберёт ваш запрос за 5 вопросов и 1 минуту — без выезда в клинику.</p>
    <button class="btn btn-primary" onclick="showScreen('quiz')">Пройти тест →</button>
  </div>
</section>

<!-- SCREEN_ANCHOR -->

<script>
// SCRIPT_ANCHOR
</script>
</body>
</html>
```

- [ ] **Step 2: Проверить структуру файла**

Run: `grep -c "STYLE_ANCHOR\|SCREEN_ANCHOR\|SCRIPT_ANCHOR" "/Users/grigorijilic/Desktop/Мой сайт /quiz-savinov/index.html"`
Expected: `3`

Run: `grep -c "id=\"cover\"" "/Users/grigorijilic/Desktop/Мой сайт /quiz-savinov/index.html"`
Expected: `1`

- [ ] **Step 3: Визуально открыть в браузере**

Run: `open "/Users/grigorijilic/Desktop/Мой сайт /quiz-savinov/index.html"`
Проверить: светлый тёплый фон (`#faf8f5`), заголовок шрифтом Fraunces (засечки), кнопка «Пройти тест →» тёмная с закруглением. Клик по кнопке пока ничего не делает (JS ещё не написан) — это ожидаемо.

- [ ] **Step 4: Commit**

```bash
cd "/Users/grigorijilic/Desktop/Мой сайт " && git add quiz-savinov/index.html && git commit -m "feat: скелет и обложка лендинга-квиза Савинова"
```

---

### Task 2: Каркас квиза — прогресс-бар, контейнер шага, навигация

**Files:**
- Modify: `quiz-savinov/index.html`

- [ ] **Step 1: Вставить HTML квиза перед `<!-- SCREEN_ANCHOR -->`**

Заменить:
```html
<!-- SCREEN_ANCHOR -->
```
на:
```html
<section id="quiz" class="screen" hidden>
  <div class="container">
    <div class="quiz-progress" id="quiz-progress"></div>
    <div id="quiz-step-content"></div>
    <div class="quiz-nav">
      <button class="btn btn-secondary" id="quiz-back" onclick="goBack()">Назад</button>
      <button class="btn btn-primary" id="quiz-next" onclick="goNext()" disabled>Далее</button>
    </div>
  </div>
</section>

<!-- SCREEN_ANCHOR -->
```

- [ ] **Step 2: Вставить CSS квиза перед `/* STYLE_ANCHOR */`**

Заменить:
```css
/* STYLE_ANCHOR */
```
на:
```css
.quiz-progress {
  display: flex;
  gap: 8px;
  margin-bottom: 40px;
}

.quiz-progress .dot {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: var(--line);
  transition: .2s;
}

.quiz-progress .dot.done,
.quiz-progress .dot.active {
  background: var(--ink);
}

.quiz-nav {
  display: flex;
  justify-content: space-between;
  margin-top: 32px;
}

.question-title {
  font-size: clamp(24px, 3.5vw, 34px);
  margin-bottom: 24px;
}

.options-grid {
  display: grid;
  gap: 12px;
}

.option-btn {
  text-align: left;
  padding: 20px 24px;
  border-radius: var(--radius);
  border: 1px solid var(--line);
  background: var(--card);
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  cursor: pointer;
  transition: .2s;
}

.option-btn:hover { border-color: var(--line-2); }
.option-btn.selected { border-color: var(--ink); background: var(--bg-2); font-weight: 600; }

.procedure-grid {
  display: grid;
  gap: 12px;
}

.procedure-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  border-radius: var(--radius);
  border: 1px solid var(--line);
  background: var(--card);
  cursor: pointer;
  transition: .2s;
  font-family: 'Inter', sans-serif;
  font-size: 17px;
  font-weight: 600;
  text-align: left;
  width: 100%;
}

.procedure-card:hover { border-color: var(--line-2); }
.procedure-card.selected { border-color: var(--ink); background: var(--bg-2); }

.procedure-card .icon { font-size: 24px; }

.checkbox-list { display: grid; gap: 12px; }

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 24px;
  border-radius: var(--radius);
  border: 1px solid var(--line);
  background: var(--card);
  cursor: pointer;
}

.checkbox-item input { width: 18px; height: 18px; }

/* STYLE_ANCHOR */
```

- [ ] **Step 3: Проверить**

Run: `grep -c "quiz-progress\|procedure-card\|checkbox-item" "/Users/grigorijilic/Desktop/Мой сайт /quiz-savinov/index.html"`
Expected: `6` (по 2 вхождения каждого класса — в CSS-селекторе и в разметке/будущей разметке; на этом шаге минимум 3, т.к. разметка контейнеров для `procedure-card`/`checkbox-item` появится в задачах 3 и 5 — проверяем базовый минимум)

Run: `grep -c "id=\"quiz-progress\"" "/Users/grigorijilic/Desktop/Мой сайт /quiz-savinov/index.html"`
Expected: `1`

- [ ] **Step 4: Commit**

```bash
cd "/Users/grigorijilic/Desktop/Мой сайт " && git add quiz-savinov/index.html && git commit -m "feat: каркас квиза — прогресс-бар и навигация"
```

---

### Task 3: Модель данных процедур, состояние, рендер шага 1

**Files:**
- Modify: `quiz-savinov/index.html`

- [ ] **Step 1: Вставить JS перед `// SCRIPT_ANCHOR`**

Заменить:
```html
// SCRIPT_ANCHOR
```
на:
```html
const TOTAL_STEPS = 5;

const state = {
  step: 1,
  procedure: null,
  answers: {},
  contraindications: []
};

const PROCEDURES = {
  blepharoplasty: {
    label: 'Блефаропластика',
    icon: '👁',
    questions: [
      { key: 'zone', question: 'Какая зона беспокоит больше всего?', options: ['Верхние веки', 'Нижние веки', 'Обе зоны'] },
      { key: 'concern', question: 'Что беспокоит сильнее всего?', options: ['Нависшее веко', 'Мешки под глазами', 'Асимметрия'] },
      { key: 'timing', question: 'Когда планируете операцию?', options: ['В ближайший месяц', 'В течение 3 месяцев', 'Пока изучаю варианты'] }
    ]
  },
  rejuvenation: {
    label: 'Тотальное омоложение',
    icon: '✦',
    questions: [
      { key: 'zone', question: 'Какая зона в приоритете?', options: ['Лицо', 'Шея', 'Овал лица'] },
      { key: 'effect', question: 'Какой эффект хотите получить?', options: ['Убрать морщины', 'Подтянуть контур', 'Освежить в целом'] },
      { key: 'timing', question: 'Когда планируете операцию?', options: ['В ближайший месяц', 'В течение 3 месяцев', 'Пока изучаю варианты'] }
    ]
  },
  mammoplasty: {
    label: 'Маммопластика',
    icon: '◐',
    questions: [
      { key: 'result', question: 'Какой результат хотите получить?', options: ['Увеличение', 'Подтяжка', 'Уменьшение'] },
      { key: 'size', question: 'Какой размер сейчас?', options: ['До 1 размера', '1–2 размер', '3 размер и более'] },
      { key: 'timing', question: 'Когда планируете операцию?', options: ['В ближайший месяц', 'В течение 3 месяцев', 'Пока изучаю варианты'] }
    ]
  }
};

const CONTRAINDICATIONS = [
  { key: 'smoking', label: 'Курю' },
  { key: 'chronic', label: 'Есть хронические заболевания' },
  { key: 'prior', label: 'Ранее уже делала операции' }
];

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(el => el.hidden = true);
  document.getElementById(id).hidden = false;
  window.scrollTo(0, 0);
  if (id === 'quiz') renderStep();
}

function updateProgress() {
  const wrap = document.getElementById('quiz-progress');
  wrap.innerHTML = '';
  for (let i = 1; i <= TOTAL_STEPS; i++) {
    const dot = document.createElement('div');
    dot.className = 'dot' + (i < state.step ? ' done' : i === state.step ? ' active' : '');
    wrap.appendChild(dot);
  }
}

function renderStep() {
  updateProgress();
  const content = document.getElementById('quiz-step-content');
  const nextBtn = document.getElementById('quiz-next');
  const backBtn = document.getElementById('quiz-back');
  backBtn.style.visibility = state.step === 1 ? 'hidden' : 'visible';
  nextBtn.textContent = 'Далее';

  if (state.step === 1) {
    content.innerHTML = `
      <h2 class="question-title">Какая процедура вас интересует?</h2>
      <div class="procedure-grid">
        ${Object.entries(PROCEDURES).map(([key, p]) => `
          <button class="procedure-card${state.procedure === key ? ' selected' : ''}" onclick="selectProcedure('${key}')">
            <span class="icon">${p.icon}</span>
            <span>${p.label}</span>
          </button>
        `).join('')}
      </div>
    `;
    nextBtn.disabled = !state.procedure;
    return;
  }
}

function selectProcedure(key) {
  state.procedure = key;
  renderStep();
}

// SCRIPT_ANCHOR
```

- [ ] **Step 2: Проверить синтаксис JS**

Run:
```bash
node -e "
const fs = require('fs');
const html = fs.readFileSync('/Users/grigorijilic/Desktop/Мой сайт /quiz-savinov/index.html', 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
new Function(script);
console.log('OK: JS syntax valid');
"
```
Expected: `OK: JS syntax valid`

- [ ] **Step 3: Визуально проверить шаг 1**

Run: `open "/Users/grigorijilic/Desktop/Мой сайт /quiz-savinov/index.html"`
Проверить в консоли браузера (DevTools) нет ошибок при загрузке; выполнить в консоли `showScreen('quiz')` — должны появиться 3 карточки процедур, клик по карточке подсвечивает её и активирует кнопку «Далее».

- [ ] **Step 4: Commit**

```bash
cd "/Users/grigorijilic/Desktop/Мой сайт " && git add quiz-savinov/index.html && git commit -m "feat: модель процедур и рендер шага выбора процедуры"
```

---

### Task 4: Ветвящиеся вопросы (шаги 2–4) и навигация далее/назад

**Files:**
- Modify: `quiz-savinov/index.html`

- [ ] **Step 1: Добавить ветку шагов 2–4 в `renderStep()`**

Заменить:
```html
    nextBtn.disabled = !state.procedure;
    return;
  }
}

function selectProcedure(key) {
```
на:
```html
    nextBtn.disabled = !state.procedure;
    return;
  }

  if (state.step >= 2 && state.step <= 4) {
    const questions = PROCEDURES[state.procedure].questions;
    const q = questions[state.step - 2];
    const selected = state.answers[q.key];
    content.innerHTML = `
      <h2 class="question-title">${q.question}</h2>
      <div class="options-grid">
        ${q.options.map(opt => `
          <button class="option-btn${selected === opt ? ' selected' : ''}" onclick="selectAnswer('${q.key}', '${opt}')">${opt}</button>
        `).join('')}
      </div>
    `;
    nextBtn.disabled = !selected;
    return;
  }
}

function selectAnswer(key, value) {
  state.answers[key] = value;
  renderStep();
}

function selectProcedure(key) {
```

- [ ] **Step 2: Добавить `goNext()`/`goBack()` перед `// SCRIPT_ANCHOR`**

Заменить:
```html
// SCRIPT_ANCHOR
```
на:
```html
function goNext() {
  if (state.step < TOTAL_STEPS) {
    state.step++;
    renderStep();
  } else {
    showResult();
  }
}

function goBack() {
  if (state.step > 1) {
    state.step--;
    renderStep();
  }
}

// SCRIPT_ANCHOR
```

- [ ] **Step 3: Проверить синтаксис JS**

Run:
```bash
node -e "
const fs = require('fs');
const html = fs.readFileSync('/Users/grigorijilic/Desktop/Мой сайт /quiz-savinov/index.html', 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
new Function(script);
console.log('OK: JS syntax valid');
"
```
Expected: `OK: JS syntax valid`

Run: `grep -c "function goNext\|function goBack\|function selectAnswer" "/Users/grigorijilic/Desktop/Мой сайт /quiz-savinov/index.html"`
Expected: `3`

- [ ] **Step 4: Визуально проверить все три ветки**

Run: `open "/Users/grigorijilic/Desktop/Мой сайт /quiz-savinov/index.html"`
В консоли: `showScreen('quiz')`. Пройти по очереди: выбрать «Блефаропластика» → «Далее» — должны появиться вопросы про зону/беспокойство/сроки. Нажать «Назад» — вернуться к шагу 1, сменить на «Маммопластика» — вопросы на шагах 2–4 должны смениться на вопросы про размер/результат.

- [ ] **Step 5: Commit**

```bash
cd "/Users/grigorijilic/Desktop/Мой сайт " && git add quiz-savinov/index.html && git commit -m "feat: ветвящиеся вопросы шагов 2-4 и навигация квиза"
```

---

### Task 5: Шаг 5 — фильтр по противопоказаниям

**Files:**
- Modify: `quiz-savinov/index.html`

- [ ] **Step 1: Добавить ветку шага 5 в `renderStep()`**

Заменить:
```html
    nextBtn.disabled = !selected;
    return;
  }
}

function selectAnswer(key, value) {
```
на:
```html
    nextBtn.disabled = !selected;
    return;
  }

  if (state.step === 5) {
    content.innerHTML = `
      <h2 class="question-title">Есть ли что-то из этого?</h2>
      <p style="color: var(--ink-2); margin-bottom: 24px;">Это не помешает пройти тест — нужно для точной консультации.</p>
      <div class="checkbox-list">
        ${CONTRAINDICATIONS.map(c => `
          <label class="checkbox-item">
            <input type="checkbox" ${state.contraindications.includes(c.key) ? 'checked' : ''} onchange="toggleContraindication('${c.key}')">
            <span>${c.label}</span>
          </label>
        `).join('')}
      </div>
    `;
    nextBtn.disabled = false;
    nextBtn.textContent = 'Показать результат';
    return;
  }
}

function toggleContraindication(key) {
  const i = state.contraindications.indexOf(key);
  if (i === -1) state.contraindications.push(key);
  else state.contraindications.splice(i, 1);
}

function selectAnswer(key, value) {
```

- [ ] **Step 2: Проверить синтаксис JS**

Run:
```bash
node -e "
const fs = require('fs');
const html = fs.readFileSync('/Users/grigorijilic/Desktop/Мой сайт /quiz-savinov/index.html', 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
new Function(script);
console.log('OK: JS syntax valid');
"
```
Expected: `OK: JS syntax valid`

Run: `grep -c "function toggleContraindication" "/Users/grigorijilic/Desktop/Мой сайт /quiz-savinov/index.html"`
Expected: `1`

- [ ] **Step 3: Визуально проверить шаг 5**

Run: `open "/Users/grigorijilic/Desktop/Мой сайт /quiz-savinov/index.html"`
Пройти квиз до шага 5 — должны появиться 3 чекбокса, кнопка «Далее» меняется на «Показать результат» и активна даже без отмеченных чекбоксов (не блокирует прохождение).

- [ ] **Step 4: Commit**

```bash
cd "/Users/grigorijilic/Desktop/Мой сайт " && git add quiz-savinov/index.html && git commit -m "feat: шаг 5 - фильтр по противопоказаниям"
```

---

### Task 6: Экран персонального результата

**Files:**
- Modify: `quiz-savinov/index.html`

- [ ] **Step 1: Вставить HTML результата перед `<!-- SCREEN_ANCHOR -->`**

Заменить:
```html
<!-- SCREEN_ANCHOR -->
```
на:
```html
<section id="result" class="screen" hidden>
  <div class="container">
    <p class="eyebrow">Ваш персональный результат</p>
    <h2 id="result-title" style="font-size: clamp(28px, 4vw, 42px); margin: 16px 0 24px;"></h2>
    <ul id="result-reasons" class="result-reasons"></ul>
    <div class="card" style="padding: 24px; margin: 32px 0;">
      <p style="color: var(--ink-2);">Александр Савинов — практикующий пластический хирург клиники «Основа Силуета» в Москве. Индивидуальный план операции обсуждается на очной консультации.</p>
    </div>
    <button class="btn btn-primary" onclick="showScreen('contact-form')">Записаться на консультацию →</button>
  </div>
</section>

<!-- SCREEN_ANCHOR -->
```

- [ ] **Step 2: Вставить CSS результата перед `/* STYLE_ANCHOR */`**

Заменить:
```css
/* STYLE_ANCHOR */
```
на:
```css
.result-reasons {
  list-style: none;
  display: grid;
  gap: 12px;
}

.result-reasons li {
  padding-left: 28px;
  position: relative;
  color: var(--ink-2);
}

.result-reasons li::before {
  content: '—';
  position: absolute;
  left: 0;
  color: var(--ink);
}

/* STYLE_ANCHOR */
```

- [ ] **Step 3: Вставить логику результата перед `// SCRIPT_ANCHOR`**

Заменить:
```html
// SCRIPT_ANCHOR
```
на:
```html
const RESULT_COPY = {
  blepharoplasty: (a) => ({
    title: `Блефаропластика — ${a.zone.toLowerCase()}`,
    reasons: [
      `Ваш основной запрос — «${a.concern.toLowerCase()}» — устраняется именно этой операцией`,
      'Вмешательство точечное, восстановление в среднем занимает 7–10 дней',
      `Срок «${a.timing.toLowerCase()}» позволяет доктору Савинову спланировать операцию заранее`
    ]
  }),
  rejuvenation: (a) => ({
    title: `Тотальное омоложение — ${a.zone.toLowerCase()}`,
    reasons: [
      `Цель «${a.effect.toLowerCase()}» достигается комплексным подходом к выбранной зоне`,
      'План операции строится индивидуально под анатомию лица',
      `Срок «${a.timing.toLowerCase()}» — доктор Савинов согласует даты на консультации`
    ]
  }),
  mammoplasty: (a) => ({
    title: `Маммопластика — ${a.result.toLowerCase()}`,
    reasons: [
      `Текущий размер «${a.size.toLowerCase()}» учитывается при подборе импланта и техники`,
      `Результат «${a.result.toLowerCase()}» — одно из основных направлений практики доктора Савинова`,
      `Срок «${a.timing.toLowerCase()}» позволяет спланировать операцию и период восстановления`
    ]
  })
};

function showResult() {
  const copy = RESULT_COPY[state.procedure](state.answers);
  document.getElementById('result-title').textContent = copy.title;
  document.getElementById('result-reasons').innerHTML = copy.reasons.map(r => `<li>${r}</li>`).join('');
  showScreen('result');
}

// SCRIPT_ANCHOR
```

- [ ] **Step 4: Проверить синтаксис JS**

Run:
```bash
node -e "
const fs = require('fs');
const html = fs.readFileSync('/Users/grigorijilic/Desktop/Мой сайт /quiz-savinov/index.html', 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
new Function(script);
console.log('OK: JS syntax valid');
"
```
Expected: `OK: JS syntax valid`

- [ ] **Step 5: Визуально проверить результат по всем трём веткам**

Run: `open "/Users/grigorijilic/Desktop/Мой сайт /quiz-savinov/index.html"`
Пройти квиз полностью для каждой из 3 процедур (перезагружая страницу между прогонами) — экран результата должен показывать заголовок с процедурой и 3 буллета, текст которых меняется в зависимости от выбранных ответов.

- [ ] **Step 6: Commit**

```bash
cd "/Users/grigorijilic/Desktop/Мой сайт " && git add quiz-savinov/index.html && git commit -m "feat: экран персонального результата квиза"
```

---

### Task 7: Форма контактов с success-состоянием

**Files:**
- Modify: `quiz-savinov/index.html`

- [ ] **Step 1: Вставить HTML формы перед `<!-- SCREEN_ANCHOR -->`**

Заменить:
```html
<!-- SCREEN_ANCHOR -->
```
на:
```html
<section id="contact-form" class="screen" hidden>
  <div class="container">
    <div id="form-step">
      <p class="eyebrow">Последний шаг</p>
      <h2 style="font-size: clamp(28px, 4vw, 42px); margin: 16px 0 24px;">Оставьте контакты — подтвердим удобное время консультации</h2>
      <form id="lead-form" onsubmit="submitForm(event)">
        <div class="form-group">
          <label for="lead-name">Имя</label>
          <input type="text" id="lead-name" name="name" required>
        </div>
        <div class="form-group">
          <label for="lead-phone">Телефон</label>
          <input type="tel" id="lead-phone" name="phone" required>
        </div>
        <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 8px;">Записаться на консультацию</button>
      </form>
    </div>
    <div id="form-success" hidden>
      <h2 style="font-size: clamp(28px, 4vw, 42px); margin-bottom: 16px;">Заявка принята</h2>
      <p style="color: var(--ink-2);">Свяжемся с вами в ближайшее время, чтобы согласовать консультацию с доктором Савиновым.</p>
    </div>
  </div>
</section>

<!-- SCREEN_ANCHOR -->
```

- [ ] **Step 2: Вставить CSS формы перед `/* STYLE_ANCHOR */`**

Заменить:
```css
/* STYLE_ANCHOR */
```
на:
```css
.form-group { margin-bottom: 20px; }

.form-group label {
  display: block;
  font-size: 13px;
  color: var(--ink-2);
  margin-bottom: 8px;
}

.form-group input {
  width: 100%;
  padding: 16px 20px;
  border-radius: var(--radius);
  border: 1px solid var(--line);
  background: var(--card);
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  color: var(--ink);
}

.form-group input:focus {
  outline: none;
  border-color: var(--ink);
}

/* STYLE_ANCHOR */
```

- [ ] **Step 3: Вставить обработчик отправки перед `// SCRIPT_ANCHOR`**

Заменить:
```html
// SCRIPT_ANCHOR
```
на:
```html
function submitForm(event) {
  event.preventDefault();
  const data = {
    name: document.getElementById('lead-name').value,
    phone: document.getElementById('lead-phone').value,
    procedure: PROCEDURES[state.procedure].label,
    answers: state.answers,
    contraindications: state.contraindications
  };
  console.log('Заявка с квиза:', data);
  document.getElementById('form-step').hidden = true;
  document.getElementById('form-success').hidden = false;
}

// SCRIPT_ANCHOR
```

- [ ] **Step 4: Проверить синтаксис JS**

Run:
```bash
node -e "
const fs = require('fs');
const html = fs.readFileSync('/Users/grigorijilic/Desktop/Мой сайт /quiz-savinov/index.html', 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
new Function(script);
console.log('OK: JS syntax valid');
"
```
Expected: `OK: JS syntax valid`

Run: `grep -c "alert(" "/Users/grigorijilic/Desktop/Мой сайт /quiz-savinov/index.html"`
Expected: `0` (правило проекта — без `alert()`)

- [ ] **Step 5: Визуально проверить форму**

Run: `open "/Users/grigorijilic/Desktop/Мой сайт /quiz-savinov/index.html"`
Пройти квиз до конца, на экране результата нажать «Записаться на консультацию», заполнить имя и телефон, отправить — форма должна скрыться, показаться блок «Заявка принята» без всплывающих alert. В консоли браузера должен появиться `console.log` с данными заявки.

- [ ] **Step 6: Commit**

```bash
cd "/Users/grigorijilic/Desktop/Мой сайт " && git add quiz-savinov/index.html && git commit -m "feat: форма контактов с success-состоянием"
```

---

### Task 8: Адаптивность, финальная полировка, удаление якорей

**Files:**
- Modify: `quiz-savinov/index.html`

- [ ] **Step 1: Добавить мобильную адаптивность и убрать CSS-якорь**

Заменить:
```css
/* STYLE_ANCHOR */
```
на:
```css
@media (max-width: 640px) {
  .screen { padding: 40px 20px; }
  .procedure-card { padding: 20px; }
  .quiz-nav { flex-direction: column-reverse; gap: 12px; }
  .quiz-nav .btn { width: 100%; }
}
```

- [ ] **Step 2: Убрать HTML-якорь**

Заменить:
```html
<!-- SCREEN_ANCHOR -->
```
на (пусто — удалить строку целиком, ничего не оставляя между секцией формы и `<script>`).

- [ ] **Step 3: Убрать JS-якорь**

Заменить:
```html
// SCRIPT_ANCHOR
```
на (пусто — удалить строку).

- [ ] **Step 4: Проверить, что якорей не осталось**

Run: `grep -c "STYLE_ANCHOR\|SCREEN_ANCHOR\|SCRIPT_ANCHOR" "/Users/grigorijilic/Desktop/Мой сайт /quiz-savinov/index.html"`
Expected: `0`

- [ ] **Step 5: Проверить синтаксис JS в финальном файле**

Run:
```bash
node -e "
const fs = require('fs');
const html = fs.readFileSync('/Users/grigorijilic/Desktop/Мой сайт /quiz-savinov/index.html', 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
new Function(script);
console.log('OK: JS syntax valid');
"
```
Expected: `OK: JS syntax valid`

- [ ] **Step 6: Полный визуальный прогон (desktop + mobile)**

Run: `open "/Users/grigorijilic/Desktop/Мой сайт /quiz-savinov/index.html"`

Чеклист:
- [ ] Обложка: имя хирурга, клиника, город, CTA — рендерятся, шрифты Fraunces/Inter/IBM Plex Mono загружены (Network tab, без fallback на системный шрифт)
- [ ] Пройти ветку «Блефаропластика» полностью до формы — все 5 шагов, результат, форма, success-состояние
- [ ] Пройти ветку «Тотальное омоложение» полностью
- [ ] Пройти ветку «Маммопластика» полностью
- [ ] Кнопка «Назад» работает на каждом шаге, не сбрасывает предыдущие ответы
- [ ] Кнопка «Далее» задизейблена, пока не выбран ответ (кроме шага 5, где это опционально)
- [ ] Открыть DevTools → Toggle device toolbar → iPhone SE (375px) — карточки процедур и кнопки навигации адаптируются в колонку, ничего не обрезается по горизонтали
- [ ] Нет ни одного `alert()` при отправке формы
- [ ] В консоли браузера нет ошибок JS на всём протяжении прохождения

- [ ] **Step 7: Commit**

```bash
cd "/Users/grigorijilic/Desktop/Мой сайт " && git add quiz-savinov/index.html && git commit -m "chore: адаптивность и финальная полировка лендинга-квиза"
```

---

## Self-Review

**Spec coverage:**
- Стек (один файл, ноль зависимостей, отдельная папка) — Task 1 ✓
- Палитра без цветного акцента — Task 1 (`:root` переменные) ✓
- Шрифты Fraunces/Inter/IBM Plex Mono — Task 1 (`<link>` + CSS) ✓
- Анимации только `.2s` transition — Task 1/2 (`.btn`, `.option-btn`, `.procedure-card`) ✓
- Экран-обложка — Task 1 ✓
- Квиз 5 шагов с прогресс-баром — Task 2, 3 ✓
- Ветвление по процедуре (шаги 2–4) — Task 4 ✓
- Шаг 5 — фильтр противопоказаний, не блокирует — Task 5 ✓
- Экран персонального результата — Task 6 ✓
- Форма контактов (имя + телефон), без `alert()`, success-состояние в UI, заглушка отправки (`console.log`) — Task 7 ✓
- Реальные данные клиента (имя, клиника, услуги, телефон — телефон используется как контекст, не выводится отдельно на этом этапе, т.к. форма собирает контакт клиента, а не хирурга — это соответствует цели «запись на консультацию») — Task 1 (обложка), Task 6 (карточка о докторе) ✓
- Мобильная адаптивность — Task 8 ✓

**Placeholder scan:** нет `TBD`/`TODO`, весь код каждой задачи — финальный рабочий код, а не описание.

**Type consistency:** имена функций (`showScreen`, `renderStep`, `selectProcedure`, `selectAnswer`, `toggleContraindication`, `goNext`, `goBack`, `updateProgress`, `showResult`, `submitForm`) и структур данных (`state`, `PROCEDURES`, `CONTRAINDICATIONS`, `RESULT_COPY`, `TOTAL_STEPS`) объявляются один раз в Task 3/4/5/6/7 и используются одинаково во всех последующих задачах — сверено построчно при написании плана.
