/**
 * Super-admin strony: pełne uprawnienia (np. usuwanie szablonów dodanych przez innych).
 * Sprawdzaj to ZAWSZE po stronie serwera (funkcje serwerowe / endpointy API),
 * a w interfejsie używaj tego tylko do pokazania lub ukrycia przycisków.
 *
 * Dodatkowe ID możesz podać w zmiennej SUPER_ADMIN_IDS (po przecinku, tylko po stronie serwera).
 */
const DEFAULT_IDS = ["827809181913317387"];

const extraIds =
  typeof process !== "undefined" && process.env?.SUPER_ADMIN_IDS
    ? process.env.SUPER_ADMIN_IDS.split(",")
        .map((s) => s.trim())
        .filter((s) => /^\d{17,20}$/.test(s))
    : [];

export const SUPER_ADMIN_IDS = new Set<string>([...DEFAULT_IDS, ...extraIds]);

export function isSuperAdmin(discordUserId?: string | null): boolean {
  return !!discordUserId && SUPER_ADMIN_IDS.has(discordUserId);
}