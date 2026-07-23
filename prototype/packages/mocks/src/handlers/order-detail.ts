import { http, HttpResponse } from 'msw';
import type { OrderArtworkDecision, OrderStatus } from '@uniprint/types';
import { toClientDetail } from '../fixtures/order-detail';
import {
  appendComment,
  findOrder,
  getOrderDetail,
  setArtworkDecision,
  transitionOrder,
} from '../store/order-store';

/** Кто выполняет действие в прототипе (в проде — из сессии). */
const MANAGER_ID = 'usr_012';

export const orderDetailHandlers = [
  /**
   * Карточка заказа. `?scope=client` отдаёт проекцию клиента — без
   * себестоимости, сотрудников, списаний и внутренних комментариев (BR-32).
   * Ограничение применяется на стороне API, а не пряталось бы в UI.
   */
  http.get('/api/orders/:id/detail', ({ params, request }) => {
    const detail = getOrderDetail(String(params.id));
    if (detail == null) return new HttpResponse(null, { status: 404 });

    const scope = new URL(request.url).searchParams.get('scope');
    if (scope === 'client') return HttpResponse.json(toClientDetail(detail));
    return HttpResponse.json(detail);
  }),

  /**
   * Смена статуса. Переход проверяется по статус-машине типа заказа (BR-07),
   * каждый переход пишется в историю (BR-20).
   */
  http.patch('/api/orders/:id/status', async ({ params, request }) => {
    const order = findOrder(String(params.id));
    if (order == null) return new HttpResponse(null, { status: 404 });

    const body = (await request.json()) as { status: OrderStatus; comment?: string };
    const updated = transitionOrder(order, body.status, MANAGER_ID, body.comment);
    if (updated == null) {
      return HttpResponse.json(
        { error: `Переход ${order.status} → ${body.status} не разрешён статус-машиной (BR-07)` },
        { status: 409 },
      );
    }
    return HttpResponse.json(getOrderDetail(order.id));
  }),

  /** Комментарий в журнал заказа без смены статуса. */
  http.post('/api/orders/:id/comments', async ({ params, request }) => {
    const order = findOrder(String(params.id));
    if (order == null) return new HttpResponse(null, { status: 404 });

    const body = (await request.json()) as { comment?: string; byUserId?: string };
    const text = body.comment?.trim();
    if (text == null || text.length === 0) {
      return HttpResponse.json({ error: 'comment required' }, { status: 400 });
    }
    appendComment(order, body.byUserId ?? MANAGER_ID, text);
    return HttpResponse.json(getOrderDetail(order.id), { status: 201 });
  }),

  /**
   * Решение клиента по макету (BR-11). Согласование двигает заказ в очередь,
   * доработка возвращает его дизайнеру.
   */
  http.post('/api/orders/:id/artwork-decision', async ({ params, request }) => {
    const order = findOrder(String(params.id));
    if (order == null) return new HttpResponse(null, { status: 404 });

    const body = (await request.json()) as {
      decision: OrderArtworkDecision;
      comment?: string;
    };
    if (body.decision !== 'approved' && body.decision !== 'rework') {
      return HttpResponse.json({ error: 'decision must be approved | rework' }, { status: 400 });
    }

    setArtworkDecision(order, body.decision, body.comment);

    if (order.status === 'client_approval') {
      const target: OrderStatus = body.decision === 'approved' ? 'queued' : 'designing';
      const comment =
        body.decision === 'approved'
          ? 'Клиент согласовал макет в личном кабинете.'
          : `Клиент отправил макет на доработку${body.comment != null ? `: ${body.comment}` : ''}`;
      // Доработка — движение назад по маршруту, статус-машина такой переход
      // не разрешает, поэтому пишем его отдельным комментарием в журнал.
      // Комментарий добавляем до смены статуса: история фиксируется по
      // состоянию заказа на момент первой мутации.
      if (target === 'queued') {
        transitionOrder(order, target, order.managerId, comment);
      } else {
        appendComment(order, order.managerId, comment);
        order.status = 'designing';
        order.updatedAt = new Date().toISOString();
      }
    }

    return HttpResponse.json(getOrderDetail(order.id));
  }),
];
