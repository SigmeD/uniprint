'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { Route } from 'next';
import {
  Amount,
  BRCallout,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FieldList,
  Input,
  OrderStatusBadge,
  PageHeader,
  Skeleton,
  StatPill,
  StatusStepper,
  Timeline,
} from '@uniprint/ui';
import type { StepperStep, TimelineItem } from '@uniprint/ui';
import type { OrderClientDetail, OrderDocumentKind, OrderType } from '@uniprint/types';
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  Image as ImageIcon,
  Package,
  Truck,
  Wallet,
} from 'lucide-react';

const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  cex: 'Наружная реклама',
  office: 'Полиграфия',
  goods: 'Готовый товар',
};

const DOC_KIND_LABELS: Record<OrderDocumentKind, string> = {
  invoice: 'Счёт на оплату',
  contract: 'Договор-оферта',
  act: 'Акт выполненных работ',
  ttn: 'Транспортная накладная',
};

const PAYMENT_PILL = {
  paid: { tone: 'done' as const, label: 'Оплачен' },
  prepaid: { tone: 'work' as const, label: 'Внесена предоплата' },
  unpaid: { tone: 'neutral' as const, label: 'Ожидает оплаты' },
};

const fmtDate = (iso?: string): string =>
  iso == null ? '—' : new Date(iso).toLocaleDateString('ru-RU');

const fmtDateTime = (iso: string): string =>
  new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export default function ClientOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<OrderClientDetail | null | 'not-found'>(null);
  const [reworkComment, setReworkComment] = useState('');
  const [reworkOpen, setReworkOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/orders/${id}/detail?scope=client`);
    if (res.status === 404) {
      setDetail('not-found');
      return;
    }
    setDetail(await res.json());
  }, [id]);

  useEffect(() => {
    load().catch(() => setDetail('not-found'));
  }, [load]);

  const decide = async (decision: 'approved' | 'rework') => {
    setSaving(true);
    await fetch(`/api/orders/${id}/artwork-decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decision,
        ...(decision === 'rework' && reworkComment.trim().length > 0
          ? { comment: reworkComment.trim() }
          : {}),
      }),
    });
    await load();
    setReworkOpen(false);
    setReworkComment('');
    setSaving(false);
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
            <ArrowLeft className="h-4 w-4" /> К моим заказам
          </Button>
        </div>
      </div>
    );
  }

  const { order, payment, delivery, artwork } = detail;
  const paymentPill = PAYMENT_PILL[payment.state];
  const itemsTotal = detail.items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const awaitingApproval = artwork != null && artwork.clientDecision === 'pending';

  const steps: StepperStep[] = detail.clientStages.map((stage) => ({
    key: stage.key,
    label: stage.label,
    state: stage.state,
  }));

  const timelineItems: TimelineItem[] = [...detail.timeline].reverse().map((entry, i) => ({
    id: entry.id,
    title: entry.label,
    at: fmtDateTime(entry.at),
    tone: i === 0 ? 'accent' : 'default',
    ...(entry.comment != null ? { comment: entry.comment } : {}),
  }));

  return (
    <div className="py-6 md:py-8">
      <Link href={'/orders' as Route<'/orders'>}>
        <button
          type="button"
          className="mb-4 flex items-center gap-1.5 text-[13px] text-[var(--color-ink-3)] transition-colors hover:text-[var(--color-ink)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Мои заказы
        </button>
      </Link>

      <PageHeader
        title={order.title}
        description={`${ORDER_TYPE_LABELS[order.type]} · срок ${fmtDate(order.dueDate)}`}
        border={false}
        className="px-0 pb-5"
        meta={
          <>
            <span className="font-mono text-[12.5px] font-medium text-[var(--color-ink-2)]">
              {order.number}
            </span>
            <OrderStatusBadge status={order.status} />
          </>
        }
      />

      <Card className="mb-4">
        <CardContent>
          <StatusStepper steps={steps} ariaLabel="Ход выполнения заказа" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex min-w-0 flex-col gap-4">
          {/* Согласование макета — главное действие клиента (BR-11) */}
          {artwork != null && (
            <Card tone={awaitingApproval ? 'warning' : 'default'}>
              <CardHeader>
                <CardTitle className="gap-2">
                  <ImageIcon className="h-4 w-4 text-[var(--color-ink-3)]" />
                  Макет
                </CardTitle>
                <StatPill
                  tone={
                    artwork.clientDecision === 'approved'
                      ? 'done'
                      : artwork.clientDecision === 'rework'
                        ? 'defect'
                        : 'design'
                  }
                >
                  {artwork.clientDecision === 'approved'
                    ? 'Согласован'
                    : artwork.clientDecision === 'rework'
                      ? 'Отправлен на доработку'
                      : 'Ждём вашего решения'}
                </StatPill>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div
                    aria-hidden="true"
                    className="grid h-24 w-32 shrink-0 place-items-center rounded-[var(--radius-lg)]"
                    style={{
                      background:
                        'linear-gradient(135deg, var(--color-surface-2), var(--color-brand-50))',
                      border: '1px solid var(--color-line)',
                    }}
                  >
                    <FileText className="h-7 w-7 text-[var(--color-ink-4)]" />
                  </div>
                  <FieldList
                    className="flex-1"
                    items={[
                      { label: 'Файл', value: artwork.fileName, mono: true },
                      { label: 'Версия', value: `v${artwork.version}` },
                      { label: 'Загружен', value: fmtDateTime(artwork.uploadedAt) },
                      {
                        label: 'Проверен нашим технологом',
                        value: artwork.chiefApproved ? (
                          <span className="inline-flex items-center gap-1.5 text-[var(--color-green)]">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Да
                          </span>
                        ) : (
                          'В работе'
                        ),
                      },
                    ]}
                  />
                </div>

                {artwork.clientComment != null && (
                  <p className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface-3)] px-3 py-2 text-[12.5px] text-[var(--color-ink-2)]">
                    Ваш комментарий: {artwork.clientComment}
                  </p>
                )}

                {awaitingApproval && (
                  <div className="flex flex-col gap-3">
                    <p className="text-[13px] text-[var(--color-ink-2)]">
                      Проверьте макет перед запуском в производство. После согласования
                      правки возможны только с пересчётом сроков.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="brand"
                        onClick={() => decide('approved')}
                        loading={saving}
                        leftIcon={<CheckCircle2 size={14} />}
                      >
                        Согласовать макет
                      </Button>
                      <Button variant="ghost" onClick={() => setReworkOpen((v) => !v)}>
                        Отправить на доработку
                      </Button>
                    </div>
                    {reworkOpen && (
                      <div className="flex flex-wrap items-end gap-2">
                        <div className="min-w-[240px] flex-1">
                          <Input
                            label="Что поправить"
                            placeholder="Например: логотип крупнее, телефон другим цветом"
                            value={reworkComment}
                            onChange={(e) => setReworkComment(e.target.value)}
                          />
                        </div>
                        <Button variant="ghost" onClick={() => decide('rework')} loading={saving}>
                          Отправить
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="gap-2">
                <Package className="h-4 w-4 text-[var(--color-ink-3)]" />
                Что заказано
              </CardTitle>
            </CardHeader>
            <section className="overflow-x-auto" aria-label="Состав заказа" tabIndex={0}>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    {['Позиция', 'Кол-во', 'Цена', 'Сумма'].map((c) => (
                      <th
                        key={c}
                        className="border-b border-[var(--color-line)] bg-[var(--color-surface-3)] px-[18px] py-[10px] text-left text-[10.5px] font-semibold uppercase tracking-[.08em] text-[var(--color-ink-3)]"
                      >
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {detail.items.map((item) => (
                    <tr key={item.id} className="border-b border-[var(--color-line)]">
                      <td className="px-[18px] py-[12px]">
                        <div className="font-semibold text-[var(--color-ink)]">
                          {item.serviceName}
                        </div>
                        {item.notes != null && (
                          <div className="mt-0.5 text-xs text-[var(--color-ink-3)]">
                            {item.notes}
                          </div>
                        )}
                      </td>
                      <td className="px-[18px] py-[12px] text-[13px] text-[var(--color-ink-2)]">
                        {item.qty.toLocaleString('ru-RU')} {item.unit}
                      </td>
                      <td className="px-[18px] py-[12px]">
                        <Amount value={item.unitPrice} size="sm" tone="muted" />
                      </td>
                      <td className="px-[18px] py-[12px]">
                        <Amount value={item.qty * item.unitPrice} />
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td className="px-[18px] py-[12px]" colSpan={3}>
                      <span className="text-[12px] font-semibold uppercase tracking-[.06em] text-[var(--color-ink-3)]">
                        Итого
                      </span>
                    </td>
                    <td className="px-[18px] py-[12px]">
                      <Amount value={itemsTotal} size="lg" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="gap-2">
                <FileText className="h-4 w-4 text-[var(--color-ink-3)]" />
                Документы
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5">
              {detail.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--color-line)] px-3.5 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-[var(--color-ink)]">
                      {DOC_KIND_LABELS[doc.kind]}
                    </div>
                    <div className="mt-0.5 font-mono text-[11.5px] text-[var(--color-ink-3)]">
                      {doc.number}
                      {doc.issuedAt != null ? ` · ${fmtDate(doc.issuedAt)}` : ''}
                    </div>
                  </div>
                  {doc.state === 'ready' ? (
                    <Button variant="ghost" size="sm" leftIcon={<Download size={14} />}>
                      Скачать
                    </Button>
                  ) : (
                    <StatPill tone="neutral">Будет позже</StatPill>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ход работы</CardTitle>
            </CardHeader>
            <CardContent>
              {timelineItems.length === 0 ? (
                <p className="text-[13px] text-[var(--color-ink-3)]">
                  Заказ только что создан. Здесь будут появляться события — передача в
                  дизайн, согласование макета, запуск в производство и готовность.
                </p>
              ) : (
                <Timeline items={timelineItems} ariaLabel="Ход работы по заказу" />
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-[76px] lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="gap-2 text-[15px]">
                <Wallet className="h-4 w-4 text-[var(--color-ink-3)]" />
                Оплата
              </CardTitle>
              <StatPill tone={paymentPill.tone}>{paymentPill.label}</StatPill>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between">
                <span className="text-[11.5px] uppercase tracking-[.06em] text-[var(--color-ink-3)]">
                  К оплате
                </span>
                <Amount value={payment.total} size="lg" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-[11.5px] uppercase tracking-[.06em] text-[var(--color-ink-3)]">
                  Оплачено
                </span>
                <Amount value={payment.paidAmount} size="sm" tone="muted" />
              </div>
              <Button variant="brand" block disabled>
                Оплатить онлайн
              </Button>
              <p className="text-[11.5px] leading-[1.45] text-[var(--color-ink-3)]">
                Онлайн-оплата появится после подключения эквайринга. Сейчас оплата — по
                счёту, чек придёт на e-mail.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="gap-2 text-[15px]">
                <Truck className="h-4 w-4 text-[var(--color-ink-3)]" />
                {delivery.mode === 'delivery' ? 'Доставка' : 'Получение'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {delivery.mode === 'delivery' ? (
                <FieldList
                  columns={1}
                  items={[
                    { label: 'Адрес', value: delivery.address ?? '—' },
                    { label: 'Плановая дата', value: fmtDate(delivery.plannedAt) },
                    {
                      label: 'Стоимость доставки',
                      value: <Amount value={delivery.cost ?? 0} size="sm" />,
                    },
                  ]}
                />
              ) : (
                <p className="text-[13px] text-[var(--color-ink-3)]">
                  Самовывоз из офиса. Мы напишем, когда заказ будет готов —{' '}
                  {fmtDate(delivery.plannedAt)}.
                </p>
              )}
            </CardContent>
          </Card>

          <BRCallout
            rules={[
              {
                code: 'BR-32',
                text: 'Вы видите только свои заказы. Себестоимость, поставщики и данные сотрудников в личном кабинете не отображаются.',
              },
              {
                code: 'BR-24',
                text: 'Уведомления по заказу приходят через push, e-mail и SMS.',
              },
            ]}
          />
        </aside>
      </div>
    </div>
  );
}
