'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { getSalts, getChallenge, verifyProof, registerUser } from '@/lib/api'
import { createCommitment, computeResponse, generatePublicKey } from '@/lib/zkp'

type Mode = 'login' | 'register'

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [step, setStep] = useState('')
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setStep('Retrieving salts...')
    try {
      const salts = await getSalts(email)
      setStep('Generating commitment...')
      const { commitmentHex, r } = createCommitment()
      setStep('Requesting challenge...')
      const challenge = await getChallenge(email, commitmentHex)
      setStep('Computing proof...')
      const responseHex = await computeResponse(password, salts.zkp_salt, r, challenge.challenge_value)
      setStep('Verifying...')
      const verified = await verifyProof(email, challenge.challenge_id, responseHex)
      localStorage.setItem('jwt_token', verified.access_token);

      localStorage.setItem('master_salt', salts.master_salt)
      localStorage.setItem('master_password', password)
      login(verified.access_token, verified.username)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
      setStep('')
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { publicKey, zkpSalt, masterSalt } = await generatePublicKey(password)
      await registerUser(email, email.split('@')[0], publicKey, zkpSalt, masterSalt)
      setSuccess('Registration successful! Please log in.')
      setMode('login')
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) {
    return <div className="min-h-screen bg-void flex items-center justify-center"><div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div className="min-h-screen bg-void bg-grid flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/3 rounded-full blur-[120px] pointer-events-none" />
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent/10 border border-accent/30 mb-5 glow-accent">
            <span className="font-display font-black text-accent text-xl">ZK</span>
          </div>
          <h1 className="font-display font-bold text-3xl text-text glow-accent-text">ZKP Vault</h1>
          <p className="text-text-dim text-sm mt-2 font-mono">Zero-knowledge credential sharing system</p>
        </div>

        <div className="bg-panel border border-border rounded-2xl overflow-hidden shadow-2xl">
          <div className="flex border-b border-border">
            {(['login', 'register'] as Mode[]).map((m) => (
              <button key={m} type="button" onClick={() => { setMode(m); setError(null); setSuccess(null); setStep('') }}
                className={`flex-1 py-3 text-sm font-mono transition-all duration-150 ${mode === m ? 'text-accent border-b-2 border-accent bg-accent/5' : 'text-muted hover:text-text-dim'}`}>
                {m === 'login' ? '→ sign in' : '+ register'}
              </button>
            ))}
          </div>

          <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="p-6 space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-text-dim uppercase tracking-widest">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                autoComplete="off" required className="w-full bg-panel border border-border rounded-md font-mono text-sm text-text px-3 py-2.5 placeholder:text-muted/50 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/20 transition-colors" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-text-dim uppercase tracking-widest">{mode === 'login' ? 'Secret / Password' : 'Create Secret'}</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••••"
                autoComplete="off" required className="w-full bg-panel border border-border rounded-md font-mono text-sm text-text px-3 py-2.5 placeholder:text-muted/50 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/20 transition-colors" />
              <p className="text-xs text-muted">Your secret never leaves your device — ZKP only sends a proof</p>
            </div>

            {error && <div className="text-red-400 text-sm">{error}</div>}
            {success && <div className="text-green-400 text-sm">{success}</div>}

            {loading && step && (
              <div className="flex items-center gap-2 text-xs font-mono text-accent/70 bg-accent/5 border border-accent/10 px-3 py-2 rounded-lg">
                <svg className="animate-spin h-3 w-3 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {step}
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full bg-accent/10 hover:bg-accent/20 border border-accent/30 rounded-md py-2.5 font-mono text-sm text-accent transition-colors">
              {loading ? 'Processing...' : (mode === 'login' ? 'Authenticate with ZKP' : 'Register Identity')}
            </button>
          </form>

          <div className="px-6 pb-5">
            <div className="border-t border-border pt-4 grid grid-cols-3 gap-3 text-center">
              {[
                { label: 'ZK Proof', desc: 'No password transmitted' },
                { label: 'AES-256', desc: 'Encrypted storage' },
                { label: 'Ephemeral', desc: 'Revocable sessions' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="text-[10px] font-mono text-accent">{item.label}</div>
                  <div className="text-[10px] text-muted mt-0.5">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="text-center text-xs text-muted font-mono mt-5">
          Recipient? <a href="/recipient" className="text-accent hover:underline">Complete handoff →</a>
        </p>
      </div>
    </div>
  )
}




























// 'use client'

// import { useState, useEffect } from 'react'
// import { useRouter } from 'next/navigation'
// import { Button, Alert } from '@/components/ui'
// import { useAuth } from '@/lib/auth-context'
// import { zkpGetChallenge, zkpVerify, zkpRegister } from '@/lib/api'
// import { deriveProof } from '@/lib/zkp'

// type Mode = 'login' | 'register'

// export default function LoginPage() {
//   const { login } = useAuth()
//   const router = useRouter()
//   const [mode, setMode] = useState<Mode>('login')
//   const [username, setUsername] = useState('')
//   const [password, setPassword] = useState('')
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState<string | null>(null)
//   const [success, setSuccess] = useState<string | null>(null)
//   const [step, setStep] = useState<string>('')
//   // Prevent hydration mismatch: skip SSR render of dynamic content
//   const [mounted, setMounted] = useState(false)
//   useEffect(() => { setMounted(true) }, [])

//   async function handleLogin(e: React.FormEvent) {
//     e.preventDefault()
//     setLoading(true)
//     setError(null)
//     setSuccess(null)
//     setStep('')

//     try {
//       setStep('Requesting challenge from server...')
//       const { challenge } = await zkpGetChallenge(username)

//       setStep('Computing zero-knowledge proof locally...')
//       const proof = await deriveProof(password, challenge)

//       setStep('Verifying proof with server...')
//       const result = await zkpVerify(username, challenge, proof)

//       setStep('Authenticated ✓')
//       login(result.access_token, username)
//       router.push('/dashboard')
//     } catch (err: unknown) {
//       setError(err instanceof Error ? err.message : 'Authentication failed')
//       setStep('')
//     } finally {
//       setLoading(false)
//     }
//   }

//   async function handleRegister(e: React.FormEvent) {
//     e.preventDefault()
//     setLoading(true)
//     setError(null)
//     setSuccess(null)
//     setStep('')

//     try {
//       setStep('Registering ZKP identity...')
//       const result = await zkpRegister(username, password)

//       setSuccess(
//         result.public_key
//           ? `Registered! Public key: ${result.public_key.slice(0, 20)}…`
//           : result.message || 'Registration successful'
//       )
//       setStep('')
//       setPassword('')
//       setTimeout(() => setMode('login'), 1500)
//     } catch (err: unknown) {
//       setError(err instanceof Error ? err.message : 'Registration failed')
//       setStep('')
//     } finally {
//       setLoading(false)
//     }
//   }

//   // Avoid hydration mismatch from state-dependent attributes by skipping SSR
//   if (!mounted) {
//     return (
//       <div className="min-h-screen bg-void flex items-center justify-center">
//         <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
//       </div>
//     )
//   }

//   return (
//     <div className="min-h-screen bg-void bg-grid flex items-center justify-center p-4 relative overflow-hidden">
//       <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/3 rounded-full blur-[120px] pointer-events-none" />

//       <div className="w-full max-w-md relative z-10">
//         {/* Header */}
//         <div className="text-center mb-10">
//           <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent/10 border border-accent/30 mb-5 glow-accent">
//             <span className="font-display font-black text-accent text-xl">ZK</span>
//           </div>
//           <h1 className="font-display font-bold text-3xl text-text glow-accent-text">ZKP Vault</h1>
//           <p className="text-text-dim text-sm mt-2 font-mono">Zero-knowledge credential sharing system</p>
//         </div>

//         {/* Card */}
//         <div className="bg-panel border border-border rounded-2xl overflow-hidden shadow-2xl">
//           {/* Tabs */}
//           <div className="flex border-b border-border">
//             {(['login', 'register'] as Mode[]).map((m) => (
//               <button
//                 key={m}
//                 type="button"
//                 onClick={() => { setMode(m); setError(null); setSuccess(null); setStep('') }}
//                 className={`flex-1 py-3 text-sm font-mono transition-all duration-150 ${
//                   mode === m
//                     ? 'text-accent border-b-2 border-accent bg-accent/5'
//                     : 'text-muted hover:text-text-dim'
//                 }`}
//               >
//                 {m === 'login' ? '→ sign in' : '+ register'}
//               </button>
//             ))}
//           </div>

//           <form
//             onSubmit={mode === 'login' ? handleLogin : handleRegister}
//             className="p-6 space-y-4"
//           >
//             {/* Username — inline to avoid the reusable Input component's autoComplete SSR issue */}
//             <div className="flex flex-col gap-1.5">
//               <label className="text-xs font-mono text-text-dim uppercase tracking-widest">Username</label>
//               <div className="relative flex items-center">
//                 <span className="absolute left-3 text-muted font-mono text-sm select-none">@</span>
//                 <input
//                   type="text"
//                   value={username}
//                   onChange={(e) => setUsername(e.target.value)}
//                   placeholder="your_username"
//                   autoComplete="off"
//                   autoCorrect="off"
//                   autoCapitalize="off"
//                   spellCheck={false}
//                   required
//                   className="w-full bg-panel border border-border rounded-md font-mono text-sm text-text pl-8 pr-3 py-2.5 placeholder:text-muted/50 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/20 transition-colors"
//                 />
//               </div>
//             </div>

//             {/* Password */}
//             <div className="flex flex-col gap-1.5">
//               <label className="text-xs font-mono text-text-dim uppercase tracking-widest">
//                 {mode === 'login' ? 'Secret / Password' : 'Create Secret'}
//               </label>
//               <input
//                 type="password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 placeholder="••••••••••••"
//                 autoComplete="off"
//                 required
//                 className="w-full bg-panel border border-border rounded-md font-mono text-sm text-text px-3 py-2.5 placeholder:text-muted/50 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/20 transition-colors"
//               />
//               <p className="text-xs text-muted">Your secret never leaves your device — ZKP only sends a proof</p>
//             </div>

//             {error && <Alert type="error">{error}</Alert>}
//             {success && <Alert type="success">{success}</Alert>}

//             {/* Step indicator */}
//             {loading && step && (
//               <div className="flex items-center gap-2 text-xs font-mono text-accent/70 bg-accent/5 border border-accent/10 px-3 py-2 rounded-lg">
//                 <svg className="animate-spin h-3 w-3 flex-shrink-0" fill="none" viewBox="0 0 24 24">
//                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
//                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
//                 </svg>
//                 {step}
//               </div>
//             )}

//             <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
//               {mode === 'login' ? 'Authenticate with ZKP' : 'Register Identity'}
//             </Button>
//           </form>

//           {/* Footer */}
//           <div className="px-6 pb-5">
//             <div className="border-t border-border pt-4 grid grid-cols-3 gap-3 text-center">
//               {[
//                 { label: 'ZK Proof', desc: 'No password transmitted' },
//                 { label: 'AES-256', desc: 'Encrypted storage' },
//                 { label: 'Ephemeral', desc: 'Revocable sessions' },
//               ].map((item) => (
//                 <div key={item.label}>
//                   <div className="text-[10px] font-mono text-accent">{item.label}</div>
//                   <div className="text-[10px] text-muted mt-0.5">{item.desc}</div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>

//         <p className="text-center text-xs text-muted font-mono mt-5">
//           Recipient?{' '}
//           <a href="/recipient" className="text-accent hover:underline">Complete handoff →</a>
//         </p>
//       </div>
//     </div>
//   )
// }
