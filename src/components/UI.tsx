import React from 'react';
import { cn } from '../utils/cn';

export function StatusBadge({ status, variant = 'default' }: { status: string; variant?: 'default' | 'small' }) {
  const config: Record<string, string> = {
    ACTIVE: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    SUSPENDED: 'bg-red-100 text-red-800 border-red-200',
    TEST: 'bg-blue-100 text-blue-800 border-blue-200',
    DECOMMISSIONED: 'bg-gray-100 text-gray-600 border-gray-200',
    UNASSIGNED: 'bg-amber-100 text-amber-800 border-amber-200',
    ASSIGNED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    RESERVED: 'bg-purple-100 text-purple-800 border-purple-200',
    QUARANTINED: 'bg-orange-100 text-orange-800 border-orange-200',
    SUCCESS: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    FAILED: 'bg-red-100 text-red-800 border-red-200',
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    PAUSED: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    COMPLETED: 'bg-blue-100 text-blue-800 border-blue-200',
    DRAFT: 'bg-gray-100 text-gray-600 border-gray-200',
    ARCHIVED: 'bg-gray-100 text-gray-500 border-gray-200',
    DISABLED: 'bg-gray-100 text-gray-600 border-gray-200',
  };

  const base = variant === 'small'
    ? 'text-xs px-1.5 py-0.5'
    : 'text-xs px-2.5 py-1';

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border',
        base,
        config[status] || 'bg-gray-100 text-gray-700 border-gray-200'
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5', {
        'bg-emerald-500': status === 'ACTIVE' || status === 'ASSIGNED' || status === 'SUCCESS',
        'bg-red-500': status === 'SUSPENDED' || status === 'FAILED',
        'bg-blue-500': status === 'TEST' || status === 'COMPLETED',
        'bg-gray-400': status === 'DECOMMISSIONED' || status === 'DRAFT' || status === 'DISABLED' || status === 'ARCHIVED',
        'bg-amber-500': status === 'UNASSIGNED',
        'bg-purple-500': status === 'RESERVED',
        'bg-orange-500': status === 'QUARANTINED',
        'bg-yellow-500': status === 'PAUSED' || status === 'PENDING',
      })} />
      {status}
    </span>
  );
}

export function KPICard({
  label,
  value,
  icon,
  color = 'blue',
  trend,
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: 'blue' | 'emerald' | 'amber' | 'purple' | 'red' | 'slate';
  trend?: { value: number; direction: 'up' | 'down' };
}) {
  const colorMap: Record<string, string> = {
    blue: 'from-blue-50 to-blue-100/50 border-blue-200',
    emerald: 'from-emerald-50 to-emerald-100/50 border-emerald-200',
    amber: 'from-amber-50 to-amber-100/50 border-amber-200',
    purple: 'from-purple-50 to-purple-100/50 border-purple-200',
    red: 'from-red-50 to-red-100/50 border-red-200',
    slate: 'from-slate-50 to-slate-100/50 border-slate-200',
  };

  const iconColorMap: Record<string, string> = {
    blue: 'text-blue-600 bg-blue-100',
    emerald: 'text-emerald-600 bg-emerald-100',
    amber: 'text-amber-600 bg-amber-100',
    purple: 'text-purple-600 bg-purple-100',
    red: 'text-red-600 bg-red-100',
    slate: 'text-slate-600 bg-slate-100',
  };

  return (
    <div className={`relative overflow-hidden rounded-xl border bg-gradient-to-br ${colorMap[color]} p-5 transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
          {trend && (
            <div className="mt-1 flex items-center text-xs">
              <span className={trend.direction === 'up' ? 'text-emerald-600' : 'text-red-600'}>
                {trend.direction === 'up' ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-slate-400 ml-1">vs last month</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={`rounded-lg p-2.5 ${iconColorMap[color]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="rounded-full bg-slate-100 p-4 text-slate-400 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-medium text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500 text-center max-w-sm">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export function LoadingState({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-slate-500">{text}</span>
      </div>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center">
        <div className="rounded-full bg-red-50 p-3 w-12 h-12 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <p className="text-sm text-red-600 font-medium">{message}</p>
        {onRetry && (
          <button onClick={onRetry} className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium">
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

export function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ============================================================
// Card Component
// ============================================================
export function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6', className)}>
      {children}
    </div>
  );
}

// ============================================================
// Badge Component
// ============================================================
export function Badge({
  children,
  variant = 'default',
  className = '',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info';
  className?: string;
}) {
  const variantClasses: Record<string, string> = {
    default: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  };

  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', variantClasses[variant], className)}>
      {children}
    </span>
  );
}

// ============================================================
// Button Component
// ============================================================
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  onClick,
  className = '',
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const variantClasses: Record<string, string> = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700',
    danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800',
  };

  const sizeClasses: Record<string, string> = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {children}
    </button>
  );
}

// ============================================================
// Input Component
// ============================================================
export function Input({
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  className = '',
}: {
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      className={cn(
        'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed',
        className
      )}
    />
  );
}

// ============================================================
// Select Component
// ============================================================
export function Select({
  value,
  onChange,
  options,
  disabled = false,
  className = '',
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={cn(
        'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed',
        className
      )}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}
