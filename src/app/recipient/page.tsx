'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Alert, Card } from '@/components/ui';
import { relayLogin, makeExtensionConnectUrl } from '@/lib/api';

export default function RecipientPage() {
  const router = useRouter();
  const [shareToken, setShareToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [handoffUrl, setHandoffUrl] = useState<string | null>(null);
  const [serviceUrl, setServiceUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'direct' | 'keycloak'>('direct');

  // ✅ Authentication guard
  useEffect(() => {
    const token = localStorage.getItem('jwt_token') || localStorage.getItem('zkp_token');
    if (!token) {
      router.push('/');
    }
  }, [router]);

  const handleRelayLogin = async () => {
    if (!shareToken.trim()) {
      setError('Please enter a share token');
      return;
    }
    setLoading(true);
    setError(null);
    setHandoffUrl(null);
    try {
      const result = await relayLogin(shareToken);
      if (result.handoff?.session_id) {
        const handoffApiUrl = `${process.env.NEXT_PUBLIC_API_URL}/sharing/handoff/${result.handoff.session_id}`;
        const connectUrl = makeExtensionConnectUrl(handoffApiUrl);
        setHandoffUrl(connectUrl);
        setServiceUrl(result.service_url);
      } else {
        setError('Relay login failed: no handoff session created');
      }
    } catch (err: any) {
      setError(err.message || 'Relay login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleKeycloakFlow = async () => {
    setError('Keycloak flow not yet implemented');
  };

  return (
    <div className="min-h-screen bg-void bg-grid flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-panel border border-border rounded-2xl p-6">
        <h1 className="text-2xl font-bold mb-2">Recipient Access</h1>
        <p className="text-muted text-sm mb-6">Complete your secure session handoff</p>

        <div className="flex border-b border-border mb-4">
          <button
            className={`flex-1 py-2 text-sm font-mono ${activeTab === 'direct' ? 'text-accent border-b-2 border-accent' : 'text-muted'}`}
            onClick={() => { setActiveTab('direct'); setError(null); setHandoffUrl(null); }}
          >
            Direct Handoff
          </button>
          <button
            className={`flex-1 py-2 text-sm font-mono ${activeTab === 'keycloak' ? 'text-accent border-b-2 border-accent' : 'text-muted'}`}
            onClick={() => { setActiveTab('keycloak'); setError(null); setHandoffUrl(null); }}
          >
            Keycloak Flow
          </button>
        </div>

        {activeTab === 'direct' && (
          <div className="space-y-4">
            <Input
              label="Share token"
              value={shareToken}
              onChange={(e) => setShareToken(e.target.value)}
              placeholder="Provided by the credential owner"
              hint="The one‑time token you received"
            />
            <Button onClick={handleRelayLogin} loading={loading} variant="primary" className="w-full">
              Login via Relay
            </Button>
            {error && <Alert type="error">{error}</Alert>}
            {handoffUrl && (
              <Card className="mt-4 p-3 border-accent/30 bg-accent/5">
                <p className="text-sm font-mono text-accent mb-2">Handoff session ready</p>
                <p className="text-xs text-muted mb-1">Service: {serviceUrl}</p>
                <a
                  href={handoffUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block w-full text-center bg-accent/10 hover:bg-accent/20 border border-accent/30 rounded-md py-2 text-sm font-mono transition-colors"
                >
                  🔓 Open connected profile
                </a>
                <p className="text-xs text-muted mt-2">
                  Requires the ZKP extension (installed and enabled).
                </p>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'keycloak' && (
          <div className="space-y-4">
            <p className="text-sm text-muted">Keycloak flow is not yet implemented.</p>
            <Button onClick={handleKeycloakFlow} variant="secondary" className="w-full">
              Poll for token
            </Button>
          </div>
        )}

        <div className="mt-6 text-center text-xs text-muted">
          <a href="/" className="text-accent hover:underline">← Back to login</a>
        </div>
      </div>
    </div>
  );
}





























// 'use client';

// import { useState } from 'react';
// import { Button, Input, Alert, Card } from '@/components/ui';
// import { relayLogin, makeExtensionConnectUrl } from '@/lib/api';

// export default function RecipientPage() {
//   const [shareToken, setShareToken] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [handoffUrl, setHandoffUrl] = useState<string | null>(null);
//   const [serviceUrl, setServiceUrl] = useState<string | null>(null);
//   const [activeTab, setActiveTab] = useState<'direct' | 'keycloak'>('direct');


  
//   const handleRelayLogin = async () => {
//     if (!shareToken.trim()) {
//       setError('Please enter a share token');
//       return;
//     }
//     setLoading(true);
//     setError(null);
//     setHandoffUrl(null);
//     try {
//       const result = await relayLogin(shareToken);
//       if (result.handoff?.session_id) {
//         const handoffApiUrl = `${process.env.NEXT_PUBLIC_API_URL}/sharing/handoff/${result.handoff.session_id}`;
//         const connectUrl = makeExtensionConnectUrl(handoffApiUrl);
//         setHandoffUrl(connectUrl);
//         setServiceUrl(result.service_url);
//       } else {
//         setError('Relay login failed: no handoff session created');
//       }
//     } catch (err: any) {
//       setError(err.message || 'Relay login failed');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleKeycloakFlow = async () => {
//     setError('Keycloak flow not yet implemented');
//   };

//   return (
//     <div className="min-h-screen bg-void bg-grid flex items-center justify-center p-4">
//       <div className="w-full max-w-md bg-panel border border-border rounded-2xl p-6">
//         <h1 className="text-2xl font-bold mb-2">Recipient Access</h1>
//         <p className="text-muted text-sm mb-6">Complete your secure session handoff</p>

//         <div className="flex border-b border-border mb-4">
//           <button
//             className={`flex-1 py-2 text-sm font-mono ${activeTab === 'direct' ? 'text-accent border-b-2 border-accent' : 'text-muted'}`}
//             onClick={() => { setActiveTab('direct'); setError(null); setHandoffUrl(null); }}
//           >
//             Direct Handoff
//           </button>
//           <button
//             className={`flex-1 py-2 text-sm font-mono ${activeTab === 'keycloak' ? 'text-accent border-b-2 border-accent' : 'text-muted'}`}
//             onClick={() => { setActiveTab('keycloak'); setError(null); setHandoffUrl(null); }}
//           >
//             Keycloak Flow
//           </button>
//         </div>

//         {activeTab === 'direct' && (
//           <div className="space-y-4">
//             <Input
//               label="Share token"
//               value={shareToken}
//               onChange={(e) => setShareToken(e.target.value)}
//               placeholder="Provided by the credential owner"
//               hint="The one‑time token you received"
//             />
//             <Button onClick={handleRelayLogin} loading={loading} variant="primary" className="w-full">
//               Login via Relay
//             </Button>
//             {error && <Alert type="error">{error}</Alert>}
//             {handoffUrl && (
//               <Card className="mt-4 p-3 border-accent/30 bg-accent/5">
//                 <p className="text-sm font-mono text-accent mb-2">Handoff session ready</p>
//                 <p className="text-xs text-muted mb-1">Service: {serviceUrl}</p>
//                 <a
//                   href={handoffUrl}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="inline-block w-full text-center bg-accent/10 hover:bg-accent/20 border border-accent/30 rounded-md py-2 text-sm font-mono transition-colors"
//                 >
//                   🔓 Open connected profile
//                 </a>
//                 <p className="text-xs text-muted mt-2">
//                   Requires the ZKP extension (installed and enabled).
//                 </p>
//               </Card>
//             )}
//           </div>
//         )}

//         {activeTab === 'keycloak' && (
//           <div className="space-y-4">
//             <p className="text-sm text-muted">Keycloak flow is not yet implemented.</p>
//             <Button onClick={handleKeycloakFlow} variant="secondary" className="w-full">
//               Poll for token
//             </Button>
//           </div>
//         )}

//         <div className="mt-6 text-center text-xs text-muted">
//           <a href="/" className="text-accent hover:underline">← Back to login</a>
//         </div>
//       </div>
//     </div>
//   );
// }




























// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { Button, Input, Alert, Card } from '@/components/ui';
// import { accessShare, relayLogin } from '@/lib/api';
// import { encryptForShare } from '@/lib/shareCrypto';

// export default function RecipientPage() {
//   const router = useRouter();
//   const [shareToken, setShareToken] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [accessInfo, setAccessInfo] = useState<any>(null);
//   const [handoffUrl, setHandoffUrl] = useState<string | null>(null);

//   const handleVerify = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const info = await accessShare(shareToken);
//       setAccessInfo(info);
//     } catch (err: any) {
//       setError(err.message || 'Access denied');
//       setAccessInfo(null);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleRelayLogin = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const result = await relayLogin(shareToken);
//       if (result.handoff?.session_id) {
//         const url = `${process.env.NEXT_PUBLIC_API_URL}/sharing/handoff/${result.handoff.session_id}`;
//         setHandoffUrl(url);
//       } else {
//         setError('No handoff session created');
//       }
//     } catch (err: any) {
//       setError(err.message || 'Relay login failed');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-void bg-grid flex items-center justify-center p-4">
//       <div className="w-full max-w-md bg-panel border border-border rounded-2xl p-6">
//         <h1 className="text-2xl font-bold mb-2">Recipient Handoff</h1>
//         <p className="text-muted text-sm mb-6">
//           Enter the share token you received. The secret will never be revealed to you.
//         </p>

//         <Input
//           label="Share token"
//           value={shareToken}
//           onChange={(e) => setShareToken(e.target.value)}
//           placeholder="e.g., abc123..."
//           className="mb-4"
//         />

//         <Button
//           onClick={handleVerify}
//           loading={loading}
//           disabled={!shareToken}
//           variant="primary"
//           className="w-full mb-3"
//         >
//           Verify access
//         </Button>

//         {error && <Alert type="error" className="mt-3">{error}</Alert>}

//         {accessInfo && (
//           <Card className="mt-4 p-3 bg-muted/5 border-border">
//             <p className="text-sm font-mono">Credential: {accessInfo.credential_name}</p>
//             <p className="text-sm">Service: {accessInfo.service_url}</p>
//             <p className="text-sm">Username: {accessInfo.username}</p>
//             <p className="text-xs text-muted mt-2">
//               Uses: {accessInfo.use_count} / {accessInfo.max_uses}
//             </p>
//             <Button
//               onClick={handleRelayLogin}
//               loading={loading}
//               variant="secondary"
//               className="w-full mt-4"
//             >
//               Login via Relay (no password)
//             </Button>
//           </Card>
//         )}

//         {handoffUrl && (
//           <Card className="mt-4 p-3 border-accent/30 bg-accent/5">
//             <p className="text-sm font-mono text-accent mb-2">Handoff session ready</p>
//             <code className="block text-xs break-all bg-black/30 p-2 rounded">{handoffUrl}</code>
//             <p className="text-xs text-muted mt-2">
//               Copy this URL and paste it into the ZKP browser extension to open the connected profile.
//             </p>
//           </Card>
//         )}

//         <div className="mt-6 text-center text-xs text-muted">
//           <a href="/" className="text-accent hover:underline">← Back to login</a>
//         </div>
//       </div>
//     </div>
//   );
// }































// 'use client'

// import { useState, useEffect } from 'react'
// import { useSearchParams } from 'next/navigation'
// import { Button, Input, Alert, Card, Spinner, Badge } from '@/components/ui'
// import { getHandoffSession, pollDeviceFlow, HandoffSession } from '@/lib/api'
// import { Suspense } from 'react'

// function RecipientContent() {
//   const searchParams = useSearchParams()
//   const urlSessionId = searchParams.get('session_id') || searchParams.get('kc_session_id') || ''
//   const isKc = !!searchParams.get('kc_session_id')

//   const [sessionId, setSessionId] = useState(urlSessionId)
//   const [mode, setMode] = useState<'handoff' | 'polling'>('handoff')
//   const [loading, setLoading] = useState(false)
//   const [polling, setPolling] = useState(false)
//   const [error, setError] = useState<string | null>(null)
//   const [handoff, setHandoff] = useState<HandoffSession | null>(null)
//   const [pollStatus, setPollStatus] = useState<string | null>(null)

//   // Auto-fetch if session_id in URL
//   useEffect(() => {
//     if (urlSessionId && !isKc) handleFetchHandoff()
//     if (urlSessionId && isKc) { setMode('polling'); handlePoll() }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [])

//   async function handleFetchHandoff() {
//     if (!sessionId) return
//     setLoading(true)
//     setError(null)
//     try {
//       const session = await getHandoffSession(sessionId)
//       setHandoff(session)
//     } catch (err: unknown) {
//       setError(err instanceof Error ? err.message : 'Session not found or expired')
//     } finally {
//       setLoading(false)
//     }
//   }

//   async function handlePoll() {
//     if (!sessionId) return
//     setPolling(true)
//     setError(null)
//     setPollStatus('Polling Keycloak for authorization…')

//     const maxAttempts = 30
//     let attempts = 0

//     const interval = setInterval(async () => {
//       attempts++
//       try {
//         const result = await pollDeviceFlow(sessionId)
//         if (result.status === 'complete' && result.session_id) {
//           clearInterval(interval)
//           setPolling(false)
//           setPollStatus(null)
//           const session = await getHandoffSession(result.session_id)
//           setHandoff(session)
//         } else if (result.status === 'pending') {
//           setPollStatus(`Waiting for Keycloak approval… (${attempts}/${maxAttempts})`)
//         } else {
//           clearInterval(interval)
//           setPolling(false)
//           setError(`Unexpected status: ${result.status}`)
//         }
//       } catch (err: unknown) {
//         clearInterval(interval)
//         setPolling(false)
//         setError(err instanceof Error ? err.message : 'Polling failed')
//       }
//       if (attempts >= maxAttempts) {
//         clearInterval(interval)
//         setPolling(false)
//         setError('Authorization timed out. Please try again.')
//       }
//     }, 3000)
//   }

//   function handleInjectSession() {
//     if (!handoff) return
//     // Extension picks this up from the page — or instruct user to use the extension
//     window.dispatchEvent(
//       new CustomEvent('zkp-handoff', { detail: { session_id: sessionId, target_url: handoff.target_url } })
//     )
//     // Fallback: open target in new tab (extension handles the injection)
//     window.open(handoff.target_url, '_blank')
//   }

//   return (
//     <div className="min-h-screen bg-void bg-grid flex items-center justify-center p-4 relative overflow-hidden">
//       {/* Ambient */}
//       <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/3 rounded-full blur-[100px] pointer-events-none" />

//       <div className="w-full max-w-lg relative z-10">
//         {/* Header */}
//         <div className="text-center mb-8">
//           <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 mb-4">
//             <span className="text-blue-400 font-mono text-lg">↗</span>
//           </div>
//           <h1 className="font-display font-bold text-2xl text-text">Recipient Access</h1>
//           <p className="text-text-dim text-sm mt-1 font-mono">
//             Complete your secure session handoff
//           </p>
//         </div>

//         {/* Mode switcher */}
//         <div className="flex gap-1 bg-surface border border-border rounded-xl p-1 mb-6">
//           <button
//             onClick={() => setMode('handoff')}
//             className={`flex-1 py-2 text-sm font-mono rounded-lg transition-all ${
//               mode === 'handoff' ? 'bg-panel text-text border border-border-bright' : 'text-muted hover:text-text-dim'
//             }`}
//           >
//             Direct Handoff
//           </button>
//           <button
//             onClick={() => setMode('polling')}
//             className={`flex-1 py-2 text-sm font-mono rounded-lg transition-all ${
//               mode === 'polling' ? 'bg-panel text-text border border-border-bright' : 'text-muted hover:text-text-dim'
//             }`}
//           >
//             Keycloak Flow
//           </button>
//         </div>

//         <Card>
//           {!handoff ? (
//             <div className="space-y-4">
//               <Input
//                 label={mode === 'handoff' ? 'Session ID' : 'Keycloak Session ID'}
//                 value={sessionId}
//                 onChange={(e) => setSessionId(e.target.value)}
//                 placeholder="Enter your session ID"
//                 prefix="#"
//                 hint={
//                   mode === 'handoff'
//                     ? 'Provided by the credential owner'
//                     : 'From the Keycloak device flow link'
//                 }
//               />

//               {error && <Alert type="error">{error}</Alert>}

//               {pollStatus && (
//                 <div className="flex items-center gap-2 text-xs font-mono text-blue-400/80 bg-blue-500/5 border border-blue-500/10 px-3 py-2 rounded-lg">
//                   <Spinner size="sm" />
//                   {pollStatus}
//                 </div>
//               )}

//               <Button
//                 variant="primary"
//                 size="lg"
//                 className="w-full"
//                 loading={loading || polling}
//                 onClick={mode === 'handoff' ? handleFetchHandoff : handlePoll}
//                 disabled={!sessionId}
//               >
//                 {mode === 'handoff' ? 'Retrieve Session →' : 'Start Polling →'}
//               </Button>
//             </div>
//           ) : (
//             <div className="space-y-5">
//               <div className="flex items-center gap-2">
//                 <Badge variant="success">session ready</Badge>
//                 <span className="text-xs font-mono text-muted">expires {new Date(handoff.expires_at).toLocaleString()}</span>
//               </div>

//               <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 space-y-2">
//                 <div className="text-xs font-mono text-text-dim">
//                   Target: <span className="text-accent">{handoff.target_url}</span>
//                 </div>
//                 <div className="text-xs font-mono text-text-dim">
//                   Session: <span className="text-accent">{sessionId.slice(0, 16)}…</span>
//                 </div>
//               </div>

//               <Alert type="info">
//                 Click below to open the session. If you have the browser extension installed, cookies and storage will be injected automatically.
//               </Alert>

//               <Button
//                 variant="primary"
//                 size="lg"
//                 className="w-full"
//                 onClick={handleInjectSession}
//               >
//                 Open Connected Session →
//               </Button>

//               <p className="text-xs text-muted text-center font-mono">
//                 This session is one-time and will expire after use.
//               </p>
//             </div>
//           )}
//         </Card>

//         <p className="text-center text-xs text-muted font-mono mt-6">
//           Owner?{' '}
//           <a href="/" className="text-accent hover:underline">
//             ← Back to login
//           </a>
//         </p>
//       </div>
//     </div>
//   )
// }

// export default function RecipientPage() {
//   return (
//     <Suspense fallback={
//       <div className="min-h-screen bg-void flex items-center justify-center">
//         <Spinner size="lg" />
//       </div>
//     }>
//       <RecipientContent />
//     </Suspense>
//   )
// }
