import type { User, Role } from '@uniprint/types';

const ROLES: Role[] = [
  'owner', 'production_chief', 'printer', 'printer', 'laser', 'mounter',
  'mounter', 'carpenter', 'designer', 'designer', 'warehouse_keeper',
  'manager_office', 'manager_office', 'manager_field', 'manager_field',
  'driver', 'driver', 'admin',
  ...Array(12).fill('printer'),
] as Role[];

/**
 * Имена сотрудников, привязанные к индексам в ROLES — ради консистентности
 * между кабинетами:
 *   - usr_011 (warehouse_keeper) = Дмитрий Сорокин — отображается в warehouse-mobile
 *   - usr_012 (manager_office)   = Мария Иванова   — отображается в manager-web
 *   - usr_018 (admin)            = Сергей Петров   — отображается в admin-panel
 *
 * Первые 5 имён (видимы на дашборде admin-panel) — реалистичная команда.
 */
const NAMED: Record<number, string> = {
  0: 'Виктор Соколов',     // owner
  1: 'Михаил Петров',       // production_chief (нач. цеха)
  2: 'Алексей Кузнецов',    // printer (печатник)
  3: 'Илья Беляев',         // printer
  4: 'Андрей Лысенко',      // laser (лазерщик)
  // Именованы ради карточки заказа: маршрут производства и доставка ссылаются
  // на этих сотрудников по id, «Сотрудник 9» на демо выглядит незаполненным.
  5: 'Павел Кротов',        // mounter
  6: 'Роман Гусев',         // mounter
  7: 'Никита Ершов',        // carpenter
  8: 'Елена Соболева',      // designer
  9: 'Ольга Мишина',        // designer
  10: 'Дмитрий Сорокин',    // warehouse_keeper
  11: 'Мария Иванова',      // manager_office
  13: 'Артём Ковалёв',      // manager_field
  15: 'Юрий Панин',         // driver
  17: 'Сергей Петров',      // admin
};

/**
 * Last-login timestamps — варьированные per reference (Сейчас / HH:MM сегодня /
 * Вчера HH:MM). Index → ISO string. Top-5 по recency на admin home должны быть:
 * Мария → Алексей → Дмитрий → Сергей → Виктор (per admin.png reference,
 * S5 follow-up закрыт здесь).
 *
 * Используем относительные смещения от `NOW` (момент загрузки модуля на
 * сервере) — так порядок recency стабилен независимо от того, в какое время
 * стартанул dev-сервер. usr_012 (Мария) = NOW → «Сейчас» в formatLastLogin.
 */
const NOW = Date.now();
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const iso = (offsetMs: number): string => new Date(NOW - offsetMs).toISOString();
const LAST_LOGINS: Record<number, string> = {
  // Top-5 по recency (порядок per admin.png reference)
  11: iso(0),                  // Мария Иванова (manager_office) — «Сейчас»
  2:  iso(30 * MIN),           // Алексей Кузнецов (printer) — ~30 мин назад
  10: iso(4 * HOUR),           // Дмитрий Сорокин (warehouse_keeper) — ~4 ч назад
  17: iso(7 * HOUR),           // Сергей Петров (admin) — ~7 ч назад
  0:  iso(DAY - 5 * HOUR),     // Виктор Соколов (owner) — вчера вечером
  // Прочие named users — за пределами top-5 home preview
  1:  iso(DAY - 2 * HOUR),     // Михаил Петров (production_chief) — вчера ночью
  3:  iso(DAY + 4 * HOUR),     // Илья Беляев (printer) — позавчера
  4:  iso(2 * DAY),            // Андрей Лысенко (laser) — 2 дня назад
};

export const usersFixture: User[] = ROLES.map((role, i) => {
  const hasFace = ['printer', 'laser', 'mounter', 'warehouse_keeper'].includes(role);
  return {
    id: `usr_${String(i + 1).padStart(3, '0')}`,
    fullName: NAMED[i] ?? `Сотрудник ${i + 1}`,
    role,
    phone: `+79${String(100000000 + i).padStart(9, '0')}`,
    ...(i < 5 ? { email: `user${i + 1}@uniprint.local` } : {}),
    active: true,
    hiredAt: '2024-01-15T00:00:00Z',
    ...(hasFace ? { faceTemplateId: `face_${i + 1}` } : {}),
    ...(hasFace ? { faceConsentAt: '2024-01-15T09:00:00Z' } : {}),
    createdAt: '2024-01-15T00:00:00Z',
    ...(LAST_LOGINS[i] ? { lastLoginAt: LAST_LOGINS[i] } : {}),
  };
});
