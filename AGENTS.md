# Agent Builder

Flowise-like visual node/flow builder built with Next.js 15 (App Router) + React 19, TypeScript, and Tailwind CSS v4. It is a **static-export, client-only** app (no backend/server, no database). Flows persist to browser `localStorage`.

## Cursor Cloud specific instructions

Single service: the Next.js app. Standard commands live in `package.json` and `README.md`; use those. Node 20+ works (CI uses Node 20; this VM uses Node 22). No environment variables or secrets are required for local development.

- Dev server: `npm run dev` (serves http://localhost:3000). Core functionality — creating flows, opening the routing graph, adding nodes from the palette — runs entirely client-side and autosaves to `localStorage`.
- Lint: `npm run lint` (uses the deprecated `next lint`; a deprecation notice is expected and harmless).
- Build: `npm run build` produces a static export in `out/` (`next.config.ts` sets `output: "export"`). Setting `GITHUB_PAGES=true` rewrites `basePath`/`assetPrefix` to `/MyContextaiView` for GitHub Pages; leave it unset for local work so assets resolve at the root.
- `npm run verify` (`scripts/verify.mjs`) is only PARTIALLY runnable here. It passes 8 checks but the `ContextAi trace example shape` check reads a **sibling repo** at `../ContextAi/workflow-trace/examples/contextai-route.json`, which is not present in this standalone checkout, so the script exits non-zero with `ENOENT`. This is expected — it is not an environment/setup failure. To run the full `verify` suite you would need the `ContextAi` repo checked out as a sibling directory next to this one.
