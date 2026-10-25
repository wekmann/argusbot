import { getRequestHeader } from "@tanstack/react-start/server";

/** Calls the bot's /templates API. Never throws on HTTP errors - returns status + parsed body. */
export async function templatesBot<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<{ status: number; body: T | null }> {
  const base = process.env["BOT_API_URL"]?.replace(/\/$/, "");
  const secret = process.env["BOT_API_SECRET"];
  if (!base || !secret) throw new Error("Bot API is not configured (BOT_API_URL / BOT_API_SECRET)");
  const res = await fetch(`${base}/templates${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  let body: T | null = null;
  try {
    body = (await res.json()) as T;
  } catch {
    /* empty or non-JSON body */
  }
  return { status: res.status, body };
}

/** Human-readable error from a bot answer ({ error: "..." }). */
export function botError(body: unknown, fallback = "Something went wrong. Try again."): string {
  const e = (body as { error?: unknown } | null)?.error;
  return typeof e === "string" && e ? e : fallback;
}

/** Salted hash of the caller's IP (never stored raw) - only used to blunt scripted review spam. */
export async function ipHash(): Promise<string | null> {
  const raw = getRequestHeader("cf-connecting-ip") ?? getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim();
  if (!raw) return null;
  const data = new TextEncoder().encode(`${raw}|${process.env["SESSION_SECRET"] ?? ""}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}