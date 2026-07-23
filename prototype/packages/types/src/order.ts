import type { MaterialUnit } from './material';

export type OrderType = 'cex' | 'office' | 'goods';

export type OrderStatus =
  | 'draft' | 'lead' | 'measured' | 'designing' | 'design_review'
  | 'client_approval' | 'queued' | 'in_production' | 'in_qc'
  | 'defect_rework' | 'ready' | 'delivered' | 'closed' | 'cancelled';

export interface Order {
  id: string;
  number: string;
  type: OrderType;
  status: OrderStatus;
  clientId: string;
  managerId: string;
  designerId?: string;
  branchId: 'main';
  title: string;
  itemsCount: number;
  priceTotal: number;
  costEstimate?: number;
  costActual?: number;
  dueDate?: string;
  /** Optional human meta для display в orders table (например «люверсы, ПВХ 440 г/м²»). */
  metaText?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  catalogServiceId: string;
  /** Название услуги из справочника — ручной ввод запрещён (BR-04). */
  serviceName: string;
  qty: number;
  unit: string;
  unitPrice: number;
  notes?: string;
}

export interface OrderHistoryEntry {
  id: string;
  orderId: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  byUserId: string;
  at: string;
  comment?: string;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Детальная карточка заказа
 *
 * Агрегат, который отдаёт `GET /api/orders/:id/detail`. Собирается из заказа +
 * связанных сущностей (позиции, операции, списания, документы, оплата,
 * доставка, макет). Клиентский кабинет получает урезанную версию —
 * `OrderClientDetail` (BR-32: без себестоимости и данных сотрудников).
 * ──────────────────────────────────────────────────────────────────────────── */

export type OrderOperationState = 'done' | 'active' | 'pending';

/** Операция производственного маршрута (BR-10 — время фиксируется). */
export interface OrderOperation {
  id: string;
  orderId: string;
  name: string;
  state: OrderOperationState;
  byUserId?: string;
  /** Затраченное время в минутах — только для завершённых операций. */
  minutes?: number;
  at?: string;
}

/** Списание материала на заказ по конкретной партии (BR-01 + BR-09 FIFO). */
export interface OrderMaterialUse {
  id: string;
  orderId: string;
  materialId: string;
  materialName: string;
  batchId: string;
  qty: number;
  unit: MaterialUnit;
  pricePerUnit: number;
  byUserId: string;
  at: string;
}

export type OrderDocumentKind = 'invoice' | 'contract' | 'act' | 'ttn';

/** Документ заказа — PDF из шаблона, хранится в S3 + audit (BR-25). */
export interface OrderDocument {
  id: string;
  orderId: string;
  kind: OrderDocumentKind;
  number: string;
  state: 'ready' | 'pending';
  issuedAt?: string;
  sizeKb?: number;
}

/** Разбивка себестоимости. Клиенту не отдаётся никогда (BR-32). */
export interface OrderCostBreakdown {
  materials: number;
  labor: number;
  depreciation: number;
  logistics: number;
  other: number;
}

export type OrderPaymentState = 'unpaid' | 'prepaid' | 'paid';

/** Оплата заказа — синхронизирована со статусом производства (BR-30). */
export interface OrderPayment {
  state: OrderPaymentState;
  total: number;
  paidAmount: number;
  dueAt?: string;
  note?: string;
}

export type OrderDeliveryMode = 'pickup' | 'delivery';

/** Доставка — стоимость считается по Yandex Maps + формуле § 7.18 (BR-26). */
export interface OrderDelivery {
  mode: OrderDeliveryMode;
  address?: string;
  distanceKm?: number;
  cost?: number;
  driverUserId?: string;
  plannedAt?: string;
}

export type OrderArtworkDecision = 'pending' | 'approved' | 'rework';

export interface OrderArtwork {
  fileName: string;
  version: number;
  uploadedAt: string;
  /** BR-11 — без проверки руководителем макет не уходит в производство. */
  chiefApproved: boolean;
  clientDecision: OrderArtworkDecision;
  clientComment?: string;
}

export interface OrderPerson {
  id: string;
  fullName: string;
  role: string;
}

export interface OrderDefect {
  at: string;
  reason: string;
  /** Всегда складщик — производство брак не фиксирует (BR-03). */
  byUserId: string;
}

/** Полная карточка заказа — scope менеджера / админа / учредителя. */
export interface OrderDetail {
  order: Order;
  client: {
    id: string;
    name: string;
    type: string;
    phone: string;
    email?: string;
    inn?: string;
    address?: string;
  };
  manager: OrderPerson;
  designer?: OrderPerson;
  /** Все сотрудники, упомянутые в карточке — чтобы UI не догружал справочник. */
  staff: OrderPerson[];
  items: OrderItem[];
  history: OrderHistoryEntry[];
  operations: OrderOperation[];
  materials: OrderMaterialUse[];
  documents: OrderDocument[];
  costPlan: OrderCostBreakdown;
  /** Факт появляется только после старта производства. */
  costFact?: OrderCostBreakdown;
  payment: OrderPayment;
  delivery: OrderDelivery;
  artwork?: OrderArtwork;
  defect?: OrderDefect;
  /** Полный маршрут статус-машины типа заказа (BR-07) — для степпера. */
  statusRoute: OrderStatus[];
  /** Разрешённые переходы из текущего статуса. */
  nextStatuses: OrderStatus[];
}

/** Заказ глазами клиента: без себестоимости и без сотрудников (BR-32). */
export type OrderClientView = Omit<
  Order,
  'costEstimate' | 'costActual' | 'managerId' | 'designerId'
>;

export interface OrderClientStage {
  key: string;
  label: string;
  state: 'done' | 'current' | 'pending';
}

/** Урезанная карточка заказа для `client-portal` (BR-32). */
export interface OrderClientDetail {
  order: OrderClientView;
  items: Array<Omit<OrderItem, 'catalogServiceId'>>;
  /** Клиентская лента: только те переходы, которые клиенту видны. */
  timeline: Array<{ id: string; label: string; at: string; comment?: string }>;
  documents: OrderDocument[];
  payment: OrderPayment;
  delivery: OrderDelivery;
  artwork?: OrderArtwork;
  clientStages: OrderClientStage[];
}
