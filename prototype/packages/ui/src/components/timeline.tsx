import type { ReactNode } from 'react';
import { cn } from '../lib/utils';

export type TimelineTone = 'default' | 'accent' | 'success' | 'defect' | 'muted';

export interface TimelineItem {
  id: string;
  title: ReactNode;
  /** Правый верхний угол записи — дата/время. */
  at?: string;
  /** Кто выполнил — скрывается в клиентском кабинете (BR-32). */
  by?: string;
  comment?: string;
  tone?: TimelineTone;
}

export interface TimelineProps {
  items: TimelineItem[];
  className?: string;
  ariaLabel?: string;
}

const TONE_DOT: Record<TimelineTone, string> = {
  default: 'var(--color-ink-4)',
  accent: 'var(--color-brand-500)',
  success: 'var(--color-green)',
  defect: 'var(--color-red)',
  muted: 'var(--color-line-2)',
};

/**
 * Timeline — журнал событий сущности: история статусов заказа (BR-20),
 * комментарии менеджера, лента для клиента. Последняя запись сверху.
 */
export const Timeline = ({ items, className, ariaLabel = 'История' }: TimelineProps) => (
  <ol className={cn('flex flex-col', className)} aria-label={ariaLabel}>
    {items.map((item, i) => {
      const isLast = i === items.length - 1;
      const tone = item.tone ?? 'default';
      return (
        <li key={item.id} className="flex gap-3">
          {/* Рельс: точка + линия до следующей записи */}
          <div className="flex flex-col items-center" aria-hidden="true">
            <span
              className="mt-1.5 block shrink-0 rounded-full"
              style={{
                width: 9,
                height: 9,
                background: TONE_DOT[tone],
                boxShadow: tone === 'accent' ? '0 0 0 3px var(--color-brand-50)' : undefined,
              }}
            />
            {!isLast && (
              <span
                className="block w-px flex-1"
                style={{ background: 'var(--color-line)', minHeight: 18 }}
              />
            )}
          </div>

          <div className={cn('min-w-0 flex-1', isLast ? 'pb-0' : 'pb-4')}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
              <span
                className="text-[13px] font-semibold"
                style={{ color: 'var(--color-ink)' }}
              >
                {item.title}
              </span>
              {item.at != null && (
                <span
                  className="text-[11px] tabular"
                  style={{ color: 'var(--color-ink-4)' }}
                >
                  {item.at}
                </span>
              )}
            </div>

            {item.by != null && (
              <div className="mt-0.5 text-[11.5px]" style={{ color: 'var(--color-ink-3)' }}>
                {item.by}
              </div>
            )}

            {item.comment != null && (
              <p
                className="mt-1.5 rounded-[var(--radius-md)] px-3 py-2 text-[12.5px] leading-[1.45]"
                style={{
                  background: 'var(--color-surface-3)',
                  border: '1px solid var(--color-line)',
                  color: 'var(--color-ink-2)',
                }}
              >
                {item.comment}
              </p>
            )}
          </div>
        </li>
      );
    })}
  </ol>
);
Timeline.displayName = 'Timeline';
