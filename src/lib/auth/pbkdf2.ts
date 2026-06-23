// PBKDF2-SHA256 password hashing (offline-first, browser-native via SubtleCrypto)

function buf2hex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hex2buf(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

export function generateSalt(bytes = 16): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return buf2hex(arr.buffer);
}

export async function hashPassword(
  password: string,
  saltHex: string
): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const derived = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: hex2buf(saltHex) as unknown as BufferSource,
      iterations: 100_000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  return buf2hex(derived);
}

export async function verifyPassword(
  password: string,
  saltHex: string,
  expectedHash: string
): Promise<boolean> {
  const h = await hashPassword(password, saltHex);
  // constant-time compare
  if (h.length !== expectedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < h.length; i++) {
    diff |= h.charCodeAt(i) ^ expectedHash.charCodeAt(i);
  }
  return diff === 0;
}
