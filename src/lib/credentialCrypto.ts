// src/lib/credentialCrypto.ts
const PBKDF2_ITERATIONS = 310000;
const KEY_LEN = 32; // 256 bits

function bytesToB64(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function b64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function deriveKey(masterPassword: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(masterPassword),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true, // extractable
    ['encrypt', 'decrypt']
  );
}

export async function encryptCredential(
  plaintext: string,
  masterPassword: string,
  masterSaltB64: string
): Promise<string> {
  const salt = b64ToBytes(masterSaltB64);
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96 bits
  const key = await deriveKey(masterPassword, salt);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext)
  );
  return JSON.stringify({
    salt: masterSaltB64,
    nonce: bytesToB64(iv),
    ciphertext: bytesToB64(new Uint8Array(encrypted)),
  });
}

export async function decryptCredential(
  encryptedJson: string,
  masterPassword: string
): Promise<string> {
  const { salt, nonce, ciphertext } = JSON.parse(encryptedJson);
  const key = await deriveKey(masterPassword, b64ToBytes(salt));
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: b64ToBytes(nonce) },
    key,
    b64ToBytes(ciphertext)
  );
  return new TextDecoder().decode(decrypted);
}