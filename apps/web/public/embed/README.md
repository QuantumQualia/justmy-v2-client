# Embed assets

- **`asksky.js`** — Built by `pnpm --filter @workspace/asksky-embed build` (Vite IIFE + **`@tailwindcss/vite`** so Tailwind utilities compile into the inlined CSS string). Copied into this folder automatically. Mounts the widget in a **shadow root** and talks to **`/api/embed/sky/*`** on the script’s origin (CORS-enabled).

- **`myform.js`** — Built by `pnpm --filter @workspace/myform-embed build`. Same pattern: Vite IIFE, inlined CSS (Tailwind + AskSKY glass tokens). Mounts **inline** in a **shadow root** after the `<script>` tag (no iframe), loads schema from **`/api/embed/forms/:slug`**, and submits to **`/api/embed/forms/:slug/submit`**. Radix `Select` dropdowns portal into the shadow host so styles apply.

- **`cityos.js`** — Built by `pnpm --filter @workspace/cityos-events-embed build`. Vite IIFE, shadow root, inlined Tailwind + **Fonarto** (CDNFonts). Fetches **`/api/embed/cityos-events?domain=…`** on the script’s origin (CORS). Domain resolution: **`data-domain`** if set, else **`window.location`** hostname (embedding page), else **`document.referrer`**. **`data-events-limit`** (1–100, optional). Mounts after the `<script>` tag.

- **CityOS events (iframe)** — Next.js route **`/embed/cityos-events`**. Legacy full-page embed; same API semantics as the script. Optional **`?domain=`** if referrers are stripped.

## Manual checks

### AskSKY!

1. **Same host:** open `https://<your-site>/embed/partner-demo.html` after substituting slug and token in the HTML (or use the in-app “Script embed” snippet from AskSKY static embed).
2. **Cross-origin:** paste the script snippet on a page served from another domain; ensure CSP allows `script-src` and `connect-src` for your JustMy origin.
3. **Variants:** set `data-variant` to `inline`, `chatbot`, or `voice` (voice shows the placeholder card).
4. **Inline height:** wrap the `<script>` in a container with a defined height and column flex so the widget fills it; defaults: `min-height: 360px`, `max-height: 100dvh`. Override with `data-min-height="320px"` and/or `data-max-height="min(80dvh, 600px)"` (alphanumeric/CSS-unit characters only, max 80 chars each).
5. **Session:** confirm a conversation survives reload in the same tab (`sessionStorage`).

### CityOS events (script)

1. Same-origin: open `/embed/partner-demo.html` with `src` pointing at your dev origin; confirm the word cloud loads.
2. **`data-domain`:** use when the embedding hostname is not the market site (e.g. widget on a partner host while the market is **`marketsite.com`**), or for tests. Omit on a normal newsstand URL so **`window.location`** is used.
3. **Event count:** the API defaults to **30** events when `eventsLimit` is omitted (iframe query, CMS fetch, or script without `data-events-limit`). Override with **`data-events-limit`** (1–100) or CMS block limit.
4. **Cross-origin:** CSP must allow `script-src` and `connect-src` to your JustMy app origin.

### CityOS events (iframe)

1. Paste the iframe on a **non-production** newsstand URL and confirm events load (hostname should match what your Nest `Market.site` / mapping expects).
2. Optional override: `/embed/cityos-events?domain=justmymemphis.com&eventsLimit=40` when `Referer` is missing (e.g. strict Referrer-Policy or opening the URL in a new tab).
3. Confirm tags link out when `ticketUrl` is present.

### myFORM

1. **Same host / cross-origin:** same CSP ideas as AskSKY (`script-src` + `connect-src` to your app origin).
2. **Preview URL:** `/embed/myform?slug=…&source=embed` still opens the form in a full page (useful for testing); the **script embed** is the shadow-root inline widget.

Rebuild after UI or embed changes:

```bash
pnpm --filter @workspace/asksky-embed build
pnpm --filter @workspace/myform-embed build
pnpm --filter @workspace/cityos-events-embed build
```

Optional: set `NEXT_PUBLIC_ASKSKY_EMBED_SCRIPT_VERSION` / `NEXT_PUBLIC_MYFORM_EMBED_SCRIPT_VERSION` in the web app (for example a git SHA). The in-app script snippets append `?v=…` for cache busting; they default to `1` when unset.
