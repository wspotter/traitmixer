const SETTINGS_KEY_PREFIX = "openclaw.control.settings.v1:";
const LEGACY_SETTINGS_KEY = "openclaw.control.settings.v1";
const LEGACY_TOKEN_SESSION_KEY = "openclaw.control.token.v1";
const TOKEN_SESSION_KEY_PREFIX = "openclaw.control.token.v1:";
const MAX_SCOPED_SESSION_ENTRIES = 10;

import type { PersonalityConfig } from "../../../src/config/types.personality.js";

function settingsKeyForGateway(gatewayUrl: string): string {
  return `${SETTINGS_KEY_PREFIX}${normalizeGatewayTokenScope(gatewayUrl)}`;
}

type ScopedSessionSelection = {
  sessionKey: string;
  lastActiveSessionKey: string;
};

type PersistedUiSettings = Omit<UiSettings, "token" | "sessionKey" | "lastActiveSessionKey"> & {
  token?: never;
  sessionKey?: string;
  lastActiveSessionKey?: string;
  sessionsByGateway?: Record<string, ScopedSessionSelection>;
};

import { isSupportedLocale } from "../i18n/index.ts";
import { getSafeLocalStorage, getSafeSessionStorage } from "../local-storage.ts";
import { inferBasePathFromPathname, normalizeBasePath } from "./navigation.ts";
import { parseThemeSelection, type ThemeMode, type ThemeName } from "./theme.ts";

export const BORDER_RADIUS_STOPS = [0, 25, 50, 75, 100] as const;
export type BorderRadiusStop = (typeof BORDER_RADIUS_STOPS)[number];

function snapBorderRadius(value: number): BorderRadiusStop {
  let best: BorderRadiusStop = BORDER_RADIUS_STOPS[0];
  let bestDist = Math.abs(value - best);
  for (const stop of BORDER_RADIUS_STOPS) {
    const dist = Math.abs(value - stop);
    if (dist < bestDist) {
      best = stop;
      bestDist = dist;
    }
  }
  return best;
}

export type UiSettings = {
  gatewayUrl: string;
  token: string;
  sessionKey: string;
  lastActiveSessionKey: string;
  theme: ThemeName;
  themeMode: ThemeMode;
  chatFocusMode: boolean;
  chatShowThinking: boolean;
  chatShowToolCalls: boolean;
  splitRatio: number; // Sidebar split ratio (0.4 to 0.7, default 0.6)
  navCollapsed: boolean; // Collapsible sidebar state
  navWidth: number; // Sidebar width when expanded (240–400px)
  navGroupsCollapsed: Record<string, boolean>; // Which nav groups are collapsed
  borderRadius: number; // Corner roundness (0–100, default 50)
  locale?: string;
  personalityProfiles?: Record<string, SavedPersonalityProfile>;
};

export type SavedPersonalityProfile = {
  id: string;
  name: string;
  target: "agent" | "defaults";
  channel: string;
  mode: "default" | "signal" | "dashboard" | "customer_email" | "stress_debug" | "bad_news";
  personality: PersonalityConfig;
  summary?: string;
  metadata?: {
    createdAt: number;
    lastAppliedAt?: number;
    applyCount?: number;
    lastRenamedAt?: number;
  };
  updatedAt: number;
};

const PERSONALITY_TARGET_VALUES = new Set(["agent", "defaults"]);
const PERSONALITY_MODE_VALUES = new Set([
  "default",
  "signal",
  "dashboard",
  "customer_email",
  "stress_debug",
  "bad_news",
]);

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function normalizePersonalityProfile(
  value: unknown,
  fallbackId: string,
): SavedPersonalityProfile | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }
  const personality = asRecord(record.personality);
  if (!personality) {
    return null;
  }
  const now = Date.now();
  const updatedAt =
    typeof record.updatedAt === "number" &&
    Number.isFinite(record.updatedAt) &&
    record.updatedAt > 0
      ? record.updatedAt
      : now;
  const metadata = asRecord(record.metadata);
  const createdAt =
    typeof metadata?.createdAt === "number" &&
    Number.isFinite(metadata.createdAt) &&
    metadata.createdAt > 0
      ? metadata.createdAt
      : updatedAt;

  return {
    id:
      typeof record.id === "string" && record.id.trim().length > 0 ? record.id.trim() : fallbackId,
    name:
      typeof record.name === "string" && record.name.trim().length > 0
        ? record.name.trim()
        : "Saved voice board",
    target:
      typeof record.target === "string" && PERSONALITY_TARGET_VALUES.has(record.target)
        ? (record.target as SavedPersonalityProfile["target"])
        : "agent",
    channel:
      typeof record.channel === "string" && record.channel.trim().length > 0
        ? record.channel.trim()
        : "*",
    mode:
      typeof record.mode === "string" && PERSONALITY_MODE_VALUES.has(record.mode)
        ? (record.mode as SavedPersonalityProfile["mode"])
        : "default",
    personality: personality as PersonalityConfig,
    summary:
      typeof record.summary === "string" && record.summary.trim().length > 0
        ? record.summary.trim()
        : undefined,
    metadata: {
      createdAt,
      ...(typeof metadata?.lastAppliedAt === "number" &&
      Number.isFinite(metadata.lastAppliedAt) &&
      metadata.lastAppliedAt > 0
        ? { lastAppliedAt: metadata.lastAppliedAt }
        : {}),
      ...(typeof metadata?.applyCount === "number" &&
      Number.isFinite(metadata.applyCount) &&
      metadata.applyCount >= 0
        ? { applyCount: Math.floor(metadata.applyCount) }
        : {}),
      ...(typeof metadata?.lastRenamedAt === "number" &&
      Number.isFinite(metadata.lastRenamedAt) &&
      metadata.lastRenamedAt > 0
        ? { lastRenamedAt: metadata.lastRenamedAt }
        : {}),
    },
    updatedAt,
  };
}

function normalizePersonalityProfiles(
  value: unknown,
): Record<string, SavedPersonalityProfile> | undefined {
  const record = asRecord(value);
  if (!record) {
    return undefined;
  }
  const normalizedEntries: Array<[string, SavedPersonalityProfile]> = [];
  for (const [key, candidate] of Object.entries(record)) {
    const profile = normalizePersonalityProfile(candidate, key);
    if (profile) {
      normalizedEntries.push([profile.id, profile]);
    }
  }
  if (normalizedEntries.length === 0) {
    return undefined;
  }
  return Object.fromEntries(normalizedEntries);
}

function isViteDevPage(): boolean {
  if (typeof document === "undefined") {
    return false;
  }
  return Boolean(document.querySelector('script[src*="/@vite/client"]'));
}

function formatHostWithPort(hostname: string, port: string): string {
  const normalizedHost = hostname.includes(":") ? `[${hostname}]` : hostname;
  return `${normalizedHost}:${port}`;
}

function deriveDefaultGatewayUrl(): { pageUrl: string; effectiveUrl: string } {
  const proto = location.protocol === "https:" ? "wss" : "ws";
  const configured =
    typeof window !== "undefined" &&
    typeof window.__OPENCLAW_CONTROL_UI_BASE_PATH__ === "string" &&
    window.__OPENCLAW_CONTROL_UI_BASE_PATH__.trim();
  const basePath = configured
    ? normalizeBasePath(configured)
    : inferBasePathFromPathname(location.pathname);
  const pageUrl = `${proto}://${location.host}${basePath}`;
  if (!isViteDevPage()) {
    return { pageUrl, effectiveUrl: pageUrl };
  }
  const effectiveUrl = `${proto}://${formatHostWithPort(location.hostname, "18789")}`;
  return { pageUrl, effectiveUrl };
}

function getSessionStorage(): Storage | null {
  return getSafeSessionStorage();
}

function normalizeGatewayTokenScope(gatewayUrl: string): string {
  const trimmed = gatewayUrl.trim();
  if (!trimmed) {
    return "default";
  }
  try {
    const base =
      typeof location !== "undefined"
        ? `${location.protocol}//${location.host}${location.pathname || "/"}`
        : undefined;
    const parsed = base ? new URL(trimmed, base) : new URL(trimmed);
    const pathname =
      parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/+$/, "") || parsed.pathname;
    return `${parsed.protocol}//${parsed.host}${pathname}`;
  } catch {
    return trimmed;
  }
}

function tokenSessionKeyForGateway(gatewayUrl: string): string {
  return `${TOKEN_SESSION_KEY_PREFIX}${normalizeGatewayTokenScope(gatewayUrl)}`;
}

function resolveScopedSessionSelection(
  gatewayUrl: string,
  parsed: PersistedUiSettings,
  defaults: UiSettings,
): ScopedSessionSelection {
  const scope = normalizeGatewayTokenScope(gatewayUrl);
  const scoped = parsed.sessionsByGateway?.[scope];
  if (
    scoped &&
    typeof scoped.sessionKey === "string" &&
    scoped.sessionKey.trim() &&
    typeof scoped.lastActiveSessionKey === "string" &&
    scoped.lastActiveSessionKey.trim()
  ) {
    return {
      sessionKey: scoped.sessionKey.trim(),
      lastActiveSessionKey: scoped.lastActiveSessionKey.trim(),
    };
  }

  const legacySessionKey =
    typeof parsed.sessionKey === "string" && parsed.sessionKey.trim()
      ? parsed.sessionKey.trim()
      : defaults.sessionKey;
  const legacyLastActiveSessionKey =
    typeof parsed.lastActiveSessionKey === "string" && parsed.lastActiveSessionKey.trim()
      ? parsed.lastActiveSessionKey.trim()
      : legacySessionKey || defaults.lastActiveSessionKey;

  return {
    sessionKey: legacySessionKey,
    lastActiveSessionKey: legacyLastActiveSessionKey,
  };
}

function loadSessionToken(gatewayUrl: string): string {
  try {
    const storage = getSessionStorage();
    if (!storage) {
      return "";
    }
    storage.removeItem(LEGACY_TOKEN_SESSION_KEY);
    const token = storage.getItem(tokenSessionKeyForGateway(gatewayUrl)) ?? "";
    return token.trim();
  } catch {
    return "";
  }
}

function persistSessionToken(gatewayUrl: string, token: string) {
  try {
    const storage = getSessionStorage();
    if (!storage) {
      return;
    }
    storage.removeItem(LEGACY_TOKEN_SESSION_KEY);
    const key = tokenSessionKeyForGateway(gatewayUrl);
    const normalized = token.trim();
    if (normalized) {
      storage.setItem(key, normalized);
      return;
    }
    storage.removeItem(key);
  } catch {
    // best-effort
  }
}

export function loadSettings(): UiSettings {
  const { pageUrl: pageDerivedUrl, effectiveUrl: defaultUrl } = deriveDefaultGatewayUrl();
  const storage = getSafeLocalStorage();

  const defaults: UiSettings = {
    gatewayUrl: defaultUrl,
    token: loadSessionToken(defaultUrl),
    sessionKey: "main",
    lastActiveSessionKey: "main",
    theme: "claw",
    themeMode: "system",
    chatFocusMode: false,
    chatShowThinking: true,
    chatShowToolCalls: true,
    splitRatio: 0.6,
    navCollapsed: false,
    navWidth: 220,
    navGroupsCollapsed: {},
    borderRadius: 50,
  };

  try {
    // First check for legacy key (no scope), then check for scoped key
    const scopedKey = settingsKeyForGateway(defaults.gatewayUrl);
    const raw =
      storage?.getItem(scopedKey) ??
      storage?.getItem(SETTINGS_KEY_PREFIX + "default") ??
      storage?.getItem(LEGACY_SETTINGS_KEY);
    if (!raw) {
      return defaults;
    }
    const parsed = JSON.parse(raw) as PersistedUiSettings;
    const parsedGatewayUrl =
      typeof parsed.gatewayUrl === "string" && parsed.gatewayUrl.trim()
        ? parsed.gatewayUrl.trim()
        : defaults.gatewayUrl;
    const gatewayUrl = parsedGatewayUrl === pageDerivedUrl ? defaultUrl : parsedGatewayUrl;
    const scopedSessionSelection = resolveScopedSessionSelection(gatewayUrl, parsed, defaults);
    const { theme, mode } = parseThemeSelection(
      (parsed as { theme?: unknown }).theme,
      (parsed as { themeMode?: unknown }).themeMode,
    );
    const normalizedPersonalityProfiles = normalizePersonalityProfiles(parsed.personalityProfiles);
    const settings = {
      gatewayUrl,
      // Gateway auth is intentionally in-memory only; scrub any legacy persisted token on load.
      token: loadSessionToken(gatewayUrl),
      sessionKey: scopedSessionSelection.sessionKey,
      lastActiveSessionKey: scopedSessionSelection.lastActiveSessionKey,
      theme,
      themeMode: mode,
      chatFocusMode:
        typeof parsed.chatFocusMode === "boolean" ? parsed.chatFocusMode : defaults.chatFocusMode,
      chatShowThinking:
        typeof parsed.chatShowThinking === "boolean"
          ? parsed.chatShowThinking
          : defaults.chatShowThinking,
      chatShowToolCalls:
        typeof parsed.chatShowToolCalls === "boolean"
          ? parsed.chatShowToolCalls
          : defaults.chatShowToolCalls,
      splitRatio:
        typeof parsed.splitRatio === "number" &&
        parsed.splitRatio >= 0.4 &&
        parsed.splitRatio <= 0.7
          ? parsed.splitRatio
          : defaults.splitRatio,
      navCollapsed:
        typeof parsed.navCollapsed === "boolean" ? parsed.navCollapsed : defaults.navCollapsed,
      navWidth:
        typeof parsed.navWidth === "number" && parsed.navWidth >= 200 && parsed.navWidth <= 400
          ? parsed.navWidth
          : defaults.navWidth,
      navGroupsCollapsed:
        typeof parsed.navGroupsCollapsed === "object" && parsed.navGroupsCollapsed !== null
          ? parsed.navGroupsCollapsed
          : defaults.navGroupsCollapsed,
      borderRadius:
        typeof parsed.borderRadius === "number" &&
        parsed.borderRadius >= 0 &&
        parsed.borderRadius <= 100
          ? snapBorderRadius(parsed.borderRadius)
          : defaults.borderRadius,
      locale: isSupportedLocale(parsed.locale) ? parsed.locale : undefined,
      personalityProfiles: normalizedPersonalityProfiles,
    };
    if (
      "token" in parsed ||
      JSON.stringify(parsed.personalityProfiles ?? null) !==
        JSON.stringify(normalizedPersonalityProfiles ?? null)
    ) {
      persistSettings(settings);
    }
    return settings;
  } catch {
    return defaults;
  }
}

export function saveSettings(next: UiSettings) {
  persistSettings(next);
}

function persistSettings(next: UiSettings) {
  persistSessionToken(next.gatewayUrl, next.token);
  const storage = getSafeLocalStorage();
  const scope = normalizeGatewayTokenScope(next.gatewayUrl);
  const scopedKey = settingsKeyForGateway(next.gatewayUrl);
  let existingSessionsByGateway: Record<string, ScopedSessionSelection> = {};
  try {
    // Try to migrate from legacy key or other scopes
    const raw =
      storage?.getItem(scopedKey) ??
      storage?.getItem(SETTINGS_KEY_PREFIX + "default") ??
      storage?.getItem("openclaw.control.settings.v1");
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedUiSettings;
      if (parsed.sessionsByGateway && typeof parsed.sessionsByGateway === "object") {
        existingSessionsByGateway = parsed.sessionsByGateway;
      }
    }
  } catch {
    // best-effort
  }
  const sessionsByGateway = Object.fromEntries(
    [
      ...Object.entries(existingSessionsByGateway).filter(([key]) => key !== scope),
      [
        scope,
        {
          sessionKey: next.sessionKey,
          lastActiveSessionKey: next.lastActiveSessionKey,
        },
      ],
    ].slice(-MAX_SCOPED_SESSION_ENTRIES),
  );
  const persisted: PersistedUiSettings = {
    gatewayUrl: next.gatewayUrl,
    theme: next.theme,
    themeMode: next.themeMode,
    chatFocusMode: next.chatFocusMode,
    chatShowThinking: next.chatShowThinking,
    chatShowToolCalls: next.chatShowToolCalls,
    splitRatio: next.splitRatio,
    navCollapsed: next.navCollapsed,
    navWidth: next.navWidth,
    navGroupsCollapsed: next.navGroupsCollapsed,
    borderRadius: next.borderRadius,
    sessionsByGateway,
    ...(next.locale ? { locale: next.locale } : {}),
    ...(next.personalityProfiles ? { personalityProfiles: next.personalityProfiles } : {}),
  };
  const serialized = JSON.stringify(persisted);
  try {
    storage?.setItem(scopedKey, serialized);
    storage?.setItem(LEGACY_SETTINGS_KEY, serialized);
  } catch {
    // best-effort — quota exceeded or security restrictions should not
    // prevent in-memory settings and visual updates from being applied
  }
}
