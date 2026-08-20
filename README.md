# Agent Builder

Flowise-like visual builder aligned with ContextAi routing and workflow traces.

## Features

- Visual node canvas powered by React Flow
- ContextAi-aligned node types: Route, Operating Model, Skill, Workflow Step, Handoff, Note
- Node palette with ContextAi operating model and skill presets
- Save/load flows in browser localStorage
- Import/export portable flow JSON
- Import ContextAi workflow trace JSON with auto-layout
- Undo/redo, duplicate, auto-layout, keyboard shortcuts

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Verification

```bash
npm run build
node scripts/verify.mjs
```

## Keyboard shortcuts

- `Ctrl/Cmd+S` — save flow
- `Ctrl/Cmd+Z` — undo
- `Ctrl/Cmd+Shift+Z` or `Ctrl/Cmd+Y` — redo
- `Delete` / `Backspace` — delete selected node or edge

## ContextAi integration

- Import any `workflow-trace/records/*.json` file from a ContextAi checkout
- Use bundled example flow: `src/data/examples/contextai-route.flow.json`
- Palette presets from `src/data/contextai-catalog.json`

Imports create editable copies in Agent Builder. They do not modify ContextAi repository files.
