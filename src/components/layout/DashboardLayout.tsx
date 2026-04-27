'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { useAuth } from '@/lib/auth-context'

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: '◈' },
  { href: '/dashboard/credentials', label: 'Credentials', icon: '⊟' },
  { href: '/dashboard/sharing', label: 'Sharing', icon: '⇌' },
  { href: '/dashboard/audit', label: 'Audit Log', icon: '◷' },
  { href: '/recipient', label: 'Recipient View', icon: '↗', divider: true },
]

export function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { username, logout } = useAuth()

  return (
    <div className="flex h-screen bg-void overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-surface border-r border-border flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-accent/10 border border-accent/30 flex items-center justify-center">
              <span className="text-accent text-xs font-mono font-bold">ZK</span>
            </div>
            <div>
              <div className="font-display font-bold text-text text-sm leading-none">ZKP Vault</div>
              <div className="text-[10px] text-muted font-mono mt-0.5">zero-knowledge</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => (
            <div key={item.href}>
              {item.divider && <div className="my-3 border-t border-border" />}
              <Link
                href={item.href}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-mono transition-all duration-150',
                  pathname === item.href
                    ? 'bg-accent/10 text-accent border border-accent/20'
                    : 'text-text-dim hover:text-text hover:bg-border'
                )}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t border-border">
          <div className="flex items-center gap-2.5 px-3 py-2">
            <div className="w-7 h-7 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center text-xs font-mono text-accent">
              {username?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-mono text-text truncate">{username}</div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent status-pulse" />
                <span className="text-[10px] text-muted">authenticated</span>
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full mt-2 px-3 py-1.5 text-xs font-mono text-muted hover:text-red-400 text-left transition-colors"
          >
            → sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto bg-void bg-grid">
        {children}
      </main>
    </div>
  )
}
