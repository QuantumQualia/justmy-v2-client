# AskSKY! embed assets

- **`asksky.js`** — Built by `pnpm --filter @workspace/asksky-embed build` (Vite IIFE + **`@tailwindcss/vite`** so Tailwind utilities compile into the inlined CSS string). Copied into this folder automatically. Mounts the widget in a **shadow root** and talks to **`/api/embed/sky/*`** on the script’s origin (CORS-enabled).

## Manual checks

1. **Same host:** open `https://<your-site>/embed/partner-demo.html` after substituting slug and token in the HTML (or use the in-app “Script embed” snippet from AskSKY static embed).
2. **Cross-origin:** paste the script snippet on a page served from another domain; ensure CSP allows `script-src` and `connect-src` for your JustMy origin.
3. **Variants:** set `data-variant` to `inline`, `chatbot`, or `voice` (voice shows the placeholder card).
4. **Inline height:** wrap the `<script>` in a container with a defined height and column flex so the widget fills it; messages scroll inside. Defaults: `min-height: 360px`, `max-height: 100dvh`. Override with `data-min-height="320px"` and/or `data-max-height="min(80dvh, 600px)"` (alphanumeric/CSS-unit characters only, max 80 chars each).
5. **Session:** confirm a conversation survives reload in the same tab (`sessionStorage`).

Rebuild after UI changes:

```bash
pnpm --filter @workspace/asksky-embed build
```

Optional: set `NEXT_PUBLIC_ASKSKY_EMBED_SCRIPT_VERSION` in the web app (for example a git SHA or release number). The in-app script embed snippet appends `?v=…` to `asksky.js` for cache busting; it defaults to `1` when unset.
