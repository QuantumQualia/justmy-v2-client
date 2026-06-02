# Embed assets

- **`asksky.js`** — Built by `pnpm --filter @workspace/asksky-embed build` (Vite IIFE + **`@tailwindcss/vite`** so Tailwind utilities compile into the inlined CSS string). Copied into this folder automatically. Mounts the widget in a **shadow root** and talks to **`/api/embed/sky/*`** on the script’s origin (CORS-enabled).

- **`myform.js`** — Built by `pnpm --filter @workspace/myform-embed build`. Same pattern: Vite IIFE, inlined CSS (Tailwind + AskSKY glass tokens). Mounts **inline** in a **shadow root** after the `<script>` tag (no iframe), loads schema from **`/api/embed/forms/:slug`**, and submits to **`/api/embed/forms/:slug/submit`**. Radix `Select` dropdowns portal into the shadow host so styles apply.

## Manual checks

### AskSKY!

1. **Same host:** open `https://<your-site>/embed/partner-demo.html` after substituting slug and token in the HTML (or use the in-app “Script embed” snippet from AskSKY static embed).
2. **Cross-origin:** paste the script snippet on a page served from another domain; ensure CSP allows `script-src` and `connect-src` for your JustMy origin.
3. **Variants:** set `data-variant` to `inline`, `chatbot`, or `voice` (voice shows the placeholder card).
4. **Inline height:** wrap the `<script>` in a container with a defined height and column flex so the widget fills it; messages scroll inside. Defaults: `min-height: 360px`, `max-height: 100dvh`. Override with `data-min-height="320px"` and/or `data-max-height="min(80dvh, 600px)"` (alphanumeric/CSS-unit characters only, max 80 chars each).
5. **Session:** confirm a conversation survives reload in the same tab (`sessionStorage`).

### myFORM

1. **Same host / cross-origin:** same CSP ideas as AskSKY (`script-src` + `connect-src` to your app origin).
2. **Preview URL:** `/embed/myform?slug=…&source=embed` still opens the form in a full page (useful for testing); the **script embed** is the shadow-root inline widget.

Rebuild after UI or embed changes:

```bash
pnpm --filter @workspace/asksky-embed build
pnpm --filter @workspace/myform-embed build
```

Optional: set `NEXT_PUBLIC_ASKSKY_EMBED_SCRIPT_VERSION` / `NEXT_PUBLIC_MYFORM_EMBED_SCRIPT_VERSION` in the web app (for example a git SHA). The in-app script snippets append `?v=…` for cache busting; they default to `1` when unset.
