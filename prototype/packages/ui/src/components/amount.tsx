import { cn } from '../lib/utils';

export type AmountSize = 'sm' | 'md' | 'lg' | 'xl';
export type AmountTone = 'default' | 'muted' | 'positive' | 'negative';

export interface AmountProps {
  value: number;
  size?: AmountSize;
  tone?: AmountTone;
  /** Показывать знак «+» у положительных значений (дельты план/факт). */
  signed?: boolean;
  className?: string;
}

const SIZE_PX: Record<AmountSize, number> = {
  sm: 13,
  md: 14.5,
  lg: 18,
  xl: 28,
};

const TONE_COLOR: Record<AmountTone, string> = {
  default: 'var(--color-ink)',
  muted: 'var(--color-ink-3)',
  positive: 'var(--color-green)',
  negative: 'var(--color-brand-600)',
};

/**
 * Amount — денежная сумма единым начертанием: Fraunces, разряды через
 * неразрывный пробел, рубль всегда рядом. Заменяет россыпь
 * `style={{fontFamily:'var(--font-display)'}}` по страницам.
 */
export const Amount = ({
  value,
  size = 'md',
  tone = 'default',
  signed = false,
  className,
}: AmountProps) => {
  const prefix = signed && value > 0 ? '+' : '';
  return (
    <span
      className={cn('tabular whitespace-nowrap', className)}
      style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 500,
        fontSize: `${SIZE_PX[size]}px`,
        letterSpacing: '-0.01em',
        color: TONE_COLOR[tone],
      }}
    >
      {prefix}
      {value.toLocaleString('ru-RU')} ₽
    </span>
  );
};
Amount.displayName = 'Amount';
