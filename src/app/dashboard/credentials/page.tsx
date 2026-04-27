'use client';

import { useEffect, useState } from 'react';
import { Card, Button, Input, Alert, Modal, Badge, Spinner } from '@/components/ui';
import { listCredentials, createCredential, deleteCredential, type Credential } from '@/lib/api';
import { encryptCredential } from '@/lib/credentialCrypto';
import { timeAgo } from '@/lib/zkp';

interface CredentialForm {
  name: string;
  service_url: string;
  username: string;
  password: string;
  credential_type: string;
  tags: string;
}

const emptyForm: CredentialForm = {
  name: '',
  service_url: '',
  username: '',
  password: '',
  credential_type: 'password',
  tags: '',
};

export default function CredentialsPage() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<CredentialForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadCredentials = () => {
    listCredentials()
      .then(setCredentials)
      .catch(() => setCredentials([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCredentials();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const masterPassword = localStorage.getItem('master_password');
    const masterSalt = localStorage.getItem('master_salt');
    if (!masterPassword || !masterSalt) {
      setError('Missing master credentials. Please log out and log in again.');
      setSaving(false);
      return;
    }

    try {
      const encryptedSecret = await encryptCredential(form.password, masterPassword, masterSalt);

      const payload = {
        name: form.name,
        service_url: form.service_url,
        username: form.username,
        credential_type: form.credential_type,
        encrypted_secret: encryptedSecret,
        tags: form.tags,
      };

      await createCredential(payload);

      setSuccess('Credential saved and encrypted.');
      setShowModal(false);
      setForm(emptyForm);
      loadCredentials();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create credential');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await deleteCredential(id);
      setCredentials((prev) => prev.filter((c) => c.id !== id));
    } catch {
      // ignore
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs font-mono text-muted mb-1">dashboard / credentials</p>
          <h1 className="font-display font-bold text-2xl text-text">Credentials</h1>
          <p className="text-text-dim text-sm mt-1">
            Manage encrypted credentials. Passwords are never revealed to recipients.
          </p>
        </div>
        <Button variant="primary" onClick={() => { setShowModal(true); setError(null); }}>
          + New Credential
        </Button>
      </div>

      {success && (
        <div className="mb-4">
          <Alert type="success">{success}</Alert>
        </div>
      )}
      {error && (
        <div className="mb-4">
          <Alert type="error">{error}</Alert>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : credentials.length === 0 ? (
        <Card className="py-16 text-center">
          <div className="text-4xl mb-3">⊟</div>
          <p className="text-text-dim font-mono text-sm">No credentials stored yet.</p>
          <Button variant="outline" className="mt-4" onClick={() => setShowModal(true)}>
            Add your first credential
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {credentials.map((c) => (
            <Card key={c.id} glow className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
                <span className="text-accent text-lg font-mono">
                  {(c.name || c.username)[0]?.toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-mono text-sm text-text font-medium">
                  {c.name || c.username}
                </div>
                <div className="text-xs text-muted truncate">{c.service_url}</div>
                <div className="text-xs text-muted font-mono mt-0.5">
                  user: {c.username} · added {timeAgo(c.created_at)}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge variant="success">encrypted</Badge>
                <Button
                  variant="danger"
                  size="sm"
                  loading={deleting === c.id}
                  onClick={() => handleDelete(c.id)}
                >
                  delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Credential">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g., GitHub Production"
            required
          />
          <Input
            label="Service URL"
            value={form.service_url}
            onChange={(e) => setForm({ ...form, service_url: e.target.value })}
            placeholder="https://example.com"
            required
          />
          <Input
            label="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            placeholder="user@example.com"
            required
          />
          <Input
            label="Secret"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••••••"
            hint="Encrypted with AES-256-GCM before storage"
            required
          />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={saving} className="flex-1">
              Save Credential
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}






























// 'use client'

// import { useEffect, useState } from 'react'
// import { Card, Button, Input, Alert, Modal, Badge, Spinner } from '@/components/ui'
// import { listCredentials, createCredential, deleteCredential, Credential, CredentialCreate } from '@/lib/api'
// import { timeAgo } from '@/lib/zkp'

// const empty: CredentialCreate = { service_url: '', username: '', password: '', label: '' }

// export default function CredentialsPage() {
//   const [credentials, setCredentials] = useState<Credential[]>([])
//   const [loading, setLoading] = useState(true)
//   const [showModal, setShowModal] = useState(false)
//   const [form, setForm] = useState<CredentialCreate>(empty)
//   const [saving, setSaving] = useState(false)
//   const [error, setError] = useState<string | null>(null)
//   const [success, setSuccess] = useState<string | null>(null)
//   const [deleting, setDeleting] = useState<string | null>(null)

//   const load = () =>
//     listCredentials()
//       .then(setCredentials)
//       .catch(() => setCredentials([]))
//       .finally(() => setLoading(false))

//   useEffect(() => { load() }, [])

//   // async function handleCreate(e: React.FormEvent) {
//   //   e.preventDefault()
//   //   setSaving(true)
//   //   setError(null)
//   //   try {
//   //     await createCredential(form)
//   //     setSuccess('Credential saved and encrypted.')
//   //     setShowModal(false)
//   //     setForm(empty)
//   //     load()
//   //   } catch (err: unknown) {
//   //     setError(err instanceof Error ? err.message : 'Failed to create credential')
//   //   } finally {
//   //     setSaving(false)
//   //   }
//   // }







//   async function handleCreate(e: React.FormEvent) {
//   e.preventDefault();
//   setSaving(true);
//   setError(null);

//   const masterPassword = localStorage.getItem('master_password');
//   const masterSalt = localStorage.getItem('master_salt');
//   if (!masterPassword || !masterSalt) {
//     setError('Missing master credentials. Please log out and log in again.');
//     setSaving(false);
//     return;
//   }

//   try {
//     // 1. Chiffrer le mot de passe localement
//     const encryptedSecret = await encryptCredential(form.password, masterPassword, masterSalt);

//     // 2. Construire le payload attendu par le backend
//     const payload = {
//       name: form.label || form.username,   // le backend attend "name"
//       service_url: form.service_url,
//       username: form.username,
//       credential_type: 'password',        // ou "api_key", etc.
//       encrypted_secret: encryptedSecret,
//       tags: '',                           // optionnel
//     };

//     // 3. Appel API (createCredential doit accepter ce payload)
//     await createCredential(payload);

//     setSuccess('Credential saved and encrypted.');
//     setShowModal(false);
//     setForm(empty);
//     load();
//   } catch (err: unknown) {
//     setError(err instanceof Error ? err.message : 'Failed to create credential');
//   } finally {
//     setSaving(false);
//   }
// }







//   async function handleDelete(id: string) {
//     setDeleting(id)
//     try {
//       await deleteCredential(id)
//       setCredentials((c) => c.filter((x) => x.id !== id))
//     } catch {
//       // ignore
//     } finally {
//       setDeleting(null)
//     }
//   }

//   return (
//     <div className="p-8 max-w-4xl">
//       {/* Header */}
//       <div className="flex items-start justify-between mb-8">
//         <div>
//           <p className="text-xs font-mono text-muted mb-1">dashboard / credentials</p>
//           <h1 className="font-display font-bold text-2xl text-text">Credentials</h1>
//           <p className="text-text-dim text-sm mt-1">
//             Manage encrypted credentials. Passwords are never revealed to recipients.
//           </p>
//         </div>
//         <Button variant="primary" onClick={() => { setShowModal(true); setError(null) }}>
//           + New Credential
//         </Button>
//       </div>

//       {success && (
//         <div className="mb-4">
//           <Alert type="success">{success}</Alert>
//         </div>
//       )}

//       {loading ? (
//         <div className="flex justify-center py-16"><Spinner size="lg" /></div>
//       ) : credentials.length === 0 ? (
//         <Card className="py-16 text-center">
//           <div className="text-4xl mb-3">⊟</div>
//           <p className="text-text-dim font-mono text-sm">No credentials stored yet.</p>
//           <Button variant="outline" className="mt-4" onClick={() => setShowModal(true)}>
//             Add your first credential
//           </Button>
//         </Card>
//       ) : (
//         <div className="space-y-3">
//           {credentials.map((c) => (
//             <Card key={c.id} glow className="flex items-center gap-4">
//               <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
//                 <span className="text-accent text-lg font-mono">
//                   {(c.label || c.username)[0]?.toUpperCase()}
//                 </span>
//               </div>
//               <div className="flex-1 min-w-0">
//                 <div className="font-mono text-sm text-text font-medium">
//                   {c.label || c.username}
//                 </div>
//                 <div className="text-xs text-muted truncate">{c.service_url}</div>
//                 <div className="text-xs text-muted font-mono mt-0.5">
//                   user: {c.username} · added {timeAgo(c.created_at)}
//                 </div>
//               </div>
//               <div className="flex items-center gap-2 flex-shrink-0">
//                 <Badge variant="success">encrypted</Badge>
//                 <Button
//                   variant="danger"
//                   size="sm"
//                   loading={deleting === c.id}
//                   onClick={() => handleDelete(c.id)}
//                 >
//                   delete
//                 </Button>
//               </div>
//             </Card>
//           ))}
//         </div>
//       )}

//       {/* Create Modal */}
//       <Modal open={showModal} onClose={() => setShowModal(false)} title="New Credential">
//         <form onSubmit={handleCreate} className="space-y-4">
//           <Input
//             label="Label (optional)"
//             value={form.label}
//             onChange={(e) => setForm({ ...form, label: e.target.value })}
//             placeholder="e.g. GitHub Production"
//           />
//           <Input
//             label="Service URL"
//             value={form.service_url}
//             onChange={(e) => setForm({ ...form, service_url: e.target.value })}
//             placeholder="https://example.com"
//             required
//           />
//           <Input
//             label="Username"
//             value={form.username}
//             onChange={(e) => setForm({ ...form, username: e.target.value })}
//             placeholder="user@example.com"
//             required
//           />
//           <Input
//             label="Password"
//             type="password"
//             value={form.password}
//             onChange={(e) => setForm({ ...form, password: e.target.value })}
//             placeholder="••••••••••••"
//             hint="Encrypted with AES-256-GCM before storage"
//             required
//           />
//           {error && <Alert type="error">{error}</Alert>}
//           <div className="flex gap-3 pt-2">
//             <Button type="button" variant="ghost" onClick={() => setShowModal(false)} className="flex-1">
//               Cancel
//             </Button>
//             <Button type="submit" variant="primary" loading={saving} className="flex-1">
//               Save Credential
//             </Button>
//           </div>
//         </form>
//       </Modal>
//     </div>
//   )
// }
