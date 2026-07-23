import { Check } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../lib/utils';

export type StepState = 'done' | 'current' | 'pending';

export interface StepperStep {
  key: string;
  label: string;
  state: StepState;
  /** Подпись под шагом — дата, исполнитель. */
  hint?: string;
}

export interface StatusStepperProps {
  steps: StepperStep[];
  /** Плашка справа — например «Брак / переделка» вне основного маршрута. */
  aside?: ReactNode;
  className?: string;
  ariaLabel?: string;
}

const DOT_SIZE = 26;

/**
 * StatusStepper — маршрут статус-машины заказа (BR-07) горизонтальной лентой:
 * пройденные шаги с галочкой, текущий подсвечен коралловым с пульсацией,
 * будущие приглушены. На узких экранах лента скроллится по горизонтали.
 */
export const StatusStepper = ({
  steps,
  aside,
  className,
  ariaLabel = 'Этапы заказа',
}: StatusStepperProps) => (
  <div className={cn('flex flex-wrap items-center gap-3', className)}>
    {/* tabIndex — скроллируемая область должна фокусироваться с клавиатуры (WCAG 2.1.1) */}
    <section
      aria-label={ariaLabel}
      tabIndex={0}
      className="min-w-0 flex-1 overflow-x-auto pb-1"
    >
      <ol className="flex min-w-max items-start">
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1;
          const done = step.state === 'done';
          const current = step.state === 'current';
          return (
            <li key={step.key} className="flex items-start">
              <div className="flex flex-col items-center" style={{ width: 96 }}>
                <span
                  aria-hidden="true"
                  className={cn(
                    'grid place-items-center rounded-full',
                    current && '[animation:pulse-amber_1.8s_infinite]',
                  )}
                  style={{
                    width: DOT_SIZE,
                    height: DOT_SIZE,
                    background: done
                      ? 'var(--color-green)'
                      : current
                        ? 'var(--color-brand-500)'
                        : 'var(--color-surface-2)',
                    color: done || current ? '#fff' : 'var(--color-ink-4)',
                    border: done || current ? 'none' : '1px solid var(--color-line)',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {done ? <Check size={14} strokeWidth={3} /> : i + 1}
                </span>
                <span
                  className="mt-2 px-1 text-center"
                  style={{
                    fontSize: 11.5,
                    lineHeight: 1.25,
                    fontWeight: current ? 600 : 500,
                    color: current
                      ? 'var(--color-ink)'
                      : done
                        ? 'var(--color-ink-2)'
                        : 'var(--color-ink-4)',
                  }}
                >
                  {step.label}
                </span>
                {step.hint != null && (
                  <span
                    className="mt-0.5 text-center"
                    style={{ fontSize: 10.5, color: 'var(--color-ink-4)' }}
                  >
                    {step.hint}
                  </span>
                )}
              </div>

              {!isLast && (
                <span
                  aria-hidden="true"
                  style={{
                    display: 'block',
                    width: 56,
                    height: 2,
                    marginTop: DOT_SIZE / 2 - 1,
                    marginLeft: -14,
                    marginRight: -14,
                    borderRadius: 2,
                    background: done ? 'var(--color-green)' : 'var(--color-line)',
                  }}
                />
              )}
            </li>
          );
        })}
      </ol>
    </section>

    {aside != null && <div className="shrink-0">{aside}</div>}
  </div>
);
StatusStepper.displayName = 'StatusStepper';
