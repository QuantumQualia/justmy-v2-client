import embedCss from "./embed.css?inline";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AskSkyWidgetCore } from "./asksky-widget-core";
import { createEmbedSkyTransport } from "./embed-sky-transport";
import type { AskSkyVariant } from "./asksky-widget-core";

function normalizeVariant(raw: string): AskSkyVariant {
  const v = raw.toLowerCase();
  if (v === "voice" || v === "chatbot" || v === "inline") {
    return v;
  }
  return "inline";
}

function getScriptEl(): HTMLScriptElement | null {
  const cur = document.currentScript;
  if (cur instanceof HTMLScriptElement) {
    return cur;
  }
  const list = document.querySelectorAll("script[src*='asksky.js']");
  const last = list[list.length - 1];
  return last instanceof HTMLScriptElement ? last : null;
}

function mountAskSkyFromScript(): void {
  const script = getScriptEl();
  if (!script?.src) {
    return;
  }
  const origin = new URL(script.src).origin;
  const profileSlug = script.dataset.profileSlug?.trim() ?? "";
  const agentToken = script.dataset.agentToken?.trim() ?? "";
  const variant = normalizeVariant(script.dataset.variant ?? "inline");
  const embedKey = `script-embed:${profileSlug || "x"}:${agentToken.slice(0, 16)}`;

  const host = document.createElement("div");
  host.id = "asksky-embed-host";
  /**
   * Chatbot: mount on `document.body` with a max-ish z-index so it stacks above typical site chrome
   * (modals, sticky nav). Nesting under `transform`/`filter` ancestors would otherwise trap stacking.
   * `pointer-events: none` on the host passes clicks through; the widget re-enables hits on controls.
   *
   * Keep this z-index in sync with the chatbot floater in `asksky-widget-core.tsx` (`z-[2147483646]`).
   */
  const CHATBOT_HOST_Z = "2147483646";

  if (variant === "inline") {
    host.style.cssText =
      "display:flex;flex-direction:column;width:100%;box-sizing:border-box;min-height:min(calc(100dvh - 150px),640px);";
    script.insertAdjacentElement("afterend", host);
  } else if (variant === "chatbot") {
    host.style.cssText = `position:fixed;inset:0;z-index:${CHATBOT_HOST_Z};pointer-events:none;display:block;`;
    document.body.appendChild(host);
  } else {
    host.style.cssText = "display:contents;";
    script.insertAdjacentElement("afterend", host);
  }

  const shadow = host.attachShadow({ mode: "open" });
  const styleEl = document.createElement("style");
  styleEl.textContent = embedCss;
  shadow.appendChild(styleEl);

  const rootEl = document.createElement("div");
  rootEl.className = "asksky-shadow-app dark";
  rootEl.style.cssText =
    variant === "inline"
      ? "display:flex;flex:1;flex-direction:column;min-height:0;width:100%;box-sizing:border-box;"
      : variant === "chatbot"
        ? "box-sizing:border-box;pointer-events:none;min-height:0;min-width:0;width:100%;height:100%;"
        : "min-height:0;min-width:0;";
  shadow.appendChild(rootEl);

  const sky = createEmbedSkyTransport(origin);
  const embedFill = variant === "inline";

  createRoot(rootEl).render(
    <StrictMode>
      <AskSkyWidgetCore
        profileSlug={profileSlug}
        agentToken={agentToken}
        variant={variant}
        embedKey={embedKey}
        embedFill={embedFill}
        sky={sky}
        visitorUserBubble={null}
      />
    </StrictMode>,
  );
}

mountAskSkyFromScript();
