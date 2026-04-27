'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { listCredentials, myShares, getAuditLog } from '@/lib/api';
import type { Credential, ShareItem, AuditEntry } from '@/lib/api';

export default function DashboardPage() {
  const { username } = useAuth();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [shares, setShares] = useState<ShareItem[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      listCredentials().catch(() => []),
      myShares().catch(() => []),
      getAuditLog().catch(() => []),
    ]).then(([creds, sharesList, auditList]) => {
      setCredentials(creds);
      setShares(sharesList);
      setAudit(auditList);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {username}</h1>
        <p className="text-muted mt-1">Manage your credentials and secure shares</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardCard
          title="Credentials"
          value={credentials.length}
          description="Total stored credentials"
          href="/dashboard/credentials"
        />
        <DashboardCard
          title="Active Shares"
          value={shares.filter(s => !s.is_expired).length}
          description="Currently active share tokens"
          href="/dashboard/shares"
        />
        <DashboardCard
          title="Audit Events"
          value={audit.length}
          description="Logged actions"
          href="/dashboard/audit"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent shares */}
        <div className="bg-panel border border-border rounded-xl p-4">
          <h2 className="font-mono text-sm text-accent mb-3">Recent Shares</h2>
          {shares.length === 0 ? (
            <p className="text-muted text-sm">No shares created yet.</p>
          ) : (
            <ul className="space-y-2">
              {shares.slice(0, 5).map((share) => (
                <li key={share.share_id} className="text-sm flex justify-between border-b border-border/50 pb-2">
                  <span className="font-mono">{share.credential_name}</span>
                  <span className="text-muted">
                    {share.use_count}/{share.max_uses} uses
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent audit */}
        <div className="bg-panel border border-border rounded-xl p-4">
          <h2 className="font-mono text-sm text-accent mb-3">Recent Activity</h2>
          {audit.length === 0 ? (
            <p className="text-muted text-sm">No recent activity.</p>
          ) : (
            <ul className="space-y-2">
              {audit.slice(0, 5).map((entry) => (
                <li key={entry.id} className="text-xs flex justify-between border-b border-border/50 pb-2">
                  <span>{entry.action}</span>
                  <span className="text-muted">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function DashboardCard({
  title,
  value,
  description,
  href,
}: {
  title: string;
  value: number;
  description: string;
  href: string;
}) {
  return (
    <Link href={href} className="block bg-panel border border-border rounded-xl p-4 hover:border-accent/30 transition-colors">
      <h3 className="font-mono text-sm text-accent">{title}</h3>
      <p className="text-3xl font-bold mt-2">{value}</p>
      <p className="text-xs text-muted mt-1">{description}</p>
    </Link>
  );
}





























// 'use client'

// import { useEffect, useState } from 'react'
// import { useAuth } from '@/lib/auth-context'
// import { Card, Badge, Spinner } from '@/components/ui'
// import { listCredentials, listShares, getAuditLog, Credential, Share, AuditEntry } from '@/lib/api'
// import { timeAgo } from '@/lib/zkp'

// export default function DashboardPage() {
//   const { username } = useAuth()
//   const [credentials, setCredentials] = useState<Credential[]>([])
//   const [shares, setShares] = useState<Share[]>([])
//   const [auditLog, setAuditLog] = useState<AuditEntry[]>([])
//   const [loading, setLoading] = useState(true)

//   useEffect(() => {
//     Promise.all([
//       listCredentials().catch(() => []),
//       listShares().catch(() => []),
//       getAuditLog().catch(() => []),
//     ]).then(([c, s, a]) => {
//       setCredentials(c)
//       setShares(s)
//       setAuditLog(a)
//       setLoading(false)
//     })
//   }, [])

//   const activeShares = shares.filter((s) => !s.revoked)
//   const revokedShares = shares.filter((s) => s.revoked)

//   const stats = [
//     { label: 'Credentials', value: credentials.length, icon: '⊟', color: 'text-accent' },
//     { label: 'Active Shares', value: activeShares.length, icon: '⇌', color: 'text-blue-400' },
//     { label: 'Revoked', value: revokedShares.length, icon: '✗', color: 'text-red-400' },
//     { label: 'Audit Events', value: auditLog.length, icon: '◷', color: 'text-yellow-400' },
//   ]

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-full">
//         <Spinner size="lg" />
//       </div>
//     )
//   }

//   return (
//     <div className="p-8 max-w-5xl">
//       {/* Header */}
//       <div className="mb-8">
//         <p className="text-xs font-mono text-muted mb-1">dashboard / overview</p>
//         <h1 className="font-display font-bold text-2xl text-text">
//           Welcome back, <span className="text-accent">{username}</span>
//         </h1>
//         <p className="text-text-dim text-sm mt-1">
//           Your zero-knowledge credential vault is secure and active.
//         </p>
//       </div>

//       {/* Stats */}
//       <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
//         {stats.map((s) => (
//           <Card key={s.label} glow>
//             <div className={`text-2xl mb-1 ${s.color} font-mono font-bold`}>
//               {s.icon} {s.value}
//             </div>
//             <div className="text-xs text-muted font-mono">{s.label}</div>
//           </Card>
//         ))}
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* Recent Credentials */}
//         <Card>
//           <div className="flex items-center justify-between mb-4">
//             <h2 className="font-display font-semibold text-text">Recent Credentials</h2>
//             <a href="/dashboard/credentials" className="text-xs font-mono text-accent hover:underline">
//               view all →
//             </a>
//           </div>
//           {credentials.length === 0 ? (
//             <p className="text-muted text-sm font-mono">No credentials yet.</p>
//           ) : (
//             <div className="space-y-2">
//               {credentials.slice(0, 5).map((c) => (
//                 <div key={c.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
//                   <div>
//                     <div className="text-sm font-mono text-text">{c.label || c.username}</div>
//                     <div className="text-xs text-muted truncate max-w-[180px]">{c.service_url}</div>
//                   </div>
//                   <span className="text-xs text-muted font-mono">{timeAgo(c.created_at)}</span>
//                 </div>
//               ))}
//             </div>
//           )}
//         </Card>

//         {/* Recent Audit */}
//         <Card>
//           <div className="flex items-center justify-between mb-4">
//             <h2 className="font-display font-semibold text-text">Audit Log</h2>
//             <a href="/dashboard/audit" className="text-xs font-mono text-accent hover:underline">
//               view all →
//             </a>
//           </div>
//           {auditLog.length === 0 ? (
//             <p className="text-muted text-sm font-mono">No audit events yet.</p>
//           ) : (
//             <div className="space-y-2">
//               {auditLog.slice(0, 5).map((entry) => (
//                 <div key={entry.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
//                   <Badge variant={
//                     entry.action.includes('login') ? 'success' :
//                     entry.action.includes('revoke') ? 'error' :
//                     entry.action.includes('share') ? 'info' : 'neutral'
//                   }>
//                     {entry.action}
//                   </Badge>
//                   <span className="text-xs text-muted font-mono ml-auto">{timeAgo(entry.timestamp)}</span>
//                 </div>
//               ))}
//             </div>
//           )}
//         </Card>
//       </div>

//       {/* Active Shares */}
//       {activeShares.length > 0 && (
//         <Card className="mt-6">
//           <div className="flex items-center justify-between mb-4">
//             <h2 className="font-display font-semibold text-text">Active Shares</h2>
//             <a href="/dashboard/sharing" className="text-xs font-mono text-accent hover:underline">
//               manage →
//             </a>
//           </div>
//           <div className="space-y-2">
//             {activeShares.slice(0, 3).map((share) => (
//               <div key={share.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
//                 <div className="flex items-center gap-3">
//                   <Badge variant="success">active</Badge>
//                   <span className="text-sm font-mono text-text">{share.recipient_email}</span>
//                 </div>
//                 <span className="text-xs text-muted font-mono">expires {timeAgo(share.expires_at)}</span>
//               </div>
//             ))}
//           </div>
//         </Card>
//       )}
//     </div>
//   )
// }
