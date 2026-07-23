# CLAUDE.md — UniPrint · ERP & Client System (типография + наружная реклама)

> **Living-doc.** Бриф проекта UniPrint для Claude Code. Правим сразу при
> изменении стека / структуры / процесса / scope. История изменений —
> в **`Docs/log.md`** (devlog). Stale-CLAUDE.md хуже его отсутствия.

## Проект

**UniPrint** — единая цифровая платформа управления типографией и
производством наружной рекламы. Объединяет **6 контуров**: продажи (CRM),
производство (цех + офис-полиграфия + продажа товара), склад с
антидублированием материалов, финансы (себестоимость / ЗП / баланс /
амортизация / налоги / логистика), HR (KPI / сдельная оплата /
Face Control), клиентский кабинет.

**Тип:** greenfield (без legacy-кодовой базы).
**Контекст (допущение):** РФ-юрисдикция (по терминологии ТЗ — рубли,
ИП/ООО, СНО). Финал — после ответа клиента 🔴 #1.
**Каналы:** PWA mobile-first (производство, склад) + Web Panel
(клиентский кабинет, менеджеры, дизайнеры, админ, учредитель).
**Нотификации:** WebPush + SMS + Email через `apps/notifications`.
**Telegram в продукте НЕ используется** (🔴 Q7 закрыт 2026-05-05) —
только PM-канал команда↔владелец, не часть продукта.

**Источник правды по требованиям:**
- `Docs/tz-po-uniprint.md` — основной ТЗ (10 разделов, 25 модулей)
- `Docs/tz-dop-modules.md` — дополнение (модули 6.23–6.25, расчёты 7.16–7.18)

**Спецификация продукта:** `Docs/00-summary.md` → детально в `Docs/01-…10-…`.
**Журнал работы:** `Docs/log.md`.

> **Соглашение по папке:** в репозитории одна папка `Docs/` (с заглавной — Windows case-insensitive, в git зафиксировано так). Внутри: исходные ТЗ заказчика (`tz-*.md` + оригинальные .docx) **и** наша спека / онбординг / ADR / PRD / sprints / runbook / kp.

## Стек

> **Phase-0:** ответы клиента закрыты на 14/20 (см. memory
> `project_owner_answers_2026-05-05`). Открыто 5 🔴 (Q1 юрисдикция,
> Q2 Face Control vendor, Q3 хостинг, Q4 миграция, Q5 эквайринг) +
> 1 отложено (Q19 Sentry). Прототип строится на закреплённых
> допущениях; prod-ADR закрываются ответами Q1-Q5.

| Слой | Phase-0 (прототип на моках) | Prod |
| --- | --- | --- |
| Frontend (web) | Next.js 16 App Router + React 19 + TS + Tailwind + shadcn/ui | то же |
| Mobile (сотрудники) | **PWA mobile-first** (Next.js + Service Worker + manifest) | **PWA** (Q6 закрыт). Native — фаза 3+ при появлении нужды. |
| Backend | mock через **MSW** в прототипе | Django + DRF или Node (NestJS/Express) — ADR-0004 (выбор по команде/нагрузке) |
| БД | — (моки) | PostgreSQL 15+ |
| Кеш / WS | — | Redis 7 |
| Каналы нотификаций | мок UI | **SMS + Email + WebPush** через `apps/notifications` с провайдер-абстракцией. **Telegram НЕ используется в продукте** (Q7 закрыт). |
| Telegram (PM) | — | **Только** для PM-канала команда↔владелец (Q20: Telegram быстрые + Email формальные). НЕ для продукта. |
| Face Control | мок-адаптер (фейковые события) | vendor TBD — Hikvision / Suprema / NtechLab / самописный CV — **ADR-0002 (🔴 Q2 OPEN)** |
| Эквайринг | мок UI | YooKassa / Тинькофф / Сбер / СБП + ОФД (микс B2B+B2C, Q14) — **ADR-0005 (🔴 Q5 OPEN)** |
| Карты (логистика) | моки | **Yandex Maps** (Q10 закрыт) |
| S3 для макетов | моки | **Yandex Object Storage** (Q11 закрыт; регион зависит от Q3 хостинг) |
| Хостинг прототипа | **Vercel preview** (Q18 закрыт) | TBD — **ADR-0003 (🔴 Q3 OPEN)** (если РФ — Yandex.Cloud / Selectel / VK Cloud / on-prem по 152-ФЗ ст. 18 ч. 5) |
| Документооборот | мок PDF | **Простая генерация PDF** (счёт/договор/акт/ТТН) + S3 + audit-log (Q13 закрыт). ЭДО — фаза 2+ |
| Мониторинг | — | Sentry + Grafana (Q19 отложено, по умолчанию фаза 1.5+) |
| Tracker задач | — | **GitHub Issues** + `gh` CLI (Q16 закрыт) |
| Спринт-каденция | — | **2 недели** (Q17 закрыт) |

## Жёсткие правила

### ⚠️ Always-on (никогда не пропускаем)

**A. Context7 перед любой работой с библиотекой / фреймворком / CLI.**
Прежде чем писать код, читать чужой код или объяснять API сторонней
технологии (Next.js, React, Tailwind, shadcn/ui, MSW, Anthropic SDK,
Django/DRF, Telegram Bot API, YooKassa SDK и т.д.):

```
1. mcp__plugin_context7_context7__resolve-library-id  → получить ID
2. mcp__plugin_context7_context7__query-docs          → получить актуальные доки
3. только после этого — писать / отвечать
```

Действует, **даже если кажется, что знаешь ответ** (training data
отстаёт). Исключения — рефакторинг внутреннего кода, бизнес-логика,
общие концепции (DI, паттерны, SOLID).

**B. Обновление документации после фичи / спринта.** Любая фича
завершена только после обновления **всех** релевантных документов.
Это часть Definition of Done.

**C. Полный тест-пайплайн после каждого спринта.** Спринт не считается
закрытым, пока не пройден **полный** test pass на актуальном HEAD ветки:

```bash
# В корне prototype/ (или другого workspace):
pnpm typecheck      # все packages + apps — должно быть PASS
pnpm lint           # biome — без errors
pnpm build          # все apps собираются — PASS
pnpm test           # unit-тесты, если есть — PASS
pnpm test:e2e       # Playwright golden-path + extended smoke — PASS
```

Результаты (числа passed/total + время) фиксируются в
`Docs/sprints/<NN>/retro.md` § «Test results» **и** в
`Docs/log.md` записью по дате. Если хоть один шаг ❌ — спринт не
закрывается, баги фиксируются в первый день следующего спринта или
эскалируются в hotfix-ветку.

**A1. Design System — обязательный источник правды для UI.**

Перед любой работой с UI (новый экран / новый компонент / редизайн / стилизация):

1. Прочитай `Docs/DESIGN_SYSTEM.md` — токены, типографика, компоненты, layout-правила
2. Прочитай `Docs/AGENT_BRIEF.md` § «Жёсткие запреты» — что нельзя никогда
3. Используй компоненты из `packages/ui/` — **не создавай локальные** в `apps/*/`
4. Используй токены из `packages/tokens/` — **не хардкоди** `#XXXXXX`, `rgb(...)`, `font-family: ...`

**Жёсткие запреты UI** (нарушение → PR отбрасывается на ревью):

- ❌ Хардкод цветов (`style={{color: '#D9531E'}}`, `bg-orange-500`) → ✅ только токены (`text-brand`, `bg-brand-soft`)
- ❌ Хардкод шрифтов (`fontFamily: 'Roboto'`, `font-mono` со своим шрифтом) → ✅ `font-display` (Fraunces) / `font-sans` (Manrope) / `font-mono` (JetBrains Mono)
- ❌ Локальные `<div className="rounded-full bg-green-100 px-2 py-1">` → ✅ `<StatusPill status="done">` из `@uniprint/ui`
- ❌ Иконки из `react-icons` / `heroicons` / SVG-инлайн → ✅ только `lucide-react`
- ❌ Удаление `<ProtoTag>` бейджа без отдельного PR с чек-листом перехода в production
- ❌ Telegram-иконка / упоминание / канал в любом месте UI
- ❌ Sidebar в `production-mobile` или `warehouse-mobile` (это PWA mobile-first, не desktop)
- ❌ Touch-target < 44pt в PWA-кабинетах
- ❌ Magic numbers в padding/margin вне Tailwind-шкалы (`p-[17px]`, `mt-[23px]`)
- ❌ `style={{...}}` инлайн-стили в компонентах (только через `variant` / `className` с токенами)

**Layout-правила по кабинетам** (детально — `Docs/DESIGN_SYSTEM.md` § 6):

| Кабинет | Тип | Базовый viewport | Главные действия |
| --- | --- | --- | --- |
| `client-portal` | Web desktop | 1280–1440px | `<Button variant="primary">` |
| `manager-web` | Web desktop | 1280–1440px | `<Button>` + Kanban |
| `production-mobile` | **PWA mobile-first** | 380px | `<BigButton>` 56px высотой |
| `warehouse-mobile` | **PWA mobile-first** | 380px | `<BigButton>` 56px высотой |
| `admin-panel` | Web desktop | 1280–1440px | `<Button>` + tile-grid |
| `owner-dashboard` | Web desktop | 1280–1440px | KPI + drill-down |

**Бизнес-правила в UI** (BR-XX из `BUSINESS_RULES.md` обязательно
отображаются на экране, где они enforce'атся бэком):

- BR-01 → callout перед формой списания (warehouse-mobile)
- BR-02 → антидубль баннер при вводе телефона (manager-web)
- BR-03 → callout «брак фиксирует только складщик» (production-mobile)
- BR-04 → услуга только select из справочника (manager-web, client-portal)
- BR-05 → текст «минимум выплачен, долг ... ₽» (production-mobile, экран Заработок)
- BR-06 → события Face Control read-only, корректировка через workflow с журналом
- BR-07 → тип заказа лейблом, mono-шрифт, обязательный фасет в фильтрах

Полный список Design-System правил, токенов и компонентов — `Docs/DESIGN_SYSTEM.md`.
Алгоритм выполнения UI-задачи — `Docs/AGENT_BRIEF.md`.

> Это правило заложено по фидбеку владельца от 2026-05-05.
> Применяется ко всем будущим спринтам начиная с sprint-1. Для уже
> закрытого Phase-0 (прототип на моках) — pass зафиксирован в
> `Docs/log.md` 2026-05-05.

| Триггер | Что обновить |
| --- | --- |
| **Любой коммит / фича** | **`Docs/log.md`** — запись по дате (короткая, 1–3 строки + хеш) |
| Сменился спринт / Phase / появилась веха | `CLAUDE.md` § «Текущий статус» (3–5 последних вех + спринт-цель) |
| Архитектурное решение | новый ADR `Docs/adr/NNNN-<slug>.md` |
| Релизный фрагмент | `CHANGELOG.md` (Keep a Changelog) |
| PRD-фича Done | `Docs/prd/<feature>.md` статус → Done |
| Сменился стек / структура / scope | `CLAUDE.md` § «Стек» / «Структура репо», `Docs/06-estimate.md`, `Docs/07-roadmap.md`, README |
| Compliance-картина | `Docs/09-compliance.md` |
| Новый ENV-vars / секрет | `CLAUDE.md` § «Внешние сервисы», `.env.example` |
| Новое бизнес-правило (BR-XXX) | `BUSINESS_RULES.md`, релевантные `Docs/04-modules.md` |
| Новый компонент в `packages/ui/` | `Docs/DESIGN_SYSTEM.md` § 5 «Компоненты», Storybook-стори |
| Новый дизайн-токен (цвет / шрифт / spacing) | `packages/tokens/`, `Docs/DESIGN_SYSTEM.md` § 2-4 |
| Новый user-level скилл / агент / MCP | `CLAUDE.md` § «Реестр инструментов», `Docs/team-structure.md` |
| Конец спринта / Phase | `Docs/sprints/<NN>/retro.md`, `Docs/07-roadmap.md` (Phase → closed), `CLAUDE.md` § «Текущий статус» |

Скилл-помощник — `claude-md-management:claude-md-improver` (раз в спринт).
Коммит документации — `commit-commands:commit` с префиксом `docs:`.

### 1. Doc-first

Изменение скоупа / архитектуры / compliance — сначала в `Docs/`, потом
в коде. Спека — источник правды. Бизнес-правила — `BUSINESS_RULES.md`,
ссылка из `Docs/04-modules.md`.

### 2. Superpowers — рабочий стандарт

Не «помнить» правило — вызывать скилл.

| Этап | Скилл |
| --- | --- |
| Сценарий / дизайн (creative) | `superpowers:brainstorming` |
| План multi-step (3+ шага) | `superpowers:writing-plans` |
| Исполнение плана | `superpowers:executing-plans` |
| Делегирование в текущей сессии | `superpowers:subagent-driven-development` |
| TDD (production-код) | `superpowers:test-driven-development` |
| Баги / unexpected behavior | `superpowers:systematic-debugging` |
| Параллельные треки | `superpowers:dispatching-parallel-agents` |
| Длинная фича — изоляция | `superpowers:using-git-worktrees` |
| Self-review перед PR | `superpowers:requesting-code-review` |
| Принять чужой review | `superpowers:receiving-code-review` |
| Эвиденс перед claim | `superpowers:verification-before-completion` |
| Завершение ветки | `superpowers:finishing-a-development-branch` |
| Создание скилла (3+ повтор) | `superpowers:writing-skills` / `skill-creator:skill-creator` |

### 3. Делегирование (агенты + model-routing)

Маппинг ролей → агентов в **`Docs/team-structure.md`**. Не делай всё в
основной сессии: делегируй профильному `cs-*` агенту.

**Model-routing — обязательно при каждом `Agent` tool call:**

| Тип задачи | Модель | `model:` |
| --- | --- | --- |
| Планирование, архитектура, управление, дизайн, research, brainstorming, ADR, спеки, UX, маркетинг-стратегия, compliance, DevOps, BPMN | **Opus 4.7** | `"opus"` |
| Написание кода (компоненты, страницы, hooks, тесты, миграции, mock-handlers, рефакторинг) | **Sonnet 4.6** | `"sonnet"` |

Правило большого пальца: **«думает → Opus, печатает по принятому
решению → Sonnet»**. В `Agent` tool параметр `model:` указывается
явно — иначе агент унаследует модель родителя.

Граничные кейсы: code review → `sonnet`, спека / PRD → `opus`,
скаффолдинг прототипа → `sonnet`, бизнес-проблема → спека → `opus`.

**Топ-15 агентов** (полный список — `Docs/team-structure.md`):
`cs-product-strategist|manager|project-manager` (opus),
`cs-senior-engineer|engineering-lead` (opus),
`cs-ux-researcher|content-creator|quality-regulatory|financial-analyst` (opus),
`feature-dev:code-architect|code-explorer` (opus), `Plan` (opus),
`feature-dev:code-reviewer|cs-karpathy-reviewer|code-simplifier|Explore` (sonnet),
`general-purpose` — opus для research, sonnet для имплементации.

### 4. Внешние системы (MCP)

| MCP | Использование |
| --- | --- |
| `mcp__plugin_context7_context7__*` | Документация (правило A) |
| `mcp__plugin_playwright_playwright__*` | Browser smoke / golden-path / screenshots |
| `mcp__ide__getDiagnostics` / `executeCode` | TS / Python diagnostics |
| `mcp__plugin_vercel_vercel__*` | Прототип-деплой на Vercel preview |

### 5. SDLC и качество

- **Conventional Commits**: `feat: / fix: / docs: / chore: / refactor:
  / test: / perf: / build: / ci:`. Ветка `feature/<slug>` + PR. Squash-merge.
  Скиллы — `commit-commands:commit` / `commit-push-pr` / `clean_gone`.
- **Agile-итерации.** Phase'ы (`Docs/07-roadmap.md`) с явной целью и
  DoD. Расширение скоупа — обновить `Docs/06-estimate.md` и согласовать
  с владельцем.
- **TDD для production-кода.** Failing → green → refactor
  (`superpowers:test-driven-development`). Прототипный UI на моках —
  минимум smoke (`mcp__plugin_playwright_playwright__*`) + manual walkthrough.
- **Verification before completion.** Не говорим «готово / тесты
  проходят / деплой ОК» без запуска команды и проверки вывода
  (`superpowers:verification-before-completion`).

### 6. Безопасность и контроль

- **Никаких реальных секретов в репо.** Только `.env.example`.
  Изменения в `.env*` — с явного разрешения владельца.
- **Production deploy — только по явной команде владельца.** Dev / stage
  / Vercel preview — автоматом. Force-push в main, drop таблиц,
  rollback prod, deletion бэкапов — confirm before action.
- **Risky actions — спрашиваем.** Уничтожимые / необратимые / shared-state
  изменения. Никогда не пропускать git-хуки (`--no-verify`,
  `--no-gpg-sign`) без явного разрешения.

### 7. Compliance (допущение РФ — финал после 🔴 #1)

- **Хостинг для prod — РФ-юрисдикция** (Yandex.Cloud / Selectel /
  VK Cloud / on-prem) по 152-ФЗ ст. 18 ч. 5. Запрещено для ПДн:
  AWS, GCP, Cloudflare R2, Hetzner, OVH. **Прототип на Vercel** допустим
  только потому, что в нём моки без реальных ПДн (отметить в
  `prototype/MOCK_NOTICE.txt`).
- **152-ФЗ ст. 11 — биометрия (Face Control).** Отдельное письменное
  согласие сотрудника на обработку биометрических ПДн. См.
  `Docs/09-compliance.md` + ADR-0002 (vendor + хранение шаблонов).
- **152-ФЗ baseline в фазе 1**: согласия с timestamp + хеш версии
  политики, audit-log на доступы к ПДн, endpoint удаления ПДн,
  шифрование at-rest.
- **ТК РФ для сдельной ЗП.** Расчётный лист (ст. 136), долговой баланс
  сотрудника (BR-05) — фиксируется как займ от компании, не уход в
  минус по ст. 137. См. `Docs/04-modules.md` § 6.22 и `Docs/09-compliance.md`.
- **402-ФЗ.** Хранение первичных документов (счета / акты / ТТН) — 5 лет.
- **54-ФЗ применим** (Q14 закрыт — микс B2B + B2C). Для B2C-оплат —
  онлайн-чеки через ОФД (провайдер TBD, под-блокер 🔴 Q5 эквайринг).
  Email/phone клиента в платеже обязательны для отправки чека.
- **Каналы нотификаций — БЕЗ Telegram** (Q7 закрыт). Все нотификации
  через `apps/notifications` (или эквивалент в выбранном backend-стеке)
  с провайдер-абстракцией: **WebPush → SMS → Email**. Авторизация клиента —
  SMS-код + email magic-link параллельно. Telegram-канал в продукте
  не реализуется. Telegram остаётся **только** для PM-канала команда↔
  владелец (внутреннее, не часть продукта).

### 8. Доменные скиллы (обязательны при триггере)

- `claude-api` — Anthropic SDK (обязательно prompt caching).
- `karpathy-coder` / `cs-karpathy-reviewer` — перед коммитом серьёзного кода.
- `gdpr-dsgvo-expert` — паттерны для 152-ФЗ-имплементации (биометрия,
  audit-log, endpoint удаления).
- `vercel:*` — для прототип-деплоя.

### 9. Memory

Auto-memory в `~/.claude/projects/D--Projects-Uniprint/memory/`. Сохранять:
- **user** — роль / экспертиза / предпочтения владельца.
- **feedback** — корректировки **и** подтверждения подхода.
- **project** — кто что делает / зачем / к когда (absolute dates).
- **reference** — указатели на внешние системы.

Не сохранять то, что выводимо из git / кода / package.json / Docs/tz-*.md.

## Workflow

```
1.  Эпик / Phase           → цель + DoD в Docs/superpowers/plans/ или
                              CLAUDE.md «Текущий статус»
2.  Brainstorm             → superpowers:brainstorming
3.  Plan                   → superpowers:writing-plans (задачи 2-5 минут)
4.  ⚠️ Context7 sync       → правило A для каждой библиотеки в плане
5.  Sub-tasks (optional)   → TodoWrite / GitHub issues
6.  Isolate (optional)     → superpowers:using-git-worktrees
7.  Implement (TDD)        → superpowers:test-driven-development
                              || параллельные треки →
                              superpowers:dispatching-parallel-agents
8.  Review                 → superpowers:requesting-code-review
                              + feature-dev:code-reviewer
                              + cs-karpathy-reviewer (для серьёзного кода)
9.  Verify                 → superpowers:verification-before-completion
10. Finish                 → superpowers:finishing-a-development-branch
11. Commit + PR (код)      → commit-commands:commit-push-pr
12. ⚠️ Update docs         → правило B: запись в Docs/log.md +
                              DoD-чеклист (PRD, ADR, CHANGELOG если
                              релизный, релевантные Docs/01-…10-…)
13. Commit docs            → commit-commands:commit с префиксом `docs:`
14. Close                  → закрытие issue / задачи
15. ⚠️ Конец спринта/Phase → правило C — полный тест-пайплайн
                              (typecheck/lint/build/test/test:e2e),
                              результаты в Docs/sprints/<NN>/retro.md
                              «Test results» + Docs/log.md,
                              Docs/07-roadmap.md → Phase closed,
                              CLAUDE.md «Текущий статус» суммирует
```

**Definition of Done** для любой фичи:
- [ ] **Context7 был запрошен** для каждой использованной библиотеки /
      SDK / CLI (правило **A**). N/A если без сторонних библиотек.
- [ ] Tests added (failing first → green) для production-кода.
- [ ] Lint / type-check passes.
- [ ] PII-поля учтены в audit-log (152-ФЗ).
- [ ] Биометрические данные (Face Control) — согласие зафиксировано,
      template хранится в защищённом storage (152-ФЗ ст. 11).
- [ ] Коммуникация — через `apps/notifications` (или эквивалент),
      не Telegram-direct.
- [ ] Бизнес-правила (BR-XXX) не нарушены — особенно BR-01 (списание
      материалов только на заказ) и BR-03 (брак фиксирует только складщик).
- [ ] **Документация обновлена** (правило **B**):
      - [ ] **`Docs/log.md`** — запись по дате (обязательно для каждой фичи)
      - [ ] `CLAUDE.md` § «Текущий статус» (только если сменился
            спринт / Phase / появилась веха)
      - [ ] PRD `Docs/prd/<feature>.md` помечен как Done
      - [ ] ADR `Docs/adr/NNNN-…` (если архитектурное решение)
      - [ ] `CHANGELOG.md` (если релизный фрагмент)
      - [ ] Затронутые файлы из `Docs/01-…10-…` (если изменилась спека)
- [ ] **Design System не нарушена** (правило **A1** — для UI-задач):
      - [ ] Все цвета — из `packages/tokens/` (нет `#XXXXXX` в коде)
      - [ ] Все шрифты — `font-display` / `font-sans` / `font-mono` (нет `style={{fontFamily}}`)
      - [ ] Использованы существующие компоненты из `packages/ui/`,
            новые добавлены в `packages/ui/` со Storybook-стори
      - [ ] Иконки только из `lucide-react`
      - [ ] `<ProtoTag>` на месте, синтетические данные, нет Telegram
      - [ ] Layout соответствует кабинету: desktop / PWA mobile-first
      - [ ] Если PWA: touch-targets ≥ 44pt, главные действия — `<BigButton>`
      - [ ] BR-XX, связанные с экраном, отображены в UI
      - [ ] Проверено на 1280 / 1440 / 380px (PWA — обязательно 380px)
- [ ] **Конец спринта** (правило **C** — полный тест-пайплайн):
      - [ ] `pnpm typecheck` — PASS на всех packages + apps
      - [ ] `pnpm lint` — без errors (Biome)
      - [ ] `pnpm build` — все apps собираются
      - [ ] `pnpm test` — unit, если есть
      - [ ] `pnpm test:e2e` — Playwright golden-path + extended smoke (16+ tests)
      - [ ] Числа passed/total + время вписаны в `Docs/sprints/<NN>/retro.md`
            и в `Docs/log.md`
      - [ ] `Docs/sprints/<NN>/retro.md` написан, Phase в
            `Docs/07-roadmap.md` помечена как closed (если применимо)
- [ ] Коммит документации сделан отдельно с префиксом `docs:`.

## Команды

> **Phase-0**: код ещё не материализован. Реальные команды появятся
> после старта прототипа (`prototype/`) и production-stack ADR.

```bash
# Прототип (Turborepo, Phase-0)
pnpm dev build test lint typecheck
pnpm playwright test                 # smoke на моках

# Design-system проверки (правило A1)
pnpm storybook                       # все компоненты с stories
pnpm lint:design                     # stylelint: запрет хардкода #XXXXXX
pnpm test:visual                     # Chromatic / Percy snapshots (когда настроим)

# Backend / Mobile — TBD после ADR на стек
```

## Среды

| Окружение | URL | Trigger деплоя |
| --- | --- | --- |
| local | `localhost:3001…3006` (6 apps прототипа) | `pnpm dev` |
| **preview (прототип)** | **6 публичных URL'ов на Vercel** ↓ | push в `main` (auto-deploy) |
| dev | TBD после prod-ADR | merge в `develop` |
| stage | TBD | merge в `release/*` |
| prod | TBD | **только по явной команде владельца** |

**Live прототип на Vercel** (моки активны, синтетические данные, MOCK_NOTICE):

| Кабинет | URL |
| --- | --- |
| Клиент | https://uniprint-client.vercel.app |
| Менеджер | https://uniprint-manager.vercel.app |
| Производство (PWA) | https://uniprint-production.vercel.app |
| Склад (PWA) | https://uniprint-warehouse.vercel.app |
| Админ | https://uniprint-admin.vercel.app |
| Учредитель | https://uniprint-owner.vercel.app |

Конфигурация — `Docs/runbook/vercel-deploy.md`. Caveats deploy'а в `Docs/log.md`
(2026-05-07 «Vercel deploy»).

## Архитектура

См. `Docs/03-architecture.md` (скелет с TBD до ответов 🔴). Высокоуровнево
для целевого решения:

```
client-portal (Web)        ─┐
manager-web                ─┤
production-mobile (PWA/native) ─┼→ Backend API + WS
warehouse-mobile (PWA/native)  ─┤   ├ модули: orders, leads, catalog,
admin-panel                ─┤   │   │ warehouse, defects, payroll,
owner-dashboard            ─┘   │   │ finance, logistics, equipment,
                                │   │ docflow, face-control-adapter,
                                │   │ notifications*, audit-log*
                                │   └ Background jobs (расчёт ЗП,
                                │      амортизация, генерация PDF)
                                └ NotificationProvider abstraction
                                   (Telegram / SMS / Email / WebPush)

PostgreSQL ─ Redis ─ S3 (макеты) ─ Face Control SDK adapter
            всё в РФ-юрисдикции (после 🔴 #3)
```

`*` — обязательные для compliance модули.

## Структура репо

Только не-очевидные узлы (полное дерево — `ls`):

- `Docs/` — единая папка документации (Windows case-insensitive,
  в git — `Docs/`):
  - **Исходные ТЗ заказчика** (вход): `tz-po-uniprint.md`,
    `tz-dop-modules.md` + оригинальные `.docx` как первоисточник.
  - **Наша спека** (выход): `00-summary.md` … `10-bpmn.md`, `log.md`
    (devlog), `team-structure.md`.
  - **Подпапки**: `adr/`, `prd/`, `runbook/`, `sprints/`,
    `superpowers/plans/`, `onboarding/`, `kp/` (коммерческие
    предложения).
- `prototype/` — Turborepo (Next.js 16 + React 19 + TS + Tailwind +
  shadcn/ui + MSW): `apps/{client-portal, manager-web,
  production-mobile, warehouse-mobile, admin-panel, owner-dashboard}`,
  `packages/{tokens, ui, mocks, types}`, `playwright/`. Деплой на
  Vercel preview (один проект на app или unified — решим в плане
  прототипа).
- `backend/` — TBD после ADR на backend-стек (фаза 1+).
- `mobile/` — TBD после ADR-0001 на mobile-стек (фаза 2+).
- `BUSINESS_RULES.md` — инварианты BR-XXX.
- `.claude/{settings.json,hooks/*.sh}` — project-level правила и хуки.

## State не в git

`.env*` (реальные ключи), `node_modules/`, `.venv/`, `.next/`,
`__pycache__/`, Docker volumes (когда появятся), Vercel build artifacts.

## Внешние сервисы / секреты

> **Phase-0:** реальные интеграции отсутствуют, всё мокается. Таблица —
> placeholder для prod-фазы. Открытые блокеры — 🔴 Q1-Q5.

| Сервис | ENV-vars (планируемые) | Где брать |
| --- | --- | --- |
| Face Control SDK | `FACECTRL_VENDOR`, `FACECTRL_API_KEY`, `FACECTRL_ENDPOINT` | TBD после ADR-0002 (🔴 Q2) |
| Эквайринг | `PAYMENTS_PROVIDER`, `PAYMENTS_API_KEY`, `PAYMENTS_SHOP_ID` | YooKassa / Тинькофф / Сбер — TBD после ADR-0005 (🔴 Q5) |
| СБП | `SBP_MERCHANT_ID` | при подключении B2C-оплат (Q14 ✅ — микс B2B+B2C) |
| ОФД (54-ФЗ) | `OFD_PROVIDER`, `OFD_API_KEY` | **обязателен** (Q14 ✅ — B2C есть). Платформа ОФД / Такском — TBD под-блокер Q5 |
| Карты (логистика) | `YANDEX_MAPS_API_KEY` | console.cloud.yandex.ru (Q10 ✅ Yandex Maps) |
| S3 (макеты) | `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET`, `S3_BUCKET` | **Yandex Object Storage** (Q11 ✅; регион зависит от Q3 хостинг) |
| SMS | `SMS_PROVIDER`, `SMS_API_KEY` | SMSAero / MTS Exolve — TBD |
| Email | `EMAIL_PROVIDER`, `EMAIL_API_KEY` | Unisender Go / SendGrid — TBD |
| WebPush (VAPID) | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | сгенерируется в `apps/notifications` |
| Sentry | `SENTRY_DSN` | sentry.io / yandex.cloud (Q19 отложено, ориентир — фаза 1.5+) |

> **Telegram Bot НЕ используется в продукте** (Q7 ✅). PM-канал
> (Telegram быстрые + Email формальные, Q20 ✅) — для команда↔
> владелец, не требует токенов в `apps/`.

## Бизнес-правила (BR-XXX)

Полный список — `BUSINESS_RULES.md`. Ключевые инварианты:

- **BR-01** — Материалы списываются **только на заказ** (никогда
  «в цех» абстрактно). См. `Docs/04-modules.md` § 6.11.
- **BR-02** — Антидублирование клиентов и контрагентов **по телефону**.
  См. `Docs/04-modules.md` § 6.5.
- **BR-03** — Брак фиксирует **только складщик**, не производство.
  См. `Docs/04-modules.md` § 6.12.
- **BR-04** — Производство **не создаёт услуги вручную**, только
  выбирает из справочника. См. `Docs/04-modules.md` § 6.6.
- **BR-05** — Баланс сотрудника = `выплачено − заработано`. Если
  заработано меньше минималки — компания доплачивает в долг,
  следующий период вычитает (без ухода в минус по ТК ст. 137).
  См. `Docs/04-modules.md` § 6.22.
- **BR-06** — Face Control события **не редактируются** пользователем
  (только просмотр + ручная корректировка времени смены через отдельный
  workflow с журналом). См. `Docs/04-modules.md` § 6.20.
- **BR-07** — Заказ может быть одного из 3 типов (цех / офис-полиграфия /
  продажа товара) — статус-машины разные. См. `Docs/04-modules.md` § 6.6.

## Compliance — pre-pilot чеклист

См. `Docs/09-compliance.md` (скелет до ответа 🔴 #1). Перед запуском
пилота (предварительно для РФ):

- [ ] Юрисдикция и хостинг подтверждены (🔴 #1, #3).
- [ ] **Уведомление РКН** подано клиентом (Госуслуги).
- [ ] Политика обработки ПДн опубликована.
- [ ] Согласия фиксируются с timestamp и хешем версии.
- [ ] **Отдельное согласие на биометрию** (Face Control) для каждого
      сотрудника (152-ФЗ ст. 11).
- [ ] Audit-log активен на доступы к ПДн.
- [ ] Endpoint удаления ПДн работает.
- [ ] Расчётный лист сотрудника генерируется (ТК ст. 136).
- [ ] SMS буквенный sender зарегистрирован (если SMS-канал).
- [ ] ОФД-провайдер подключён (если 54-ФЗ B2C-оплаты).

## Реестр инструментов

**Скиллы / агенты / MCP** — см. правила 2–4 выше + `Docs/team-structure.md`
(полный маппинг ролей и моделей).

**Hooks** (`.claude/settings.json` + `.claude/hooks/*.sh`):

| Событие | Скрипт | Эффект |
| --- | --- | --- |
| `SessionStart` | TBD `session-start.sh` | Памятка про правила A/B в начале сессии |
| `UserPromptSubmit` | TBD `context7-reminder.sh` | Триггер на имена библиотек / глаголы «реализуй / интегрируй» — one-line напоминание про Context7 |
| `Stop` | TBD `docs-sync-check.sh` | Проверяет git-diff: код изменён → `Docs/` / `CLAUDE.md` / `CHANGELOG.md` тронуты? Иначе варнинг |

Хуки добавляем по мере прихода к коду (фаза 1+). Глобальные хуки
управления — через скилл `update-config`.

**Memory** — `~/.claude/projects/D--Projects-Uniprint/memory/` (auto-memory).

**Cross-project knowledge accumulator** (с 2026-05-08):
`SigmeD/claude-md-templates` (private, локально `D:\Projects\claude-md-templates`)
— общая база знаний команды для антихрупкого аккумулирования lessons-learned.
UniPrint — основной источник lessons для шаблона: §3.7 Vercel deploy + §3.8
monorepo recipe + §8.2 UI anti-patterns + §8.3 deploy anti-patterns (все из
шаблона v5+v6, истоки — инциденты UniPrint 2026-05-06/07). Триггер
«Обнови документацию» из `~/.claude/CLAUDE.md` (Ветка A шаг 2) проверяет
promotion-кандидатов из текущей сессии.

## Текущий статус (2026-05-08)

**Фаза:** Phase-0 (discovery / спецификация / прототип на моках) **закрыта**.
**Веха:** **КП клиенту собран** (7 файлов в `Docs/kp/` + Notion sync).
Ждём ответов на 5 ключевых вопросов до 29 мая 2026 для старта Stage A.

### Последние вехи

- **2026-05-08** — **📋 КП для клиента собран** (`feature/prototype`).
  7 файлов в `Docs/kp/` (1644 строки): README + executive-summary +
  scope-mvp + roadmap + pricing + risks + appendix. Phased-стратегия:
  Stage A 7-9 млн (4 кабинета, ~4 мес) → Stage B 2-3 млн (+портал
  +owner +auto-doc) → Phase 2 4-5 млн T&M (Face Control + payroll +
  finance) → Phase 3 1.5-2 млн T&M. **Total ownership 15-19 млн ₽** за
  ~9-10 мес. Старт Stage A — 1 июня 2026. График платежей: 8 траншей
  (15+10+15+15+20+10+10+5 = 100%) привязаны к 7 milestones. Делегирование
  через `cs-engineering-lead` + `cs-project-manager` (opus). Spec в
  `Docs/superpowers/specs/2026-05-08-kp-design.md` с outputs агентов
  как Appendix А/Б. Все 7 страниц синхронизированы в
  [Notion](https://www.notion.so/UniPrint-358159174b918033a90adbfb7a949617).
  Подробности — `Docs/log.md` 2026-05-08.

- **2026-05-07** — **🚀 6 кабинетов в проде на Vercel** (`main`). Все 6
  Next.js apps задеплоены как отдельные Vercel projects с auto-deploy на
  push в `main`. Конфигурация — `vercel.json` per app с workspace
  install/build pattern (`cd ../.. && pnpm install`). Host-based ROLES
  resolver (`getRoles(host)` через `await headers()` в layouts) даёт
  правильные cross-cabinet ссылки на проде. Live URL'ы: см. § Среды.
  Все 6 verified 200 OK + sub-routes + MSW моки активны. Подробности и
  caveats deploy'а — `Docs/log.md` (запись «Vercel deploy»).

- **2026-05-07** — **Crumbs upgrade** + **S0-S7 cosmetic follow-ups**
  (`feature/prototype`). Динамические хлебные крошки через `AutoCrumbs`
  client wrapper + `getRoles(host)` per cabinet, 18 routes mapped.
  Cosmetic fixes: drill-down hrefs на owner-dashboard (+ stub'ы для
  /profit и /defects), admin home sort by lastLoginAt (top-5: Мария /
  Алексей / Дмитрий / Сергей / Виктор), manager-web display-only client
  override для UNI-00002..00006 в таблице. Button получил `href` prop.
  Commits `83e84a8` (cosmetic + crumbs), `94f4259` (chore cleanup).

- **2026-05-07** — **By-cabinet roadmap S0-S7 closed** (`feature/prototype`).
  Все 6 кабинетов прошли S0-style polish с RoleSwitcher + topbar slots
  (Crumbs / Search / IconButton Bell) + RoleTag + reference-точное содержание
  per `Docs/design/references/*.png`:
  - **S0** — 5 components (RoleTag, Crumbs, SearchInput, IconButton, Tabs) +
    ROLES config + AppShell topbar slots (`f7669a5`)
  - **S1** client-portal `00e4de4` · **S2** manager-web `1fee0d8` ·
    **S3** production-mobile `940be57` · **S4** warehouse-mobile `247610e` ·
    **S5** admin-panel `56602ed` · **S6** owner-dashboard `454216c`
  - **Bonus fixes** между спринтами: Button text readability + global
    OrderStatusBadge color (`4413298`); PwaTabBar глобальный bottom-nav на
    sub-страницах PWA (`b691619`); ComingSoon + 4 stubs + 6 not-found
    pages (`a794a4b`)
  - **S7 hardening** (`75a7b4a`): KpiCard trendIsGood semantics fix (3
    инцидента resolved), RoleTag tone унификация (все coral), PhoneFrame
    status bar hide on mobile, lastLoginAt field + formatLastLogin helper,
    a11y фикс на overflow-x-auto regions per WCAG 2.1.1, e2e адаптация
    селекторов под новую структуру.
  - **Pipeline (Rule C, последний прогон 2026-05-07):** typecheck 10/10
    (3.5s), lint 10/10 0 warnings (0.5s), unit 9/9, build 6/6 (13.9s),
    **e2e 44/44 PASS** (15.1s).
  - Подробнее — `Docs/log.md`, `Docs/design/specs/*-diff-v[2-6].md`.

- **2026-05-06** — **Redesign 2026-05-06** (`feature/prototype`). Полный
  визуальный пересмотр под новую дизайн-концепцию (warm cream + coral + Fraunces
  + dark sidebar + PWA phone-frame). 9 новых компонентов, рефакторинг 12
  существующих, переписаны все 6 кабинетов. Анимации: page-fade, BarRow
  fill-on-view, card hover-lift, count-up KPI, status pulse. Pipeline (Rule C):
  typecheck 10/10, lint 10/10, build 6/6, unit 9/9, e2e **44/44** PASS in 24.8s.
  Дизайн утверждён владельцем. Подробнее — `Docs/log.md`.
- **2026-05-05** — **Design system overhaul Phase 1+2+3** (`feature/prototype`).
  12 компонентов (warm cream + coral + Manrope), AppShell во всех 6 кабинетах,
  15+ эмодзи → lucide icons. Исправлены 2 бага Phase 2 (двойной disabled-placeholder
  в warehouse-mobile Select). Pipeline (Rule C): typecheck 10/10, lint 10/10,
  build 6/6, unit 9/9, e2e **44/44** PASS in 13.4s. Подробнее — `Docs/log.md`.
- **2026-05-05** — **Прототип готов** (`feature/prototype`, 17 задач за один день).
  Turborepo + Next.js 16 + 6 кабинетов на моках MSW. 16/16 Playwright smoke
  pass. BR-01/02/03/09/21/31 enforced в handlers и UI. Pipeline:
  10 packages typecheck PASS, 6 apps build PASS. Готово к manual Vercel
  deploy владельцем (плюс merge в `main`).
- **2026-05-05** — Spec pack: `Docs/00-summary.md` … `10-bpmn.md`,
  `BUSINESS_RULES.md` (36 BR), скелеты `03/05/09`. ~9700 строк документации
  через делегирование cs-product-strategist + cs-product-manager +
  cs-senior-engineer (opus). Plan `Docs/superpowers/plans/prototype.md`
  + execution через subagent-driven-development.
- **2026-05-05** — Owner answers (14/20 закрыто): Mobile=PWA,
  Telegram out of product, Yandex Maps + Yandex Object Storage,
  GitHub Issues, 2-нед спринты, Vercel preview, документооборот = PDF,
  один цех/склад MVP, справочник с нуля + R3, чеки B2B+B2C → ОФД.
  Memory: `project_owner_answers_2026-05-05`.
- **2026-05-05** — Bootstrap документации: `CLAUDE.md`,
  `Docs/team-structure.md` (18 ролей + R3 полиграфический консультант),
  `Docs/onboarding/owner-questions.md` (20 Q с шаблоном ответов).
- **2026-05-04** — `git init`, remote `github.com/SigmeD/uniprint.git`,
  `Docs/tz-*.md` сконвертированы из исходных .docx
  (`9d0aae2 docs: convert ТЗ to markdown`).

**Полная история — `Docs/log.md`**.

### Не сделано / следующее

**Пауза взята 2026-05-07** на текущем месте — продолжить можно с любого пункта:

**S8 Closure** (последний спринт by-cabinet roadmap'а, ~1-2ч):
- [ ] Финальный summary-документ + retro
- [ ] `Docs/07-roadmap.md` — пометить Phase 1+2 как closed
- [ ] CHANGELOG.md обновить (если применимо)

**Backlog для будущих спринтов** (накоплено за S1-S7):
- [ ] PWA sub-screens — 4 экрана: production «Смена» / «Заработок» / «История»,
      warehouse «Остатки». Сейчас stub'ы через `<ComingSoon>`. См. memory
      `project_pwa_tabs_dead.md`. Связать с PRD модулей 6.20 (Face Control)
      и 6.22 (ЗП/баланс BR-05).
- [ ] owner-dashboard /profit и /defects — сейчас `<ComingSoon>` stub'ы
      (S0-S7 cosmetic 2026-05-07 закрыл hrefs кнопок). Полные экраны после PRD
      модулей детализации маржи и журнала брака.
- [x] drill-down hrefs для buttons на owner-dashboard (закрыто 2026-05-07)
- [x] Admin table rows order vs reference (закрыто 2026-05-07: sort by lastLoginAt)
- [x] Fixture cli distribution для UNI-00002..00006 (закрыто 2026-05-07: display override в manager-web)

**Compliance / архитектура (после ответов 🔴 Q1-Q5):**
- [ ] Manual Vercel deploy 6 кабинетов владельцем (см. `prototype/README.md`)
- [ ] ADR-0001 (Mobile=PWA — закрыт ответом Q6, оформить документ)
- [ ] ADR-0002 Face Control vendor, ADR-0003 хостинг,
      ADR-0004 миграция, ADR-0005 эквайринг — **после ответов 🔴 Q1-Q5**
- [ ] `Docs/06-estimate.md`, `07-roadmap.md`, `kp/kp-with-cost.md` —
      **после ответов 🔴 Q1-Q5**
- [ ] Merge `feature/prototype` → `main` после ревью владельца

### Открытые блокеры

🔴 **5 из 7 ответов** ещё открыты:
- **Q1** Юрисдикция / юр-лицо (ИП/ООО, СНО, НДС)
- **Q2** Face Control vendor (Hikvision / Suprema / NtechLab / самописный)
- **Q3** Хостинг (Yandex.Cloud / Selectel / VK Cloud / on-prem)
- **Q4** Миграция legacy (1С / Excel / нет)
- **Q5** Эквайринг + ОФД-провайдер (под-блокер от Q14)

⏸ **Отложено:** Q19 Sentry (по умолчанию фаза 1.5+).
Артефакты-блокеры (КП, smeта, prod-ADR) ждут.

## Контакты

- **Заказчик:** владелец будущей типографии и производства наружной
  рекламы (контакт через PM-канал — TBD).
- **Разработка:** команда формируется (`Docs/06-estimate.md` после 🔴).
- **PM-канал:** TBD после 🔴 #20.
- **Demo URL прототипа:** Vercel preview (после `prototype/`).

## Ссылки внутрь

- [README.md](README.md) — короткая презентация проекта
- [Docs/tz-po-uniprint.md](Docs/tz-po-uniprint.md) — основной ТЗ заказчика
- [Docs/tz-dop-modules.md](Docs/tz-dop-modules.md) — дополнение ТЗ
- [Docs/log.md](Docs/log.md) — журнал изменений (devlog)
- [Docs/00-summary.md](Docs/00-summary.md) — executive summary
- [Docs/01-vision.md](Docs/01-vision.md) … [10-bpmn.md](Docs/10-bpmn.md) — спецификация
- [Docs/team-structure.md](Docs/team-structure.md) — команда → агенты + model-routing
- [Docs/onboarding/owner-questions.md](Docs/onboarding/owner-questions.md) — вопросы заказчику
- [BUSINESS_RULES.md](BUSINESS_RULES.md) — инварианты BR-XXX
- [Docs/DESIGN_SYSTEM.md](Docs/DESIGN_SYSTEM.md) — токены, компоненты, layout-правила (правило A1)
- [Docs/AGENT_BRIEF.md](Docs/AGENT_BRIEF.md) — алгоритм выполнения UI-задачи для агента
