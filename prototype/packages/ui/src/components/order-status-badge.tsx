import type { OrderStatus } from '@uniprint/types';
import { StatPill, type StatPillTone } from './stat-pill';

/**
 * OrderStatusBadge — отображение статуса заказа единым визуальным языком
 * со StatPill (Kanban). Перенаправляет в StatPill через статус-to-tone маппинг
 * — все 6 кабинетов получают одни и те же яркие цвета без расхождений.
 *
 * Если нужно использовать кастомный лейбл/тон (на Kanban-карточках сокращения
 * вроде «Печать» вместо «В производстве»), бери StatPill напрямую.
 */

interface PillSpec {
  tone: StatPillTone;
  label: string;
  pulse: boolean;
}

const STATUS_TO_PILL: Record<OrderStatus, PillSpec> = {
  draft:           { tone: 'neutral', label: 'Черновик',                pulse: false },
  lead:            { tone: 'queue',   label: 'Лид',                     pulse: false },
  measured:        { tone: 'queue',   label: 'Замер сделан',            pulse: false },
  designing:       { tone: 'design',  label: 'На дизайне',              pulse: true  },
  design_review:   { tone: 'review',  label: 'Проверка макета',         pulse: false },
  client_approval: { tone: 'design',  label: 'Согласование с клиентом', pulse: true  },
  queued:          { tone: 'queue',   label: 'В очереди',               pulse: false },
  in_production:   { tone: 'work',    label: 'В производстве',          pulse: true  },
  in_qc:           { tone: 'review',  label: 'На контроле',             pulse: false },
  defect_rework:   { tone: 'defect',  label: 'Брак / переделка',        pulse: true  },
  ready:           { tone: 'done',    label: 'Готов',                   pulse: false },
  delivered:       { tone: 'done',    label: 'Выдан',                   pulse: false },
  closed:          { tone: 'neutral', label: 'Закрыт',                  pulse: false },
  cancelled:       { tone: 'neutral', label: 'Отменён',                 pulse: false },
};

/**
 * Человеко-читаемые названия статусов — единый словарь для бейджей, степпера
 * и списков выбора следующего статуса.
 */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = Object.fromEntries(
  Object.entries(STATUS_TO_PILL).map(([status, spec]) => [status, spec.label]),
) as Record<OrderStatus, string>;

export interface OrderStatusBadgeProps {
  status: OrderStatus;
  /** @deprecated не влияет — StatPill сам выбирает размер. */
  size?: 'sm' | 'md';
  /** @deprecated StatPill всегда показывает dot. */
  withDot?: boolean;
  className?: string;
}

export const OrderStatusBadge = ({ status, className }: OrderStatusBadgeProps) => {
  const spec = STATUS_TO_PILL[status];
  return (
    <StatPill
      tone={spec.tone}
      pulse={spec.pulse}
      {...(className != null ? { className } : {})}
    >
      {spec.label}
    </StatPill>
  );
};
OrderStatusBadge.displayName = 'OrderStatusBadge';
