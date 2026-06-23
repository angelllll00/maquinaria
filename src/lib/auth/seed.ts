import type { Usuario } from "@/lib/types";
import { generateSalt, hashPassword } from "@/lib/auth/pbkdf2";

const ADMIN_EMAILS = ["deya@maquinaria.local", "jhonatan@maquinaria.local"];
const ADMIN_PASSWORD = "admin123";

function uuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // fallback
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function buildSeedUsers(): Promise<Usuario[]> {
  const now = new Date().toISOString();
  const users: Usuario[] = [];

  for (const email of ADMIN_EMAILS) {
    const salt = generateSalt();
    const hash = await hashPassword(ADMIN_PASSWORD, salt);
    const nombre = email.startsWith("deya")
      ? "Deya"
      : "Jhonatan";
    users.push({
      id: uuid(),
      cedula: email.startsWith("deya") ? "admin-deya" : "admin-jhonatan",
      nombre,
      email,
      role: "admin",
      password_hash: hash,
      salt,
      active: true,
      created_at: now,
      updated_at: now,
      synced: false,
    });
  }

  return users;
}

export function syntheticEmail(cedula: string): string {
  return `${cedula}@maquinaria.local`;
}

export function employeeDefaultPassword(cedula: string): string {
  return `V${cedula}`;
}
