import type {
  Order,
  OrderArtwork,
  OrderClientDetail,
  OrderClientStage,
  OrderCostBreakdown,
  OrderDelivery,
  OrderDetail,
  OrderDocument,
  OrderHistoryEntry,
  OrderItem,
  OrderMaterialUse,
  OrderOperation,
  OrderPayment,
  OrderStatus,
  OrderType,
} from '@uniprint/types';
import { clientsFixture } from './clients';
import { materialsFixture, batchesFixture } from './materials';
import { usersFixture } from './users';

/**
 * Построение детальной карточки заказа.
 *
 * Данные не хранятся отдельной фикстурой, а **выводятся из самого заказа** —
 * так карточка есть у любого заказа, включая созданные через `POST /api/orders`
 * во время демо. Вывод детерминированный (никакого Math.random): один и тот же
 * заказ всегда даёт одну и ту же карточку, поэтому e2e-тесты стабильны.
 *
 * Мутируемая часть (добавленные комментарии, смена статуса, решение клиента по
 * макету) живёт в `store/order-store.ts` и накладывается поверх этого вывода.
 */

/* ── Статус-машины по типам заказа (BR-07) ────────────────────────────────── */

export const STATUS_ROUTES: Record<OrderType, OrderStatus[]> = {
  cex: [
    'draft', 'lead', 'measured', 'designing', 'design_review', 'client_approval',
    'queued', 'in_production', 'in_qc', 'ready', 'delivered', 'closed',
  ],
  office: [
    'draft', 'lead', 'designing', 'design_review', 'client_approval',
    'queued', 'in_production', 'in_qc', 'ready', 'delivered', 'closed',
  ],
  goods: ['draft', 'lead', 'queued', 'in_qc', 'ready', 'delivered', 'closed'],
};

/**
 * Насколько заказ продвинут (0…1) — общий «курсор» для операций, списаний,
 * оплаты и документов. `defect_rework` откатывает курсор ниже производства.
 */
const STATUS_PROGRESS: Record<OrderStatus, number> = {
  draft: 0,
  lead: 0.05,
  measured: 0.15,
  designing: 0.25,
  design_review: 0.35,
  client_approval: 0.4,
  queued: 0.45,
  in_production: 0.7,
  in_qc: 0.85,
  defect_rework: 0.6,
  ready: 0.95,
  delivered: 1,
  closed: 1,
  cancelled: 0,
};

/** Позиция статуса на маршруте; для off-route статусов — ближайшая точка. */
export function routeIndex(status: OrderStatus, route: OrderStatus[]): number {
  const direct = route.indexOf(status);
  if (direct !== -1) return direct;
  if (status === 'defect_rework') return route.indexOf('in_production');
  return 0;
}

/** Разрешённые переходы из текущего статуса. */
export function nextStatusesFor(order: Order): OrderStatus[] {
  const route = STATUS_ROUTES[order.type];
  if (order.status === 'closed' || order.status === 'cancelled') return [];
  if (order.status === 'defect_rework') return ['in_production', 'cancelled'];

  const next: OrderStatus[] = [];
  const idx = route.indexOf(order.status);
  const forward = idx !== -1 ? route[idx + 1] : route[1];
  if (forward != null) next.push(forward);
  if (order.status === 'in_production' || order.status === 'in_qc') {
    next.push('defect_rework');
  }
  next.push('cancelled');
  return next;
}

/* ── Позиции заказа (BR-04 — только из справочника) ───────────────────────── */

const SECONDARY_LINE: Record<OrderType, string> = {
  cex: 'Монтаж и выезд бригады',
  office: 'Допечатная подготовка',
  goods: 'Упаковка и комплектация',
};

export function buildItems(order: Order): OrderItem[] {
  const qty = Math.max(order.itemsCount, 1);
  const primaryShare = order.type === 'cex' ? 0.8 : 0.92;
  const unitPrice = Math.floor((order.priceTotal * primaryShare) / qty);
  const primaryTotal = unitPrice * qty;
  const remainder = order.priceTotal - primaryTotal;

  const items: OrderItem[] = [
    {
      id: `${order.id}_itm_1`,
      orderId: order.id,
      catalogServiceId: `srv_${order.type}_001`,
      serviceName: order.title,
      qty,
      unit: 'шт',
      unitPrice,
      ...(order.metaText != null ? { notes: order.metaText } : {}),
    },
  ];

  if (remainder > 0) {
    items.push({
      id: `${order.id}_itm_2`,
      orderId: order.id,
      catalogServiceId: `srv_${order.type}_002`,
      serviceName: SECONDARY_LINE[order.type],
      qty: 1,
      unit: 'усл.',
      unitPrice: remainder,
    });
  }

  return items;
}

/* ── Люди ─────────────────────────────────────────────────────────────────── */

const ROLE_LABELS: Record<string, string> = {
  owner: 'Учредитель',
  production_chief: 'Начальник цеха',
  printer: 'Печатник',
  laser: 'Лазерщик',
  mounter: 'Монтажник',
  carpenter: 'Столяр',
  designer: 'Дизайнер',
  warehouse_keeper: 'Складщик',
  manager_office: 'Менеджер офиса',
  manager_field: 'Менеджер выездной',
  driver: 'Водитель',
  admin: 'Администратор',
};

export function personOf(userId: string) {
  const user = usersFixture.find((u) => u.id === userId);
  return {
    id: userId,
    fullName: user?.fullName ?? 'Сотрудник',
    role: ROLE_LABELS[user?.role ?? ''] ?? 'Сотрудник',
  };
}

/* ── История статусов (BR-20 — каждый переход фиксируется) ────────────────── */

const HISTORY_COMMENTS: Partial<Record<OrderStatus, string>> = {
  measured: 'Замер на объекте, фасад 3×1 м, крепление — люверсы по периметру.',
  client_approval: 'Макет отправлен клиенту на согласование через WebPush + Email.',
  queued: 'Материалы зарезервированы, заказ поставлен в очередь печати.',
  in_qc: 'Проверка геометрии и цветопередачи перед выдачей.',
  defect_rework: 'Зафиксирован брак складщиком, заказ возвращён в производство (BR-17).',
};

function actorFor(status: OrderStatus, order: Order): string {
  if (['designing', 'design_review'].includes(status)) {
    return order.designerId ?? 'usr_009';
  }
  if (['in_production', 'in_qc'].includes(status)) return 'usr_002';
  if (status === 'defect_rework') return 'usr_011';
  return order.managerId;
}

export function buildHistory(order: Order): OrderHistoryEntry[] {
  const route = STATUS_ROUTES[order.type];
  const idx = routeIndex(order.status, route);
  const created = new Date(order.createdAt).getTime();
  const path = route.slice(0, idx + 1);
  if (order.status === 'defect_rework' && !path.includes('defect_rework')) {
    path.push('defect_rework');
  }

  return path.map((status, i) => {
    const comment = HISTORY_COMMENTS[status];
    return {
      id: `${order.id}_hist_${i + 1}`,
      orderId: order.id,
      fromStatus: i === 0 ? null : (path[i - 1] ?? null),
      toStatus: status,
      byUserId: actorFor(status, order),
      at: new Date(created + i * 9 * 3_600_000).toISOString(),
      ...(comment != null ? { comment } : {}),
    };
  });
}

/* ── Производственные операции (BR-10) ────────────────────────────────────── */

const OPERATIONS: Record<OrderType, { name: string; userId: string }[]> = {
  cex: [
    { name: 'Замер на объекте', userId: 'usr_014' },
    { name: 'Дизайн-макет', userId: 'usr_009' },
    { name: 'Широкоформатная печать', userId: 'usr_003' },
    { name: 'Люверсовка и подгибка', userId: 'usr_006' },
    { name: 'Монтаж у клиента', userId: 'usr_007' },
  ],
  office: [
    { name: 'Дизайн-макет', userId: 'usr_009' },
    { name: 'Цифровая печать', userId: 'usr_003' },
    { name: 'Резка в размер', userId: 'usr_005' },
    { name: 'Ламинация', userId: 'usr_004' },
  ],
  goods: [
    { name: 'Комплектация со склада', userId: 'usr_011' },
    { name: 'Проверка комплектности', userId: 'usr_002' },
    { name: 'Упаковка', userId: 'usr_011' },
  ],
};

export function buildOperations(order: Order): OrderOperation[] {
  const specs = OPERATIONS[order.type];
  const progress = STATUS_PROGRESS[order.status];
  const finished = ['ready', 'delivered', 'closed'].includes(order.status);
  const cursor = finished
    ? specs.length
    : Math.min(specs.length, Math.floor(progress * specs.length));
  const created = new Date(order.createdAt).getTime();
  // «Сейчас» бывает только когда заказ действительно в цеху: у заказа в очереди
  // ничего не выполняется, следующая операция ждёт запуска.
  const inWork = ['in_production', 'in_qc', 'defect_rework'].includes(order.status);

  return specs.map((spec, i) => {
    const state: OrderOperation['state'] =
      i < cursor ? 'done' : i === cursor && inWork ? 'active' : 'pending';
    const base: OrderOperation = {
      id: `${order.id}_op_${i + 1}`,
      orderId: order.id,
      name: spec.name,
      state,
    };
    if (state === 'pending') return base;
    return {
      ...base,
      byUserId: spec.userId,
      at: new Date(created + (i + 1) * 11 * 3_600_000).toISOString(),
      ...(state === 'done' ? { minutes: 35 + ((i * 25) % 90) } : {}),
    };
  });
}

/* ── Списанные материалы (BR-01 на заказ, BR-09 FIFO по партиям) ──────────── */

export function buildMaterials(order: Order): OrderMaterialUse[] {
  // Материалы списываются только после старта производства; товар со склада
  // (`goods`) материалы не потребляет — он уменьшает stock (BR-23).
  if (order.type === 'goods') return [];
  if (STATUS_PROGRESS[order.status] < 0.6) return [];

  const seed = Number.parseInt(order.number.slice(-3), 10) || 1;
  const count = order.type === 'cex' ? 3 : 2;

  return Array.from({ length: count }, (_, i) => {
    const material = materialsFixture[(seed * 7 + i * 13) % materialsFixture.length];
    const batch = batchesFixture.find((b) => b.materialId === material?.id);
    return {
      id: `${order.id}_mat_${i + 1}`,
      orderId: order.id,
      materialId: material?.id ?? 'mat_001',
      materialName: material?.name ?? 'Материал',
      batchId: batch?.id ?? 'bat_0001',
      qty: 2 + ((seed + i * 3) % 9),
      unit: material?.unit ?? 'pcs',
      pricePerUnit: batch?.pricePerUnit ?? 100,
      byUserId: 'usr_011',
      at: new Date(new Date(order.createdAt).getTime() + 30 * 3_600_000).toISOString(),
    };
  });
}

/* ── Документы (BR-25 — PDF из шаблонов, хранение в S3 + audit) ───────────── */

export function buildDocuments(order: Order, isB2b: boolean): OrderDocument[] {
  const progress = STATUS_PROGRESS[order.status];
  const issued = new Date(order.createdAt).toISOString();
  const suffix = order.number.slice(-5);

  const docs: OrderDocument[] = [
    {
      id: `${order.id}_doc_inv`,
      orderId: order.id,
      kind: 'invoice',
      number: `СЧ-${suffix}`,
      state: progress >= 0.4 ? 'ready' : 'pending',
      ...(progress >= 0.4 ? { issuedAt: issued, sizeKb: 84 } : {}),
    },
  ];

  if (isB2b) {
    docs.push({
      id: `${order.id}_doc_contract`,
      orderId: order.id,
      kind: 'contract',
      number: `ДГ-${suffix}`,
      state: progress >= 0.4 ? 'ready' : 'pending',
      ...(progress >= 0.4 ? { issuedAt: issued, sizeKb: 132 } : {}),
    });
  }

  docs.push({
    id: `${order.id}_doc_act`,
    orderId: order.id,
    kind: 'act',
    number: `АКТ-${suffix}`,
    state: progress >= 1 ? 'ready' : 'pending',
    ...(progress >= 1 ? { issuedAt: issued, sizeKb: 76 } : {}),
  });

  if (order.type === 'cex') {
    docs.push({
      id: `${order.id}_doc_ttn`,
      orderId: order.id,
      kind: 'ttn',
      number: `ТТН-${suffix}`,
      state: progress >= 0.95 ? 'ready' : 'pending',
      ...(progress >= 0.95 ? { issuedAt: issued, sizeKb: 58 } : {}),
    });
  }

  return docs;
}

/* ── Экономика ────────────────────────────────────────────────────────────── */

const COST_SHARES = {
  materials: 0.45,
  labor: 0.3,
  depreciation: 0.1,
  logistics: 0.08,
  other: 0.07,
} as const;

export function buildCostPlan(order: Order): OrderCostBreakdown {
  const total = order.costEstimate ?? Math.floor(order.priceTotal * 0.6);
  return {
    materials: Math.round(total * COST_SHARES.materials),
    labor: Math.round(total * COST_SHARES.labor),
    depreciation: Math.round(total * COST_SHARES.depreciation),
    logistics: Math.round(total * COST_SHARES.logistics),
    other: Math.round(total * COST_SHARES.other),
  };
}

/** Факт появляется только когда производство реально стартовало. */
export function buildCostFact(order: Order): OrderCostBreakdown | undefined {
  if (STATUS_PROGRESS[order.status] < 0.6) return undefined;
  const plan = buildCostPlan(order);
  const seed = Number.parseInt(order.number.slice(-3), 10) || 1;
  const drift = (offset: number) => 1 + (((seed + offset) % 7) - 3) / 50; // ±6 %
  const fact: OrderCostBreakdown = {
    materials: Math.round(plan.materials * drift(0)),
    labor: Math.round(plan.labor * drift(2)),
    depreciation: plan.depreciation,
    logistics: Math.round(plan.logistics * drift(4)),
    other: plan.other,
  };
  // Брак всегда дороже плана: повторное списание материалов (BR-17).
  if (order.status === 'defect_rework') {
    fact.materials = Math.round(fact.materials * 1.4);
    fact.labor = Math.round(fact.labor * 1.2);
  }
  return fact;
}

export function costTotal(cost: OrderCostBreakdown): number {
  return cost.materials + cost.labor + cost.depreciation + cost.logistics + cost.other;
}

/* ── Оплата (BR-30) и доставка (BR-26) ────────────────────────────────────── */

export function buildPayment(order: Order): OrderPayment {
  const progress = STATUS_PROGRESS[order.status];
  const total = order.priceTotal;
  const base = {
    total,
    note: 'Провайдер эквайринга не выбран (🔴 Q5) — экран показывает состояние оплаты, платёж не проводится.',
    ...(order.dueDate != null ? { dueAt: order.dueDate } : {}),
  };
  if (progress >= 1) return { ...base, state: 'paid', paidAmount: total };
  if (progress >= 0.45) {
    return { ...base, state: 'prepaid', paidAmount: Math.round(total * 0.5) };
  }
  return { ...base, state: 'unpaid', paidAmount: 0 };
}

export function buildDelivery(order: Order, clientAddress?: string): OrderDelivery {
  if (order.type !== 'cex') {
    return { mode: 'pickup', ...(order.dueDate != null ? { plannedAt: order.dueDate } : {}) };
  }
  const seed = Number.parseInt(order.number.slice(-3), 10) || 1;
  const distanceKm = 4 + (seed % 21);
  return {
    mode: 'delivery',
    ...(clientAddress != null ? { address: clientAddress } : {}),
    distanceKm,
    cost: 400 + distanceKm * 35,
    driverUserId: 'usr_016',
    ...(order.dueDate != null ? { plannedAt: order.dueDate } : {}),
  };
}

/* ── Макет (BR-11) ────────────────────────────────────────────────────────── */

export function buildArtwork(order: Order): OrderArtwork | undefined {
  if (order.type === 'goods') return undefined;
  const progress = STATUS_PROGRESS[order.status];
  if (progress < 0.25) return undefined;

  const decision: OrderArtwork['clientDecision'] =
    order.status === 'client_approval' ? 'pending' : progress > 0.4 ? 'approved' : 'pending';

  return {
    fileName: `${order.number}-maket-v${progress > 0.4 ? 2 : 1}.pdf`,
    version: progress > 0.4 ? 2 : 1,
    uploadedAt: new Date(new Date(order.createdAt).getTime() + 20 * 3_600_000).toISOString(),
    chiefApproved: progress >= 0.4,
    clientDecision: decision,
  };
}

/* ── Брак (BR-03 — фиксирует только складщик) ─────────────────────────────── */

export function buildDefect(order: Order): OrderDetail['defect'] {
  if (order.status !== 'defect_rework') return undefined;
  return {
    at: new Date(new Date(order.createdAt).getTime() + 40 * 3_600_000).toISOString(),
    reason: 'Полосы на печати по левому краю, 0.4 м² в брак. Материал списан повторно.',
    byUserId: 'usr_011',
  };
}

/* ── Сборка полной карточки ───────────────────────────────────────────────── */

export function buildOrderDetail(order: Order): OrderDetail {
  const client = clientsFixture.find((c) => c.id === order.clientId);
  const isB2b = client?.type === 'b2b';

  const operations = buildOperations(order);
  const materials = buildMaterials(order);
  const history = buildHistory(order);
  const delivery = buildDelivery(order, client?.address);
  const defect = buildDefect(order);

  // Все, кого карточка упоминает по id — UI не должен догружать справочник.
  const staffIds = new Set<string>([
    order.managerId,
    ...(order.designerId != null ? [order.designerId] : []),
    ...operations.flatMap((o) => (o.byUserId != null ? [o.byUserId] : [])),
    ...materials.map((m) => m.byUserId),
    ...history.map((h) => h.byUserId),
    ...(delivery.driverUserId != null ? [delivery.driverUserId] : []),
    ...(defect != null ? [defect.byUserId] : []),
  ]);

  const detail: OrderDetail = {
    order,
    client: {
      id: order.clientId,
      name: client?.name ?? 'Клиент',
      type: client?.type ?? 'individual',
      phone: client?.phone ?? '+79990000000',
      ...(client?.email != null ? { email: client.email } : {}),
      ...(client?.inn != null ? { inn: client.inn } : {}),
      ...(client?.address != null ? { address: client.address } : {}),
    },
    manager: personOf(order.managerId),
    staff: [...staffIds].map(personOf),
    items: buildItems(order),
    history,
    operations,
    materials,
    documents: buildDocuments(order, isB2b),
    costPlan: buildCostPlan(order),
    payment: buildPayment(order),
    delivery,
    statusRoute: STATUS_ROUTES[order.type],
    nextStatuses: nextStatusesFor(order),
  };

  if (order.designerId != null) detail.designer = personOf(order.designerId);
  const costFact = buildCostFact(order);
  if (costFact != null) detail.costFact = costFact;
  const artwork = buildArtwork(order);
  if (artwork != null) detail.artwork = artwork;
  if (defect != null) detail.defect = defect;

  return detail;
}

/* ── Клиентская проекция (BR-32) ──────────────────────────────────────────── */

const CLIENT_STAGES: Record<OrderType, { key: string; label: string; from: number }[]> = {
  cex: [
    { key: 'accepted', label: 'Заказ принят', from: 0 },
    { key: 'design', label: 'Дизайн', from: 0.25 },
    { key: 'approval', label: 'Согласование', from: 0.4 },
    { key: 'production', label: 'Производство', from: 0.45 },
    { key: 'ready', label: 'Готов', from: 0.95 },
    { key: 'delivered', label: 'Доставлен', from: 1 },
  ],
  office: [
    { key: 'accepted', label: 'Заказ принят', from: 0 },
    { key: 'design', label: 'Дизайн', from: 0.25 },
    { key: 'approval', label: 'Согласование', from: 0.4 },
    { key: 'production', label: 'Печать', from: 0.45 },
    { key: 'ready', label: 'Готов', from: 0.95 },
    { key: 'delivered', label: 'Выдан', from: 1 },
  ],
  goods: [
    { key: 'accepted', label: 'Заказ принят', from: 0 },
    { key: 'picking', label: 'Комплектация', from: 0.45 },
    { key: 'ready', label: 'Готов к выдаче', from: 0.95 },
    { key: 'delivered', label: 'Выдан', from: 1 },
  ],
};

export function buildClientStages(order: Order): OrderClientStage[] {
  const defs = CLIENT_STAGES[order.type];
  const progress = STATUS_PROGRESS[order.status];
  const allDone = ['delivered', 'closed'].includes(order.status);

  let cursor = 0;
  defs.forEach((stage, i) => {
    if (progress >= stage.from) cursor = i;
  });

  return defs.map((stage, i) => ({
    key: stage.key,
    label: stage.label,
    state: allDone || i < cursor ? 'done' : i === cursor ? 'current' : 'pending',
  }));
}

/** Человеко-читаемые подписи переходов для клиентской ленты. */
const CLIENT_TIMELINE_LABELS: Partial<Record<OrderStatus, string>> = {
  lead: 'Заявка принята',
  measured: 'Замер выполнен',
  designing: 'Дизайнер приступил к макету',
  client_approval: 'Макет отправлен вам на согласование',
  queued: 'Заказ принят в работу',
  in_production: 'Заказ в производстве',
  in_qc: 'Проверка качества',
  ready: 'Заказ готов',
  delivered: 'Заказ выдан',
  closed: 'Заказ закрыт',
  defect_rework: 'Переделка по контролю качества',
};

/**
 * Клиентская проекция: без себестоимости, без сотрудников, без внутренних
 * переходов и без списаний материалов (BR-32).
 */
export function toClientDetail(detail: OrderDetail): OrderClientDetail {
  const { costEstimate: _c, costActual: _a, managerId: _m, designerId: _d, ...order } =
    detail.order;
  // Водитель — тоже данные сотрудника: клиенту отдаём доставку без исполнителя.
  const { driverUserId: _driver, ...delivery } = detail.delivery;

  const clientDetail: OrderClientDetail = {
    order,
    items: detail.items.map(({ catalogServiceId: _s, ...item }) => item),
    timeline: detail.history
      .filter((h) => CLIENT_TIMELINE_LABELS[h.toStatus] != null)
      .map((h) => ({
        id: h.id,
        label: CLIENT_TIMELINE_LABELS[h.toStatus] ?? h.toStatus,
        at: h.at,
        // Комментарии менеджера внутренние — клиенту отдаём только по согласованию макета.
        ...(h.toStatus === 'client_approval' && h.comment != null ? { comment: h.comment } : {}),
      })),
    documents: detail.documents,
    payment: detail.payment,
    delivery,
    clientStages: buildClientStages(detail.order),
  };

  if (detail.artwork != null) clientDetail.artwork = detail.artwork;
  return clientDetail;
}
