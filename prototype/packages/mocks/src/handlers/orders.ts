import { http, HttpResponse } from 'msw';
import type { Order } from '@uniprint/types';
import { addOrder, findOrder, orders } from '../store/order-store';

export const orderHandlers = [
  http.get('/api/orders', ({ request }) => {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const status = url.searchParams.get('status');
    const clientId = url.searchParams.get('clientId');
    let filtered = orders;
    if (type) filtered = filtered.filter((o) => o.type === type);
    if (status) filtered = filtered.filter((o) => o.status === status);
    if (clientId) filtered = filtered.filter((o) => o.clientId === clientId);
    return HttpResponse.json({ items: filtered, total: filtered.length });
  }),

  http.get('/api/orders/:id', ({ params }) => {
    const order = findOrder(String(params.id));
    if (!order) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(order);
  }),

  http.post('/api/orders', async ({ request }) => {
    const body = (await request.json()) as Partial<Order>;
    if (!body.type || !body.clientId || !body.title) {
      return HttpResponse.json({ error: 'type, clientId, title required (BR-04, BR-07)' }, { status: 400 });
    }
    const newOrder: Order = {
      id: `ord_${String(orders.length + 1).padStart(4, '0')}`,
      number: `UNI-2026-${String(orders.length + 1).padStart(5, '0')}`,
      type: body.type,
      status: 'draft',
      clientId: body.clientId,
      managerId: body.managerId ?? 'usr_012',
      branchId: 'main',
      title: body.title,
      itemsCount: body.itemsCount ?? 1,
      priceTotal: body.priceTotal ?? 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addOrder(newOrder);
    return HttpResponse.json(newOrder, { status: 201 });
  }),
];
