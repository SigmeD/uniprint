'use client';

import { useState } from 'react';
import {
  Amount,
  BRCallout,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  FieldList,
  Input,
  KpiCard,
  StatPill,
  Timeline,
  ORDER_STATUS_LABELS,
} from '@uniprint/ui';
import type { TimelineItem } from '@uniprint/ui';
import type {
  OrderCostBreakdown,
  OrderDetail,
  OrderOperationState,
} from '@uniprint/types';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileText,
  Image as ImageIcon,
  Layers,
  MessageSquarePlus,
  Package,
} from 'lucide-react';
import {
  DOC_KIND_LABELS,
  MATERIAL_UNIT_LABELS,
  fmtDate,
  fmtDateTime,
  fmtMinutes,
} from './_format';

/* ── Общие мелочи ─────────────────────────────────────────────────────────── */

const thClass =
  'border-b border-[var(--color-line)] bg-[var(--color-surface-3)] px-[18px] py-[10px] text-left text-[10.5px] font-semibold uppercase tracking-[.08em] text-[var(--color-ink-3)]';
const tdClass = 'border-b border-[var(--color-line)] px-[18px] py-[12px] align-top';

const OPERATION_TONE: Record<OrderOperationState, { label: string; tone: 'done' | 'work' | 'neutral' }> =
  {
    done: { label: 'Выполнено', tone: 'done' },
    active: { label: 'Сейчас', tone: 'work' },
    pending: { label: 'Ожидает', tone: 'neutral' },
  };

function costTotal(cost: OrderCostBreakdown): number {
  return cost.materials + cost.labor + cost.depreciation + cost.logistics + cost.other;
}

/* ── Обзор: позиции + макет ───────────────────────────────────────────────── */

export function OverviewPanel({ detail }: { detail: OrderDetail }) {
  const itemsTotal = detail.items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="gap-2">
            <Package className="h-4 w-4 text-[var(--color-ink-3)]" />
            Состав заказа
          </CardTitle>
          <span className="text-[11px] font-semibold text-[var(--color-ink-3)]">
            {detail.items.length} поз.
          </span>
        </CardHeader>
        <section className="overflow-x-auto" aria-label="Позиции заказа" tabIndex={0}>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {['Услуга из справочника', 'Кол-во', 'Цена за ед.', 'Сумма'].map((c) => (
                  <th key={c} className={thClass}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {detail.items.map((item) => (
                <tr key={item.id}>
                  <td className={tdClass}>
                    <div className="font-semibold text-[var(--color-ink)]">{item.serviceName}</div>
                    {item.notes != null && (
                      <div className="mt-0.5 text-xs text-[var(--color-ink-3)]">{item.notes}</div>
                    )}
                  </td>
                  <td className={`${tdClass} text-[13px] text-[var(--color-ink-2)]`}>
                    {item.qty.toLocaleString('ru-RU')} {item.unit}
                  </td>
                  <td className={tdClass}>
                    <Amount value={item.unitPrice} size="sm" tone="muted" />
                  </td>
                  <td className={tdClass}>
                    <Amount value={item.qty * item.unitPrice} />
                  </td>
                </tr>
              ))}
              <tr>
                <td className={`${tdClass} border-none`} colSpan={3}>
                  <span className="text-[12px] font-semibold uppercase tracking-[.06em] text-[var(--color-ink-3)]">
                    Итого по заказу
                  </span>
                </td>
                <td className={`${tdClass} border-none`}>
                  <Amount value={itemsTotal} size="lg" />
                </td>
              </tr>
            </tbody>
          </table>
        </section>
        <CardContent className="pt-0">
          <BRCallout
            rules={[
              {
                code: 'BR-04',
                text: 'Услуги выбираются только из справочника — ручное создание позиции запрещено.',
              },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="gap-2">
            <ImageIcon className="h-4 w-4 text-[var(--color-ink-3)]" />
            Макет
          </CardTitle>
          {detail.artwork != null && (
            <StatPill
              tone={
                detail.artwork.clientDecision === 'approved'
                  ? 'done'
                  : detail.artwork.clientDecision === 'rework'
                    ? 'defect'
                    : 'design'
              }
            >
              {detail.artwork.clientDecision === 'approved'
                ? 'Согласован клиентом'
                : detail.artwork.clientDecision === 'rework'
                  ? 'На доработке'
                  : 'Ждём клиента'}
            </StatPill>
          )}
        </CardHeader>
        <CardContent>
          {detail.artwork == null ? (
            <EmptyState
              icon={<ImageIcon className="h-6 w-6" />}
              title="Макет не требуется"
              description="Для заказов типа «продажа-товар» макет не разрабатывается."
            />
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-4">
                {/* Плейсхолдер превью — реальные макеты в S3 (BR-33), в прототипе не грузим */}
                <div
                  aria-hidden="true"
                  className="grid h-20 w-28 shrink-0 place-items-center rounded-[var(--radius-lg)]"
                  style={{
                    background:
                      'linear-gradient(135deg, var(--color-surface-2), var(--color-brand-50))',
                    border: '1px solid var(--color-line)',
                  }}
                >
                  <FileText className="h-6 w-6 text-[var(--color-ink-4)]" />
                </div>
                <FieldList
                  className="flex-1"
                  items={[
                    { label: 'Файл', value: detail.artwork.fileName, mono: true },
                    { label: 'Версия', value: `v${detail.artwork.version}` },
                    { label: 'Загружен', value: fmtDateTime(detail.artwork.uploadedAt) },
                    {
                      label: 'Проверка руководителем',
                      value: detail.artwork.chiefApproved ? (
                        <span className="inline-flex items-center gap-1.5 text-[var(--color-green)]">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Пройдена
                        </span>
                      ) : (
                        <span className="text-[var(--color-brand-600)]">Не пройдена</span>
                      ),
                    },
                  ]}
                />
              </div>
              {detail.artwork.clientComment != null && (
                <p className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface-3)] px-3 py-2 text-[12.5px] text-[var(--color-ink-2)]">
                  Комментарий клиента: {detail.artwork.clientComment}
                </p>
              )}
              <BRCallout
                rules={[
                  {
                    code: 'BR-11',
                    text: 'Макет не уходит в производство без проверки руководителем.',
                  },
                ]}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Производство: операции + материалы + брак ────────────────────────────── */

export function ProductionPanel({
  detail,
  personName,
}: {
  detail: OrderDetail;
  personName: (userId?: string) => string;
}) {
  const materialsTotal = detail.materials.reduce((s, m) => s + m.qty * m.pricePerUnit, 0);
  const spentMinutes = detail.operations.reduce((s, o) => s + (o.minutes ?? 0), 0);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="gap-2">
            <Layers className="h-4 w-4 text-[var(--color-ink-3)]" />
            Маршрут производства
          </CardTitle>
          <span className="text-[11px] font-semibold text-[var(--color-ink-3)]">
            {fmtMinutes(spentMinutes)} отработано
          </span>
        </CardHeader>
        <CardContent className="flex flex-col gap-2.5">
          {detail.operations.map((op) => {
            const spec = OPERATION_TONE[op.state];
            return (
              <div
                key={op.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--color-line)] px-3.5 py-2.5"
                style={{
                  background:
                    op.state === 'active' ? 'var(--color-brand-50)' : 'var(--color-surface)',
                }}
              >
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-[var(--color-ink)]">{op.name}</div>
                  <div className="mt-0.5 text-[11.5px] text-[var(--color-ink-3)]">
                    {op.byUserId != null ? personName(op.byUserId) : 'Исполнитель не назначен'}
                    {op.at != null ? ` · ${fmtDateTime(op.at)}` : ''}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {op.minutes != null && (
                    <span className="tabular text-[12px] text-[var(--color-ink-3)]">
                      {fmtMinutes(op.minutes)}
                    </span>
                  )}
                  <StatPill tone={spec.tone}>{spec.label}</StatPill>
                </div>
              </div>
            );
          })}
          <BRCallout
            rules={[
              {
                code: 'BR-10',
                text: 'Заказ нельзя завершить без списанных материалов и зафиксированного времени.',
              },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="gap-2">
            <Package className="h-4 w-4 text-[var(--color-ink-3)]" />
            Списанные материалы
          </CardTitle>
          {detail.materials.length > 0 && <Amount value={materialsTotal} size="sm" tone="muted" />}
        </CardHeader>
        {detail.materials.length === 0 ? (
          <CardContent className="flex flex-col gap-4">
            <EmptyState
              icon={<Package className="h-6 w-6" />}
              title="Материалы ещё не списаны"
              description={
                detail.order.type === 'goods'
                  ? 'Заказ типа «продажа-товар» уменьшает остаток товара напрямую (BR-23), материалы не расходуются.'
                  : 'Списание выполняет складщик после запуска заказа в производство.'
              }
            />
            <BRCallout
              rules={[
                { code: 'BR-01', text: 'Материалы списываются только на заказ, не «в цех» абстрактно.' },
              ]}
            />
          </CardContent>
        ) : (
          <>
            <section className="overflow-x-auto" aria-label="Списанные материалы" tabIndex={0}>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    {['Материал', 'Партия (FIFO)', 'Кол-во', 'Цена', 'Сумма', 'Кто списал'].map(
                      (c) => (
                        <th key={c} className={thClass}>
                          {c}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {detail.materials.map((m) => (
                    <tr key={m.id}>
                      <td className={`${tdClass} font-semibold text-[var(--color-ink)]`}>
                        {m.materialName}
                      </td>
                      <td className={tdClass}>
                        <span className="font-mono text-[12px] text-[var(--color-ink-2)]">
                          {m.batchId}
                        </span>
                      </td>
                      <td className={`${tdClass} text-[13px] text-[var(--color-ink-2)]`}>
                        {m.qty} {MATERIAL_UNIT_LABELS[m.unit] ?? m.unit}
                      </td>
                      <td className={tdClass}>
                        <Amount value={m.pricePerUnit} size="sm" tone="muted" />
                      </td>
                      <td className={tdClass}>
                        <Amount value={m.qty * m.pricePerUnit} size="sm" />
                      </td>
                      <td className={`${tdClass} text-[12.5px] text-[var(--color-ink-3)]`}>
                        {personName(m.byUserId)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
            <CardContent>
              <BRCallout
                rules={[
                  { code: 'BR-01', text: 'Списание всегда привязано к заказу.' },
                  { code: 'BR-09', text: 'Партии расходуются по FIFO — вручную партия не выбирается.' },
                ]}
              />
            </CardContent>
          </>
        )}
      </Card>

      {detail.defect != null && (
        <Card tone="danger">
          <CardHeader>
            <CardTitle className="gap-2">
              <AlertTriangle className="h-4 w-4 text-[var(--color-red)]" />
              Зафиксирован брак
            </CardTitle>
            <span className="text-[11px] text-[var(--color-ink-3)]">
              {fmtDateTime(detail.defect.at)}
            </span>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-[13px] text-[var(--color-ink-2)]">{detail.defect.reason}</p>
            <FieldList
              columns={2}
              items={[
                { label: 'Зафиксировал', value: personName(detail.defect.byUserId) },
                { label: 'Действие', value: 'Возврат в производство на переделку' },
              ]}
            />
            <BRCallout
              rules={[
                { code: 'BR-03', text: 'Брак фиксирует только складщик — у производства такой кнопки нет.' },
                { code: 'BR-17', text: 'Переделка требует повторного списания материалов.' },
              ]}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ── Экономика: план / факт / маржа ───────────────────────────────────────── */

const COST_ROWS: { key: keyof OrderCostBreakdown; label: string; hint: string }[] = [
  { key: 'materials', label: 'Материалы', hint: 'списания по партиям' },
  { key: 'labor', label: 'Оплата труда', hint: 'сдельная по операциям' },
  { key: 'depreciation', label: 'Амортизация', hint: 'оборудование, BR-18' },
  { key: 'logistics', label: 'Логистика', hint: 'доставка и выезды' },
  { key: 'other', label: 'Прочее', hint: 'накладные' },
];

export function EconomicsPanel({ detail }: { detail: OrderDetail }) {
  const plan = detail.costPlan;
  const fact = detail.costFact;
  const planTotal = costTotal(plan);
  const factTotal = fact != null ? costTotal(fact) : null;
  const revenue = detail.order.priceTotal;
  const currentCost = factTotal ?? planTotal;
  const margin = revenue - currentCost;
  const marginPct = revenue > 0 ? Math.round((margin / revenue) * 100) : 0;
  const maxRow = Math.max(
    ...COST_ROWS.map((r) => Math.max(plan[r.key], fact?.[r.key] ?? 0)),
    1,
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Выручка" value={revenue.toLocaleString('ru-RU')} unit="₽" />
        <KpiCard
          label={fact != null ? 'Себестоимость факт' : 'Себестоимость план'}
          value={currentCost.toLocaleString('ru-RU')}
          unit="₽"
          {...(factTotal != null
            ? {
                trend: factTotal > planTotal ? ('up' as const) : ('down' as const),
                trendIsGood: factTotal <= planTotal,
                delta: `${factTotal > planTotal ? '+' : ''}${(factTotal - planTotal).toLocaleString('ru-RU')} ₽ к плану`,
              }
            : { hint: 'Факт появится после старта производства' })}
        />
        <KpiCard
          label="Маржа"
          value={margin.toLocaleString('ru-RU')}
          unit="₽"
          trend={margin >= 0 ? 'up' : 'down'}
          trendIsGood={margin >= 0}
          delta={`${marginPct}% от выручки`}
        />
        <KpiCard
          label="Рентабельность"
          value={currentCost > 0 ? Math.round((margin / currentCost) * 100) : 0}
          unit="%"
          hint="маржа к себестоимости"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Структура себестоимости</CardTitle>
          <span className="text-[11px] font-semibold uppercase tracking-[.06em] text-[var(--color-ink-3)]">
            {fact != null ? 'план → факт' : 'план'}
          </span>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col">
            {COST_ROWS.map((row) => {
              const planValue = plan[row.key];
              const factValue = fact?.[row.key];
              const shown = factValue ?? planValue;
              const delta = factValue != null ? factValue - planValue : null;
              return (
                <div
                  key={row.key}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-[var(--color-line)] py-3 last:border-none"
                >
                  <div className="w-[150px] shrink-0">
                    <div className="text-[13px] font-medium text-[var(--color-ink)]">
                      {row.label}
                    </div>
                    <div className="text-[11px] text-[var(--color-ink-3)]">{row.hint}</div>
                  </div>
                  <div
                    className="h-2.5 min-w-[80px] flex-1 overflow-hidden rounded-full"
                    style={{ background: 'var(--color-surface-2)' }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.round((shown / maxRow) * 100)}%`,
                        background:
                          'linear-gradient(90deg, var(--color-brand-500), var(--color-gold))',
                        transition: 'width 600ms cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    />
                  </div>
                  <div className="w-[150px] shrink-0 text-right">
                    <Amount value={shown} size="sm" />
                    {delta != null && delta !== 0 && (
                      <div className="mt-0.5">
                        <Amount
                          value={delta}
                          size="sm"
                          signed
                          tone={delta > 0 ? 'negative' : 'positive'}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <BRCallout
        rules={[
          {
            code: 'BR-32',
            text: 'Этот блок виден только внутренним ролям — в кабинете клиента себестоимость и маржа не отображаются.',
          },
        ]}
      />
    </div>
  );
}

/* ── Документы ────────────────────────────────────────────────────────────── */

export function DocumentsPanel({ detail }: { detail: OrderDetail }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="gap-2">
          <FileText className="h-4 w-4 text-[var(--color-ink-3)]" />
          Документы заказа
        </CardTitle>
        <span className="text-[11px] font-semibold text-[var(--color-ink-3)]">
          {detail.documents.filter((d) => d.state === 'ready').length} из {detail.documents.length}{' '}
          готовы
        </span>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5">
        {detail.documents.map((doc) => (
          <div
            key={doc.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--color-line)] px-3.5 py-2.5"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span
                aria-hidden="true"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-md)]"
                style={{ background: 'var(--color-surface-2)' }}
              >
                <FileText className="h-4 w-4 text-[var(--color-ink-3)]" />
              </span>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-[var(--color-ink)]">
                  {DOC_KIND_LABELS[doc.kind]}
                </div>
                <div className="mt-0.5 font-mono text-[11.5px] text-[var(--color-ink-3)]">
                  {doc.number}
                  {doc.issuedAt != null ? ` · ${fmtDate(doc.issuedAt)}` : ''}
                  {doc.sizeKb != null ? ` · ${doc.sizeKb} КБ` : ''}
                </div>
              </div>
            </div>
            {doc.state === 'ready' ? (
              <Button variant="ghost" size="sm" leftIcon={<Download size={14} />}>
                Скачать PDF
              </Button>
            ) : (
              <StatPill tone="neutral">Будет доступен позже</StatPill>
            )}
          </div>
        ))}
        <BRCallout
          rules={[
            {
              code: 'BR-25',
              text: 'Документы генерируются из шаблонов в PDF, хранятся в S3 и попадают в audit-log.',
            },
          ]}
        />
      </CardContent>
    </Card>
  );
}

/* ── История + комментарий ────────────────────────────────────────────────── */

export function HistoryPanel({
  detail,
  personName,
  onComment,
}: {
  detail: OrderDetail;
  personName: (userId?: string) => string;
  onComment: (text: string) => Promise<void>;
}) {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const value = text.trim();
    if (value.length === 0) return;
    setSaving(true);
    await onComment(value);
    setText('');
    setSaving(false);
  };

  const items: TimelineItem[] = [...detail.history].reverse().map((entry, i) => ({
    id: entry.id,
    title:
      entry.fromStatus === entry.toStatus
        ? 'Комментарий'
        : `${entry.fromStatus != null ? `${ORDER_STATUS_LABELS[entry.fromStatus]} → ` : ''}${ORDER_STATUS_LABELS[entry.toStatus]}`,
    at: fmtDateTime(entry.at),
    by: personName(entry.byUserId),
    tone: i === 0 ? 'accent' : entry.toStatus === 'defect_rework' ? 'defect' : 'default',
    ...(entry.comment != null ? { comment: entry.comment } : {}),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>История заказа</CardTitle>
        <span className="text-[11px] font-semibold text-[var(--color-ink-3)]">
          {items.length} записей
        </span>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[240px] flex-1">
            <Input
              label="Комментарий в журнал"
              placeholder="Например: клиент просил перезвонить после 15:00"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          <Button
            variant="ghost"
            leftIcon={<MessageSquarePlus size={14} />}
            onClick={submit}
            loading={saving}
            disabled={text.trim().length === 0}
          >
            Добавить
          </Button>
        </div>

        <Timeline items={items} ariaLabel="История заказа" />

        <BRCallout
          rules={[
            { code: 'BR-20', text: 'Все статус-переходы фиксируются в журнале заказа.' },
            { code: 'BR-13', text: 'Записи журнала immutable — редактировать их нельзя.' },
          ]}
        />
      </CardContent>
    </Card>
  );
}
