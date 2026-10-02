# JustMy Client

Next.js web app for JustMy: public profiles (myCard), newsstands, Personal OS, Biz OS, admin, and embeddable AskSKY, myForm, and CityOS events widgets. It is a pnpm + Turborepo workspace. The site is `apps/web`. Shared controls and design tokens are `@workspace/ui`.

## Stack

- Node 20+ and pnpm 10.4.1 (`packageManager` in the root `package.json`)
- Next.js 16 (App Router) and React 19
- Tailwind CSS 4, tokens in `packages/ui/src/styles/globals.css`
- TanStack Query for server state, Zustand for client state
- Lexical for rich text

## Layout

```text
.
├── apps
│   └── web                         # Next.js app
└── packages
    ├── ui                          # Buttons, inputs, cards, globals.css
    ├── asksky-embed                # AskSKY widget
    ├── myform-embed                # myForm widget
    ├── cityos-events-embed         # CityOS events widget
    ├── eslint-config
    └── typescript-config
```

### `apps/web`

| Path | What lives here |
| --- | --- |
| `app/` | Routes. Product areas are folders: `biz-os`, `personal-os`, `admin`, `news`, `embed`, `try-free`, auth pages, and `[handle]` for public profiles. |
| `app/api/` | Route handlers that proxy the Nest API, revalidate caches, and serve embed and newsstand endpoints. |
| `components/` | UI grouped by product, matching `app/` (`biz-os`, `personal-os`, `city-os`, `lab`, `mycard`, `cms`, `news`, `forms`, `agents`, `admin`, `common`). |
| `components/ui/` | App-only widgets (`data-table`, `tag-input`). Shared controls come from `@workspace/ui`. |
| `lib/services/` | Typed clients for the Nest API (`auth`, `profiles`, `cms`, `agents`, `biz-os`, …). |
| `lib/api-client.ts` | `fetch` wrapper: attaches the access token and refreshes it on 401. |
| `lib/store/` | Zustand stores (profile editor, news nav, search, try-free). |
| `lib/config.ts` | `NEXT_PUBLIC_API_URL` / `API_URL` resolution. |
| `hooks/` | Small shared hooks. |
| `proxy.ts` | Next.js proxy: auth gates, newsstand host rewrites, embed passthrough. |
| `public/embed/` | Published embed script notes. |

Import controls from `@workspace/ui/components/*`. Color and focus rings come from the CSS variables in `packages/ui`, not from one-off palettes on a page.

## Prerequisites

- Node 20 or newer
- pnpm 10.4.1 (`corepack enable` then `corepack prepare pnpm@10.4.1 --activate`)
- The API running and reachable. It defaults to port `3000`, so run this app on another port.

## Setup

From this directory:

```bash
pnpm install
```

Create `apps/web/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
API_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

`API_URL` is the server-side base (Route Handlers and server components). `NEXT_PUBLIC_API_URL` is the browser base. `getApiBaseUrl()` in `lib/config.ts` picks between them.

Other variables the app reads when you need those features:

| Variable | Use |
| --- | --- |
| `NEXT_PUBLIC_NEWS_HOSTS` | Hostnames that render the newsstand chrome |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google sign-in |
| `NEXT_PUBLIC_APPLE_CLIENT_ID` | Apple sign-in |
| `NEXT_PUBLIC_APPLE_REDIRECT_URI` | Apple redirect override |
| `NEXT_PUBLIC_ASKSKY_EMBED_SCRIPT_VERSION` | Cache-bust the AskSKY embed snippet |
| `NEXT_PUBLIC_MYFORM_EMBED_SCRIPT_VERSION` | Cache-bust the myForm embed snippet |
| `ENABLE_MANUAL_REVALIDATE_ENDPOINT` | Set `true` to allow `POST /api/revalidate` |
| `REVALIDATE_SECRET` | Secret required by that endpoint |

Start the app on port 3001 so it does not take the API port:

```bash
pnpm --filter web exec next dev --turbopack -p 3001
```

`pnpm dev` from this directory runs Turbo and starts Next on port 3000. Use that only when the API is on a different port and `NEXT_PUBLIC_API_URL` matches it.

## Scripts

Root:

| Command | What it does |
| --- | --- |
| `pnpm dev` | Turbo `dev` |
| `pnpm build` | Production build |
| `pnpm lint` | Lint |
| `pnpm format` | Prettier |

Inside `apps/web` (`pnpm --filter web <script>`):

| Script | What it does |
| --- | --- |
| `dev` | `next dev --turbopack` |
| `build` | `next build` |
| `build:turbo` | `next build --turbopack` |
| `start` | `next start` |
| `lint` / `lint:fix` | `next lint` |
| `typecheck` | `tsc --noEmit` |

## How data moves

Browser components call functions in `lib/services`. Those functions use `apiRequest` from `lib/api-client.ts`, which sends `Authorization` and retries once after a refresh.

Mutations that must refresh public Next.js caches go through `app/api` route handlers (CMS pages and posts, profile updates). Those handlers call the Nest API and then `revalidateTag`. Tags in use:

- `cms-page:<handle>` and nested handle paths
- `cms-post:<slug>`
- `public-profile:<slug>`

Details: [`apps/web/lib/services/README.md`](apps/web/lib/services/README.md).

Zustand stores hold editor and newsstand UI state. TanStack Query holds fetched lists and records inside feature components. `QueryProvider` is mounted from `components/providers.tsx`.

## Embeds

AskSKY, myForm, and CityOS events are packages so the same UI can ship inside the app and as a script tag. Widget behavior and the public snippet are documented in [`apps/web/public/embed/README.md`](apps/web/public/embed/README.md).

`next.config.mjs` transpiles `@workspace/ui`, `@workspace/asksky-embed`, and `@workspace/myform-embed`.

## Adding a screen

1. Add a route under `apps/web/app/<area>/`.
2. Put the screen components in `apps/web/components/<area>/`, using the same area name as the route (`biz-os`, `personal-os`, `lab`, and so on).
3. Put Nest calls in `apps/web/lib/services/<area>.ts` and export them from `lib/services/index.ts`.
4. Use `@workspace/ui` for buttons, inputs, cards, and the rest of the shared set. Add a new shared control in `packages/ui` when more than one app surface needs it.
