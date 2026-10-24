// Signed-cookie session (HMAC-SHA256 via Web Crypto; works on Workers).
export type Session = {
  id: string;
  username: string;
  avatar: string | null;
  accessToken: string;
  exp: number;
};

export const SESSION_COOKIE = "argus_session";
export const STATE_COOKIE = "argus_oauth_state";

const enc = new TextEncoder();

function b64url(bytes: Uint8Array) {
  let s = "";
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromB64url(str: string) {
  const s = atob(str.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
}

async function key() {
  const secret = process.env["SESSION_SECRET"];
  if (!secret) throw new Error("SESSION_SECRET is not configured");
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

export async function sign(value: string) {
  const sig = await crypto.subtle.sign("HMAC", await key(), enc.encode(value));
  return `${value}.${b64url(new Uint8Array(sig))}`;
}

export async function unsign(signed: string | undefined | null) {
  if (!signed) return null;
  const i = signed.lastIndexOf(".");
  if (i < 0) return null;
  const value = signed.slice(0, i);
  const ok = await crypto.subtle.verify("HMAC", await key(), fromB64url(signed.slice(i + 1)), enc.encode(value));
  return ok ? value : null;
}

export async function encodeSession(s: Session) {
  return sign(b64url(enc.encode(JSON.stringify(s))));
}

export async function decodeSession(raw: string | undefined | null): Promise<Session | null> {
  const v = await unsign(raw);
  if (!v) return null;
  try {
    const s = JSON.parse(new TextDecoder().decode(fromB64url(v))) as Session;
    return s.exp > Date.now() ? s : null;
  } catch {
    return null;
  }
}

export function readCookie(header: string | null, name: string) {
  if (!header) return null;
  for (const part of header.split(/;\s*/)) {
    const [k, ...rest] = part.split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

export function cookie(name: string, value: string, maxAge: number) {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function appOrigin(request: Request) {
  return process.env["APP_URL"]?.replace(/\/$/, "") || new URL(request.url).origin;
}
