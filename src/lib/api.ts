// src/lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('jwt_token') || localStorage.getItem('zkp_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    const detail = err.detail;
    if (Array.isArray(detail)) {
      throw new Error(detail.map((d) => `${d.loc?.slice(-1)?.[0] ?? 'field'}: ${d.msg}`).join(' | '));
    }
    throw new Error(typeof detail === 'string' ? detail : `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export interface ZKPSalts {
  zkp_salt: string;
  master_salt: string;
}

export interface ZKPChallenge {
  challenge_id: number;
  challenge_value: string;
  expires_at: number;
}

export interface ZKPVerifyResult {
  access_token: string;
  token_type: string;
  expires_in: number;
  user_id: number;
  username: string;
}

export async function getSalts(email: string): Promise<ZKPSalts> {
  return request(`/auth/salts/${encodeURIComponent(email)}`);
}

export async function getChallenge(email: string, commitment: string): Promise<ZKPChallenge> {
  return request('/auth/challenge', {
    method: 'POST',
    body: JSON.stringify({ email, commitment }),
  });
}

export async function verifyProof(email: string, challengeId: number, response: string): Promise<ZKPVerifyResult> {
  return request('/auth/verify', {
    method: 'POST',
    body: JSON.stringify({ email, challenge_id: challengeId, response }),
  });
}

export async function registerUser(email: string, username: string, zkpPublicKey: string, zkpSalt: string, masterSalt: string): Promise<{ user_id: number }> {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, username, zkp_public_key: zkpPublicKey, zkp_salt: zkpSalt, master_salt: masterSalt }),
  });
}

// ─── Credentials ─────────────────────────────────────────────────────────────
export interface Credential {
  id: string;
  name: string;
  service_url: string;
  username: string;
  credential_type: string;
  tags: string;
  created_at: string;
  shares_count?: number;
}

export async function listCredentials(): Promise<Credential[]> {
  return request('/credentials/');
}

export async function createCredential(data: {
  name: string;
  service_url: string;
  username: string;
  credential_type: string;
  encrypted_secret: string;
  tags?: string;
}): Promise<Credential> {
  return request('/credentials/', { method: 'POST', body: JSON.stringify(data) });
}

export async function deleteCredential(id: string): Promise<void> {
  return request(`/credentials/${id}`, { method: 'DELETE' });
}

// ─── Sharing ────────────────────────────────────────────────────────────────
export interface ShareIntent {
  share_token: string;
  share_id: number;
  expires_at: number;
}

export async function createShareIntent(
  credentialId: number,
  recipientEmail: string,
  permission: string,
  ttlMinutes: number,
  maxUses: number
): Promise<ShareIntent> {
  return request('/sharing/create-intent', {
    method: 'POST',
    body: JSON.stringify({
      credential_id: credentialId,
      recipient_email: recipientEmail,
      permission,
      ttl_minutes: ttlMinutes,
      max_uses: maxUses,
    }),
  });
}

export async function finalizeShare(token: string, encryptedPayload: string): Promise<{ message: string }> {
  return request('/sharing/finalize', {
    method: 'POST',
    body: JSON.stringify({ token, encrypted_payload: encryptedPayload }),
  });
}

export interface AccessResult {
  credential_name: string;
  service_url: string;
  username: string;
  permission: string;
  use_count: number;
  max_uses: number;
  next_action: string;
}

export async function accessShare(shareToken: string): Promise<AccessResult> {
  return request('/sharing/access', { method: 'POST', body: JSON.stringify({ token: shareToken }) });
}

export interface RelayLoginResult {
  handoff: { session_id: string; expires_in: number };
  service_url: string;
  relay: any;
}

export async function relayLogin(shareToken: string): Promise<RelayLoginResult> {
  return request('/sharing/relay-login', { method: 'POST', body: JSON.stringify({ token: shareToken }) });
}

export interface ShareItem {
  share_id: number;
  credential_name: string;
  recipient_email: string;
  permission: string;
  use_count: number;
  max_uses: number;
  expires_at: number;
  is_expired: boolean;
}

export async function myShares(): Promise<ShareItem[]> {
  return request('/sharing/my-shares');
}

export async function revokeShare(shareId: number): Promise<{ message: string }> {
  return request(`/sharing/revoke/${shareId}`, { method: 'DELETE' });
}

export async function increaseMaxUses(shareId: number, addUses: number): Promise<{ use_count: number; max_uses: number }> {
  return request(`/sharing/increase-max-uses/${shareId}`, {
    method: 'POST',
    body: JSON.stringify({ add_uses: addUses }),
  });
}

// ─── Audit (optional) ───────────────────────────────────────────────────────
export interface AuditEntry {
  id: number;
  action: string;
  credential_id?: number;
  share_id?: number;
  ip?: string;
  timestamp: string;
  details?: string;
}

export async function getAuditLog(): Promise<AuditEntry[]> {
  return request('/audit/');
}

// ─── Utility ────────────────────────────────────────────────────────────────
export function makeExtensionConnectUrl(handoffApiUrl: string): string {
  return `${API_BASE}/extension/connect?handoff=${encodeURIComponent(handoffApiUrl)}`;
}




























// // src/lib/api.ts
// const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

// // function getToken(): string | null {
// //   if (typeof window === 'undefined') return null;
// //   return localStorage.getItem('jwt_token');
// // }


// function getToken(): string | null {
//   if (typeof window === 'undefined') return null;
//   // Lire d'abord 'jwt_token', sinon 'zkp_token' (compatibilité)
//   return localStorage.getItem('jwt_token') || localStorage.getItem('zkp_token');
// }




// async function request<T>(
//   path: string,
//   options: RequestInit = {}
// ): Promise<T> {
//   const token = getToken();
//   const headers: Record<string, string> = {
//     'Content-Type': 'application/json',
//     ...(options.headers as Record<string, string>),
//   };
//   if (token) headers['Authorization'] = `Bearer ${token}`;

//   const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

//   if (!res.ok) {
//     const err = await res.json().catch(() => ({ detail: res.statusText }));
//     const detail = err.detail;
//     if (Array.isArray(detail)) {
//       throw new Error(detail.map((d) => `${d.loc?.slice(-1)?.[0] ?? 'field'}: ${d.msg}`).join(' | '));
//     }
//     throw new Error(typeof detail === 'string' ? detail : `HTTP ${res.status}`);
//   }
//   return res.json();
// }

// // ─── Auth ────────────────────────────────────────────────────────────────────
// export interface ZKPSalts {
//   zkp_salt: string;
//   master_salt: string;
// }

// export interface ZKPChallenge {
//   challenge_id: number;
//   challenge_value: string;
//   expires_at: number;
// }

// export interface ZKPVerifyResult {
//   access_token: string;
//   token_type: string;
//   expires_in: number;
//   user_id: number;
//   username: string;
// }

// export async function getSalts(email: string): Promise<ZKPSalts> {
//   return request(`/auth/salts/${encodeURIComponent(email)}`);
// }

// export async function getChallenge(email: string, commitment: string): Promise<ZKPChallenge> {
//   return request('/auth/challenge', {
//     method: 'POST',
//     body: JSON.stringify({ email, commitment }),
//   });
// }

// export async function verifyProof(email: string, challengeId: number, response: string): Promise<ZKPVerifyResult> {
//   return request('/auth/verify', {
//     method: 'POST',
//     body: JSON.stringify({ email, challenge_id: challengeId, response }),
//   });
// }

// export async function registerUser(email: string, username: string, zkpPublicKey: string, zkpSalt: string, masterSalt: string): Promise<{ user_id: number }> {
//   return request('/auth/register', {
//     method: 'POST',
//     body: JSON.stringify({ email, username, zkp_public_key: zkpPublicKey, zkp_salt: zkpSalt, master_salt: masterSalt }),
//   });
// }

// // ─── Credentials ─────────────────────────────────────────────────────────────
// export interface Credential {
//   id: number;
//   name: string;
//   service_url: string;
//   username: string;
//   credential_type: string;
//   tags: string;
//   created_at: number;
//   shares_count: number;
// }

// export async function listCredentials(): Promise<Credential[]> {
//   return request('/credentials/');
// }

// export async function createCredential(data: any): Promise<Credential> {
//   return request('/credentials/', { method: 'POST', body: JSON.stringify(data) });
// }

// export async function deleteCredential(id: number, hard: boolean = false): Promise<void> {
//   const endpoint = hard ? `/credentials/${id}/hard` : `/credentials/${id}`;
//   return request(endpoint, { method: 'DELETE' });
// }

// export async function getEncryptedSecret(id: number): Promise<{ encrypted_secret: string }> {
//   return request(`/credentials/${id}/encrypted`);
// }

// // ─── Sharing ────────────────────────────────────────────────────────────────
// export interface ShareIntent {
//   share_token: string;
//   share_id: number;
//   expires_at: number;
// }

// export async function createShareIntent(credentialId: number, recipientEmail: string, permission: string, ttlMinutes: number, maxUses: number): Promise<ShareIntent> {
//   return request('/sharing/create-intent', {
//     method: 'POST',
//     body: JSON.stringify({ credential_id: credentialId, recipient_email: recipientEmail, permission, ttl_minutes: ttlMinutes, max_uses: maxUses }),
//   });
// }

// export async function finalizeShare(token: string, encryptedPayload: string): Promise<{ message: string }> {
//   return request('/sharing/finalize', { method: 'POST', body: JSON.stringify({ token, encrypted_payload: encryptedPayload }) });
// }

// export interface AccessResult {
//   credential_name: string;
//   service_url: string;
//   username: string;
//   permission: string;
//   use_count: number;
//   max_uses: number;
//   next_action: string;
// }

// export async function accessShare(shareToken: string): Promise<AccessResult> {
//   return request('/sharing/access', { method: 'POST', body: JSON.stringify({ token: shareToken }) });
// }

// export interface RelayLoginResult {
//   handoff: { session_id: string; expires_in: number };
//   service_url: string;
//   relay: any;
// }

// export async function relayLogin(shareToken: string): Promise<RelayLoginResult> {
//   return request('/sharing/relay-login', { method: 'POST', body: JSON.stringify({ token: shareToken }) });
// }

// export interface ShareItem {
//   share_id: number;
//   credential_name: string;
//   recipient_email: string;
//   permission: string;
//   use_count: number;
//   max_uses: number;
//   expires_at: number;
//   is_expired: boolean;
// }

// export async function myShares(): Promise<ShareItem[]> {
//   return request('/sharing/my-shares');
// }

// export async function revokeShare(shareId: number): Promise<{ message: string }> {
//   return request(`/sharing/revoke/${shareId}`, { method: 'DELETE' });
// }

// export async function increaseMaxUses(shareId: number, addUses: number): Promise<{ use_count: number; max_uses: number }> {
//   return request(`/sharing/increase-max-uses/${shareId}`, { method: 'POST', body: JSON.stringify({ add_uses: addUses }) });
// }


// export interface AuditEntry {
//   id: number;
//   action: string;
//   credential_id?: number;
//   share_id?: number;
//   ip?: string;
//   timestamp: string;
//   details?: string;
// }


// export async function getAuditLog(): Promise<AuditEntry[]> {
//   return request('/audit/');
// }



// export function timeAgo(dateStr: string): string {
//   const date = new Date(dateStr);
//   const diff = Date.now() - date.getTime();
//   const mins = Math.floor(diff / 60_000);
//   if (mins < 1) return 'just now';
//   if (mins < 60) return `${mins}m ago`;
//   const hrs = Math.floor(mins / 60);
//   if (hrs < 24) return `${hrs}h ago`;
//   return `${Math.floor(hrs / 24)}d ago`;
// }



// export async function getHandoffSession(sessionId: string): Promise<{ session_id: string; target_url: string; expires_at: string }> {
//   return request(`/sharing/handoff/${sessionId}`);
// }







// export interface RelayLoginResult {
//   handoff: { session_id: string; expires_in: number };
//   service_url: string;
//   relay: any;
// }

// export async function relayLogin(shareToken: string): Promise<RelayLoginResult> {
//   return request('/sharing/relay-login', {
//     method: 'POST',
//     body: JSON.stringify({ token: shareToken }),
//   });
// }

// export function makeExtensionConnectUrl(handoffApiUrl: string): string {
//   return `${process.env.NEXT_PUBLIC_API_URL}/extension/connect?handoff=${encodeURIComponent(handoffApiUrl)}`;
// }

















// const BASE = process.env.NEXT_PUBLIC_API_URL || '/api/backend'

// function getToken(): string | null {
//   if (typeof window === 'undefined') return null
//   return localStorage.getItem('zkp_token')
// }

// async function request<T>(
//   path: string,
//   options: RequestInit = {}
// ): Promise<T> {
//   const token = getToken()
//   const headers: Record<string, string> = {
//     'Content-Type': 'application/json',
//     ...(options.headers as Record<string, string>),
//   }
//   if (token) headers['Authorization'] = `Bearer ${token}`

//   const res = await fetch(`${BASE}${path}`, { ...options, headers })

//   if (!res.ok) {
//     const err = await res.json().catch(() => ({ detail: res.statusText }))
//     // FastAPI returns detail as string or as array of validation error objects
//     const detail = err.detail
//     if (Array.isArray(detail)) {
//       throw new Error(detail.map((d) => d.msg ? `${d.loc?.slice(-1)?.[0] ?? "field"}: ${d.msg}` : JSON.stringify(d)).join(" | "))
//     }
//     throw new Error(typeof detail === "string" ? detail : `HTTP ${res.status}`)
//   }

//   return res.json()
// }

// // ─── Auth ────────────────────────────────────────────────────────────────────

// export interface ZKPChallenge {
//   challenge: string
//   user_id: string
// }

// export interface ZKPLoginResult {
//   access_token: string
//   token_type: string
// }

// export interface ZKPRegisterResult {
//   message?: string
//   public_key?: string
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   [key: string]: any
// }

// export async function zkpGetChallenge(username: string): Promise<ZKPChallenge> {
//   return request('/auth/challenge', {
//     method: 'POST',
//     body: JSON.stringify({ username }),
//   })
// }

// export async function zkpVerify(
//   username: string,
//   challenge: string,
//   proof: string
// ): Promise<ZKPLoginResult> {
//   return request('/auth/verify', {
//     method: 'POST',
//     body: JSON.stringify({ username, challenge, proof }),
//   })
// }

// export async function zkpRegister(
//   username: string,
//   password: string
// ): Promise<ZKPRegisterResult> {
//   return request('/auth/register', {
//     method: 'POST',
//     body: JSON.stringify({ username, password }),
//   })
// }

// // ─── Credentials ─────────────────────────────────────────────────────────────

// export interface Credential {
//   id: string
//   service_url: string
//   username: string
//   label?: string
//   created_at: string
// }

// export interface CredentialCreate {
//   service_url: string
//   username: string
//   password: string
//   label?: string
// }

// export async function listCredentials(): Promise<Credential[]> {
//   return request('/credentials/')
// }

// export async function createCredential(data: CredentialCreate): Promise<Credential> {
//   return request('/credentials/', {
//     method: 'POST',
//     body: JSON.stringify(data),
//   })
// }

// export async function deleteCredential(id: string): Promise<void> {
//   return request(`/credentials/${id}`, { method: 'DELETE' })
// }

// // ─── Sharing ──────────────────────────────────────────────────────────────────

// export interface Share {
//   id: string
//   credential_id: string
//   recipient_email: string
//   ttl_seconds: number
//   created_at: string
//   expires_at: string
//   revoked: boolean
//   share_token?: string
// }

// export interface ShareCreate {
//   credential_id: string
//   recipient_email: string
//   ttl_seconds: number
// }

// export interface RelayLoginResult {
//   session_id: string
//   handoff_url: string
//   message: string
// }

// export interface HandoffSession {
//   session_id: string
//   target_url: string
//   expires_at: string
// }

// export async function listShares(): Promise<Share[]> {
//   return request('/sharing/shares')
// }

// export async function createShare(data: ShareCreate): Promise<Share> {
//   return request('/sharing/shares', {
//     method: 'POST',
//     body: JSON.stringify(data),
//   })
// }

// export async function revokeShare(id: string): Promise<void> {
//   return request(`/sharing/shares/${id}/revoke`, { method: 'POST' })
// }

// export async function triggerRelayLogin(
//   credentialId: string
// ): Promise<RelayLoginResult> {
//   return request(`/sharing/relay-login/${credentialId}`, { method: 'POST' })
// }

// export async function getHandoffSession(
//   sessionId: string
// ): Promise<HandoffSession> {
//   return request(`/sharing/handoff/${sessionId}`)
// }

// // ─── Keycloak ─────────────────────────────────────────────────────────────────

// export interface DeviceFlowResult {
//   kc_session_id: string
//   verification_uri_complete: string
//   user_code: string
//   expires_in: number
//   interval: number
// }

// export async function startDeviceFlow(
//   credentialId: string,
//   recipientEmail: string
// ): Promise<DeviceFlowResult> {
//   return request('/keycloak/device-flow', {
//     method: 'POST',
//     body: JSON.stringify({ credential_id: credentialId, recipient_email: recipientEmail }),
//   })
// }

// export async function pollDeviceFlow(
//   kcSessionId: string
// ): Promise<{ status: string; session_id?: string }> {
//   return request(`/keycloak/device-flow/${kcSessionId}/poll`)
// }

// // ─── Audit ────────────────────────────────────────────────────────────────────

// export interface AuditEntry {
//   id: string
//   action: string
//   credential_id?: string
//   share_id?: string
//   ip?: string
//   timestamp: string
//   details?: string
// }

// export async function getAuditLog(): Promise<AuditEntry[]> {
//   return request('/audit/')
// }
