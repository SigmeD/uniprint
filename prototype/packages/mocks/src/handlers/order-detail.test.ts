import { beforeEach, describe, expect, test } from 'vitest';
import { buildOrderDetail, nextStatusesFor, toClientDetail } from '../fixtures/order-detail.js';
import {
  appendComment,
  findOrder,
  getOrderDetail,
  resetOrderStore,
  transitionOrder,
} from '../store/order-store.js';

const CEX_ORDER = 'ord_0001'; // UNI-2026-00001, status=queued, cli_001
const GOODS_ORDER = 'ord_0003'; // UNI-2026-00003, status=in_qc, тип goods
const DEFECT_ORDER = 'ord_0010'; // UNI-2026-00010, status=defect_rework

beforeEach(() => {
  resetOrderStore();
});

describe('карточка заказа — состав', () => {
  test('сумма позиций совпадает с суммой заказа (без копеечных расхождений)', () => {
    for (const id of [CEX_ORDER, GOODS_ORDER, 'ord_0014']) {
      const detail = getOrderDetail(id);
      expect(detail).toBeDefined();
      // biome-ignore lint/style/noNonNullAssertion: проверено выше
      const d = detail!;
      const sum = d.items.reduce((acc, i) => acc + i.qty * i.unitPrice, 0);
      expect(sum).toBe(d.order.priceTotal);
    }
  });

  test('в staff попадают все упомянутые сотрудники', () => {
    // biome-ignore lint/style/noNonNullAssertion: заказ есть в фикстуре
    const detail = getOrderDetail(CEX_ORDER)!;
    const referenced = [
      detail.order.managerId,
      ...detail.operations.flatMap((o) => (o.byUserId != null ? [o.byUserId] : [])),
      ...detail.history.map((h) => h.byUserId),
    ];
    const known = new Set(detail.staff.map((p) => p.id));
    for (const id of referenced) expect(known.has(id)).toBe(true);
  });

  test('у сотрудников заполнены имена, а не заглушки', () => {
    // biome-ignore lint/style/noNonNullAssertion: заказ есть в фикстуре
    const detail = getOrderDetail(CEX_ORDER)!;
    for (const person of detail.staff) {
      expect(person.fullName).not.toMatch(/^Сотрудник \d+$/);
    }
  });

  test('BR-23: заказ типа goods не расходует материалы', () => {
    // biome-ignore lint/style/noNonNullAssertion: заказ есть в фикстуре
    const detail = getOrderDetail(GOODS_ORDER)!;
    expect(detail.order.type).toBe('goods');
    expect(detail.materials).toHaveLength(0);
  });

  test('BR-03: брак зафиксирован складщиком', () => {
    // biome-ignore lint/style/noNonNullAssertion: заказ есть в фикстуре
    const detail = getOrderDetail(DEFECT_ORDER)!;
    expect(detail.defect).toBeDefined();
    expect(detail.defect?.byUserId).toBe('usr_011');
  });
});

describe('BR-07 — статус-машина по типу заказа', () => {
  test('маршруты типов различаются', () => {
    // biome-ignore lint/style/noNonNullAssertion: заказы есть в фикстуре
    const cex = getOrderDetail(CEX_ORDER)!;
    // biome-ignore lint/style/noNonNullAssertion: заказы есть в фикстуре
    const goods = getOrderDetail(GOODS_ORDER)!;
    expect(cex.statusRoute).toContain('measured');
    expect(goods.statusRoute).not.toContain('measured');
    expect(goods.statusRoute).not.toContain('designing');
  });

  test('следующий статус берётся из маршрута своего типа', () => {
    // biome-ignore lint/style/noNonNullAssertion: заказ есть в фикстуре
    const order = findOrder(CEX_ORDER)!;
    expect(order.status).toBe('queued');
    expect(nextStatusesFor(order)).toContain('in_production');
    expect(nextStatusesFor(order)).not.toContain('ready');
  });

  test('переход через голову маршрута запрещён', () => {
    // biome-ignore lint/style/noNonNullAssertion: заказ есть в фикстуре
    const order = findOrder(CEX_ORDER)!;
    expect(transitionOrder(order, 'delivered', 'usr_012')).toBeNull();
    expect(order.status).toBe('queued');
  });

  test('закрытый заказ дальше не двигается', () => {
    // biome-ignore lint/style/noNonNullAssertion: заказ есть в фикстуре
    const closed = findOrder('ord_0006')!;
    expect(closed.status).toBe('closed');
    expect(nextStatusesFor(closed)).toHaveLength(0);
  });
});

describe('BR-20 — журнал статус-переходов', () => {
  test('разрешённый переход добавляет запись с комментарием', () => {
    // biome-ignore lint/style/noNonNullAssertion: заказ есть в фикстуре
    const order = findOrder(CEX_ORDER)!;
    // biome-ignore lint/style/noNonNullAssertion: заказ есть в фикстуре
    const before = getOrderDetail(CEX_ORDER)!.history.length;

    const updated = transitionOrder(order, 'in_production', 'usr_012', 'Запущен в печать');
    expect(updated?.status).toBe('in_production');

    // biome-ignore lint/style/noNonNullAssertion: заказ есть в фикстуре
    const history = getOrderDetail(CEX_ORDER)!.history;
    expect(history).toHaveLength(before + 1);
    const last = history[history.length - 1];
    expect(last?.fromStatus).toBe('queued');
    expect(last?.toStatus).toBe('in_production');
    expect(last?.comment).toBe('Запущен в печать');
  });

  test('история не перестраивается заново после смены статуса', () => {
    // biome-ignore lint/style/noNonNullAssertion: заказ есть в фикстуре
    const order = findOrder(CEX_ORDER)!;
    transitionOrder(order, 'in_production', 'usr_012');
    transitionOrder(order, 'in_qc', 'usr_012');

    // biome-ignore lint/style/noNonNullAssertion: заказ есть в фикстуре
    const history = getOrderDetail(CEX_ORDER)!.history;
    const ids = new Set(history.map((h) => h.id));
    expect(ids.size).toBe(history.length); // без дублей
    expect(history.filter((h) => h.toStatus === 'in_production')).toHaveLength(1);
  });

  test('комментарий не меняет статус, но попадает в журнал', () => {
    // biome-ignore lint/style/noNonNullAssertion: заказ есть в фикстуре
    const order = findOrder(CEX_ORDER)!;
    appendComment(order, 'usr_012', 'Клиент просил перезвонить');
    expect(order.status).toBe('queued');
    // biome-ignore lint/style/noNonNullAssertion: заказ есть в фикстуре
    const last = getOrderDetail(CEX_ORDER)!.history.at(-1);
    expect(last?.comment).toBe('Клиент просил перезвонить');
    expect(last?.fromStatus).toBe(last?.toStatus);
  });
});

describe('BR-32 — клиентская проекция', () => {
  test('не содержит себестоимости и сотрудников', () => {
    // biome-ignore lint/style/noNonNullAssertion: заказ есть в фикстуре
    const clientDetail = toClientDetail(getOrderDetail(CEX_ORDER)!);
    const serialized = JSON.stringify(clientDetail);

    expect(serialized).not.toContain('costPlan');
    expect(serialized).not.toContain('costFact');
    expect(serialized).not.toContain('materials');
    expect(serialized).not.toContain('managerId');
    expect(serialized).not.toContain('designerId');
    expect(serialized).not.toContain('costEstimate');
    expect(serialized).not.toContain('usr_');
  });

  test('оставляет то, что клиенту нужно', () => {
    // biome-ignore lint/style/noNonNullAssertion: заказ есть в фикстуре
    const clientDetail = toClientDetail(getOrderDetail(CEX_ORDER)!);
    expect(clientDetail.items.length).toBeGreaterThan(0);
    expect(clientDetail.documents.length).toBeGreaterThan(0);
    expect(clientDetail.payment.total).toBeGreaterThan(0);
    expect(clientDetail.clientStages.length).toBeGreaterThan(0);
  });

  test('этапы клиента: ровно один текущий, пока заказ не выдан', () => {
    // biome-ignore lint/style/noNonNullAssertion: заказ есть в фикстуре
    const clientDetail = toClientDetail(getOrderDetail(CEX_ORDER)!);
    expect(clientDetail.clientStages.filter((s) => s.state === 'current')).toHaveLength(1);
  });

  test('выданный заказ — все этапы пройдены', () => {
    // biome-ignore lint/style/noNonNullAssertion: ord_0005 = delivered
    const clientDetail = toClientDetail(getOrderDetail('ord_0005')!);
    expect(clientDetail.clientStages.every((s) => s.state === 'done')).toBe(true);
  });
});

describe('карточка строится для любого заказа', () => {
  test('заказ, созданный во время демо (status=draft), не ломает сборку', () => {
    const detail = buildOrderDetail({
      id: 'ord_9999',
      number: 'UNI-2026-09999',
      type: 'office',
      status: 'draft',
      clientId: 'cli_002',
      managerId: 'usr_012',
      branchId: 'main',
      title: 'Визитки 100 шт',
      itemsCount: 100,
      priceTotal: 3000,
      createdAt: '2026-05-20T09:00:00.000Z',
      updatedAt: '2026-05-20T09:00:00.000Z',
    });

    expect(detail.items.reduce((s, i) => s + i.qty * i.unitPrice, 0)).toBe(3000);
    expect(detail.operations.length).toBeGreaterThan(0);
    expect(detail.costFact).toBeUndefined();
    expect(detail.payment.state).toBe('unpaid');
    expect(nextStatusesFor(detail.order)).toContain('lead');
  });
});
