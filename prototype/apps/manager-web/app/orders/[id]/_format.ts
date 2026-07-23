import type { OrderDocumentKind, OrderType } from '@uniprint/types';

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  cex: 'услуга-цех',
  office: 'услуга-офис',
  goods: 'продажа-товар',
};

export const ORDER_TYPE_HINT: Record<OrderType, string> = {
  cex: 'Наружная реклама: замер → дизайн → печать → монтаж',
  office: 'Оперативная полиграфия: дизайн → печать → постпечать',
  goods: 'Продажа готового товара со склада',
};

export const DOC_KIND_LABELS: Record<OrderDocumentKind, string> = {
  invoice: 'Счёт на оплату',
  contract: 'Договор-оферта',
  act: 'Акт выполненных работ',
  ttn: 'Транспортная накладная',
};

export const MATERIAL_UNIT_LABELS: Record<string, string> = {
  pcs: 'шт',
  m2: 'м²',
  lm: 'м.п.',
  kg: 'кг',
  l: 'л',
};

export const fmtDate = (iso?: string): string =>
  iso == null ? '—' : new Date(iso).toLocaleDateString('ru-RU');

export const fmtDateTime = (iso: string): string =>
  new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export const fmtMinutes = (minutes?: number): string => {
  if (minutes == null) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} мин`;
  return m === 0 ? `${h} ч` : `${h} ч ${m} мин`;
};
