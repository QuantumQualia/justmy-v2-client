import embedCss from "./embed.css?inline";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CityOsInlineRoot } from "./cityos-inline-root";
import { hostFromReferrerUrl } from "./referrer-host";

function getScriptEl(): HTMLScriptElement | null {
  const cur = document.currentScript;
  if (cur instanceof HTMLScriptElement) {
    return cur;
  }
  const list = document.querySelectorAll("script[src*='cityos.js']");
  const last = list[list.length - 1];
  return last instanceof HTMLScriptElement ? last : null;
}

function parseLimit(raw: string | undefined): number | undefined {
  if (raw == null || raw === "") return undefined;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return undefined;
  return Math.min(100, Math.max(1, n));
}

function mountCityOsFromScript(): void {
  const script = getScriptEl();
  if (!script?.src) {
    return;
  }
  const origin = new URL(script.src).origin;
  const fromDataset = script.dataset.domain?.trim() ?? "";
  // Prefer the page that runs this script (embedding newsstand). `document.referrer` is often empty on direct loads.
  const fromLocation =
    hostFromReferrerUrl(typeof window !== "undefined" ? window.location.href : "") ?? "";
  const fromReferrer =
    hostFromReferrerUrl(typeof document !== "undefined" ? document.referrer : "") ?? "";
  const domain = fromDataset || fromLocation || fromReferrer;

  if (!domain) {
    console.warn(
      "[cityos.js] Missing market domain: set data-domain on the script tag, or load the widget on a normal http(s) page so window.location.hostname can be read.",
    );
    return;
  }

  const eventsLimit = parseLimit(script.dataset.eventsLimit);

  const host = document.createElement("div");
  host.id = "cityos-embed-host";
  host.style.cssText =
    "display:block;width:100%;min-width:0;max-width:100%;box-sizing:border-box;position:relative;";
  script.insertAdjacentElement("afterend", host);

  const shadow = host.attachShadow({ mode: "open" });
  const styleEl = document.createElement("style");
  styleEl.textContent = embedCss;
  shadow.appendChild(styleEl);

  const rootEl = document.createElement("div");
  rootEl.className = "cityos-shadow-app dark";
  rootEl.style.cssText = "width:100%;min-width:0;box-sizing:border-box;";
  shadow.appendChild(rootEl);

  createRoot(rootEl).render(
    <StrictMode>
      <CityOsInlineRoot
        key={`${origin}|${domain}|${eventsLimit ?? ""}`}
        apiOrigin={origin}
        domain={domain}
        eventsLimit={eventsLimit}
      />
    </StrictMode>,
  );
}

mountCityOsFromScript();
