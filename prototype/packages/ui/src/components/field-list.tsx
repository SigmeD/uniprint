import type { ReactNode } from 'react';
import { cn } from '../lib/utils';

export interface FieldItem {
  label: string;
  value: ReactNode;
  /** Моноширинно — для номеров, ИНН, ID (правило контента AGENT_BRIEF). */
  mono?: boolean;
}

export interface FieldListProps {
  items: FieldItem[];
  columns?: 1 | 2;
  className?: string;
}

/**
 * FieldList — пары «подпись / значение» в карточках сущностей.
 * Подпись капсом ink-3, значение обычным текстом ink. Заменяет повторяющуюся
 * вёрстку `<dl><dt class=uppercase>…` на страницах деталей.
 */
export const FieldList = ({ items, columns = 2, className }: FieldListProps) => (
  <dl
    className={cn(
      'grid gap-x-6 gap-y-3.5',
      columns === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1',
      className,
    )}
  >
    {items.map((item) => (
      <div key={item.label} className="flex flex-col gap-1">
        <dt
          className="text-[10.5px] font-semibold uppercase tracking-[.08em]"
          style={{ color: 'var(--color-ink-3)' }}
        >
          {item.label}
        </dt>
        <dd
          className="text-[13.5px]"
          style={{
            color: 'var(--color-ink)',
            ...(item.mono === true
              ? { fontFamily: 'var(--font-mono)', fontSize: '12.5px', fontWeight: 500 }
              : {}),
          }}
        >
          {item.value}
        </dd>
      </div>
    ))}
  </dl>
);
FieldList.displayName = 'FieldList';
