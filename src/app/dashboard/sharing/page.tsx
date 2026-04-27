'use client';

import { useEffect, useState } from 'react';
import { Card, Button, Input, Alert, Spinner } from '@/components/ui';
import { listCredentials, myShares, createShareIntent, finalizeShare, type Credential, type ShareItem } from '@/lib/api';
import { encryptForShare } from '@/lib/shareCrypto';

export default function SharingPage() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCredId, setSelectedCredId] = useState<number | null>(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [secretToShare, setSecretToShare] = useState('');
  const [ttlMinutes, setTtlMinutes] = useState(60);
  const [maxUses, setMaxUses] = useState(5);
  const [permission, setPermission] = useState<'read' | 'read_once'>('read');
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    Promise.all([
      listCredentials().catch(() => []),
      myShares().catch(() => []),
    ]).then(([creds, sharesList]) => {
      setCredentials(creds);
      setLoading(false);
    });
  }, []);

  const handleCreateShare = async () => {
    if (!selectedCredId || !recipientEmail || !secretToShare) {
      setError('Please fill all fields');
      return;
    }
    setCreating(true);
    setError(null);
    setSuccess(null);

    try {
      const intent = await createShareIntent(
        selectedCredId,
        recipientEmail,
        permission,
        ttlMinutes,
        maxUses
      );

      const plaintext = JSON.stringify({ password: secretToShare });
      const encryptedPayload = await encryptForShare(plaintext, intent.share_token);

      await finalizeShare(intent.share_token, encryptedPayload);

      setShareToken(intent.share_token);
      setSuccess('Share created successfully!');
    } catch (err: any) {
      setError(err.message || 'Share creation failed');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">Create a secure share</h1>
      <p className="text-muted text-sm mb-6">
        Grant passwordless access to another user. The secret is re‑encrypted and never exposed.
      </p>

      <Card className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-mono mb-1">Credential</label>
          <select
            className="w-full bg-panel border border-border rounded-md px-3 py-2"
            value={selectedCredId ?? ''}
            onChange={(e) => setSelectedCredId(Number(e.target.value))}
          >
            <option value="">Select a credential</option>
            {credentials.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name || c.username} ({c.service_url})
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Recipient email"
          type="email"
          value={recipientEmail}
          onChange={(e) => setRecipientEmail(e.target.value)}
          placeholder="friend@example.com"
        />

        <Input
          label="Secret to share (decrypted locally)"
          type="password"
          value={secretToShare}
          onChange={(e) => setSecretToShare(e.target.value)}
          placeholder="Enter the plaintext secret"
          hint="This will be re‑encrypted with a one‑time key"
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-mono mb-1">Permission</label>
            <select
              className="w-full bg-panel border border-border rounded-md px-3 py-2"
              value={permission}
              onChange={(e) => setPermission(e.target.value as 'read' | 'read_once')}
            >
              <option value="read">Read (multiple uses)</option>
              <option value="read_once">Read once (single use)</option>
            </select>
          </div>
          <Input
            label="Validity (minutes)"
            type="number"
            min={1}
            max={1440}
            value={ttlMinutes}
            onChange={(e) => setTtlMinutes(Number(e.target.value))}
          />
          <Input
            label="Max uses"
            type="number"
            min={1}
            max={50}
            value={maxUses}
            onChange={(e) => setMaxUses(Number(e.target.value))}
            disabled={permission === 'read_once'}
            hint={permission === 'read_once' ? 'Forced to 1' : undefined}
          />
        </div>

        {error && <Alert type="error">{error}</Alert>}
        {success && <Alert type="success">{success}</Alert>}

        <Button
          onClick={handleCreateShare}
          loading={creating}
          variant="primary"
          className="w-full"
        >
          Create share
        </Button>

        {shareToken && (
          <div className="mt-4 p-3 bg-accent/5 border border-accent/20 rounded-lg">
            <p className="text-sm font-mono text-accent mb-1">Share token (send to recipient):</p>
            <code className="block text-xs break-all bg-black/30 p-2 rounded">{shareToken}</code>
          </div>
        )}
      </Card>
    </div>
  );
}























// 'use client';

// import { useEffect, useState } from 'react';
// import { Card, Button, Input, Alert, Select, Spinner } from '@/components/ui';
// import { listCredentials, createShareIntent, finalizeShare, type Credential } from '@/lib/api';
// import { encryptForShare } from '@/lib/shareCrypto';

// export default function SharingPage() {
//   const [credentials, setCredentials] = useState<Credential[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [selectedCredId, setSelectedCredId] = useState<number | null>(null);
//   const [recipientEmail, setRecipientEmail] = useState('');
//   const [secretToShare, setSecretToShare] = useState('');
//   const [ttlMinutes, setTtlMinutes] = useState(60);
//   const [maxUses, setMaxUses] = useState(5);
//   const [permission, setPermission] = useState<'read' | 'read_once'>('read');
//   const [shareToken, setShareToken] = useState<string | null>(null);
//   const [error, setError] = useState<string | null>(null);
//   const [success, setSuccess] = useState<string | null>(null);
//   const [creating, setCreating] = useState(false);

//   useEffect(() => {
//     listCredentials()
//       .then(setCredentials)
//       .catch(() => setCredentials([]))
//       .finally(() => setLoading(false));
//   }, []);

//   const handleCreateShare = async () => {
//     if (!selectedCredId || !recipientEmail || !secretToShare) {
//       setError('Please fill all fields');
//       return;
//     }
//     setCreating(true);
//     setError(null);
//     setSuccess(null);

//     try {
//       // 1. Create intent
//       const intent = await createShareIntent(
//         selectedCredId,
//         recipientEmail,
//         permission,
//         ttlMinutes,
//         maxUses
//       );

//       // 2. Locally encrypt the secret with the share token (one‑time key)
//       const plaintext = JSON.stringify({ password: secretToShare });
//       const encryptedPayload = await encryptForShare(plaintext, intent.share_token);

//       // 3. Finalize
//       await finalizeShare(intent.share_token, encryptedPayload);

//       setShareToken(intent.share_token);
//       setSuccess('Share created successfully!');
//     } catch (err: any) {
//       setError(err.message || 'Share creation failed');
//     } finally {
//       setCreating(false);
//     }
//   };

//   if (loading) {
//     return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
//   }

//   return (
//     <div className="p-8 max-w-2xl">
//       <h1 className="text-2xl font-bold mb-2">Create a secure share</h1>
//       <p className="text-muted text-sm mb-6">
//         Grant passwordless access to another user. The secret is re‑encrypted and never exposed.
//       </p>

//       <Card className="p-6 space-y-4">
//         <div>
//           <label className="block text-sm font-mono mb-1">Credential</label>
//           <select
//             className="w-full bg-panel border border-border rounded-md px-3 py-2"
//             value={selectedCredId ?? ''}
//             onChange={(e) => setSelectedCredId(Number(e.target.value))}
//           >
//             <option value="">Select a credential</option>
//             {credentials.map((c) => (
//               <option key={c.id} value={c.id}>
//                 {c.name || c.username} ({c.service_url})
//               </option>
//             ))}
//           </select>
//         </div>

//         <Input
//           label="Recipient email"
//           type="email"
//           value={recipientEmail}
//           onChange={(e) => setRecipientEmail(e.target.value)}
//           placeholder="friend@example.com"
//         />

//         <Input
//           label="Secret to share (decrypted locally)"
//           type="password"
//           value={secretToShare}
//           onChange={(e) => setSecretToShare(e.target.value)}
//           placeholder="Enter the plaintext secret"
//           hint="This will be re‑encrypted with a one‑time key"
//         />

//         <div className="grid grid-cols-2 gap-4">
//           <div>
//             <label className="block text-sm font-mono mb-1">Permission</label>
//             <select
//               className="w-full bg-panel border border-border rounded-md px-3 py-2"
//               value={permission}
//               onChange={(e) => setPermission(e.target.value as 'read' | 'read_once')}
//             >
//               <option value="read">Read (multiple uses)</option>
//               <option value="read_once">Read once (single use)</option>
//             </select>
//           </div>
//           <Input
//             label="Validity (minutes)"
//             type="number"
//             min={1}
//             max={1440}
//             value={ttlMinutes}
//             onChange={(e) => setTtlMinutes(Number(e.target.value))}
//           />
//           <Input
//             label="Max uses"
//             type="number"
//             min={1}
//             max={50}
//             value={maxUses}
//             onChange={(e) => setMaxUses(Number(e.target.value))}
//             disabled={permission === 'read_once'}
//             hint={permission === 'read_once' ? 'Forced to 1' : undefined}
//           />
//         </div>

//         {error && <Alert type="error">{error}</Alert>}
//         {success && <Alert type="success">{success}</Alert>}

//         <Button
//           onClick={handleCreateShare}
//           loading={creating}
//           variant="primary"
//           className="w-full"
//         >
//           Create share
//         </Button>

//         {shareToken && (
//           <div className="mt-4 p-3 bg-accent/5 border border-accent/20 rounded-lg">
//             <p className="text-sm font-mono text-accent mb-1">Share token (send to recipient):</p>
//             <code className="block text-xs break-all bg-black/30 p-2 rounded">{shareToken}</code>
//           </div>
//         )}
//       </Card>
//     </div>
//   );
// }





































// 'use client'

// import { useEffect, useState } from 'react'
// import {
//   Card, Button, Input, Alert, Modal, Badge, Spinner
// } from '@/components/ui'
// import {
//   listCredentials, listShares, createShare, revokeShare,
//   triggerRelayLogin, startDeviceFlow,
//   Credential, Share, RelayLoginResult, DeviceFlowResult
// } from '@/lib/api'
// import { timeAgo, formatTTL, isExpired } from '@/lib/zkp'

// export default function SharingPage() {
//   const [credentials, setCredentials] = useState<Credential[]>([])
//   const [shares, setShares] = useState<Share[]>([])
//   const [loading, setLoading] = useState(true)
//   const [showShareModal, setShowShareModal] = useState(false)
//   const [showRelayModal, setShowRelayModal] = useState(false)
//   const [showKcModal, setShowKcModal] = useState(false)

//   // Share form
//   const [shareForm, setShareForm] = useState({
//     credential_id: '',
//     recipient_email: '',
//     ttl_seconds: 3600,
//   })
//   const [shareError, setShareError] = useState<string | null>(null)
//   const [shareSaving, setShareSaving] = useState(false)

//   // Relay login result
//   const [relayCredId, setRelayCredId] = useState('')
//   const [relayResult, setRelayResult] = useState<RelayLoginResult | null>(null)
//   const [relayLoading, setRelayLoading] = useState(false)
//   const [relayError, setRelayError] = useState<string | null>(null)

//   // Keycloak device flow
//   const [kcCredId, setKcCredId] = useState('')
//   const [kcEmail, setKcEmail] = useState('')
//   const [kcResult, setKcResult] = useState<DeviceFlowResult | null>(null)
//   const [kcLoading, setKcLoading] = useState(false)
//   const [kcError, setKcError] = useState<string | null>(null)

//   const load = async () => {
//     const [c, s] = await Promise.all([
//       listCredentials().catch(() => []),
//       listShares().catch(() => []),
//     ])
//     setCredentials(c)
//     setShares(s)
//     setLoading(false)
//   }

//   useEffect(() => { load() }, [])

//   async function handleCreateShare(e: React.FormEvent) {
//     e.preventDefault()
//     setShareSaving(true)
//     setShareError(null)
//     try {
//       await createShare(shareForm)
//       setShowShareModal(false)
//       load()
//     } catch (err: unknown) {
//       setShareError(err instanceof Error ? err.message : 'Failed to create share')
//     } finally {
//       setShareSaving(false)
//     }
//   }

//   async function handleRevoke(id: string) {
//     await revokeShare(id).catch(() => null)
//     load()
//   }

//   async function handleRelayLogin() {
//     setRelayLoading(true)
//     setRelayError(null)
//     setRelayResult(null)
//     try {
//       const result = await triggerRelayLogin(relayCredId)
//       setRelayResult(result)
//     } catch (err: unknown) {
//       setRelayError(err instanceof Error ? err.message : 'Relay login failed')
//     } finally {
//       setRelayLoading(false)
//     }
//   }

//   async function handleDeviceFlow() {
//     setKcLoading(true)
//     setKcError(null)
//     setKcResult(null)
//     try {
//       const result = await startDeviceFlow(kcCredId, kcEmail)
//       setKcResult(result)
//     } catch (err: unknown) {
//       setKcError(err instanceof Error ? err.message : 'Device flow failed')
//     } finally {
//       setKcLoading(false)
//     }
//   }

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-full">
//         <Spinner size="lg" />
//       </div>
//     )
//   }

//   return (
//     <div className="p-8 max-w-5xl">
//       {/* Header */}
//       <div className="flex items-start justify-between mb-8">
//         <div>
//           <p className="text-xs font-mono text-muted mb-1">dashboard / sharing</p>
//           <h1 className="font-display font-bold text-2xl text-text">Secure Sharing</h1>
//           <p className="text-text-dim text-sm mt-1">
//             Grant access without revealing passwords. All sessions are ephemeral and revocable.
//           </p>
//         </div>
//         <div className="flex gap-2">
//           <Button variant="ghost" size="sm" onClick={() => { setShowKcModal(true); setKcResult(null); setKcError(null) }}>
//             Keycloak Flow
//           </Button>
//           <Button variant="ghost" size="sm" onClick={() => { setShowRelayModal(true); setRelayResult(null); setRelayError(null) }}>
//             Relay Login
//           </Button>
//           <Button variant="primary" size="sm" onClick={() => { setShowShareModal(true); setShareError(null) }}>
//             + New Share
//           </Button>
//         </div>
//       </div>

//       {/* Share list */}
//       {shares.length === 0 ? (
//         <Card className="py-16 text-center">
//           <div className="text-4xl mb-3">⇌</div>
//           <p className="text-text-dim font-mono text-sm">No shares created yet.</p>
//           <Button variant="outline" className="mt-4" onClick={() => setShowShareModal(true)}>
//             Create first share
//           </Button>
//         </Card>
//       ) : (
//         <div className="space-y-3">
//           {shares.map((share) => {
//             const expired = isExpired(share.expires_at)
//             return (
//               <Card key={share.id} glow className="flex items-center gap-4">
//                 <div className="flex-1 min-w-0">
//                   <div className="flex items-center gap-2 mb-1">
//                     <span className="font-mono text-sm text-text">{share.recipient_email}</span>
//                     <Badge variant={share.revoked ? 'error' : expired ? 'warn' : 'success'}>
//                       {share.revoked ? 'revoked' : expired ? 'expired' : 'active'}
//                     </Badge>
//                   </div>
//                   <div className="text-xs text-muted font-mono">
//                     created {timeAgo(share.created_at)} · TTL {formatTTL(share.ttl_seconds)} ·
//                     expires {timeAgo(share.expires_at)}
//                   </div>
//                   {share.share_token && (
//                     <div className="mt-1 font-mono text-xs text-accent/60 truncate max-w-[320px]">
//                       token: {share.share_token}
//                     </div>
//                   )}
//                 </div>
//                 {!share.revoked && !expired && (
//                   <Button variant="danger" size="sm" onClick={() => handleRevoke(share.id)}>
//                     revoke
//                   </Button>
//                 )}
//               </Card>
//             )
//           })}
//         </div>
//       )}

//       {/* ── Create Share Modal ── */}
//       <Modal open={showShareModal} onClose={() => setShowShareModal(false)} title="Create Share">
//         <form onSubmit={handleCreateShare} className="space-y-4">
//           <div className="flex flex-col gap-1.5">
//             <label className="text-xs font-mono text-text-dim uppercase tracking-widest">Credential</label>
//             <select
//               className="bg-panel border border-border rounded-md font-mono text-sm text-text px-3 py-2.5 focus:outline-none focus:border-accent/60"
//               value={shareForm.credential_id}
//               onChange={(e) => setShareForm({ ...shareForm, credential_id: e.target.value })}
//               required
//             >
//               <option value="">Select credential…</option>
//               {credentials.map((c) => (
//                 <option key={c.id} value={c.id}>{c.label || c.username} — {c.service_url}</option>
//               ))}
//             </select>
//           </div>
//           <Input
//             label="Recipient Email"
//             type="email"
//             value={shareForm.recipient_email}
//             onChange={(e) => setShareForm({ ...shareForm, recipient_email: e.target.value })}
//             placeholder="recipient@example.com"
//             required
//           />
//           <div className="flex flex-col gap-1.5">
//             <label className="text-xs font-mono text-text-dim uppercase tracking-widest">
//               TTL — {formatTTL(shareForm.ttl_seconds)}
//             </label>
//             <input
//               type="range"
//               min={300}
//               max={86400}
//               step={300}
//               value={shareForm.ttl_seconds}
//               onChange={(e) => setShareForm({ ...shareForm, ttl_seconds: Number(e.target.value) })}
//               className="accent-accent"
//             />
//             <div className="flex justify-between text-[10px] text-muted font-mono">
//               <span>5min</span><span>1h</span><span>12h</span><span>24h</span>
//             </div>
//           </div>
//           {shareError && <Alert type="error">{shareError}</Alert>}
//           <div className="flex gap-3 pt-2">
//             <Button type="button" variant="ghost" onClick={() => setShowShareModal(false)} className="flex-1">
//               Cancel
//             </Button>
//             <Button type="submit" variant="primary" loading={shareSaving} className="flex-1">
//               Create Share
//             </Button>
//           </div>
//         </form>
//       </Modal>

//       {/* ── Relay Login Modal ── */}
//       <Modal open={showRelayModal} onClose={() => setShowRelayModal(false)} title="Relay Login">
//         <div className="space-y-4">
//           <Alert type="info">
//             Backend runs Playwright to log into the target site. Recipient receives only a one-time session ID.
//           </Alert>
//           <div className="flex flex-col gap-1.5">
//             <label className="text-xs font-mono text-text-dim uppercase tracking-widest">Credential</label>
//             <select
//               className="bg-panel border border-border rounded-md font-mono text-sm text-text px-3 py-2.5 focus:outline-none focus:border-accent/60"
//               value={relayCredId}
//               onChange={(e) => setRelayCredId(e.target.value)}
//             >
//               <option value="">Select credential…</option>
//               {credentials.map((c) => (
//                 <option key={c.id} value={c.id}>{c.label || c.username} — {c.service_url}</option>
//               ))}
//             </select>
//           </div>
//           {relayError && <Alert type="error">{relayError}</Alert>}
//           {relayResult && (
//             <div className="bg-accent/5 border border-accent/20 rounded-lg p-4 space-y-2">
//               <div className="text-xs font-mono text-accent">✓ Relay login successful</div>
//               <div className="font-mono text-xs text-text-dim">
//                 Session ID: <span className="text-accent">{relayResult.session_id}</span>
//               </div>
//               <div className="font-mono text-xs text-text-dim break-all">
//                 Handoff URL: <span className="text-blue-400">{relayResult.handoff_url}</span>
//               </div>
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={() => navigator.clipboard.writeText(relayResult.handoff_url)}
//               >
//                 Copy URL
//               </Button>
//             </div>
//           )}
//           <Button
//             variant="primary"
//             loading={relayLoading}
//             onClick={handleRelayLogin}
//             disabled={!relayCredId}
//             className="w-full"
//           >
//             Trigger Relay Login
//           </Button>
//         </div>
//       </Modal>

//       {/* ── Keycloak Device Flow Modal ── */}
//       <Modal open={showKcModal} onClose={() => setShowKcModal(false)} title="Keycloak Passwordless Share">
//         <div className="space-y-4">
//           <Alert type="info">
//             Generates a Keycloak Device Authorization Grant. Recipient logs in on Keycloak — no password shared.
//           </Alert>
//           <div className="flex flex-col gap-1.5">
//             <label className="text-xs font-mono text-text-dim uppercase tracking-widest">Credential</label>
//             <select
//               className="bg-panel border border-border rounded-md font-mono text-sm text-text px-3 py-2.5 focus:outline-none focus:border-accent/60"
//               value={kcCredId}
//               onChange={(e) => setKcCredId(e.target.value)}
//             >
//               <option value="">Select credential…</option>
//               {credentials.map((c) => (
//                 <option key={c.id} value={c.id}>{c.label || c.username}</option>
//               ))}
//             </select>
//           </div>
//           <Input
//             label="Recipient Email"
//             type="email"
//             value={kcEmail}
//             onChange={(e) => setKcEmail(e.target.value)}
//             placeholder="recipient@example.com"
//           />
//           {kcError && <Alert type="error">{kcError}</Alert>}
//           {kcResult && (
//             <div className="bg-accent/5 border border-accent/20 rounded-lg p-4 space-y-3">
//               <div className="text-xs font-mono text-accent">✓ Device flow initiated</div>
//               <div className="font-mono text-xs space-y-1">
//                 <div className="text-text-dim">User Code: <span className="text-xl text-accent font-bold">{kcResult.user_code}</span></div>
//                 <div className="text-text-dim">Session: <span className="text-accent">{kcResult.kc_session_id}</span></div>
//                 <div className="text-text-dim">Expires in: <span className="text-yellow-400">{kcResult.expires_in}s</span></div>
//               </div>
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={() => navigator.clipboard.writeText(kcResult.verification_uri_complete)}
//               >
//                 Copy Verification Link
//               </Button>
//               <a
//                 href={kcResult.verification_uri_complete}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 className="block text-xs text-blue-400 font-mono hover:underline break-all"
//               >
//                 {kcResult.verification_uri_complete}
//               </a>
//             </div>
//           )}
//           <Button
//             variant="primary"
//             loading={kcLoading}
//             onClick={handleDeviceFlow}
//             disabled={!kcCredId || !kcEmail}
//             className="w-full"
//           >
//             Start Device Flow
//           </Button>
//         </div>
//       </Modal>
//     </div>
//   )
// }
