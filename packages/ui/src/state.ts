import {
  compilePersonalityOverlay,
  resolvePersonalityConfig,
  type TraitMixerConfig,
} from "traitmixer-core";
import type { PersonalityTarget } from "./personality-panel.js";
import { FALLBACK_TARGETS, type TargetPushResult, type TargetStatus } from "./targets.js";

export const AGENT_ID = "demo";

function resolveApiBaseUrl(): string {
  const configured = import.meta.env.VITE_TRAITMIXER_API_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    return "http://localhost:4400";
  }

  return window.location.origin.replace(/\/$/, "");
}

const API_BASE_URL = resolveApiBaseUrl();

export const INITIAL_CONFIG: TraitMixerConfig = {
  agents: {
    defaults: {
      personality: {
        traits: {},
      },
    },
    list: [
      {
        id: AGENT_ID,
        personality: {
          traits: {},
        },
      },
    ],
  },
};

export type TargetAction = "push" | "keep" | "clear";

export type AppState = {
  theme: "system" | "light" | "neutral" | "dark";
  availableTargets: TargetStatus[];
  channel: string;
  configDirty: boolean;
  configForm: TraitMixerConfig;
  pushResults: TargetPushResult[];
  pushing: boolean;
  targetActions: Record<string, TargetAction>;
  target: PersonalityTarget;
  targetMenuOpen: boolean;
  targetSelectionTouched: boolean;
  targetsLoading: boolean;
};

// Simple pub-sub for rerendering
let listeners: (() => void)[] = [];
export function subscribe(listener: () => void) {
  listeners.push(listener);
}
function emit() {
  for (const listener of listeners) listener();
}

function defaultTargetActions(targets: TargetStatus[]): Record<string, TargetAction> {
  const actions: Record<string, TargetAction> = {};
  for (const target of targets) {
    if (target.configured) {
      actions[target.id] = "push";
    }
  }
  return actions;
}

function syncTargetActions(
  targets: TargetStatus[],
  currentActions: Record<string, TargetAction>,
  targetSelectionTouched: boolean,
): Record<string, TargetAction> {
  const configuredTargetIds = new Set(
    targets.filter((target) => target.configured).map((target) => target.id),
  );
  
  const newActions: Record<string, TargetAction> = {};
  for (const id of Object.keys(currentActions)) {
    if (configuredTargetIds.has(id)) {
      newActions[id] = currentActions[id];
    }
  }

  if (targetSelectionTouched) {
    return newActions;
  }

  return Object.keys(newActions).length > 0 ? newActions : defaultTargetActions(targets);
}

export let state: AppState = {
  theme: (localStorage.getItem("traitmixer_theme") as AppState["theme"]) || "system",
  availableTargets: FALLBACK_TARGETS,
  channel: "*",
  configDirty: false,
  configForm: structuredClone(INITIAL_CONFIG),
  pushResults: [],
  pushing: false,
  targetActions: defaultTargetActions(FALLBACK_TARGETS),
  target: "agent",
  targetMenuOpen: false,
  targetSelectionTouched: false,
  targetsLoading: false,
};

export function updateState(newState: Partial<AppState>) {
  if (newState.theme) {
    localStorage.setItem("traitmixer_theme", newState.theme);
  }
  state = { ...state, ...newState };
  emit();
}

function setNestedValue(target: Record<string, unknown>, path: string[], value: unknown) {
  let cursor: Record<string, unknown> = target;
  for (const key of path.slice(0, -1)) {
    const next = cursor[key];
    if (!next || typeof next !== "object") {
      cursor[key] = {};
    }
    cursor = cursor[key] as Record<string, unknown>;
  }
  cursor[path[path.length - 1]] = value;
}

export function updateField(args: { path: string[]; target: PersonalityTarget; value: unknown }) {
  const configForm = structuredClone(state.configForm);
  const personalityRoot =
    args.target === "defaults"
      ? configForm.agents?.defaults?.personality
      : configForm.agents?.list?.find((agent) => agent.id === AGENT_ID)?.personality;

  if (!personalityRoot) return;

  setNestedValue(personalityRoot as Record<string, unknown>, args.path, args.value);
  updateState({ configDirty: true, configForm, pushResults: [] });
}

export async function loadTargets() {
  updateState({ targetsLoading: true });

  try {
    const response = await fetch(`${API_BASE_URL}/api/targets`);
    if (!response.ok) {
      throw new Error(`Target lookup failed: ${response.status}`);
    }

    const data = (await response.json()) as { targets?: TargetStatus[] };
    const availableTargets = data.targets?.length ? data.targets : FALLBACK_TARGETS;
    updateState({
      availableTargets,
      targetActions: syncTargetActions(
        availableTargets,
        state.targetActions,
        state.targetSelectionTouched,
      ),
      targetsLoading: false,
    });
  } catch {
    updateState({
      availableTargets: FALLBACK_TARGETS,
      targetActions: syncTargetActions(
        FALLBACK_TARGETS,
        state.targetActions,
        state.targetSelectionTouched,
      ),
      targetsLoading: false,
    });
  }
}

export function setTargetAction(targetId: string, action: TargetAction) {
  const target = state.availableTargets.find((item) => item.id === targetId);
  if (!target?.configured) return;

  const targetActions = { ...state.targetActions, [targetId]: action };

  updateState({
    pushResults: [],
    targetActions,
    targetSelectionTouched: true,
  });
}

export async function pushSelectedTargets() {
  const pushTargets: string[] = [];
  const clearTargets: string[] = [];
  
  for (const target of state.availableTargets) {
    if (target.configured) {
      const action = state.targetActions[target.id] || "keep";
      if (action === "push") pushTargets.push(target.id);
      if (action === "clear") clearTargets.push(target.id);
    }
  }

  if (pushTargets.length === 0 && clearTargets.length === 0) {
    updateState({
      pushResults: [
        {
          success: false,
          target: "traitmixer",
          message: "Select at least one configured target to push or clear.",
        },
      ],
      targetMenuOpen: true,
    });
    return;
  }

  const personality = resolvePersonalityConfig(state.configForm, AGENT_ID);
  const rawOverlay = compilePersonalityOverlay(personality, {
    channel: state.channel === "*" ? undefined : state.channel,
  });
  const overlay = rawOverlay ?? "";

  if (!overlay && pushTargets.length > 0) {
    updateState({
      pushResults: [
        {
          success: false,
          target: "traitmixer",
          message: "No overlay was generated for the current mix to push.",
        },
      ],
    });
    return;
  }

  updateState({ pushResults: [], pushing: true, targetMenuOpen: false });

  try {
    const response = await fetch(`${API_BASE_URL}/api/push`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        overlay,
        targets: pushTargets,
        uninstall: clearTargets,
      }),
    });
    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
      results?: TargetPushResult[];
    };
    updateState({
      pushResults:
        data.results && data.results.length > 0
          ? data.results
          : [
              {
                success: false,
                target: "traitmixer",
                message: data.error ?? "Push failed without a detailed response.",
              },
            ],
      pushing: false,
    });
  } catch {
    updateState({
      pushResults: [
        {
          success: false,
          target: "traitmixer",
          message: `Could not reach the TraitMixer push API at ${API_BASE_URL}.`,
        },
      ],
      pushing: false,
    });
  }
}
