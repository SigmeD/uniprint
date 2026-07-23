import type {
  Order,
  OrderArtworkDecision,
  OrderDetail,
  OrderHistoryEntry,
  OrderStatus,
} from '@uniprint/types';
import { ordersFixture } from '../fixtures/orders';
import { buildOrderDetail, nextStatusesFor } from '../fixtures/order-detail';

/**
 * Мутируемое состояние заказов на время сессии прототипа.
 *
 * Базовые данные выводятся из фикстуры (`buildOrderDetail`), а всё, что
 * меняется во время демо — смена статуса, комментарии, решение клиента по
 * макету — копится здесь и накладывается сверху. Так демо остаётся живым, а
 * фикстуры — чистыми и детерминированными.
 */

// Копии, а не ссылки на фикстуру: смена статуса во время демо не должна
// протекать в исходные данные.
export const orders: Order[] = ordersFixture.map((o) => ({ ...o }));

interface OrderOverlay {
  /** Материализованная история: с момента первой мутации ведём её сами. */
  history?: OrderHistoryEntry[];
  artworkDecision?: { decision: OrderArtworkDecision; comment?: string };
}

const overlays = new Map<string, OrderOverlay>();

export function findOrder(id: string): Order | undefined {
  return orders.find((o) => o.id === id);
}

export function addOrder(order: Order): void {
  orders.unshift(order);
}

/**
 * Фиксирует историю в её текущем (выведенном) виде, чтобы дальше дополнять
 * реальными событиями вместо повторного вывода из статуса.
 */
function materializeHistory(order: Order): OrderHistoryEntry[] {
  const overlay = overlays.get(order.id) ?? {};
  if (overlay.history == null) {
    overlay.history = buildOrderDetail(order).history;
    overlays.set(order.id, overlay);
  }
  return overlay.history;
}

export function getOrderDetail(id: string): OrderDetail | undefined {
  const order = findOrder(id);
  if (order == null) return undefined;

  const detail = buildOrderDetail(order);
  const overlay = overlays.get(id);
  if (overlay == null) return detail;

  if (overlay.history != null) detail.history = overlay.history;
  if (overlay.artworkDecision != null && detail.artwork != null) {
    detail.artwork = {
      ...detail.artwork,
      clientDecision: overlay.artworkDecision.decision,
      ...(overlay.artworkDecision.comment != null
        ? { clientComment: overlay.artworkDecision.comment }
        : {}),
    };
  }
  return detail;
}

/** Проверка перехода по статус-машине типа заказа (BR-07). */
export function canTransition(order: Order, to: OrderStatus): boolean {
  return nextStatusesFor(order).includes(to);
}

/**
 * Смена статуса с записью в историю — каждый переход фиксируется (BR-20).
 * Возвращает обновлённый заказ либо `null`, если переход запрещён.
 */
export function transitionOrder(
  order: Order,
  to: OrderStatus,
  byUserId: string,
  comment?: string,
): Order | null {
  if (!canTransition(order, to)) return null;

  const history = materializeHistory(order);
  const from = order.status;
  order.status = to;
  order.updatedAt = new Date().toISOString();

  history.push({
    id: `${order.id}_hist_${history.length + 1}`,
    orderId: order.id,
    fromStatus: from,
    toStatus: to,
    byUserId,
    at: order.updatedAt,
    ...(comment != null && comment.length > 0 ? { comment } : {}),
  });

  return order;
}

/** Комментарий без смены статуса — отдельная запись в журнале заказа. */
export function appendComment(
  order: Order,
  byUserId: string,
  comment: string,
): OrderHistoryEntry {
  const history = materializeHistory(order);
  const entry: OrderHistoryEntry = {
    id: `${order.id}_hist_${history.length + 1}`,
    orderId: order.id,
    fromStatus: order.status,
    toStatus: order.status,
    byUserId,
    at: new Date().toISOString(),
    comment,
  };
  history.push(entry);
  return entry;
}

/** Решение клиента по макету (BR-11 — согласование до производства). */
export function setArtworkDecision(
  order: Order,
  decision: OrderArtworkDecision,
  comment?: string,
): void {
  const overlay = overlays.get(order.id) ?? {};
  overlay.artworkDecision = {
    decision,
    ...(comment != null && comment.length > 0 ? { comment } : {}),
  };
  overlays.set(order.id, overlay);
}

/** Сброс мутаций — используется в юнит-тестах. */
export function resetOrderStore(): void {
  overlays.clear();
  orders.length = 0;
  orders.push(...ordersFixture.map((o) => ({ ...o })));
}
