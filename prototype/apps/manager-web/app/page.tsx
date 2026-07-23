'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import {
  AnimatedCounter,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  KanbanBoard,
  KanbanCard,
  KanbanColumn,
  KpiCard,
  OrderStatusBadge,
  PageHeader,
  RoleTag,
  Skeleton,
  StatPill,
  Tabs,
} from '@uniprint/ui';
import type { KanbanCardAssignee, StatPillTone, TabItem } from '@uniprint/ui';
import {
  CalendarCheck,
  CircleDollarSign,
  Clock,
  Download,
  Inbox,
  Package,
  Sparkles,
} from 'lucide-react';
import type { Client, Order, OrderStatus, OrderType } from '@uniprint/types';

const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  cex: 'услуга-цех',
  office: 'услуга-офис',
  goods: 'продажа-товар',
};

type ColId = 'design' | 'queue' | 'work' | 'done';
type ColTone = 'lead' | 'design' | 'work' | 'done';

function orderToColumn(status: OrderStatus): ColId | null {
  if (['designing', 'design_review', 'client_approval'].includes(status)) return 'design';
  if (['queued', 'draft', 'lead', 'measured'].includes(status)) return 'queue';
  if (['in_production', 'in_qc', 'defect_rework'].includes(status)) return 'work';
  if (['ready', 'delivered', 'closed'].includes(status)) return 'done';
  return null;
}

const COLUMNS: { id: ColId; tone: ColTone; title: string }[] = [
  { id: 'design', tone: 'design', title: 'Лиды / Дизайн' },
  { id: 'queue', tone: 'lead', title: 'В очереди' },
  { id: 'work', tone: 'work', title: 'В производстве' },
  { id: 'done', tone: 'done', title: 'Готовы / Выданы' },
];

// Demo-only: override клиентов в таблице «Все заказы за сегодня» — fixture
// держит UNI-00001..00006 на cli_001 (ради 6-orders demo в client-portal),
// но manager.png reference показывает разных клиентов per строке. Override
// применяется только на отображение в этой таблице, не меняет данные.
const TABLE_CLIENT_OVERRIDE_BY_CLI: Record<string, Record<string, string>> = {
  cli_001: {
    'UNI-2026-00002': 'ИП Воронов',
    'UNI-2026-00003': 'ООО «Маяк»',
    'UNI-2026-00004': 'Кофейня «Бариста»',
    'UNI-2026-00005': 'ИП Грачёв',
    'UNI-2026-00006': 'ООО «Север»',
  },
};

// Demo-only: per-card avatar map matching manager.png reference.
// In prod: derive from order.designerId / managerId via /api/users.
const ASSIGNEE_BY_NUMBER: Record<string, KanbanCardAssignee> = {
  'UNI-2026-00007': { initials: 'ЕС', tone: 'violet' },
  'UNI-2026-00008': { initials: 'МИ', tone: 'blue' },
  'UNI-2026-00001': { initials: 'ИП', tone: 'green' },
  'UNI-2026-00009': { initials: 'АК', tone: 'green' },
  'UNI-2026-00002': { initials: 'АК', tone: 'green' },
  'UNI-2026-00003': { initials: 'ДС', tone: 'amber' },
  'UNI-2026-00004': { initials: 'ДС', tone: 'amber' },
  'UNI-2026-00005': { initials: 'МИ', tone: 'blue' },
};

// Short pill labels for Kanban cards (sокращения вроде «Печать» вместо «В производстве»;
// для табличного представления статусов используется OrderStatusBadge с полными названиями).
function cardPill(status: OrderStatus): { tone: StatPillTone; label: string } | null {
  switch (status) {
    case 'client_approval':
      return { tone: 'design', label: 'Согласование' };
    case 'in_production':
      return { tone: 'work', label: 'Печать' };
    case 'in_qc':
      return { tone: 'review', label: 'На контроле' };
    case 'ready':
      return { tone: 'done', label: 'Готов' };
    case 'delivered':
      return { tone: 'done', label: 'Выдан' };
    default:
      return null;
  }
}

const ORDER_TABS: TabItem[] = [
  { value: 'kanban', label: 'Канбан' },
  { value: 'list', label: 'Список' },
  { value: 'calendar', label: 'Календарь' },
];

export default function ManagerDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('kanban');

  useEffect(() => {
    Promise.all([
      fetch('/api/orders').then((r) => r.json()),
      fetch('/api/clients').then((r) => r.json()),
    ]).then(([o, c]) => {
      setOrders(o.items ?? []);
      setClients(c.items ?? []);
      setLoading(false);
    });
  }, []);

  const clientName = (id: string) => clients.find((c) => c.id === id)?.name ?? id;
  // Display-only override для таблицы (не для Kanban): см. TABLE_CLIENT_OVERRIDE_BY_CLI.
  const tableClientName = (clientId: string, orderNumber: string) =>
    TABLE_CLIENT_OVERRIDE_BY_CLI[clientId]?.[orderNumber] ?? clientName(clientId);

  const columnOrders = (col: ColId) =>
    orders.filter((o) => orderToColumn(o.status) === col).slice(0, 2);

  const kanbanTotalCount = COLUMNS.reduce((sum, col) => sum + columnOrders(col.id).length, 0);
  const tableRowCount = Math.min(orders.length, 8);

  const timeLabel = new Date().toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const countBadgeStyle = {
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    fontSize: 11,
    background: 'var(--color-surface-2)',
    color: 'var(--color-ink-3)',
    padding: '3px 8px',
    borderRadius: 99,
  } as const;

  return (
    <div className="py-6 md:py-8">
      <RoleTag tone="manager">Менеджер офиса</RoleTag>

      <PageHeader
        title={`Сегодня, ${timeLabel}`}
        accentText={timeLabel}
        description="Обзор активности на сегодня — лиды, заказы, согласования. Уведомления приходят через WebPush + Email."
        border={false}
        className="px-0 pb-6"
      />

      {/* KPI cols-5 — hardcoded baseline per manager.png reference */}
      <div className="mb-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {loading ? (
          [0, 1, 2, 3, 4].map((i) => <Skeleton key={i} variant="rect" className="h-24" />)
        ) : (
          <>
            <KpiCard
              label="Новых лидов"
              value={<AnimatedCounter value={3} />}
              icon={<Sparkles className="h-4 w-4" />}
              trend="up"
              trendIsGood
              delta="конверсия 62%"
            />
            <KpiCard
              label="В производстве"
              value={<AnimatedCounter value={6} />}
              icon={<Package className="h-4 w-4" />}
              trend="flat"
              delta="из 30 заказов"
            />
            <KpiCard
              label="Всего заказов"
              value={<AnimatedCounter value={30} />}
              icon={<CalendarCheck className="h-4 w-4" />}
              trend="up"
              trendIsGood
              delta="+4 сегодня"
            />
            <KpiCard
              label="Согласование"
              value={<AnimatedCounter value={2} />}
              icon={<Clock className="h-4 w-4" />}
              trend="down"
              trendIsGood
              delta="просрочены 0"
            />
            <KpiCard
              label="Выручка дня"
              value={<AnimatedCounter value={160} />}
              unit="к ₽"
              icon={<CircleDollarSign className="h-4 w-4" />}
              trend="up"
              trendIsGood
              delta="+18% к плану"
            />
          </>
        )}
      </div>

      {/* Active orders Kanban */}
      <Card className="mb-6">
        <CardHeader className="flex-row items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2.5">
            Активные заказы
            <span style={countBadgeStyle}>{kanbanTotalCount}</span>
          </CardTitle>
          <Tabs items={ORDER_TABS} value={activeTab} onChange={setActiveTab} />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton variant="rect" className="h-48" />
          ) : orders.length === 0 ? (
            <EmptyState
              icon={<Inbox className="h-6 w-6" />}
              title="Заказов пока нет"
              description="Новые заказы появятся здесь."
            />
          ) : (
            <KanbanBoard>
              {COLUMNS.map((col) => {
                const cards = columnOrders(col.id);
                return (
                  <KanbanColumn
                    key={col.id}
                    title={col.title}
                    tone={col.tone}
                    count={cards.length}
                  >
                    {cards.length === 0 ? (
                      <p className="py-4 text-center text-[11.5px] text-[var(--color-ink-4)]">
                        Пусто
                      </p>
                    ) : (
                      cards.map((o) => {
                        const pill = cardPill(o.status);
                        const assignee = ASSIGNEE_BY_NUMBER[o.number];
                        const metaLabel = pill ? (
                          <StatPill tone={pill.tone}>{pill.label}</StatPill>
                        ) : (
                          <span>{o.metaText ?? clientName(o.clientId)}</span>
                        );
                        return (
                          <KanbanCard
                            key={o.id}
                            id={o.number}
                            title={o.title}
                            meta={metaLabel}
                            href={`/orders/${o.id}`}
                            {...(assignee != null ? { assignee } : {})}
                          />
                        );
                      })
                    )}
                  </KanbanColumn>
                );
              })}
            </KanbanBoard>
          )}
        </CardContent>
      </Card>

      {/* All today's orders — table */}
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2.5">
            Все заказы за сегодня
            <span style={countBadgeStyle}>{tableRowCount}</span>
          </CardTitle>
          <Button variant="ghost" size="sm" leftIcon={<Download size={14} />}>
            Экспорт
          </Button>
        </CardHeader>
        {loading ? (
          <CardContent>
            <Skeleton variant="text" lines={6} />
          </CardContent>
        ) : orders.length === 0 ? (
          <CardContent>
            <EmptyState icon={<Inbox className="h-6 w-6" />} title="Заказов нет" />
          </CardContent>
        ) : (
          <section
            className="overflow-x-auto"
            aria-label="Все заказы за сегодня — таблица"
            tabIndex={0}
          >
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  {['№', 'Заказ', 'Клиент', 'Тип · BR-07', 'Статус', 'Сумма'].map((col) => (
                    <th
                      key={col}
                      className="border-b border-[var(--color-line)] bg-[var(--color-surface-3)] px-[22px] py-[11px] text-left text-[10.5px] font-semibold uppercase tracking-[.08em] text-[var(--color-ink-3)]"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 8).map((o) => (
                  <tr
                    key={o.id}
                    className="border-b border-[var(--color-line)] last:border-none hover:bg-[var(--color-surface-3)]"
                  >
                    <td className="px-[22px] py-[13px]">
                      <Link
                        href={`/orders/${o.id}` as Route<`/orders/${string}`>}
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '12px',
                          color: 'var(--color-ink-2)',
                          fontWeight: 500,
                        }}
                        className="hover:text-[var(--color-brand-500)]"
                      >
                        {o.number}
                      </Link>
                    </td>
                    <td className="px-[22px] py-[13px]">
                      <Link
                        href={`/orders/${o.id}` as Route<`/orders/${string}`>}
                        className="font-semibold text-[var(--color-ink)] hover:text-[var(--color-brand-500)]"
                      >
                        {o.title}
                      </Link>
                    </td>
                    <td className="px-[22px] py-[13px] text-[13px] text-[var(--color-ink-2)]">
                      {tableClientName(o.clientId, o.number)}
                    </td>
                    <td className="px-[22px] py-[13px]">
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '11.5px',
                          color: 'var(--color-ink-2)',
                        }}
                      >
                        {ORDER_TYPE_LABELS[o.type]}
                      </span>
                    </td>
                    <td className="px-[22px] py-[13px]">
                      <OrderStatusBadge status={o.status} />
                    </td>
                    <td className="px-[22px] py-[13px]">
                      <span
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontWeight: 500,
                          fontSize: '14.5px',
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {o.priceTotal.toLocaleString('ru-RU')} ₽
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </Card>
    </div>
  );
}
