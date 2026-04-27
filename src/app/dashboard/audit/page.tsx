'use client';

import { useEffect, useState } from 'react';
import { Card, Button, Spinner, Alert, Input } from '@/components/ui';
import { myShares, revokeShare, increaseMaxUses, type ShareItem } from '@/lib/api';
import { timeAgo } from '@/lib/zkp';

export default function AuditPage() {
  const [shares, setShares] = useState<ShareItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<number | null>(null);
  const [increasing, setIncreasing] = useState<{ id: number; add: number } | null>(null);

  const loadShares = () => {
    myShares()
      .then(setShares)
      .catch(() => setShares([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadShares();
  }, []);

  const handleRevoke = async (shareId: number) => {
    setRevoking(shareId);
    try {
      await revokeShare(shareId);
      loadShares();
    } catch {
      setError('Failed to revoke');
    } finally {
      setRevoking(null);
    }
  };

  const handleIncreaseUses = async (shareId: number, addUses: number) => {
    setIncreasing({ id: shareId, add: addUses });
    try {
      await increaseMaxUses(shareId, addUses);
      loadShares();
    } catch {
      setError('Failed to increase max uses');
    } finally {
      setIncreasing(null);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Audit Trail</h1>
      {error && <Alert type="error" className="mb-4">{error}</Alert>}

      {shares.length === 0 ? (
        <Card className="py-12 text-center">
          <p className="text-muted">No active shares.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {shares.map((s) => (
            <Card key={s.share_id} className="p-4">
              <div className="flex justify-between items-start flex-wrap gap-3">
                <div>
                  <p className="font-mono text-accent">{s.credential_name}</p>
                  <p className="text-sm">Recipient: {s.recipient_email}</p>
                  <p className="text-xs text-muted">
                    Permission: {s.permission} · Uses: {s.use_count}/{s.max_uses}
                  </p>
                  <p className="text-xs text-muted">
                    Expires: {new Date(s.expires_at * 1000).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted">
                    Created {timeAgo(new Date(s.expires_at * 1000).toISOString())}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="danger"
                    loading={revoking === s.share_id}
                    onClick={() => handleRevoke(s.share_id)}
                  >
                    Revoke
                  </Button>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      defaultValue={1}
                      className="w-16 h-8 text-center"
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        // store temporarily, but we'll use a separate state per row for simplicity
                      }}
                      id={`add-uses-${s.share_id}`}
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={increasing?.id === s.share_id}
                      onClick={() => {
                        const input = document.getElementById(`add-uses-${s.share_id}`) as HTMLInputElement;
                        const add = parseInt(input?.value) || 1;
                        handleIncreaseUses(s.share_id, add);
                      }}
                    >
                      + uses
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


























// 'use client'

// import { useEffect, useState } from 'react'
// import { Card, Badge, Spinner } from '@/components/ui'
// import { getAuditLog, AuditEntry } from '@/lib/api'
// import { timeAgo } from '@/lib/zkp'

// function actionVariant(action: string): 'success' | 'error' | 'info' | 'warn' | 'neutral' {
//   if (action.includes('login')) return 'success'
//   if (action.includes('revoke') || action.includes('delete')) return 'error'
//   if (action.includes('share') || action.includes('handoff')) return 'info'
//   if (action.includes('relay') || action.includes('keycloak')) return 'warn'
//   return 'neutral'
// }

// export default function AuditPage() {
//   const [log, setLog] = useState<AuditEntry[]>([])
//   const [loading, setLoading] = useState(true)
//   const [filter, setFilter] = useState('')

//   useEffect(() => {
//     getAuditLog()
//       .then(setLog)
//       .catch(() => setLog([]))
//       .finally(() => setLoading(false))
//   }, [])

//   const filtered = log.filter(
//     (e) =>
//       !filter ||
//       e.action.toLowerCase().includes(filter.toLowerCase()) ||
//       e.details?.toLowerCase().includes(filter.toLowerCase())
//   )

//   return (
//     <div className="p-8 max-w-4xl">
//       <div className="mb-8">
//         <p className="text-xs font-mono text-muted mb-1">dashboard / audit</p>
//         <h1 className="font-display font-bold text-2xl text-text">Audit Log</h1>
//         <p className="text-text-dim text-sm mt-1">
//           Complete immutable record of all access and sharing events.
//         </p>
//       </div>

//       {/* Filter */}
//       <div className="mb-5">
//         <input
//           className="bg-panel border border-border rounded-md font-mono text-sm text-text px-3 py-2 w-full max-w-sm focus:outline-none focus:border-accent/60 placeholder:text-muted/50"
//           placeholder="Filter events…"
//           value={filter}
//           onChange={(e) => setFilter(e.target.value)}
//         />
//       </div>

//       {loading ? (
//         <div className="flex justify-center py-16"><Spinner size="lg" /></div>
//       ) : filtered.length === 0 ? (
//         <Card className="py-16 text-center">
//           <div className="text-4xl mb-3">◷</div>
//           <p className="text-text-dim font-mono text-sm">No audit events found.</p>
//         </Card>
//       ) : (
//         <div className="space-y-2">
//           {filtered.map((entry, i) => (
//             <Card key={entry.id || i} className="flex items-start gap-4 py-3">
//               <div className="flex-shrink-0 w-6 text-center font-mono text-xs text-muted">{filtered.length - i}</div>
//               <div className="flex-1 min-w-0">
//                 <div className="flex items-center gap-2 flex-wrap">
//                   <Badge variant={actionVariant(entry.action)}>{entry.action}</Badge>
//                   {entry.ip && (
//                     <span className="text-xs font-mono text-muted">{entry.ip}</span>
//                   )}
//                 </div>
//                 {entry.details && (
//                   <div className="text-xs text-muted font-mono mt-1 truncate">{entry.details}</div>
//                 )}
//                 {(entry.credential_id || entry.share_id) && (
//                   <div className="text-[10px] text-muted/60 font-mono mt-0.5">
//                     {entry.credential_id && <>cred: {entry.credential_id.slice(0, 8)}…</>}
//                     {entry.share_id && <> · share: {entry.share_id.slice(0, 8)}…</>}
//                   </div>
//                 )}
//               </div>
//               <div className="flex-shrink-0 text-xs font-mono text-muted">
//                 {timeAgo(entry.timestamp)}
//               </div>
//             </Card>
//           ))}
//         </div>
//       )}

//       {log.length > 0 && (
//         <p className="text-xs text-muted font-mono mt-4 text-right">
//           {filtered.length} of {log.length} events
//         </p>
//       )}
//     </div>
//   )
// }
