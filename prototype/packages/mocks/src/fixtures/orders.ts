import type { Order, OrderType, OrderStatus } from '@uniprint/types';

/**
 * Demo orders fixture — 14 заказов под две демки:
 *   - client-portal: cli_001 (ООО «Рассвет») имеет 6 заказов (UNI-00001..00006)
 *   - manager-web: 8 заказов на Kanban (00001..00009 без 00006) распределены
 *     по 4 колонкам по 2 карточки + клиенты варьируются per `manager.png`
 *     (00007 → ИП Соколов cli_007, 00008 → ООО Маяк cli_003).
 *
 * UNI-2026-00001..00014. Дополнительные 00010..00014 — для manager KPI cols-5
 * (in_production, ready, delivered, defect_rework — разные клиенты cli_002..007).
 */

interface DemoOrder {
  number: string;
  type: OrderType;
  status: OrderStatus;
  clientId: string;
  managerId: string;
  designerId?: string;
  title: string;
  metaText: string;
  itemsCount: number;
  priceTotal: number;
  /** Разброс срока сдачи: 10…23 → от +1 до +14 дней от сегодня. */
  dueDay: number;
  /** Разброс даты создания: 1…13 → от 13 до 1 дня назад. */
  createdDay: number;
}

const DEMO: DemoOrder[] = [
  // ── Client demo (8 orders for cli_001 = ООО «Рассвет») ──
  {
    number: 'UNI-2026-00001',
    type: 'cex',
    status: 'queued',
    clientId: 'cli_001',
    managerId: 'usr_012',
    designerId: 'usr_009',
    title: 'Баннер 3×1 м',
    metaText: 'люверсы, ПВХ 440 г/м²',
    itemsCount: 1,
    priceTotal: 5000,
    dueDay: 10,
    createdDay: 1,
  },
  {
    number: 'UNI-2026-00002',
    type: 'office',
    status: 'in_production',
    clientId: 'cli_001',
    managerId: 'usr_012',
    title: 'Визитки 200 шт',
    metaText: '90×50 мм · 4+4 · ламинация',
    itemsCount: 200,
    priceTotal: 6500,
    dueDay: 11,
    createdDay: 2,
  },
  {
    number: 'UNI-2026-00003',
    type: 'goods',
    status: 'in_qc',
    clientId: 'cli_001',
    managerId: 'usr_012',
    title: 'Готовый стенд тип 3',
    metaText: 'самосборный, А-формат',
    itemsCount: 3,
    priceTotal: 8000,
    dueDay: 12,
    createdDay: 3,
  },
  {
    number: 'UNI-2026-00004',
    type: 'cex',
    status: 'ready',
    clientId: 'cli_001',
    managerId: 'usr_012',
    designerId: 'usr_009',
    title: 'Баннер 6×1 м',
    metaText: 'баннерная ткань, монтажные карманы',
    itemsCount: 4,
    priceTotal: 9500,
    dueDay: 13,
    createdDay: 4,
  },
  {
    number: 'UNI-2026-00005',
    type: 'office',
    status: 'delivered',
    clientId: 'cli_001',
    managerId: 'usr_012',
    title: 'Визитки 500 шт',
    metaText: '90×50 мм · мел. 300 г',
    itemsCount: 500,
    priceTotal: 11000,
    dueDay: 14,
    createdDay: 5,
  },
  {
    number: 'UNI-2026-00006',
    type: 'goods',
    status: 'closed',
    clientId: 'cli_001',
    managerId: 'usr_012',
    title: 'Готовый стенд тип 2',
    metaText: 'самосборный',
    itemsCount: 6,
    priceTotal: 7200,
    dueDay: 15,
    createdDay: 6,
  },
  {
    // ИП Соколов per manager.png Kanban col «Лиды / Дизайн»
    number: 'UNI-2026-00007',
    type: 'cex',
    status: 'designing',
    clientId: 'cli_007',
    managerId: 'usr_012',
    designerId: 'usr_009',
    title: 'Баннер 4×1 м',
    metaText: 'ПВХ',
    itemsCount: 7,
    priceTotal: 14000,
    dueDay: 16,
    createdDay: 7,
  },
  {
    // ООО «Маяк» per manager.png Kanban col «Лиды / Дизайн»
    number: 'UNI-2026-00008',
    type: 'office',
    status: 'client_approval',
    clientId: 'cli_003',
    managerId: 'usr_012',
    title: 'Визитки 800 шт',
    metaText: 'мел. 250 г',
    itemsCount: 800,
    priceTotal: 15500,
    dueDay: 17,
    createdDay: 8,
  },
  // ── Manager extra (other clients, для cols-5 KPI и Kanban distribution) ──
  {
    number: 'UNI-2026-00009',
    type: 'cex',
    status: 'queued',
    clientId: 'cli_002',
    managerId: 'usr_012',
    title: 'Папка А4 с тиснением',
    metaText: '50 шт · цех',
    itemsCount: 50,
    priceTotal: 17000,
    dueDay: 18,
    createdDay: 9,
  },
  {
    number: 'UNI-2026-00010',
    type: 'cex',
    status: 'defect_rework',
    clientId: 'cli_003',
    managerId: 'usr_012',
    title: 'Баннер 7×1 м',
    metaText: 'переделка после брака',
    itemsCount: 10,
    priceTotal: 18500,
    dueDay: 19,
    createdDay: 9,
  },
  {
    number: 'UNI-2026-00011',
    type: 'office',
    status: 'in_production',
    clientId: 'cli_004',
    managerId: 'usr_012',
    title: 'Визитки 1100 шт',
    metaText: 'мел. 350 г',
    itemsCount: 1100,
    priceTotal: 20000,
    dueDay: 20,
    createdDay: 10,
  },
  {
    number: 'UNI-2026-00012',
    type: 'office',
    status: 'in_production',
    clientId: 'cli_005',
    managerId: 'usr_012',
    title: 'Каталог 24 стр',
    metaText: 'А4 · клееное',
    itemsCount: 100,
    priceTotal: 21500,
    dueDay: 21,
    createdDay: 11,
  },
  {
    number: 'UNI-2026-00013',
    type: 'goods',
    status: 'ready',
    clientId: 'cli_006',
    managerId: 'usr_012',
    title: 'Готовый стенд тип 1',
    metaText: 'роллап',
    itemsCount: 9,
    priceTotal: 17500,
    dueDay: 22,
    createdDay: 12,
  },
  {
    number: 'UNI-2026-00014',
    type: 'office',
    status: 'delivered',
    clientId: 'cli_007',
    managerId: 'usr_012',
    title: 'Визитки 1400 шт',
    metaText: '90×50 · мел. 300 г',
    itemsCount: 1400,
    priceTotal: 25000,
    dueDay: 23,
    createdDay: 13,
  },
];

/**
 * Даты заказов считаются от момента загрузки модуля, а не прибиты к маю 2026.
 * С фиксированными датами любой заказ на демо выглядел просроченным, а таблица
 * «Все заказы за сегодня» показывала прошлогодние числа. Тот же приём, что и с
 * `lastLoginAt` в `users.ts`.
 */
const NOW = Date.now();
const DAY = 86_400_000;

export const ordersFixture: Order[] = DEMO.map((d, i) => {
  const createdAt = new Date(NOW - (14 - d.createdDay) * DAY);
  const order: Order = {
    id: `ord_${String(i + 1).padStart(4, '0')}`,
    number: d.number,
    type: d.type,
    status: d.status,
    clientId: d.clientId,
    managerId: d.managerId,
    branchId: 'main' as const,
    title: d.title,
    metaText: d.metaText,
    itemsCount: d.itemsCount,
    priceTotal: d.priceTotal,
    costEstimate: Math.floor(d.priceTotal * 0.6),
    dueDate: new Date(NOW + (d.dueDay - 9) * DAY).toISOString(),
    createdAt: createdAt.toISOString(),
    updatedAt: new Date(createdAt.getTime() + DAY).toISOString(),
  };
  if (d.designerId != null) {
    order.designerId = d.designerId;
  }
  return order;
});
