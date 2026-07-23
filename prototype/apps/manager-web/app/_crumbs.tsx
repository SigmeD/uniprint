'use client';
import { AutoCrumbs, type CrumbsResolver } from '@uniprint/ui';

const resolve: CrumbsResolver = (pathname) => {
  if (pathname === '/' || pathname === '') return [{ label: 'Дашборд' }];
  if (pathname === '/leads') return [{ label: 'Лиды' }];
  if (pathname === '/orders') return [{ label: 'Заказы' }];
  if (pathname === '/orders/new')
    return [{ label: 'Заказы', href: '/orders' }, { label: 'Новый заказ' }];
  if (pathname.startsWith('/orders/'))
    return [{ label: 'Заказы', href: '/orders' }, { label: 'Карточка заказа' }];
  return [];
};

export function ManagerCrumbs() {
  return <AutoCrumbs rootLabel="Менеджер" resolve={resolve} />;
}
