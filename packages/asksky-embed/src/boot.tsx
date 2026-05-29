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

function parseCssLength(raw: string | undefined, fallback: string): string {
  const v = raw?.trim();
  if (v && /^[\w\s%.+(),\-/]+$/i.test(v) && v.length <= 80) {
    return v;
  }
  return fallback;
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
    /**
     * Fill the embedding container’s height (partners should wrap the script in a sized box,
     * e.g. `height: 500px; display: flex; flex-direction: column` so this host can flex).
     * `max-height` caps the shell so the message list scrolls instead of growing the page.
     */
    const minHeightCss = parseCssLength(script.dataset.minHeight, "360px");
    const maxHeightCss = parseCssLength(
      script.dataset.maxHeight,
      "min(640px, calc(100dvh - 120px))",
    );
    host.style.cssText = [
      "display:flex",
      "flex:1 1 auto",
      "flex-direction:column",
      "width:100%",
      "min-width:0",
      `min-height:${minHeightCss}`,
      "height:100%",
      `max-height:${maxHeightCss}`,
      "box-sizing:border-box",
      "overflow:hidden",
    ].join(";");
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
      ? "display:flex;flex:1;flex-direction:column;min-height:0;height:100%;width:100%;box-sizing:border-box;"
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
