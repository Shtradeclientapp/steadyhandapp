'use client'

import { forwardRef, ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from 'react'
import clsx from 'clsx'

// ── Button ───────────────────────────────────────────────────────────────────
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'ink' | 'terra' | 'sage' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'ink', size = 'md', loading, className, children, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center gap-2 font-sans font-medium rounded-lg transition-all duration-150 cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed'
    const variants = {
      ink:   'bg-ink text-mist-l hover:bg-bark active:scale-[0.98]',
      terra: 'bg-terra text-white hover:bg-terra-l active:scale-[0.98]',
      sage:  'bg-stage-1 text-white hover:brightness-110 active:scale-[0.98]',
      ghost: 'bg-transparent text-ink border border-ink/20 hover:bg-mist-d active:scale-[0.98]',
      danger:'bg-red-600 text-white hover:bg-red-500 active:scale-[0.98]',
    }
    const sizes = {
      sm: 'px-3 py-1.5 text-xs rounded-md',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-[15px] rounded-[10px]',
      xl: 'px-8 py-4 text-base rounded-[11px]',
    }
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

// ── Card ─────────────────────────────────────────────────────────────────────
export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx('bg-mist-xl border border-ink/10 rounded-xl p-6', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardSm({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx('bg-mist-xl border border-ink/10 rounded-[10px] p-4', className)}
      {...props}
    >
      {children}
    </div>
  )
}

// ── Badge / Chip ──────────────────────────────────────────────────────────────
type BadgeVariant = 'sage' | 'terra' | 'clay' | 'blue' | 'purple' | 'teal' | 'muted'

const badgeStyles: Record<BadgeVariant, string> = {
  sage:   'bg-stage-1/10 border-stage-1/25 text-stage-1',
  terra:  'bg-terra/10 border-terra/22 text-terra',
  clay:   'bg-stage-4/12 border-stage-4/25 text-stage-4',
  blue:   'bg-stage-2/10 border-stage-2/22 text-stage-2',
  purple: 'bg-stage-3/10 border-stage-3/22 text-stage-3',
  teal:   'bg-stage-6/10 border-stage-6/22 text-stage-6',
  muted:  'bg-muted/10 border-muted/20 text-muted',
}

export function Badge({ variant = 'sage', className, children }: {
  variant?: BadgeVariant; className?: string; children: React.ReactNode
}) {
  return (
    <span className={clsx(
      'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border',
      badgeStyles[variant], className
    )}>
      {children}
    </span>
  )
}

// ── Input ─────────────────────────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string; hint?: string; error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, className, ...props }, ref) => (
    <div className="mb-4">
      {label && <label className="block text-[13px] font-medium text-ink mb-1.5">{label}</label>}
      <input
        ref={ref}
        className={clsx(
          'w-full px-3 py-2.5 border-[1.5px] rounded-lg text-[14px] bg-off text-ink outline-none transition-colors',
          error ? 'border-terra' : 'border-ink/18 focus:border-terra',
          className
        )}
        {...props}
      />
      {hint && !error && <p className="text-[11px] text-muted-l mt-1">{hint}</p>}
      {error && <p className="text-[11px] text-terra mt-1">{error}</p>}
    </div>
  )
)
Input.displayName = 'Input'

// ── Select ────────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string; hint?: string; error?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, error, className, children, ...props }, ref) => (
    <div className="mb-4">
      {label && <label className="block text-[13px] font-medium text-ink mb-1.5">{label}</label>}
      <select
        ref={ref}
        className={clsx(
          'w-full px-3 py-2.5 border-[1.5px] rounded-lg text-[14px] bg-off text-ink outline-none transition-colors',
          error ? 'border-terra' : 'border-ink/18 focus:border-terra',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {hint && !error && <p className="text-[11px] text-muted-l mt-1">{hint}</p>}
      {error && <p className="text-[11px] text-terra mt-1">{error}</p>}
    </div>
  )
)
Select.displayName = 'Select'

// ── Textarea ──────────────────────────────────────────────────────────────────
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string; hint?: string; error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, className, ...props }, ref) => (
    <div className="mb-4">
      {label && <label className="block text-[13px] font-medium text-ink mb-1.5">{label}</label>}
      <textarea
        ref={ref}
        className={clsx(
          'w-full px-3 py-2.5 border-[1.5px] rounded-lg text-[14px] bg-off text-ink outline-none transition-colors resize-y min-h-[88px]',
          error ? 'border-terra' : 'border-ink/18 focus:border-terra',
          className
        )}
        {...props}
      />
      {hint && !error && <p className="text-[11px] text-muted-l mt-1">{hint}</p>}
      {error && <p className="text-[11px] text-terra mt-1">{error}</p>}
    </div>
  )
)
Textarea.displayName = 'Textarea'

// ── Section label ─────────────────────────────────────────────────────────────
export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx('text-[10px] tracking-[1px] uppercase font-medium text-muted-l mb-2.5', className)}>
      {children}
    </div>
  )
}

// ── AI Panel ──────────────────────────────────────────────────────────────────
export function AIPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-ink rounded-xl p-5 mb-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,rgba(212,82,42,0.18),transparent_50%)]" />
      <div className="relative z-10">
        <div className="inline-flex items-center gap-1.5 bg-mist-l/15 border border-mist-l/30 rounded-full px-3 py-1 text-[10px] font-medium text-mist-l mb-2.5">
          <span className="w-1.5 h-1.5 bg-terra-l rounded-full animate-pulse-dot" />
          AI insight
        </div>
        <h3 className="font-display text-xl text-mist-l mb-1.5">{title}</h3>
        <div className="text-[13px] text-mist-l/65 leading-relaxed">{children}</div>
      </div>
    </div>
  )
}

// ── Progress bar ──────────────────────────────────────────────────────────────
export function ProgressBar({ value, color = 'var(--s4)' }: { value: number; color?: string }) {
  return (
    <div className="h-[3px] bg-ink/10 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${value}%`, background: color }}
      />
    </div>
  )
}

// ── Divider ───────────────────────────────────────────────────────────────────
export function Divider({ className }: { className?: string }) {
  return <div className={clsx('h-px bg-ink/10 my-5', className)} />
}

// ── Empty state ───────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }: {
  icon: string; title: string; description: string; action?: React.ReactNode
}) {
  return (
    <div className="text-center py-16 px-8">
      <div className="text-5xl mb-4 opacity-40">{icon}</div>
      <h3 className="font-display text-xl mb-2">{title}</h3>
      <p className="text-[13px] text-muted max-w-xs mx-auto mb-6">{description}</p>
      {action}
    </div>
  )
}

// ── Step dots ─────────────────────────────────────────────────────────────────
export function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex gap-1.5 mb-7">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={clsx(
            'h-2 rounded-full transition-all duration-300',
            i < current  ? 'w-2 bg-stage-1' :
            i === current ? 'w-6 bg-stage-1' :
                            'w-2 bg-ink/20'
          )}
        />
      ))}
    </div>
  )
}

export { StageRail } from './StageRail'
