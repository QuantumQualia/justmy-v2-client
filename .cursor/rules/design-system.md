# 🎨 Design System Rules

## Tech Stack Context

* React / Next.js (App Router)
* Turborepo (monorepo)
* Tailwind CSS
* shadcn/ui
* Dark mode (class-based)

---

# 1. 🎯 Core Principles

* Consistency over creativity
* Reuse over duplication
* Composition over complexity
* Accessibility is required (not optional)
* Dark mode must be first-class (not patched later)

---

# 2. 🎨 Color System

## Base Rules

* Use ONLY Tailwind tokens or CSS variables
* Never hardcode hex values in components
* All colors must support light + dark mode

## Semantic Tokens

* primary
* secondary
* muted
* accent
* destructive
* border
* input
* ring
* background
* foreground

## Usage Rules

* Text:

  * text-foreground
  * text-muted-foreground

* Backgrounds:

  * bg-background
  * bg-muted
  * bg-accent

* Borders:

  * border-border

## Dark Mode

* Use `class` strategy
* All components must render correctly in both themes
* Avoid color overrides per component

---

# 3. ✍️ Typography

## Rules

* Use Tailwind typography scale only
* No custom font sizes unless defined globally

## Scale

* h1 → text-3xl font-bold
* h2 → text-2xl font-semibold
* h3 → text-xl font-semibold
* body → text-base
* small → text-sm text-muted-foreground

## Constraints

* Max 2 font weights per component
* Avoid excessive font size variation

---

# 4. 📏 Spacing System

## Rules

* Use Tailwind spacing scale only
* No arbitrary values like `mt-[13px]`

## Standard Spacing

* xs → 1 (4px)
* sm → 2 (8px)
* md → 4 (16px)
* lg → 6 (24px)
* xl → 8 (32px)

## Layout Rules

* Use `gap-*` instead of margins for layout
* Prefer `flex` or `grid` over manual spacing

---

# 5. 🔲 Border Radius System

## Core Pattern (MANDATORY)

We use a **signature asymmetric radius style**:

👉 `rounded-lg rounded-br-none`

Meaning:
- top-left → rounded
- top-right → rounded
- bottom-left → rounded
- bottom-right → NONE

This creates a distinctive “cut corner” design.

---

## Rules

- Default radius for components:
  - `rounded-lg rounded-br-none`

- This applies to:
  - Cards
  - Buttons (primary/secondary)
  - Inputs
  - Modals
  - Dropdowns
  - Containers

---

## Variants

### Small components
```tsx
rounded-md rounded-br-none

---

# 6. 🧩 Component System (shadcn/ui)

## Rules

* Always use shadcn/ui components when available
* Do NOT rebuild existing primitives (Button, Input, Dialog, etc.)
* Extend via composition, not modification

## Pattern

* Wrap shadcn components in app-level components if customization is needed

Example:

```tsx
export function PrimaryButton(props) {
  return <Button className="w-full" {...props} />
}
```

## Variants

* Use `variant` and `size` props
* Do not create duplicate components for styling differences

---

# 7. 🌗 Dark Mode Rules

## Requirements

* Every component must support dark mode by default
* No light-only components

## Implementation

* Use Tailwind `dark:` modifier
* Prefer semantic tokens instead of manual colors

Example:

```tsx
className="bg-background text-foreground"
```

---

# 8. 📦 Layout & Containers

## Rules

* Use consistent container widths
* Avoid custom max-width per page

## Standard

* container mx-auto px-4
* max-w-7xl for main layouts

## Structure

* Page

  * Section

    * Card

      * Content

---

# 9. 🧱 Forms & Inputs

## Rules

* Always use shadcn Form components
* Labels are required
* Errors must be visible and styled consistently

## Validation

* Show inline error messages
* Use consistent error color (destructive)

---

# 10. 🔘 Buttons

## Rules

* Use Button from shadcn/ui
* Max 2 primary buttons per view

## Variants

* primary (default)
* secondary
* ghost
* destructive

## Constraints

* Avoid mixing too many button styles in one section

---

# 11. 📊 Data Display

## Rules

* Use tables or cards consistently
* Do not mix patterns randomly

## Loading States

* Use skeleton loaders
* Avoid spinners for content-heavy sections

---

# 12. 🧭 Navigation

## Rules

* Keep navigation shallow
* Use consistent active states

## Patterns

* Sidebar (dashboard)
* Topbar (marketing)

---

# 13. ♻️ Reusability

## Rules

* If reused 2+ times → extract component
* Shared components go into `packages/ui`

## Turborepo Structure

* apps/
* packages/ui
* packages/typescript-config
* packages/eslint-config

---

# 14. 🚫 Anti-Patterns (DO NOT DO)

* ❌ Hardcoded colors (#fff, #000)
* ❌ Inline styles
* ❌ Arbitrary spacing values
* ❌ Rebuilding shadcn components
* ❌ Ignoring dark mode

---

# 15. ✅ Definition of Done (UI)

A component is complete only if:

* Works in light + dark mode
* Uses design tokens only
* Follows spacing + typography rules
* Is reusable
* Uses shadcn primitives
* Is accessible (labels, focus states)

---

# 16. 🔥 Optional Enhancements

* Use `clsx` or `cn()` utility for class merging
* Use `cva` (class-variance-authority) for variants
* Add animation via `framer-motion` (subtle only)

---

# 17. 🔄 TanStack Query Usage

## Rules

* Use TanStack Query for all server state (API data)
* Do not use `useEffect` + `fetch` in components for server data
* Keep local UI state in React state; keep remote state in Query cache
* Query hooks should live in feature-level hooks/modules, not inline in page JSX

## Query Keys

* Use stable, array-based keys only
* Format: `['resource', id, { filters }]`
* Centralize key builders per feature to avoid mismatches

Example:

```tsx
const mycardKeys = {
  all: ['mycard'] as const,
  detail: (id: string) => ['mycard', id] as const,
  posts: (id: string, filter: string) => ['mycard', id, { filter }] as const,
}
```

## Fetching

* Always set `queryKey` and `queryFn`
* Use `enabled` for dependent queries
* Use `select` to shape API data for the UI instead of transforming repeatedly in components
* Prefer sensible `staleTime` to reduce unnecessary refetching

## Mutations

* Use `useMutation` for writes only
* On success, invalidate related query keys with `queryClient.invalidateQueries`
* Use optimistic updates only when rollback behavior is defined

## UX States

* Show skeletons for initial loading and subtle pending states for background refetch
* Always handle empty and error states consistently
* Surface retry actions for recoverable failures

## Constraints

* Do not call APIs directly from presentational components when a query hook exists
* Do not duplicate the same query in multiple components with different keys for the same data
* Do not store Query results in additional global stores unless strictly necessary

---

# FINAL RULE

If a design decision is unclear:

👉 Follow existing components in the codebase
👉 Do NOT invent new patterns
