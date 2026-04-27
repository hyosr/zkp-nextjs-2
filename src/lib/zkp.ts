// src/lib/zkp.ts
import { modPow } from 'bigint-mod-arith';

const P = BigInt(
  '0xFFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD1' +
  '29024E088A67CC74020BBEA63B139B22514A08798E3404DD' +
  'EF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245' +
  'E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7ED' +
  'EE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3D' +
  'C2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F' +
  '83655D23DCA3AD961C62F356208552BB9ED529077096966D' +
  '670C354E4ABC9804F1746C08CA18217C32905E462E36CE3B' +
  'E39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9' +
  'DE2BCBF6955817183995497CEA956AE515D2261898FA0510' +
  '15728E5A8AACAA68FFFFFFFFFFFFFFFF'
);
const G = 2n;
const Q = (P - 1n) / 2n;

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function bytesToB64(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

// async function pbkdf2(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
//   const enc = new TextEncoder();
//   const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveBits']);
//   const derived = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, keyMaterial, 256);
//   return new Uint8Array(derived);
// }


async function pbkdf2(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const derived = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,  // ✅ cast to BufferSource
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );
  return new Uint8Array(derived);
}



export async function deriveSecret(password: string, saltB64: string): Promise<bigint> {
  const salt = base64ToBytes(saltB64);
  const dk = await pbkdf2(password, salt, 310_000);
  let num = 0n;
  for (let i = 0; i < dk.length; i++) num = (num << 8n) + BigInt(dk[i]);
  return (num % (Q - 1n)) + 1n;
}

export function createCommitment(): { commitmentHex: string; r: bigint } {
  const max = Q - 1n;
  let r = 0n;
  do {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    r = 0n;
    for (let i = 0; i < bytes.length; i++) r = (r << 8n) + BigInt(bytes[i]);
    r = r % max;
  } while (r === 0n);
  r += 1n;
  const Yr = modPow(G, r, P);
  return { commitmentHex: Yr.toString(16), r };
}

export async function computeResponse(
  password: string,
  saltB64: string,
  r: bigint,
  challengeHex: string
): Promise<string> {
  const x = await deriveSecret(password, saltB64);
  const c = BigInt(challengeHex);
  let s = (r - c * x) % Q;
  if (s < 0n) s += Q;
  return '0x' + s.toString(16);
}

export async function generatePublicKey(password: string): Promise<{ publicKey: string; zkpSalt: string; masterSalt: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const zkpSaltB64 = bytesToB64(salt);
  const x = await deriveSecret(password, zkpSaltB64);
  const Y = modPow(G, x, P);
  const masterSalt = crypto.getRandomValues(new Uint8Array(32));
  const masterSaltB64 = bytesToB64(masterSalt);
  return { publicKey: Y.toString(16), zkpSalt: zkpSaltB64, masterSalt: masterSaltB64 };
}




export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}























// /**
//  * ZKP client-side utilities
//  * Implements a Schnorr-like proof for the ZKP login protocol.
//  * The exact math must match the backend's verification logic.
//  */

// /**
//  * Simple deterministic "proof" derivation.
//  * In a real Schnorr protocol you would:
//  *   1. Pick random nonce r
//  *   2. Compute commitment R = g^r mod p
//  *   3. Compute challenge c = H(R || public_key || message)
//  *   4. Compute response s = r + c * secret mod q
//  *
//  * Here we derive a HMAC-SHA256 based proof that mirrors
//  * what the backend expects from the Streamlit prototype.
//  */
// export async function deriveProof(
//   password: string,
//   challenge: string
// ): Promise<string> {
//   const encoder = new TextEncoder()

//   // Derive secret key from password
//   const keyMaterial = await crypto.subtle.importKey(
//     'raw',
//     encoder.encode(password),
//     { name: 'PBKDF2' },
//     false,
//     ['deriveKey']
//   )

//   const secretKey = await crypto.subtle.deriveKey(
//     {
//       name: 'PBKDF2',
//       salt: encoder.encode('zkp-salt-v1'),
//       iterations: 100_000,
//       hash: 'SHA-256',
//     },
//     keyMaterial,
//     { name: 'HMAC', hash: 'SHA-256' },
//     true,
//     ['sign']
//   )

//   // Sign the challenge
//   const signature = await crypto.subtle.sign(
//     'HMAC',
//     secretKey,
//     encoder.encode(challenge)
//   )

//   return Array.from(new Uint8Array(signature))
//     .map((b) => b.toString(16).padStart(2, '0'))
//     .join('')
// }

// /**
//  * Derive public key from password (for registration)
//  */
// export async function derivePublicKey(password: string): Promise<string> {
//   const encoder = new TextEncoder()
//   const data = encoder.encode(`zkp-pubkey:${password}`)
//   const hash = await crypto.subtle.digest('SHA-256', data)
//   return Array.from(new Uint8Array(hash))
//     .map((b) => b.toString(16).padStart(2, '0'))
//     .join('')
// }

// /**
//  * Format relative time
//  */
// export function timeAgo(dateStr: string): string {
//   const date = new Date(dateStr)
//   const diff = Date.now() - date.getTime()
//   const mins = Math.floor(diff / 60_000)
//   if (mins < 1) return 'just now'
//   if (mins < 60) return `${mins}m ago`
//   const hrs = Math.floor(mins / 60)
//   if (hrs < 24) return `${hrs}h ago`
//   return `${Math.floor(hrs / 24)}d ago`
// }

// /**
//  * Format TTL seconds to human readable
//  */
// export function formatTTL(seconds: number): string {
//   if (seconds < 60) return `${seconds}s`
//   if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
//   if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
//   return `${Math.floor(seconds / 86400)}d`
// }

// /**
//  * Check if an ISO date string is expired
//  */
// export function isExpired(dateStr: string): boolean {
//   return new Date(dateStr).getTime() < Date.now()
// }
