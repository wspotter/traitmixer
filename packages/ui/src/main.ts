import { html, render } from "lit";
import { renderAgentPersonality } from "./personality-panel.js";
import {
  AGENT_ID,
  INITIAL_CONFIG,
  loadTargets,
  pushSelectedTargets,
  state,
  subscribe,
  setTargetAction,
  updateField,
  updateState,
} from "./state.js";

function renderApp() {
  document.documentElement.setAttribute('data-theme', state.theme);
  return html`
    <style>
      .page {
        min-height: 100vh;
        padding: 32px 20px 72px;
      }

      .shell {
        width: min(1240px, 100%);
        margin: 0 auto;
      }

      .showcase {
        position: relative;
        z-index: 1;
        padding: 18px;
        border: 1px solid var(--panel-border);
        border-radius: 28px;
        background: var(--panel-bg);
        backdrop-filter: blur(18px);
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
      }

      @media (max-width: 720px) {
        .page {
          padding-inline: 14px;
        }
      }

      .app-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .theme-switch select {
        appearance: none;
        background: transparent;
        border: 1px solid var(--theme-sel-border);
        color: var(--text);
        padding: 6px 12px;
        border-radius: 6px;
        font-family: inherit;
        font-size: 0.75rem;
        cursor: pointer;
      }
      .theme-switch select option {
        background: var(--bg);
        color: var(--text);
      }
    </style>

    <div class="page">
      <header class="app-header">
        <div class="logo">
          <span class="logo-mark"></span>
          <h1>TraitMixer</h1>
        </div>
        <div class="theme-switch">
          <select @change=${(e: Event) => updateState({ theme: (e.target as HTMLSelectElement).value as any })}>
            <option value="system" ?selected=${state.theme === "system"}>System</option>
            <option value="light" ?selected=${state.theme === "light"}>Light</option>
            <option value="neutral" ?selected=${state.theme === "neutral"}>Neutral</option>
            <option value="dark" ?selected=${state.theme === "dark"}>Dark</option>
          </select>
        </div>
      </header>

      <div class="shell" style="margin-top: 40px;">
        <div class="showcase">
          ${renderAgentPersonality({
            availableTargets: state.availableTargets,
            agentId: AGENT_ID,
            configDirty: state.configDirty,
            configForm: state.configForm,
            channel: state.channel,
            onPush: pushSelectedTargets,
            onRefreshTargets: loadTargets,
            target: state.target,
            pushResults: state.pushResults,
            pushing: state.pushing,
            targetActions: state.targetActions,
            targetMenuOpen: state.targetMenuOpen,
            targetsLoading: state.targetsLoading,
            onChannelChange: (channel) => {
              updateState({ channel, pushResults: [] });
            },
            onFieldChange: updateField,
            onReset: () => {
              updateState({
                channel: "*",
                configDirty: false,
                configForm: structuredClone(INITIAL_CONFIG),
                pushResults: [],
                target: "agent",
              });
            },
            onTargetChange: (target) => {
              updateState({ pushResults: [], target });
            },
            onTargetMenuToggle: () => {
              updateState({ targetMenuOpen: !state.targetMenuOpen });
            },
            onTargetActionSet: setTargetAction,
          })}
        </div>
      </div>

        <footer class="app-footer">
          <div class="footer-content">
          </div>
        </footer>
      </div>
    </div>
  `;
}

function rerender() {
  const app = document.getElementById("app");
  if (!app) return;
  render(renderApp(), app);
}

subscribe(rerender);

rerender();
void loadTargets();
