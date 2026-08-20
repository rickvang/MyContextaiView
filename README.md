# Agent Builder

Flowise-like visual builder aligned with ContextAi routing and workflow traces.

## Features

- Visual node canvas powered by React Flow
- ContextAi-aligned node types: Route, Operating Model, Skill, Workflow Step, Handoff, Note
- **Open Routing Graph** from the bundled `CONTEXT.md` workspace flow
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

## ContextAi views

1. **Routing graph** — living operating model from `CONTEXT.md` (AGENTS → IDENTITY → CONTEXT → routes → specialists → handoffs)
2. **Trace import** — what a completed turn actually used (`workflow-trace/records/*.json`)
3. **Manual canvas** — blank or edited graphs saved locally

## Verification

```bash
npm run build
npm run verify
```

## Keyboard shortcuts

- `Ctrl/Cmd+S` — save flow
- `Ctrl/Cmd+Z` — undo
- `Ctrl/Cmd+Shift+Z` or `Ctrl/Cmd+Y` — redo
- `Delete` / `Backspace` — delete selected node or edge

Imports create editable copies in Agent Builder. They do not modify ContextAi repository files.
