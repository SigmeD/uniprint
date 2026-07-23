import type { ReactNode } from 'react';
import { cn } from '../lib/utils';

/* ─── KanbanBoard ─── */

export interface KanbanBoardProps {
  children: ReactNode;
  className?: string;
}

export const KanbanBoard = ({ children, className }: KanbanBoardProps) => (
  <div
    className={cn(
      'grid gap-3.5',
      'grid-cols-1 min-[600px]:grid-cols-2 min-[1100px]:grid-cols-4',
      className,
    )}
  >
    {children}
  </div>
);
KanbanBoard.displayName = 'KanbanBoard';

/* ─── KanbanColumn ─── */

export type KanbanColumnTone = 'lead' | 'design' | 'work' | 'done';

export interface KanbanColumnProps {
  title: string;
  tone: KanbanColumnTone;
  count?: number;
  children: ReactNode;
  className?: string;
}

const TONE_DOT: Record<KanbanColumnTone, string> = {
  lead:   'var(--color-blue)',
  design: '#7B5896',
  work:   'var(--color-amber)',
  done:   'var(--color-green)',
};

export const KanbanColumn = ({
  title,
  tone,
  count,
  children,
  className,
}: KanbanColumnProps) => (
  <div
    className={cn(className)}
    style={{
      background:   'var(--color-surface-3)',
      border:       '1px solid var(--color-line)',
      borderRadius: '14px',
      padding:      '12px',
    }}
  >
    {/* Column header */}
    <div
      style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        marginBottom:   '10px',
        padding:        '0 4px',
      }}
    >
      {/* Title with dot */}
      <span
        style={{
          fontSize:      '11.5px',
          fontWeight:    700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color:         'var(--color-ink-2)',
          display:       'flex',
          alignItems:    'center',
          gap:           '7px',
        }}
      >
        {/* Colour dot — replaces CSS ::before */}
        <span
          aria-hidden="true"
          style={{
            display:      'inline-block',
            width:        '7px',
            height:       '7px',
            borderRadius: '50%',
            flexShrink:   0,
            background:   TONE_DOT[tone],
          }}
        />
        {title}
      </span>

      {/* Count badge */}
      {count != null && (
        <span
          style={{
            fontSize:     '11px',
            color:        'var(--color-ink-3)',
            background:   'var(--color-surface)',
            padding:      '2px 8px',
            borderRadius: '99px',
            fontWeight:   600,
          }}
        >
          {count}
        </span>
      )}
    </div>

    {children}
  </div>
);
KanbanColumn.displayName = 'KanbanColumn';

/* ─── KanbanCard ─── */

export interface KanbanCardAssignee {
  initials: string;
  tone: 'green' | 'blue' | 'amber' | 'gold' | 'violet';
}

export interface KanbanCardProps {
  id: string;
  title: string;
  meta?: ReactNode;
  assignee?: KanbanCardAssignee;
  /** Ссылка на карточку заказа — делает всю плитку кликабельной. */
  href?: string;
  className?: string;
}

const AVATAR_GRADIENT: Record<KanbanCardAssignee['tone'], string> = {
  green:  'linear-gradient(135deg, #7AAB54, #3F6E22)',
  blue:   'linear-gradient(135deg, #5A8AA8, #2E5470)',
  amber:  'linear-gradient(135deg, #D9A84A, #A06C18)',
  gold:   'linear-gradient(135deg, #C8923A, #8C5818)',
  violet: 'linear-gradient(135deg, #8C6FA8, #5A4070)',
};

export const KanbanCard = ({
  id,
  title,
  meta,
  assignee,
  href,
  className,
}: KanbanCardProps) => {
  const Tag = href != null ? 'a' : 'div';
  return (
  <Tag
    {...(href != null ? { href, 'aria-label': `Заказ ${id} — ${title}` } : {})}
    className={cn(
      href != null &&
        'block transition-[box-shadow,transform] duration-150 hover:-translate-y-px hover:shadow-[var(--shadow-sm)]',
      className,
    )}
    style={{
      background:   'var(--color-surface)',
      border:       '1px solid var(--color-line)',
      borderRadius: '10px',
      padding:      '11px 12px',
      marginBottom: '8px',
    }}
  >
    {/* Order ID */}
    <div
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize:   '11px',
        color:      'var(--color-ink-3)',
        fontWeight: 500,
      }}
    >
      {id}
    </div>

    {/* Title */}
    <div
      style={{
        fontWeight:  600,
        fontSize:    '13px',
        margin:      '3px 0 6px',
        lineHeight:  1.3,
        color:       'var(--color-ink)',
      }}
    >
      {title}
    </div>

    {/* Footer: meta + assignee */}
    <div
      style={{
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'center',
        fontSize:       '11.5px',
        color:          'var(--color-ink-3)',
      }}
    >
      <div>{meta}</div>

      {assignee != null && (
        <span
          aria-label={assignee.initials}
          title={assignee.initials}
          style={{
            width:        '18px',
            height:       '18px',
            borderRadius: '50%',
            background:   AVATAR_GRADIENT[assignee.tone],
            fontSize:     '9px',
            fontWeight:   700,
            color:        '#fff',
            display:      'grid',
            placeItems:   'center',
            flexShrink:   0,
          }}
        >
          {assignee.initials}
        </span>
      )}
    </div>
  </Tag>
  );
};
KanbanCard.displayName = 'KanbanCard';
