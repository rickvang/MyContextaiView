"use client";

import { useMemo, useState } from "react";
import { getCatalogGroups, type CatalogEntry } from "@/lib/contextai/catalog";
import { NODE_TYPE_LABELS, type FlowNodeType } from "@/lib/flow/schema";

type NodePaletteProps = {
  onAddNode: (type: FlowNodeType, preset?: Partial<CatalogEntry>) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
};

export function NodePalette({ onAddNode, collapsed, onToggleCollapse }: NodePaletteProps) {
  const [query, setQuery] = useState("");
  const groups = useMemo(() => getCatalogGroups(), []);

  const filteredGroups = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return groups;
    return groups
      .map((group) => ({
        ...group,
        entries: group.entries.filter((entry) =>
          `${entry.label} ${entry.description ?? ""} ${entry.type}`.toLowerCase().includes(normalized),
        ),
      }))
      .filter((group) => group.entries.length > 0);
  }, [groups, query]);

  if (collapsed) {
    return (
      <aside className="flex w-12 shrink-0 flex-col items-center border-r border-[var(--border)] bg-[var(--surface)] py-3">
        <button
          type="button"
          className="rounded-md border border-[var(--border)] px-2 py-1 text-xs text-[var(--muted)] hover:bg-[var(--surface-2)]"
          onClick={onToggleCollapse}
          title="Expand palette"
        >
          »
        </button>
      </aside>
    );
  }

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)]">
      <div className="border-b border-[var(--border)] p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--accent)]">Palette</div>
            <h2 className="text-base font-semibold">Node Library</h2>
          </div>
          {onToggleCollapse ? (
            <button
              type="button"
              className="rounded-md border border-[var(--border)] px-2 py-1 text-xs text-[var(--muted)] hover:bg-[var(--surface-2)]"
              onClick={onToggleCollapse}
              title="Collapse palette"
            >
              «
            </button>
          ) : null}
        </div>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search nodes..."
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {filteredGroups.map((group) => (
          <section key={group.id} className="mb-4">
            <h3 className="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--muted)]">
              {group.title}
            </h3>
            <div className="space-y-2">
              {group.entries.map((entry) => (
                <button
                  key={`${group.id}-${entry.type}-${entry.label}`}
                  type="button"
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData(
                      "application/agent-builder-node",
                      JSON.stringify(entry),
                    );
                    event.dataTransfer.effectAllowed = "move";
                  }}
                  onClick={() => onAddNode(entry.type, entry)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-left transition hover:border-[var(--accent)] hover:bg-[var(--surface-3)]"
                >
                  <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--faint)]">
                    {NODE_TYPE_LABELS[entry.type]}
                  </div>
                  <div className="text-sm font-medium">{entry.label}</div>
                  {entry.description ? (
                    <div className="mt-1 text-xs text-[var(--muted)]">{entry.description}</div>
                  ) : null}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </aside>
  );
}
