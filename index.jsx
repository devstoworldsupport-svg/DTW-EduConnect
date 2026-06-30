// src/components/common/index.jsx — All shared UI components

import { useState } from 'react'
import { X, ChevronLeft, ChevronRight, Search, Filter, Download, Plus, AlertCircle, CheckCircle, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react'

// ─── MetricCard ──────────────────────────────────────────────────────────────
export function MetricCard({ icon: Icon, label, value, sub, trend, color = 'blue', loading }) {
  const colors = {
    blue: 'bg-blue-500/10 text-blue-400',
    green: 'bg-emerald-500/10 text-emerald-400',
    purple: 'bg-purple-500/10 text-purple-400',
    amber: 'bg-amber-500/10 text-amber-400',
    red: 'bg-red-500/10 text-red-400',
  }
  if (loading) return (
    <div className="card p-5 space-y-3">
      <div className="skeleton w-8 h-8 rounded-lg" />
      <div className="skeleton w-16 h-7 rounded" />
      <div className="skeleton w-24 h-3 rounded" />
    </div>
  )
  return (
    <div className="card p-5 hover:border-white/20 transition-colors">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${colors[color]}`}>
        <Icon size={18} />
      </div>
      <div className="text-2xl font-semibold text-white">{value}</div>
      <div className="text-xs text-white/50 mt-0.5">{label}</div>
      {sub && (
        <div className={`flex items-center gap-1 mt-2 text-xs ${trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-white/30'}`}>
          {trend === 'up' ? <TrendingUp size={11} /> : trend === 'down' ? <TrendingDown size={11} /> : <Minus size={11} />}
          {sub}
        </div>
      )}
    </div>
  )
}

// ─── PageHeader ──────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-6 gap-4">
      <div>
        <h1 className="text-xl font-semibold text-white">{title}</h1>
        {subtitle && <p className="text-sm text-white/40 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}

// ─── SearchBar ───────────────────────────────────────────────────────────────
export function SearchBar({ value, onChange, placeholder = 'Pesquisar...' }) {
  return (
    <div className="relative">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input pl-9 py-2 text-sm"
      />
      {value && (
        <button onClick={() => onChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
          <X size={14} />
        </button>
      )}
    </div>
  )
}

// ─── DataTable ───────────────────────────────────────────────────────────────
export function DataTable({ columns, data, loading, emptyMessage = 'Sem dados', onRowClick }) {
  if (loading) return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-12 w-full rounded-lg" />)}
    </div>
  )
  if (!data?.length) return (
    <div className="text-center py-16 text-white/30">
      <AlertCircle size={32} className="mx-auto mb-3 opacity-50" />
      <p className="text-sm">{emptyMessage}</p>
    </div>
  )
  return (
    <div className="table-wrap">
      <table className="data w-full">
        <thead>
          <tr>{columns.map((col) => <th key={col.key} style={{ width: col.width }} className="whitespace-nowrap">{col.label}</th>)}</tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.id || i} onClick={() => onRowClick?.(row)} className={onRowClick ? 'cursor-pointer' : ''}>
              {columns.map((col) => (
                <td key={col.key}>{col.render ? col.render(row[col.key], row) : row[col.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Pagination ──────────────────────────────────────────────────────────────
export function Pagination({ page, total, perPage = 10, onChange }) {
  const pages = Math.ceil(total / perPage)
  if (pages <= 1) return null
  return (
    <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
      <span className="text-xs text-white/30">{total} registos · Página {page} de {pages}</span>
      <div className="flex gap-1">
        <button onClick={() => onChange(page - 1)} disabled={page === 1} className="btn btn-secondary btn-sm disabled:opacity-30">
          <ChevronLeft size={14} />
        </button>
        {[...Array(Math.min(5, pages))].map((_, i) => {
          const p = i + 1
          return (
            <button key={p} onClick={() => onChange(p)} className={`btn btn-sm w-8 ${p === page ? 'btn-primary' : 'btn-secondary'}`}>{p}</button>
          )
        })}
        <button onClick={() => onChange(page + 1)} disabled={page === pages} className="btn btn-secondary btn-sm disabled:opacity-30">
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

// ─── Modal ───────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null
  const sizes = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`card-solid w-full ${sizes[size]} max-h-[90vh] flex flex-col animate-fade-in`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="btn-icon text-white/40 hover:text-white"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-5">{children}</div>
      </div>
    </div>
  )
}

// ─── ConfirmDialog ───────────────────────────────────────────────────────────
export function ConfirmDialog({ open, onClose, onConfirm, title, message, danger }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-white/60 mb-5">{message}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="btn-secondary">Cancelar</button>
        <button onClick={onConfirm} className={danger ? 'btn-danger' : 'btn-primary'}>Confirmar</button>
      </div>
    </Modal>
  )
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  const map = {
    active: { label: 'Activo', cls: 'badge-green' },
    inactive: { label: 'Inactivo', cls: 'badge-gray' },
    paid: { label: 'Pago', cls: 'badge-green' },
    pending: { label: 'Pendente', cls: 'badge-amber' },
    late: { label: 'Atrasado', cls: 'badge-red' },
    present: { label: 'Presente', cls: 'badge-green' },
    absent: { label: 'Falta', cls: 'badge-red' },
    late_att: { label: 'Atraso', cls: 'badge-amber' },
    justified: { label: 'Justificada', cls: 'badge-blue' },
    normal: { label: 'Normal', cls: 'badge-gray' },
    important: { label: 'Importante', cls: 'badge-amber' },
    urgent: { label: 'Urgente', cls: 'badge-red' },
  }
  const s = map[status] || { label: status, cls: 'badge-gray' }
  return <span className={s.cls}>{s.label}</span>
}

// ─── GradePill ───────────────────────────────────────────────────────────────
export function GradePill({ value }) {
  const v = parseFloat(value)
  const cls = v >= 14 ? 'badge-green' : v >= 10 ? 'badge-blue' : v >= 7 ? 'badge-amber' : 'badge-red'
  return <span className={cls}>{value ?? '—'}</span>
}

// ─── AttendanceDots ──────────────────────────────────────────────────────────
export function AttendanceDots({ records, limit: lim = 30 }) {
  const statusColor = { present: 'bg-emerald-500', absent: 'bg-red-500', late: 'bg-amber-500', justified: 'bg-blue-500' }
  return (
    <div className="flex gap-1 flex-wrap">
      {records.slice(0, lim).map((r, i) => (
        <div key={i} title={`${r.date}: ${r.status}`} className={`w-3.5 h-3.5 rounded-sm ${statusColor[r.status] || 'bg-white/10'}`} />
      ))}
    </div>
  )
}

// ─── Avatar ──────────────────────────────────────────────────────────────────
export function Avatar({ name, photo, size = 'md' }) {
  const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-16 h-16 text-xl' }
  const initials = name?.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?'
  const colors = ['bg-blue-600', 'bg-emerald-600', 'bg-purple-600', 'bg-amber-600', 'bg-red-600', 'bg-pink-600']
  const color = colors[initials.charCodeAt(0) % colors.length]
  if (photo) return <img src={photo} alt={name} className={`${sizes[size]} rounded-full object-cover flex-shrink-0`} />
  return <div className={`${sizes[size]} ${color} rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0`}>{initials}</div>
}

// ─── EmptyState ──────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="text-center py-16">
      <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Icon size={24} className="text-white/20" />
      </div>
      <h3 className="text-sm font-medium text-white/50 mb-1">{title}</h3>
      {description && <p className="text-xs text-white/30 mb-4">{description}</p>}
      {action}
    </div>
  )
}

// ─── SectionCard ─────────────────────────────────────────────────────────────
export function SectionCard({ title, action, children, className = '' }) {
  return (
    <div className={`card p-5 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h3 className="text-sm font-semibold text-white">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  )
}

// ─── Spinner ─────────────────────────────────────────────────────────────────
export function Spinner({ size = 'md' }) {
  const s = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }
  return <div className={`${s[size]} border-2 border-brand/30 border-t-brand rounded-full animate-spin`} />
}

// ─── LoadingPage ─────────────────────────────────────────────────────────────
export function LoadingPage() {
  return (
    <div className="flex items-center justify-center h-64">
      <Spinner size="lg" />
    </div>
  )
}

// ─── FormField ───────────────────────────────────────────────────────────────
export function FormField({ label, error, children }) {
  return (
    <div>
      {label && <label className="input-label">{label}</label>}
      {children}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  )
}

// ─── Select ──────────────────────────────────────────────────────────────────
export function Select({ value, onChange, options, placeholder, className = '' }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`input ${className}`}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
      ))}
    </select>
  )
}

// ─── Tabs ────────────────────────────────────────────────────────────────────
export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 bg-white/5 rounded-lg p-1 mb-5">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`flex-1 px-3 py-1.5 rounded-md text-sm transition-all ${active === tab.key ? 'bg-white/10 text-white font-medium' : 'text-white/40 hover:text-white/70'}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
