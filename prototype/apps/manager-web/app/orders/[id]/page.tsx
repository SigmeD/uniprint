'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { Route } from 'next';
import {
  Amount,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FieldList,
  PageHeader,
  Select,
  Skeleton,
  StatPill,
  StatusStepper,
  Tabs,
  Input,
  OrderStatusBadge,
  ORDER_STATUS_LABELS,
} from '@uniprint/ui';
import type { StepperStep, TabItem } from '@uniprint/ui';
import type { OrderDetail, OrderStatus } from '@uniprint/types';
import {
  ArrowLeft,
  ArrowRightLeft,
  Building2,
  CalendarClock,
  FileText,
  Truck,
  Users,
  Wallet,
} from 'lucide-react';
import {
  DocumentsPanel,
  EconomicsPanel,
  HistoryPanel,
  OverviewPanel,
  ProductionPanel,
} from './_panels';
import { ORDER_TYPE_HINT, ORDER_TYPE_LABELS, fmtDate, fmtDateTime } from './_format';

const TABS: TabItem[] = [
  { value: 'overview', label: 'Обзор' },
  { value: 'production', label: 'Производство' },
  { value: 'economics', label: 'Экономика' },
  { value: 'documents', label: 'Документы' },
  { value: 'history', label: 'История' },
];

const PAYMENT_PILL = {
  paid: { tone: 'done' as const, label: 'Оплачен' },
  prepaid: { tone: 'work' as const, label: 'Предоплата 50%' },
  unpaid: { tone: 'neutral' as const, label: 'Не оплачен' },
};

export default function ManagerOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<OrderDetail | null | 'not-found'>(null);
  const [tab, setTab] = useState('overview');
  const [statusPanelOpen, setStatusPanelOpen] = useState(false);
  const [nextStatus, setNextStatus] = useState('');
  const [statusComment, setStatusComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/orders/${id}/detail`);
    if (res.status === 404) {
      setDetail('not-found');
      return;
    }
    setDetail(await res.json());
  }, [id]);

  useEffect(() => {
    load().catch(() => setDetail('not-found'));
  }, [load]);

  /** Имя сотрудника по id — из уже загруженной карточки, без лишних запросов. */
  const personName = useCallback(
    (userId?: string): string => {
      if (userId == null || detail == null || detail === 'not-found') return '—';
      const person = detail.staff.find((p) => p.id === userId);
      return person != null ? `${person.fullName} · ${person.role}` : 'Сотрудник';
    },
    [detail],
  );

  const steps = useMemo<StepperStep[]>(() => {
    if (detail == null || detail === 'not-found') return [];
    const route: OrderStatus[] = detail.statusRoute.filter((s) => s !== 'draft');
    const currentIdx = route.indexOf(detail.order.status);
    const anchorIdx =
      currentIdx !== -1 ? currentIdx : route.indexOf('in_production'); // defect_rework вне маршрута
    return route.map((status, i) => ({
      key: status,
      label: ORDER_STATUS_LABELS[status],
      state: i < anchorIdx ? 'done' : i === anchorIdx ? 'current' : 'pending',
    }));
  }, [detail]);

  const applyStatus = async () => {
    if (nextStatus === '' || detail === null || detail === 'not-found') return;
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/orders/${detail.order.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus, comment: statusComment.trim() || undefined }),
    });
    if (res.ok) {
      setDetail(await res.json());
      setStatusPanelOpen(false);
      setNextStatus('');
      setStatusComment('');
      setTab('history');
    } else {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? 'Не удалось сменить статус');
    }
    setSaving(false);
  };

  const addComment = async (text: string) => {
    if (detail === null || detail === 'not-found') return;
    const res = await fetch(`/api/orders/${detail.order.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment: text }),
    });
    if (res.ok) setDetail(await res.json());
  };

  if (detail === null) {
    return (
      <div className="flex flex-col gap-4 py-6 md:py-8">
        <Skeleton variant="title" />
        <Skeleton variant="rect" className="h-24" />
        <Skeleton variant="rect" className="h-64" />
      </div>
    );
  }

  if (detail === 'not-found') {
    return (
      <div className="py-6 md:py-8">
        <div className="mx-auto max-w-lg py-16 text-center">
          <div
            className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-[14px]"
            style={{ background: 'var(--color-surface-2)' }}
          >
            <FileText className="h-6 w-6 text-[var(--color-ink-3)]" />
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 500,
              fontSize: '24px',
              color: 'var(--color-ink)',
            }}
          >
            Заказ не найден
          </h1>
          <p className="mt-2 text-sm text-[var(--color-ink-3)]">
            Возможно, ссылка устарела или заказ был удалён.
          </p>
          <Button href="/orders" variant="ghost" className="mt-6 gap-2">
            <ArrowLeft className="h-4 w-4" /> К списку заказов
          </Button>
        </div>
      </div>
    );
  }

  const { order, client, payment, delivery } = detail;
  const paymentPill = PAYMENT_PILL[payment.state];
  const overdue =
    order.dueDate != null &&
    new Date(order.dueDate).getTime() < Date.now() &&
    !['ready', 'delivered', 'closed'].includes(order.status);

  return (
    <div className="py-6 md:py-8">
      <Link href={'/orders' as Route<'/orders'>}>
        <button
          type="button"
          className="mb-4 flex items-center gap-1.5 text-[13px] text-[var(--color-ink-3)] transition-colors hover:text-[var(--color-ink)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Все заказы
        </button>
      </Link>

      <PageHeader
        title={order.title}
        description={`${client.name} · ${ORDER_TYPE_HINT[order.type]}`}
        border={false}
        className="px-0 pb-5"
        meta={
          <>
            <span className="font-mono text-[12.5px] font-medium text-[var(--color-ink-2)]">
              {order.number}
            </span>
            <OrderStatusBadge status={order.status} />
            <span
              className="rounded-full px-2.5 py-1 font-mono text-[11px] font-semibold"
              style={{ background: 'var(--color-surface-2)', color: 'var(--color-ink-2)' }}
            >
              {ORDER_TYPE_LABELS[order.type]}
            </span>
            {overdue && <StatPill tone="defect">Просрочен</StatPill>}
          </>
        }
        actions={
          <>
            <Button variant="ghost" leftIcon={<FileText size={14} />}>
              Счёт PDF
            </Button>
            <Button
              variant="brand"
              leftIcon={<ArrowRightLeft size={14} />}
              onClick={() => setStatusPanelOpen((v) => !v)}
              disabled={detail.nextStatuses.length === 0}
            >
              Сменить статус
            </Button>
          </>
        }
      />

      {/* Степпер статус-машины (BR-07) + панель смены статуса */}
      <Card className="mb-4">
        <CardContent>
          <StatusStepper
            steps={steps}
            aside={
              order.status === 'defect_rework' ? (
                <StatPill tone="defect">Вне маршрута: брак / переделка</StatPill>
              ) : undefined
            }
          />
        </CardContent>

        {statusPanelOpen && (
          <div
            className="flex flex-wrap items-end gap-3 border-t border-[var(--color-line)] px-[22px] py-4"
            style={{ background: 'var(--color-surface-3)' }}
          >
            <div className="min-w-[220px]">
              <Select
                label="Следующий статус"
                placeholder="Выберите статус"
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value)}
                options={detail.nextStatuses.map((s) => ({
                  value: s,
                  label: ORDER_STATUS_LABELS[s as OrderStatus],
                }))}
              />
            </div>
            <div className="min-w-[260px] flex-1">
              <Input
                label="Комментарий (необязательно)"
                placeholder="Что произошло — попадёт в журнал заказа"
                value={statusComment}
                onChange={(e) => setStatusComment(e.target.value)}
              />
            </div>
            <Button variant="brand" onClick={applyStatus} loading={saving} disabled={nextStatus === ''}>
              Применить
            </Button>
            <Button variant="ghost" onClick={() => setStatusPanelOpen(false)}>
              Отмена
            </Button>
            <p className="w-full text-[11.5px] text-[var(--color-ink-3)]">
              Доступны только переходы, разрешённые статус-машиной типа «
              {ORDER_TYPE_LABELS[order.type]}» (BR-07). Переход попадёт в журнал (BR-20).
            </p>
            {error != null && (
              <p role="alert" className="w-full text-[12px] text-[var(--color-red-ink)]">
                {error}
              </p>
            )}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Основная колонка */}
        <div className="flex min-w-0 flex-col gap-4">
          <Tabs items={TABS} value={tab} onChange={setTab} ariaLabel="Разделы заказа" />

          {tab === 'overview' && <OverviewPanel detail={detail} />}
          {tab === 'production' && <ProductionPanel detail={detail} personName={personName} />}
          {tab === 'economics' && <EconomicsPanel detail={detail} />}
          {tab === 'documents' && <DocumentsPanel detail={detail} />}
          {tab === 'history' && (
            <HistoryPanel detail={detail} personName={personName} onComment={addComment} />
          )}
        </div>

        {/* Боковая колонка — не меняется при переключении вкладок */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-[76px] lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="gap-2 text-[15px]">
                <Building2 className="h-4 w-4 text-[var(--color-ink-3)]" />
                Клиент
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FieldList
                columns={1}
                items={[
                  { label: 'Название', value: client.name },
                  { label: 'Телефон', value: client.phone, mono: true },
                  ...(client.email != null
                    ? [{ label: 'E-mail', value: client.email, mono: true }]
                    : []),
                  ...(client.inn != null ? [{ label: 'ИНН', value: client.inn, mono: true }] : []),
                  ...(client.address != null ? [{ label: 'Адрес', value: client.address }] : []),
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="gap-2 text-[15px]">
                <Users className="h-4 w-4 text-[var(--color-ink-3)]" />
                Ответственные
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FieldList
                columns={1}
                items={[
                  { label: detail.manager.role, value: detail.manager.fullName },
                  ...(detail.designer != null
                    ? [{ label: detail.designer.role, value: detail.designer.fullName }]
                    : []),
                  {
                    label: 'Операция сейчас',
                    value:
                      detail.operations.find((o) => o.state === 'active')?.name ??
                      (detail.operations.every((o) => o.state === 'done')
                        ? 'Все операции завершены'
                        : 'Ожидает запуска в производство'),
                  },
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="gap-2 text-[15px]">
                <Wallet className="h-4 w-4 text-[var(--color-ink-3)]" />
                Деньги
              </CardTitle>
              <StatPill tone={paymentPill.tone}>{paymentPill.label}</StatPill>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between">
                <span className="text-[11.5px] uppercase tracking-[.06em] text-[var(--color-ink-3)]">
                  Сумма заказа
                </span>
                <Amount value={payment.total} size="lg" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-[11.5px] uppercase tracking-[.06em] text-[var(--color-ink-3)]">
                  Оплачено
                </span>
                <Amount value={payment.paidAmount} size="sm" tone="muted" />
              </div>
              {payment.note != null && (
                <p className="text-[11.5px] leading-[1.45] text-[var(--color-ink-3)]">
                  {payment.note}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="gap-2 text-[15px]">
                <CalendarClock className="h-4 w-4 text-[var(--color-ink-3)]" />
                Сроки
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FieldList
                columns={2}
                items={[
                  { label: 'Создан', value: fmtDate(order.createdAt) },
                  { label: 'Срок сдачи', value: fmtDate(order.dueDate) },
                  { label: 'Обновлён', value: fmtDateTime(order.updatedAt) },
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="gap-2 text-[15px]">
                <Truck className="h-4 w-4 text-[var(--color-ink-3)]" />
                {delivery.mode === 'delivery' ? 'Доставка' : 'Самовывоз'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {delivery.mode === 'pickup' ? (
                <p className="text-[13px] text-[var(--color-ink-3)]">
                  Клиент забирает заказ из офиса. Готовность —{' '}
                  {fmtDate(delivery.plannedAt)}.
                </p>
              ) : (
                <FieldList
                  columns={2}
                  items={[
                    { label: 'Адрес', value: delivery.address ?? '—' },
                    { label: 'Расстояние', value: `${delivery.distanceKm ?? 0} км` },
                    {
                      label: 'Стоимость (BR-26)',
                      value: <Amount value={delivery.cost ?? 0} size="sm" />,
                    },
                    { label: 'Плановая дата', value: fmtDate(delivery.plannedAt) },
                    { label: 'Водитель', value: personName(delivery.driverUserId) },
                  ]}
                />
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
