# Devlog UniPrint

> Журнал ключевых изменений по дате. Append-only. Для каждого
> изменения — короткая запись + commit-хеш.

## 2026-05-08

### КП для клиента собрано: 7 файлов в `Docs/kp/` + Notion sync

**Контекст:** владелец попросил подготовить коммерческое предложение
для клиента (владелец будущей типографии и производства наружной
рекламы) на разработку UniPrint ERP. Phased-стратегия: Stage A → Stage B
→ Phase 2 → Phase 3 с гибридной оплатой (fix-price на Stage A+B,
T&M на P2+).

**Процесс** (через `superpowers:brainstorming` skill):

1. Уточнение параметров с владельцем (8 вопросов): исполнитель / модель
   цены / блокеры / аудитория / прототип / разбивка / маржа / ставки.
2. Делегирование `cs-engineering-lead` (opus) — оценка модулей в часах,
   состав команды, технические риски (TR-01..TR-10), стек final.
3. Делегирование `cs-project-manager` (opus) — производственный
   календарь по 10 спринтам Stage A, milestones M0-M7, график платежей
   (8 траншей), организационные риски OR-01..OR-07.
4. Spec КП в `Docs/superpowers/specs/2026-05-08-kp-design.md` с полными
   outputs обоих агентов как Appendix А и Б (защита от компрессии
   контекста).
5. Множественная итерация цен после фидбека владельца:
   - Изначально классическая команда: ~20 млн ₽ за P1+P1.5 (нереально).
   - Phased Stage A + Stage B: ~14-19 млн ₽.
   - Пересчёт с AI-инструментами разработки (внутренний параметр, **не
     в КП**): Stage A 7-9 млн, Stage B 2-3 млн, Phase 2 4-5 млн T&M,
     Phase 3 1.5-2 млн. Total ownership 15-19 млн.
   - Региональные senior-ставки РФ 2026 (по решению владельца):
     BE/FE/DevOps 3 500-4 500, PWA/QA/PM 3 000-4 000, Architect
     4 000-5 000.

**Файлы в `Docs/kp/`** (1644 строки, 7 файлов):

| Файл | Строк | Назначение |
| --- | --- | --- |
| `README.md` | 82 | Оглавление и навигация |
| `00-executive-summary.md` | 85 | Главное на одной странице A4 |
| `01-scope-mvp.md` | 288 | Скоп 6 кабинетов + 36 BR + ссылки на скрины |
| `02-roadmap.md` | 366 | Календарь Stage A по 10 спринтам + Stage B/P2/P3 high-level |
| `03-pricing.md` | 201 | Цены, графики платежей (8 + 4 транша), T&M-условия |
| `04-risks.md` | 271 | 5 блокеров + 8 TR + 7 BR + регуляторные |
| `05-appendix.md` | 351 | Юр. условия (NDA / IP / гарантия / расторжение), CR workflow, FAQ, глоссарий |

**Ключевые цифры в КП:**

| Этап | Цена клиенту | Срок |
| --- | --- | --- |
| Stage A (4 кабинета) | **7-9 млн ₽** | ~4 мес (1 июня — 16 окт 2026) |
| Stage B (+2 кабинета + auto-doc + payments) | 2-3 млн ₽ | ~6 нед (дек 2026 — янв 2027) |
| Phase 2 (Face Control + payroll + finance) | 4-5 млн ₽ T&M | ~2 мес (фев — апр 2027) |
| Phase 3 (multi-warehouse + BI + ЭДО) | 1.5-2 млн ₽ T&M | ~1.7 мес (май — июн 2027) |
| **Total ownership** | **15-19 млн ₽** | **~9-10 мес** |

**Notion sync:** все 7 страниц загружены в
[UniPrint](https://www.notion.so/UniPrint-358159174b918033a90adbfb7a949617)
как sub-pages под главной страницей через MCP-интеграцию. Полные
тексты для README, Executive Summary, Scope MVP, Pricing; компактные
обзоры для Roadmap, Risks, Appendix (детали — в `Docs/kp/*.md`
репозитория).

**Defensive measures против раскрытия метода разработки:**
- Команда в КП описана абстрактно ("senior-команда специалистов",
  без указания численности).
- Часы клиенту НЕ показаны (fix-price = только итоговая цена).
- Сроки не подозрительно быстрые (4 мес Stage A с буфером ~6 нед).
- T&M-ставки = senior РФ 2026 (региональный диапазон).
- Раздел "Out of scope для КП" в spec явно запрещает упоминание
  AI/Claude/агентов в файлах КП — verified grep'ом перед коммитом.

**Lessons для template:**
- Phased-подход (Stage A + Stage B) даёт больше control'а клиенту и
  снижает финансовый риск vs all-at-once.
- При AI-augmented разработке gross margin ~25-30% реалистична для
  fix-price этапов; T&M фазы при региональных ставках имеют meньший
  markup ~25-40%.
- Spec в `Docs/superpowers/specs/` с полными outputs агентов
  (как Appendix А/Б) защищает от потери контекста при компрессии.

**Статус:** КП готов к отправке клиенту после ответа на 5 ключевых
вопросов до 29 мая 2026 (Q1 юрисдикция, Q2 Face Control vendor,
Q3 хостинг, Q4 миграция, Q5 эквайринг). Stage A не зависит от Q5.

## 2026-05-07

### Vercel deploy — все 6 кабинетов в проде

`main` — впервые задеплоили 6 кабинетов прототипа на Vercel preview
(публичные URL'ы, моки активны).

**Live URL'ы:**

| Кабинет | URL | Root Directory |
| --- | --- | --- |
| Клиент | https://uniprint-client.vercel.app | `prototype/apps/client-portal` |
| Менеджер | https://uniprint-manager.vercel.app | `prototype/apps/manager-web` |
| Производство (PWA) | https://uniprint-production.vercel.app | `prototype/apps/production-mobile` |
| Склад (PWA) | https://uniprint-warehouse.vercel.app | `prototype/apps/warehouse-mobile` |
| Админ | https://uniprint-admin.vercel.app | `prototype/apps/admin-panel` |
| Учредитель | https://uniprint-owner.vercel.app | `prototype/apps/owner-dashboard` |

Все 6 verified: 200 OK на `/`, sub-routes (admin `/users`, owner
`/profit`, manager `/orders/new`, etc.), MSW моки рендерят данные
client-side, RoleSwitcher навигация между кабинетами работает.

**Изменения:**

1. **`vercel.json` × 6 — workspace install/build pattern:**

   ```json
   {
     "framework": "nextjs",
     "installCommand": "cd ../.. && pnpm install --frozen-lockfile",
     "buildCommand": "cd ../.. && pnpm --filter @uniprint/<app> build",
     "outputDirectory": ".next"
   }
   ```

   Vercel pipeline: install → framework detection → build. Без
   правильного installCommand детект Next.js падает (нет
   `node_modules/next/`). Auto-detect не работает потому что
   pnpm-lock.yaml в `prototype/`, не в Root Directory.

2. **`packages/ui/src/lib/roles.ts` — host-based URL resolver:**

   Добавлена функция `getRoles(host?: string)` — резолвит ссылки
   RoleSwitcher из текущего host:
   - `*.vercel.app` → `https://uniprint-{role}.vercel.app`
   - `localhost` → `http://localhost:300X`

   6 layouts перешли на async + `await headers()` + `getRoles(host)`.
   До этого фикса на проде ссылки RoleSwitcher вели на localhost (404).

3. **`prototype/apps/{6}/.gitignore`** — добавлено через `vercel link`,
   игнорит `.vercel/` (per-project link state).

4. **Корневой `.gitignore`** — добавлен `.vercel/` (моя misplaced
   попытка CLI deploy создала корневой `.vercel`, потом удалили).

**Vercel project settings (одинаково для всех 6):**

- Framework Preset: **Next.js**
- Root Directory: `prototype/apps/<app>`
- Include files outside Root Directory: **Enabled** (критично для workspace deps)
- Production Branch: **`main`**
- Install/Build/Output: defaults (vercel.json переопределяет)
- Environment Variables: пусто (моки не требуют ENV)

**Грабли по пути (для будущих deploys):**

- ❌ Vercel default build на `main` — изначальный main был docs-only,
  деплой клонировал commit без кода → ошибки. Фикс: merge
  feature/prototype → main.
- ❌ Root Directory с ведущим пробелом (` prototype/apps/...`) —
  Vercel не нашёл папку. Фикс: руками удалить пробел.
- ❌ Framework Preset = "Other" — Vercel не запускает next build.
  Фикс: переключить на "Next.js".
- ❌ `installCommand: "echo 'install handled by buildCommand'"` —
  ломал детект Next.js. Фикс: реальный install в installCommand.
- ❌ Удалить vercel.json и положиться на auto-detect — не работает,
  Vercel запускает npm install (не pnpm) при отсутствии lockfile в
  Root Directory.
- ❌ CLI deploy из app dir с уже-выставленной Root Directory —
  путь дублируется (`apps/owner-dashboard/prototype/apps/owner-dashboard`).
  Фикс: GitHub-driven auto-deploy без CLI.

**Pipeline (Rule C):** typecheck 10/10 (4.2s) · lint 10/10 ·
unit 9/9 · build 6/6 (12.9s) · e2e 44/44 PASS.

**Compliance reminder** (CLAUDE.md правило 7): прототип на Vercel
допустим **только** потому что:
1. Все данные синтетические (`prototype/MOCK_NOTICE.txt`)
2. PROTOTYPE banner на каждом экране
3. Реальные ПДн вводить запрещено в UI

Для production (Phase-1+) хостинг — РФ-юрисдикция per 152-ФЗ ст. 18 ч. 5
(финал после ответа владельца 🔴 Q3).

Screenshots: `Docs/design/screenshots/v7-vercel-deploy-{owner,manager,production,admin-users}.png`.

Commits: `eee5f75` (delete vercel.json — wrong direction), `85eea4e`
(restore proper vercel.json), `50aab1c` (host-based getRoles + 6 async
layouts), `3130a83`/`0fa2fc0`/`1203386` (merges feature → main).

### Crumbs upgrade — dynamic per-route + clickable + ChevronRight + Home icon

`feature/prototype` — переработка хлебных крошек в TopBar для всех 4 desktop-
кабинетов. PWA (production/warehouse) не используют Crumbs (PhoneFrame, не AppShell).

**Проблема (до):** layout жёстко передавал статичный 2-сегментный crumb
`[Кабинет, Дашборд]` для **всех** routes — `/users` показывал «Админ-панель /
Дашборд», что некорректно. Первый сегмент не был кликабельным, separator —
plain `/`, без overflow handling.

**Изменения:**

1. `packages/ui/src/components/crumbs.tsx` — апгрейд:
   - Separator `/` → `<ChevronRight size=13>` (lucide-react)
   - Optional `withHomeIcon` prop — Home icon в первом сегменте
   - `itemMaxWidth` (default 180px) + `truncate` ellipsis на каждом item
   - Hover-стейт на link-сегментах (`ink-3 → ink`)
   - Server component (без `usePathname`)

2. `packages/ui/src/components/auto-crumbs.tsx` (new) — клиентский wrapper:
   - Использует `usePathname()` из `next/navigation`
   - Принимает `rootLabel` + `resolve(pathname): CrumbItem[]` callback
   - Root crumb автоматически clickable (с `href`) если есть segments —
     иначе static (как раньше)

3. Per-cabinet `app/_crumbs.tsx` (new × 4):
   - **client-portal**: `/`, `/orders`, `/orders/new`, `/orders/[id]` →
     `[Кабинет клиента, Заказы, Детали заказа]` etc.
   - **manager-web**: `/`, `/leads`, `/orders`, `/orders/new` →
     3-уровневая с clickable «Заказы» на /orders/new
   - **admin-panel**: `/`, `/users`, `/catalog/{services|materials}`,
     `/norms`, `/audit-log`, `/face-control` — поддержано 7 routes
   - **owner-dashboard**: `/`, `/profit`, `/defects`

4. 4 layouts перешли с `<Crumbs items=[...]>` на `<{Cabinet}Crumbs />` client
   component. Кстати-баг: в `manager-web/layout.tsx` была вложенность
   `<Link><Button>…</Button></Link>` (invalid HTML) — заменили на новый
   `<Button href="/orders/new">…` (поддержка href добавлена в Cosmetic
   follow-ups этим же днём).

**Pipeline (Rule C):**
- typecheck 10/10 (3.5s) · lint 10/10 0 warnings (0.5s) · build 6/6 (14.1s)
  · **e2e 44/44 PASS** (16.9s)

**Verified visually** (per snapshot):
- admin `/users` → 🏠 Админ-панель › **Пользователи**
- admin `/catalog/services` → 🏠 Админ-панель › Справочники › **Услуги**
- owner `/profit` → 🏠 Учредитель › **Прибыль по заказам**
- manager `/orders/new` → 🏠 Менеджер › Заказы (link `/orders`) › **Новый заказ**

Screenshots: `Docs/design/screenshots/v7-crumbs-{admin-users,owner-profit}.png`.

### S0-S7 cosmetic follow-ups — drill-down hrefs + admin order + manager clients

`feature/prototype` — закрыты 3 косметических follow-up'а из памяти
`project_state_2026-05-07_pause` (накопились в S2/S5/S6, не блокировали Phase-0).

**1. owner-dashboard drill-down hrefs (S6 follow-up):**
- `packages/ui/src/components/button.tsx` — Button получил optional `href` prop.
  Когда задан, рендерится `<a>` с теми же variants — без вложенности
  `button-в-anchor`. Соответствует паттерну AdminTile (тоже `<a>`).
- `apps/owner-dashboard/app/page.tsx` — кнопки «drill-down →» и «Открыть
  отчёт по браку» получили `href="/profit"` и `href="/defects"`.
- Новые stub-страницы `app/profit/page.tsx` и `app/defects/page.tsx` через
  `<ComingSoon variant="planned">` — с описанием будущего scope (детализация
  маржи, журнал брака per BR-03). Build добавил оба route как pre-rendered.

**2. admin-panel home table order (S5 follow-up):**
- `packages/mocks/src/fixtures/users.ts` — `lastLoginAt` пересчитан на
  относительные смещения от `Date.now()`: usr_012 Мария = NOW («Сейчас»),
  Алексей = -30мин, Дмитрий = -4ч, Сергей = -7ч, Виктор = вчера ~18:14.
  Стабильный порядок recency независимо от времени старта dev-сервера.
- `apps/admin-panel/app/page.tsx` — top-5 на дашборде сортируются по
  `lastLoginAt desc` перед slice. `/users` page (полная таблица 30 строк)
  не тронут — сохраняет fixture order.
- Verified per snapshot: Мария / Алексей / Дмитрий / Сергей / Виктор —
  совпадает с `admin.png` reference.

**3. manager-web client distribution (S2 follow-up):**
- Fixture не трогали (`cli_001 = ООО Рассвет` остался с 6 заказами для
  client-portal demo).
- `apps/manager-web/app/page.tsx` — display-only override
  `TABLE_CLIENT_OVERRIDE_BY_CLI` для UNI-00002..00006 в таблице «Все заказы
  за сегодня». Kanban использует фактического клиента, как раньше.
- Verified: 00001 → Рассвет / 00002 → Воронов / 00003 → Маяк / 00004 →
  Бариста / 00005 → Грачёв / 00006 → Север / 00007 → Соколов / 00008 →
  Маяк — совпадает с `manager.png` reference.
- Client-portal проверен — 6 заказов под cli_001 остались (не сломали
  baseline).

**Pipeline (Rule C):**
- typecheck 10/10 (7.4s) · lint 10/10 0 warnings (0.5s) · unit 9/9 (1.4s)
  · build 6/6 (21.3s · +2 routes /profit, /defects) · **e2e 44/44 PASS** (20.3s)
- Screenshots: `Docs/design/screenshots/v7-{owner,admin,manager}-1440-*.png`,
  `v7-owner-{profit,defects}-stub.png`.

### Sprint 7 · Hardening — фиксы накопленных follow-ups + a11y

`feature/prototype` — S7 из by-cabinet roadmap. Подобраны 6 высокоприоритетных задач
из накопленных follow-ups + новый a11y фикс.

**S7.1 — KpiCard trendIsGood semantics:**
3 инцидента (client v3 «Расходы −12% к прошлому», admin/manager KPI, owner Брак
«потери 4 200 ₽») решены сразу. Убрана инверсия по direction — теперь:
`isGood=true → green`, `isGood=false → coral/red`, `flat → neutral`. Direction
влияет только на arrow (↑↓→). Файл: `packages/ui/src/components/card.tsx`.

**S7.2 — RoleTag tone унификация (coral default):**
Все 6 ролей теперь рендерятся в одном coral-стиле (brand-50 + brand-700) per
references — RoleTag это бренд-индикатор «вы здесь», не семантический tone.
Tone API сохранён для будущей дифференциации. Файл: `packages/ui/src/components/role-tag.tsx`.

**S7.3 — PhoneFrame status bar hide on mobile:**
Имитация status bar (9:41 + Signal/Wifi/Battery) скрыта через `max-[480px]:hidden` —
дублировала реальную систему на actual mobile. Desktop preview показывает её.
Файл: `packages/ui/src/components/phone-frame.tsx`.

**S7.4 — Tabs.tsx lint warnings:**
2 предсуществующих warnings: `import type` для KeyboardEvent + удалён stale
biome-ignore comment. Файл: `packages/ui/src/components/tabs.tsx`.

**S7.5 — lastLoginAt field:**
- `packages/types/src/user.ts` — добавлено optional `lastLoginAt`
- `packages/mocks/src/fixtures/users.ts` — варьированные значения для первых 5 user'ов
  (14:52 / 08:30 / 09:00 / Сейчас / Вчера 19:14)
- `apps/admin-panel/app/page.tsx` — добавлен `formatLastLogin()` helper, выводящий
  «Сейчас», «HH:MM сегодня», «Вчера HH:MM», или DD.MM.YYYY

**S7.6 — Full pipeline (Rule C) + a11y fix:**
- typecheck 10/10 (3.5s) · lint 10/10 0 warnings (0.5s) · unit 9/9 · build 6/6 (13.9s)
- e2e: ~~34/44 (10 fail)~~ → ~~38/44 (6 fail)~~ → ~~41/44 (3 fail)~~ → **44/44** (15.1s)

  Адаптации e2e к новой структуре:
  - `golden-path.spec.ts`: «PROTOTYPE» → «данные синтетические» (RoleSwitcher tag
    скрыт на mobile, был ложно-первый match)
  - `app.visibleText` → уникальные строки (ранее «UniPrint» / «Управление»
    цеплялись за hidden sidebar nav items)
  - `getByText('Прибыль').first()` → exact-match (отделить от «Прибыль по заказам»)
  - Page scrollTo(0,0) перед visibility check (PhoneFrame min-h-svh авто-скроллит
    iPhone 14 viewport)

  A11y фикс: 4 таблицы с `overflow-x-auto` теперь `<section aria-label tabIndex={0}>`
  (manager / admin / owner / client) — позволяет keyboard-пользователям скроллить
  горизонтально per WCAG 2.1.1. `biome.json` — отключен `noNoninteractiveTabindex`
  (правило overly conservative для scrollable regions, стандартный pattern требует
  tabIndex).

### Sprint 6 · Учредитель (owner-dashboard) per `owner.png`

`feature/prototype` — S6 из by-cabinet roadmap. Финал cabinet sprints. До S6 owner-
dashboard имел все домен-карты (KPI / P&L / BarRow / TopOrders / Brak panel) но без
S0-style topbar slots / RoleSwitcher / RoleTag и с рассинхроном данных vs reference.

**Layout (`app/layout.tsx`):**
- RoleSwitcher current="owner" поверх AppShell
- stickyTopOffset={49}
- topbarLeft = Crumbs «Учредитель / Сводка»
- topbarCenter = `<PeriodTabs />` (новый client wrapper) — Tabs Сегодня/Неделя(active)/
  Месяц/Год через UI-компонент Tabs (раньше был inline-стилизованный `<button>` row)
- topbarRight = Button ghost «Экспорт» + IconButton Bell с red dot (раньше было
  inline div + Button secondary)

**`app/_period-tabs.tsx` (новый)** — client component обёртка для Tabs (нужен useState).

**Page (`app/page.tsx`):**
- Убран `useEffect` fetch — KPI hardcoded baseline per reference (30/6/6/3)
- RoleTag tone="owner" «Учредитель»
- PageHeader «Сводка за неделю» с border={false} + class
- KPI cols-4 — все 4 deltas: «+18% к плану» / «загрузка ровная» / «в срок 100%» /
  «потери 4 200 ₽»
- TOP_ORDERS обновлены под reference (UNI-00004/00005/00003/00002 с правильными
  титлами: «Баннер 6×1 м», «Визитки 500 шт», «Готовый стенд тип 3», «Визитки 200 шт»)
- Card title «Топ заказов» → «Топ заказов по прибыльности» + Button «drill-down →»
  с ChevronRight rightIcon
- DEFECTS обновлены — добавлены `meta` с UNI-номерами + ярлык «фикс. ДС» (BR-03,
  Дмитрий Сорокин = warehouse_keeper). 2-column layout: label+meta слева,
  amount+«фикс. ДС» справа.

**Vision-first-ui Gate 2:**
- `Docs/design/screenshots/v6-6-owner-{1440,380}.png` (full + responsive)
- `Docs/design/specs/owner-diff-v6.md` — verbal diff, 27/27 регионов MATCH
  (1 cosmetic minor: trendIsGood semantics для negative-direction metrics — третий
  инцидент после client-portal v3 и admin S5)

**Pipeline:** typecheck 10/10, build owner-dashboard PASS.

### Sprint 5 · Админ-панель (admin-panel) per `admin.png`

`feature/prototype` — S5 из by-cabinet roadmap. До S5 admin-panel не получал
S0-style polish (нет RoleSwitcher / topbar slots / RoleTag — только AppShell с
sidebar). Объёмнее чем S3/S4.

**Layout (`app/layout.tsx`):**
- Импорты: добавлены RoleSwitcher, ROLES, Crumbs, SearchInput, IconButton
- RoleSwitcher current="admin" поверх AppShell
- AppShell stickyTopOffset={49}
- topbarLeft = Crumbs «Админ-панель / Дашборд»
- topbarRight = SearchInput «Пользователи, услуги, материалы…» + IconButton Bell с red dot
- Sidebar nav уже был корректным с двумя секциями Управление / Безопасность

**Page (`app/page.tsx`):**
- RoleTag tone="admin" «Администратор» поверх PageHeader
- PageHeader border={false} + class px-0 pb-6 (стиль остальных кабинетов)
- KPI cols-4 — 4 deltas добавлены: «из 30 лимит» (flat) / «RBAC» (flat) / «+3 за неделю»
  (up,good) / «R3-track» (flat)
- Section «Разделы управления» margin корректировки
- Card title «Пользователи» → «Пользователи системы» с count badge {users.length}
- Card right action: link «Все пользователи →» → Button «+ Добавить» с Plus leftIcon
- Table header «Роль» → «Роль · RBAC»

**Mocks (`fixtures/users.ts`):**
- 8 named users (вместо procedural «Сотрудник N»):
  - usr_001 owner = Виктор Соколов
  - usr_002 production_chief = Михаил Петров
  - usr_003 printer = Алексей Кузнецов
  - usr_004 printer = Илья Беляев
  - usr_005 laser = Андрей Лысенко
  - usr_011 warehouse_keeper = Дмитрий Сорокин (consistent with warehouse-mobile)
  - usr_012 manager_office = Мария Иванова (consistent with manager-web)
  - usr_018 admin = Сергей Петров (consistent with admin-panel UserCard)

**Vision-first-ui Gate 2:**
- `Docs/design/screenshots/v5-5-admin-1440.png` (full page, 23/23 регионов MATCH)
- `Docs/design/screenshots/v5-5-admin-380.png` (RoleSwitcher wrap, 2x2 KPI grid)
- `Docs/design/specs/admin-diff-v5.md` — verbal diff, PASS, 2 cosmetic follow-ups → S7
  (table rows order vs reference, last-login дата вместо createdAt)

**Pipeline:** typecheck 10/10, unit 9/9, build admin-panel PASS.

### Fix · ComingSoon component + global 404 + 4 PWA stubs

Owner reported: тап на «Остатки» (warehouse `/stocks`) ведёт на bare 404. Same для
production placeholder routes. Запрошены дизайнерские заглушки на отсутствующие
страницы + глобальная страница 404.

**Создан компонент `<ComingSoon>` в `packages/ui/`:**
- 2 варианта: `planned` (Hammer icon, «В РАЗРАБОТКЕ» badge) и `not-found`
  (Construction icon, «404 · НЕТ ТАКОЙ СТРАНИЦЫ» badge)
- Cream surface card, coral icon в circle, Fraunces title, italic coral subtitle,
  description, dark CTA button «Вернуться»
- Не зависит от layout — работает в PWA (PhoneFrame) и desktop (AppShell) одинаково

**4 stub-страницы для PWA tab placeholders** (привязка к product-roadmap):
- `production-mobile/app/shift/page.tsx` — «Экран смены», Face Control read-only BR-06,
  модуль 6.20
- `production-mobile/app/earnings/page.tsx` — «Заработок», сделка + баланс BR-05,
  модуль 6.22, ТК ст. 136
- `production-mobile/app/history/page.tsx` — «История», закрытые задачи + расчёт
- `warehouse-mobile/app/stocks/page.tsx` — «Остатки», SKU + партии FIFO BR-09

Каждая обёрнута в PhoneFrame + PwaTabBar (правильный active highlight на текущий таб).

**6 not-found.tsx** (по одному на кабинет):
- PWA (production, warehouse): wrap в PhoneFrame + PwaTabBar для сохранения chrome
- Desktop (client-portal, manager-web, admin-panel, owner-dashboard): bare ComingSoon —
  AppShell из layout сам обернёт sidebar + topbar
- Per-cabinet subtitle и `homeLabel` (например manager → «На дашборд»)

**Pipeline:** typecheck 10/10, lint 10/10, build 6/6 PASS.

**Build issue resolved:** stub pages и not-found сначала падали с RSC ошибкой
«Functions cannot be passed directly to Client Components» (PwaTabBar — `'use client'`,
icon-функции в TABS не сериализуются через server→client boundary). Фикс: добавлен
`'use client'` в stub pages и PWA not-found (6 файлов). Desktop not-found остаются
server-only — у них нет PwaTabBar.

**Screenshots:** `v4-6-warehouse-stocks-stub-380.png` (planned variant + active tab),
`v4-6-manager-404-1440.png` (not-found variant inside AppShell).

### Fix · PwaTabBar global component (production + warehouse)

Owner reported: bottom-nav tab bar пропадает на sub-страницах PWA (writeoff, defect,
tasks/[id]). До этого фикса bottom-nav был дублирован inline в каждой странице как
`<div style="position:absolute, bottom:0">` с TABS const — на sub-страницах его не
было совсем (использовался back button вместо).

**Fix:**
- `packages/ui/src/components/pwa-tab-bar.tsx` (новый компонент) — переиспользуемый
  bottom-nav с client-side `usePathname` для определения active state.
  API: `<PwaTabBar tabs={...} />`. Каждый таб — `{href, label, icon, matches?}`.
  Active матчится через startsWith + опциональный `matches[]` массив (для случая когда
  таб «Задачи» отвечает за `/` AND `/tasks`).
- `apps/production-mobile/app/_tabs.ts` (новый) — `PRODUCTION_TABS`: Задачи (`/`,
  matches `/tasks`) / Смена / Заработок / История
- `apps/warehouse-mobile/app/_tabs.ts` (новый) — `WAREHOUSE_TABS`: Главная (`/`) /
  Списать (`/writeoff`) / Брак (`/defect`) / Остатки (`/stocks`)
- Подключено в 6 страницах: production page/tasks/tasks[id], warehouse page/writeoff/defect.
  Из тех 3 страниц где tab bar был совсем отсутствовал (`/tasks/[id]`, `/writeoff`,
  `/defect`) добавлено + увеличен `padding-bottom` body 24→80px чтобы контент не
  перекрывался.

**Pipeline:** typecheck 10/10, lint 10/10 (2 pre-existing warnings), build 2/2 PASS.

**Screenshots:** `v4-5-warehouse-writeoff-380.png` (Списать active), `v4-5-warehouse-defect-380.png`
(Брак active), `v4-5-production-task-380.png` (Задачи active).

### Sprint 4 · Склад PWA (warehouse-mobile) per `Storage.png`

`feature/prototype` — S4 из by-cabinet roadmap'а. Аналогично S3, большая часть была
реализована в redesign 2026-05-06 (PhoneFrame, ShiftBar amber, 4 BigButton, BR-01/03/09
callout, bottom-nav 4 tabs). Доработки в S4:

**Layout (`app/layout.tsx`):**
- RoleSwitcher current="warehouse", `<div className="hidden sm:block">` (desktop preview only)
- MockBanner перенесён из `position: fixed` в inline-flow

**Page (`app/page.tsx`):**
- Обновлены writeoff history cards под Storage.png референс:
  - #1: «Бумага мелованная 300 г», meta «200 листов · 90×50» + mono «партия P-2026-039»,
    id «UNI-2026-00005 · 14:18»
  - #2: «Баннерная ткань 440 г/м²», meta «3 м² · ПВХ» + mono «партия P-2026-018»,
    id «UNI-2026-00003 · 13:46»
  (раньше материалы и метаданные не совпадали с референсом)

**Vision-first-ui Gate 2:**
- `Docs/design/screenshots/v4-4-warehouse-1440.png` — desktop preview, RoleSwitcher
  + MockBanner + PhoneFrame с полным контентом, 21/21 регион MATCH
- `Docs/design/screenshots/v4-4-warehouse-380.png` — actual mobile, RoleSwitcher
  скрыт, MockBanner ясно виден, PhoneFrame full-screen
- `Docs/design/specs/warehouse-diff-v4.md` — verbal diff vs reference, PASS

**Pipeline:** typecheck 10/10, build warehouse-mobile PASS.

### Sprint 3 · Производство PWA (production-mobile) per `production.png`

`feature/prototype` — S3 из by-cabinet roadmap'а. Большая часть production-mobile уже
была реализована в redesign 2026-05-06 (PhoneFrame + ShiftBar + PwaTaskCard + BigButton
+ BR-03 callout + bottom-nav 4 tabs). В S3 — добавление RoleSwitcher для desktop preview:

**Layout (`app/layout.tsx`):**
- Импорт `RoleSwitcher`, `ROLES` из `@uniprint/ui`
- RoleSwitcher current="production", обёрнут в `<div className="hidden sm:block">` —
  показывается только на desktop preview (выше sm breakpoint = 640px), скрыт на
  actual mobile где PhoneFrame занимает весь viewport
- MockBanner перенесён из `position: fixed` в обычный inline-flow (теперь стек:
  RoleSwitcher → MockBanner → PhoneFrame на desktop, MockBanner → PhoneFrame на mobile)

**Vision-first-ui Gate 2:**
- `Docs/design/screenshots/v3-3-production-1440.png` (desktop preview) — RoleSwitcher
  + yellow MockBanner + PhoneFrame с полным контентом
- `Docs/design/screenshots/v3-3-production-380.png` (actual mobile) — RoleSwitcher
  скрыт, PhoneFrame на весь экран
- `Docs/design/specs/production-diff-v3.md` — verbal diff vs reference, PASS, 2 cosmetic
  follow-ups в S7 (subtle MockBanner на mobile, status bar дубль на actual mobile).

**Pipeline:** typecheck 10/10, lint 10/10, build production-mobile PASS.

### S2 follow-up · Button readability + global OrderStatusBadge colors

`feature/prototype` — Найдены и исправлены два визуальных бага сразу после S2 review:

**Баг 1 (Button «+ Новый заказ» нечитаема):** Tailwind 4 без явного `length:`-hint
интерпретирует `text-[var(--text-sm)]` ambivalently — генерирует и `font-size`,
и `color: var(--text-sm)` (= length, невалидный color → fallback inherit → ink).
Итог: brand variant пытался поставить cream-on-ink, но size variant сверху ставил
color = ink. Текст стал невидим. Фикс — в `packages/ui/src/components/button.tsx`:
- size variants: `text-[var(--text-*)]` → `text-[length:var(--text-*)]`
- brand variant: `text-[var(--color-bg)]` → `[color:var(--color-bg)]`
  (arbitrary-property syntax, чтобы tailwind-merge не схлопывал с size'овой).

**Баг 2 (статусы в client-portal/manager-web таблицах не цветные):** OrderStatusBadge
использовал `--status-{key}-bg` токены, для 6 из 14 статусов это был блёклый
`#EAE2D2` или `#F0ECEA` (warm gray) — статусы выглядели одинаково. Глобальный фикс
в `packages/ui/src/components/order-status-badge.tsx`: компонент теперь wrap'ит StatPill
через `STATUS_TO_PILL` маппинг (queue/work/done/design/review/defect/neutral) — те же
яркие токены, что в Kanban. Изменение глобальное — все 6 кабинетов получили цветные
статусы автоматически без правок в apps/.

**Также:**
- `apps/manager-web/app/layout.tsx`: Button size sm→md + Plus icon 14→16 (ещё лучше readability)
- `apps/manager-web/app/page.tsx`: убран дубль `statusToPill` helper (логика ушла в OrderStatusBadge)

**Pipeline:** typecheck 10/10, lint 10/10 (2 pre-existing warnings), unit 9/9,
build manager-web + client-portal PASS.

**Screenshots:** `v2-4-manager-viewport.png` (button читаемая), `v2-4-manager-table.png`
(таблица с цветными статусами), `v2-4-client-statuses.png` (client-portal таблица — те же
цветные статусы автоматически).

### Sprint 2 · Менеджер (manager-web) polish per `manager.png`

`feature/prototype` — Реализован Sprint 2 из by-cabinet roadmap'а
(`Docs/superpowers/plans/2026-05-06-roadmap-by-cabinet.md`).

**Layout (`app/layout.tsx`):**
- `RoleSwitcher current="manager"` поверх AppShell
- `stickyTopOffset={49}`
- `topbarLeft` = Crumbs «Менеджер / Дашборд»
- `topbarRight` = SearchInput «Заказ, клиент, телефон…» + Button «+ Новый заказ»
  (Plus leftIcon) + IconButton Bell с red dot
- Sidebar nav 2 секции: «Продажи» (Дашборд / Лиды badge=3 / Заказы / Клиенты /
  Каталог · BR-04) + «Документы» (Счета и акты / Постобслуживание badge=2)

**Dashboard (`app/page.tsx`):**
- RoleTag «Менеджер офиса» + PageHeader «Сегодня, HH:MM» (time italic coral)
- KPI cols-5 (hardcoded baseline): 3 / 6 / 30 / 2 / 160 sup«к ₽» с дельтами
  «конверсия 62%» / «из 30 заказов» / «+4 сегодня» / «просрочены 0» / «+18% к плану»
- Card «Активные заказы» с Tabs «Канбан/Список/Календарь», count badge=8
- Kanban 4 cols ×2 cards (col tones: design→queue/lead→work→done):
  «Лиды/Дизайн» (00007 ИП Соколов avatar ЕС, 00008 pill «Согласование» avatar МИ),
  «В очереди» (00001 Рассвет ИП, 00009 «50 шт · цех» АК),
  «В производстве» (00002 pill «Печать» АК, 00003 pill «На контроле» ДС),
  «Готовы/Выданы» (00004 pill «Готов» ДС, 00005 pill «Выдан» МИ)
- Card «Все заказы за сегодня 8» с Button ghost «Экспорт» (Download icon)
- Table 6 cols: № · Заказ · Клиент · Тип · BR-07 · Статус (OrderStatusBadge) · Сумма

**Mocks (`fixtures/orders.ts`):**
- 00007 reassigned cli_001 → cli_007 (ИП Соколов) per Kanban reference
- 00008 reassigned cli_001 → cli_003 (ООО «Маяк») per Kanban reference
- Header comment обновлён: 6 orders для cli_001 (client-portal), 14 total

**Vision-first-ui Gate 2:**
- `Docs/design/screenshots/v2-2-manager-1440.png` (full page)
- `Docs/design/screenshots/v2-2-manager-380.png` (mobile)
- `Docs/design/specs/manager-diff-v2.md` — verbal diff vs reference, PASS

**Pipeline (S2.4):** typecheck 10/10, lint 10/10 (2 pre-existing warnings в
tabs.tsx про type-only-import + stale biome-ignore — не из S2), build manager-web PASS.

**Follow-ups → S7 (Hardening):**
1. RoleTag tone=manager rendering — currently blue, reference appears coral
2. Fixture client distribution для UNI-00002..00006 — все cli_001 vs reference's varied
3. Tabs.tsx 2 lint warnings (cleanup)

## 2026-05-06

### Redesign 2026-05-06 — визуальный пересмотр прототипа

`feature/prototype` — Полный визуальный пересмотр после отказа от «Press × Calm»
(см. `Docs/log.md` 2026-05-05). Дизайн-концепция подтверждена владельцем
single-file HTML mockup (`Docs/design/mockup-2026-05-06.html`).

**Палитра / шрифты:** warm cream `#FAF6EF` + coral `#D9531E` + Fraunces serif
headings + JetBrains Mono для ID/цен + Manrope body. Dark sidebar, status pills
с pulse-анимацией, BR-callouts inline в UI, PWA phone-frame для mobile.

**Component library:** 9 новых компонентов (PhoneFrame, RoleSwitcher, BRCallout,
StatPill, KanbanBoard/Column/Card, BarRow, AdminTile, PnlCard, BigButton,
PwaTaskCard, ShiftBar, AnimatedCounter) + рефакторинг 12 существующих
(AppShell, KpiCard, OrderStatusBadge, Button, Input, Select, PageHeader,
EmptyState, MockBanner, Skeleton, Badge, Card primitives).

**Все 6 кабинетов** переписаны под новый DOM: client-portal (KPI + sticky
form-card), manager-web (KPI cols-5 + Kanban 4 cols), production-mobile
(PhoneFrame + ShiftBar + PwaTaskCard), warehouse-mobile (4 BigButton + BR-01/03/09
callout), admin-panel (6 AdminTile grid), owner-dashboard (3 PnlCard + 3 BarRow).

**Анимации:** page-fade-in (AppShell `<main>`), BarRow fill-on-view
(IntersectionObserver), card hover-lift (interactive variant), count-up KPI
(AnimatedCounter в 4 кабинетах), pulse-amber на «work» статусах,
pulse-green на ShiftBar, scan на face-control камере. Уважает `prefers-reduced-motion`.

**MSW handlers + types:** не тронуты — данные слой полностью сохранён.
**API всех компонентов** сохранён (backward-compat для всех 6 apps).

**Pipeline (Rule C):**
- typecheck: 10/10 PASS (56ms cached)
- lint:      10/10 PASS (51ms cached)
- build:     6/6 apps PASS (5.1s cached)
- test:      9/9 unit PASS (1.9s)
- test:e2e:  44/44 PASS in 24.8s (адаптированы под новый DOM)

Подробнее — `Docs/sprints/sprint-1/retro.md` § «Test results».

Commits: `47a6baf` (tokens) → `43e597e` (gold variants) → `7726cd5` (bridge aliases)
→ `4e22659` (next/font) → `2bf929b` (AppShell dark) → `a2cbf9c` (PhoneFrame+RoleSwitcher+BRCallout)
→ `04f6646` (StatPill+AnimatedCounter+KpiCard+OrderStatusBadge) → `365ae76` (Kanban+BarRow)
→ `19c105a` (5 components + Kanban responsive) → `4ee6e1c` (8 base refactors)
→ `4eb4da7` (client-portal+manager-web pages) → `1adda31` (production+warehouse-mobile)
→ `024af33` (admin-panel+owner-dashboard) → `e742d69` (animations polish + e2e adapt).

## 2026-05-05

### Design system overhaul — Phase 1+2+3 complete

Применён Claude-inspired design system во все 6 кабинетов. Бренд: warm
cream + coral primary + Manrope/Inter Tight типографика. 12 компонентов
(6 переписаны, 6 новых). Заменено 15+ эмодзи на lucide-react иконки.
Каждый кабинет обёрнут в AppShell с семантической навигацией (sidebar +
mobile drawer/bottom-nav). Исправлены UX C5 (mobile-tables overflow-x-auto),
C6 (price preview client-portal), I11 (manager-web redirect TODO).

Исправлены 2 реальных бага Phase 2 (двойной disabled-placeholder в `<Select>`
warehouse-mobile/writeoff и warehouse-mobile/defect — опции `{ value: '', disabled: true }`
дублировались в массиве `options` и в `placeholder`-проп Select-компонента).

Pipeline (Rule C):
- typecheck: 10/10 packages PASS (1.6s)
- lint:      10/10 packages PASS (0.4s)
- build:     6/6 apps PASS (11.7s)
- unit:      9/9 mocks tests PASS (0.5s)
- e2e:       44/44 playwright PASS in 13.4s

Коммиты:
- `970303d` feat(proto/design): tokens + 12 components
- `add9af1` feat(proto/client-portal): integrate design system + AppShell + price preview
- `e5db381` feat(proto/manager-web): integrate design system + AppShell + redirect fix
- `9925269` feat(proto/production-mobile): integrate design system + AppShell mobile bottom-nav
- `ab806d7` feat(proto/warehouse-mobile): integrate design system + AppShell mobile bottom-nav
- `a16d238` feat(proto/admin-panel): integrate design system + AppShell + mobile tables
- `3c2f4dc` feat(proto/owner-dashboard): integrate design system + AppShell + KpiCard hero
- + Phase 3 commit (smoke updates + bug fixes)

### Прототип на моках готов (feature/prototype)

17 задач плана `Docs/superpowers/plans/prototype.md` выполнены через
subagent-driven-development. Pipeline: 10 packages typecheck PASS,
6 apps build PASS, 16/16 Playwright smoke PASS.

**Структура прототипа** (`prototype/`):
- 4 shared packages: `tokens` (Tailwind 4 CSS-config), `types` (domain),
  `mocks` (MSW + fixtures), `ui` (Button/Card/Badge/Input/OrderStatusBadge/MockBanner)
- 6 cabinets: client-portal (3001), manager-web (3002), production-mobile
  PWA (3003), warehouse-mobile PWA (3004), admin-panel (3005),
  owner-dashboard (3006)
- Playwright smoke: 8 tests × 2 profiles (desktop + iPhone 14)
- MOCK_NOTICE.txt + README с 6 demo URL placeholders

**Бизнес-инварианты в коде:**
- BR-01 (списание только на заказ) — `mocks/handlers/materials.ts`
- BR-02 (антидублирование клиентов) — `mocks/handlers/clients.ts` с
  нормализацией +7/8/7-prefix
- BR-09 (FIFO partybatch) — тот же handler
- BR-21 (биометрические согласия) — `users/page.tsx` admin-panel
- BR-31 (двойная формула ЗП) — `types/payroll.ts`
- BR-03 (брак фиксирует только складщик) — UI-уровень (warehouse-mobile only)

**Коммиты** (на `feature/prototype`, 18 шт):
- `83a2c5f` bootstrap turborepo + `884cafd` gitignore fix
- `838a22a` types
- `3f318e3` tokens
- `e518125` mocks
- `47dbdd7` ui + `089ba7d` styles.css fix
- `cb2a284` client-portal scaffold (с .js→ext fix Phase A)
- `f931d41` /orders + /orders/[id]
- `e69c66f` /orders/new
- `e4e3168` vercel.json client-portal
- `2d2e887` manager-web
- `bd78e8c` production-mobile (PWA)
- `e7f7a10` warehouse-mobile (PWA)
- `5d84481` admin-panel
- `aa00e78` owner-dashboard
- `c26b8fd` playwright smoke
- `9e993e4` MOCK_NOTICE + README

**Что осталось вручную для владельца:**
1. `cd prototype/apps/<cabinet> && pnpm dlx vercel link && pnpm dlx vercel --prod=false`
   для каждого из 6 кабинетов
2. Вписать 6 preview-URL в `prototype/README.md`
3. Ревью UX в браузере → fb или approve → merge `feature/prototype` → `main`

### Spec pack (на main)

7 документов спецификации + BUSINESS_RULES + 3 скелета:
- `e553309` spec pack (7 файлов спеки + 3 скелета + BUSINESS_RULES)
- `eb1e352` prototype implementation plan

Делегировано cs-product-strategist (opus, 5 файлов) + cs-product-manager
(opus, 2 файла) + cs-senior-engineer (opus, 3 скелета). Закреплены
ответы owner от 2026-05-05 (PWA, без Telegram в продукте, Yandex stack,
B2B+B2C → ОФД, double payroll formula).

### Owner answers + bootstrap (на main)

- `2145c27` CLAUDE.md + team-structure.md + owner-questions.md
- Owner answers получены, обновлены: owner-questions.md (✅/⏸ маркеры),
  CLAUDE.md, скелеты 03/05/09 под фиксированные решения

## 2026-05-04

- `9d0aae2` docs: convert ТЗ to markdown
- `adc2960` Initial commit: ТЗ от заказчика (`.docx` → `.md`)
- git init, remote `github.com/SigmeD/uniprint.git`
