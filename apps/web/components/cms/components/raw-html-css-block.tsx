"use client";

import { useEffect, useMemo, useRef } from "react";
import { prepareRawHtml } from "@/lib/legacy-html";

interface RawHtmlCssBlockProps {
  html?: string;
  customCss?: string;
}

/** CSS fields sometimes store a full `<style>` element. Inject only the rules. */
function cssRules(value: string): string {
  const trimmed = value.trim();
  const wrapped = trimmed.match(/^<style\b[^>]*>([\s\S]*)<\/style>$/i);
  return (wrapped?.[1] ?? trimmed).replace(/<\/style/gi, "").trim();
}

/**
 * Renders trusted author HTML and optional CSS.
 * First-party scripts are mounted as real script nodes. innerHTML does not run them.
 */
export function RawHtmlCssBlock({ html = "", customCss = "" }: RawHtmlCssBlockProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const htmlStr = typeof html === "string" ? html : "";
  const prepared = useMemo(() => prepareRawHtml(htmlStr), [htmlStr]);
  const cssStr = [prepared.css, typeof customCss === "string" ? cssRules(customCss) : ""]
    .map((part) => part.trim())
    .filter(Boolean)
    .join("\n");

  useEffect(() => {
    const root = rootRef.current;
    if (!root || prepared.scripts.length === 0) return;
    const nodes: HTMLScriptElement[] = [];
    let cancelled = false;

    const mount = (index: number) => {
      if (cancelled || index >= prepared.scripts.length) return;
      const spec = prepared.scripts[index];
      const slot = root.querySelector<HTMLElement>(`[data-raw-script="${index}"]`);
      if (!spec || !slot) {
        mount(index + 1);
        return;
      }
      const script = document.createElement("script");
      script.src = spec.src;
      script.async = false;
      for (const [name, value] of Object.entries(spec.data)) script.setAttribute(name, value);
      nodes.push(script);
      const done = () => {
        script.removeEventListener("load", done);
        script.removeEventListener("error", done);
        mount(index + 1);
      };
      script.addEventListener("load", done);
      script.addEventListener("error", done);
      slot.insertAdjacentElement("afterend", script);
    };

    mount(0);
    return () => {
      cancelled = true;
      for (const node of nodes) node.remove();
    };
  }, [prepared]);

  if (!prepared.html.trim() && !cssStr.trim() && prepared.scripts.length === 0) {
    return null;
  }

  return (
    <div ref={rootRef} className="cms-raw-html-css-block w-full">
      {cssStr.trim() ? (
        <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: cssStr }} />
      ) : null}
      {prepared.html.trim() ? (
        <div className="raw-html-root" dangerouslySetInnerHTML={{ __html: prepared.html }} />
      ) : null}
    </div>
  );
}
