import embedCss from "./embed.css?inline";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SelectPortalContainerContext } from "@workspace/ui/components/select";
import { MyFormInlineRoot } from "./myform-inline-root";

function getScriptEl(): HTMLScriptElement | null {
  const cur = document.currentScript;
  if (cur instanceof HTMLScriptElement) {
    return cur;
  }
  const list = document.querySelectorAll("script[src*='myform.js']");
  const last = list[list.length - 1];
  return last instanceof HTMLScriptElement ? last : null;
}

function mountMyFormFromScript(): void {
  const script = getScriptEl();
  if (!script?.src) {
    return;
  }
  const origin = new URL(script.src).origin;
  const slug = script.dataset.formSlug?.trim() ?? "";
  if (!slug) {
    console.warn("[myform.js] Missing data-form-slug on script tag.");
    return;
  }

  const host = document.createElement("div");
  host.id = "myform-embed-host";
  host.style.cssText =
    "display:block;width:100%;max-width:32rem;min-width:0;box-sizing:border-box;position:relative;";
  script.insertAdjacentElement("afterend", host);

  const shadow = host.attachShadow({ mode: "open" });
  const styleEl = document.createElement("style");
  styleEl.textContent = embedCss;
  shadow.appendChild(styleEl);

  const rootEl = document.createElement("div");
  rootEl.className = "myform-shadow-app dark";
  rootEl.style.cssText = "width:100%;min-width:0;box-sizing:border-box;";
  shadow.appendChild(rootEl);

  createRoot(rootEl).render(
    <StrictMode>
      <SelectPortalContainerContext.Provider value={rootEl}>
        <MyFormInlineRoot apiOrigin={origin} slug={slug} />
      </SelectPortalContainerContext.Provider>
    </StrictMode>,
  );
}

mountMyFormFromScript();
