import { orderHandlers } from './orders';
import { orderDetailHandlers } from './order-detail';
import { leadHandlers } from './leads';
import { clientHandlers } from './clients';
import { materialHandlers } from './materials';
import { userHandlers } from './users';
import { faceControlHandlers } from './face-control';

export const handlers = [
  // Детальные роуты идут первыми: `/api/orders/:id/detail` не должен
  // перехватываться более общим `/api/orders/:id`.
  ...orderDetailHandlers,
  ...orderHandlers,
  ...leadHandlers,
  ...clientHandlers,
  ...materialHandlers,
  ...userHandlers,
  ...faceControlHandlers,
];
