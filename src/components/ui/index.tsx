'use client'

import { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes } from 'react'
import { clsx } from 'clsx'

// ─── Button ──────────────────────────────────────────────────────────────────

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={clsx(
        'relative inline-flex items-center justify-center gap-2 font-mono font-medium transition-all duration-200 select-none',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-void',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        {
          // variants
          'bg-accent text-void hover:bg-accent-dim active:scale-[0.98] glow-accent':
            variant === 'primary',
          'bg-transparent text-text-dim hover:text-text hover:bg-border border border-border hover:border-border-bright':
            variant === 'ghost',
          'bg-transparent text-accent border border-accent/40 hover:border-accent hover:bg-accent/10':
            variant === 'outline',
          'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 hover:border-red-500/50':
            variant === 'danger',
          // sizes
          'text-xs px-3 py-1.5 rounded': size === 'sm',
          'text-sm px-4 py-2 rounded-md': size === 'md',
          'text-base px-6 py-3 rounded-lg': size === 'lg',
        },
        className
      )}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
}

// ─── Input ───────────────────────────────────────────────────────────────────

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  prefix?: string
}

export function Input({ label, error, hint, prefix, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-mono text-text-dim uppercase tracking-widest">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 text-muted font-mono text-sm select-none">{prefix}</span>
        )}
        <input
          className={clsx(
            'w-full bg-panel border border-border rounded-md font-mono text-sm text-text',
            'placeholder:text-muted/50 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/20',
            'transition-colors duration-150',
            prefix ? 'pl-8 pr-3 py-2.5' : 'px-3 py-2.5',
            error && 'border-red-500/50 focus:border-red-500/70',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-400 font-mono">{error}</p>}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
    </div>
  )
}

// ─── Card ────────────────────────────────────────────────────────────────────

interface CardProps {
  children: ReactNode
  className?: string
  glow?: boolean
}

export function Card({ children, className, glow }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-panel border border-border rounded-xl p-5 transition-all duration-200',
        glow && 'hover:border-accent/30 hover:shadow-[0_0_30px_rgba(0,255,135,0.05)]',
        className
      )}
    >
      {children}
    </div>
  )
}

// ─── Badge ───────────────────────────────────────────────────────────────────

type BadgeVariant = 'success' | 'warn' | 'error' | 'info' | 'neutral'

export function Badge({ children, variant = 'neutral' }: { children: ReactNode; variant?: BadgeVariant }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 text-xs font-mono px-2 py-0.5 rounded-full border',
        {
          'text-accent border-accent/30 bg-accent/5': variant === 'success',
          'text-yellow-400 border-yellow-400/30 bg-yellow-400/5': variant === 'warn',
          'text-red-400 border-red-400/30 bg-red-400/5': variant === 'error',
          'text-blue-400 border-blue-400/30 bg-blue-400/5': variant === 'info',
          'text-muted border-border bg-surface': variant === 'neutral',
        }
      )}
    >
      {children}
    </span>
  )
}

// ─── Alert ───────────────────────────────────────────────────────────────────

type AlertType = 'success' | 'error' | 'info' | 'warn'

export function Alert({ type, children }: { type: AlertType; children: ReactNode }) {
  return (
    <div
      className={clsx(
        'flex items-start gap-3 px-4 py-3 rounded-lg border font-mono text-sm',
        {
          'bg-accent/5 border-accent/20 text-accent': type === 'success',
          'bg-red-500/5 border-red-500/20 text-red-400': type === 'error',
          'bg-blue-500/5 border-blue-500/20 text-blue-400': type === 'info',
          'bg-yellow-500/5 border-yellow-500/20 text-yellow-400': type === 'warn',
        }
      )}
    >
      <span className="mt-0.5">
        {type === 'success' && '✓'}
        {type === 'error' && '✗'}
        {type === 'info' && 'ℹ'}
        {type === 'warn' && '⚠'}
      </span>
      <span>{children}</span>
    </div>
  )
}

// ─── Spinner ─────────────────────────────────────────────────────────────────

export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  return (
    <svg
      className={clsx('animate-spin text-accent', {
        'h-4 w-4': size === 'sm',
        'h-6 w-6': size === 'md',
        'h-10 w-10': size === 'lg',
      })}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

// ─── Modal ───────────────────────────────────────────────────────────────────

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-void/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-panel border border-border-bright rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-display font-semibold text-text">{title}</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-text transition-colors font-mono"
          >
            ✕
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
