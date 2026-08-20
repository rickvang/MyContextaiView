"use client";

import type { Edge, Node } from "@xyflow/react";
import { ContractContent } from "@/components/flow/ContractContent";
import { contractUrlForPath } from "@/lib/contextai/contracts";
import { NODE_TYPE_LABELS, type FlowNodeType } from "@/lib/flow/schema";

type NodeInspectorProps = {
  selectedNode: Node | null;
  selectedEdge: Edge | null;
  onUpdateNode: (nodeId: string, patch: Record<string, string | undefined>) => void;
  onUpdateEdge: (edgeId: string, label: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onDeleteEdge: (edgeId: string) => void;
  onDuplicateNode: (nodeId: string) => void;
};

export function NodeInspector({
  selectedNode,
  selectedEdge,
  onUpdateNode,
  onUpdateEdge,
  onDeleteNode,
  onDeleteEdge,
  onDuplicateNode,
}: NodeInspectorProps) {
  if (!selectedNode && !selectedEdge) {
    return (
      <aside className="flex w-[22rem] shrink-0 flex-col border-l border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--accent)]">Inspector</div>
        <h2 className="mt-1 text-base font-semibold">Nothing selected</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Select a node or edge on the canvas to edit its properties.
        </p>
      </aside>
    );
  }

  if (selectedEdge) {
    return (
      <aside className="flex w-[22rem] shrink-0 flex-col border-l border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--accent)]">Inspector</div>
        <h2 className="mt-1 text-base font-semibold">Edge</h2>
        <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
          Label
          <input
            value={String(selectedEdge.label ?? "")}
            onChange={(event) => onUpdateEdge(selectedEdge.id, event.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
        </label>
        <button
          type="button"
          onClick={() => onDeleteEdge(selectedEdge.id)}
          className="mt-4 rounded-lg border border-[var(--red-soft)] bg-[var(--red-soft)] px-3 py-2 text-sm font-medium text-[var(--red)] hover:opacity-90"
        >
          Delete edge
        </button>
      </aside>
    );
  }

  if (!selectedNode) return null;

  const nodeType = (selectedNode.type ?? "note") as FlowNodeType;
  const contractPath = selectedNode.data.contractPath ? String(selectedNode.data.contractPath) : "";
  const contractUrl = selectedNode.data.contractUrl ? String(selectedNode.data.contractUrl) : "";
  const hasContract = Boolean(contractPath);

  return (
    <aside
      className={`flex h-full min-h-0 shrink-0 flex-col overflow-hidden border-l border-[var(--border)] bg-[var(--surface)] p-4 ${
        hasContract ? "w-[28rem]" : "w-[22rem]"
      }`}
    >
      <div className="shrink-0">
        <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--accent)]">Inspector</div>
        <h2 className="mt-1 text-base font-semibold">{NODE_TYPE_LABELS[nodeType]}</h2>
        <p className="mt-1 text-xs text-[var(--muted)]">Node id: {selectedNode.id}</p>

        <div className="mt-4 max-h-56 space-y-3 overflow-y-auto pr-1">
          <Field
            label="Label"
            value={String(selectedNode.data.label ?? "")}
            onChange={(value) => onUpdateNode(selectedNode.id, { label: value })}
          />
          <Field
            label="Description"
            value={String(selectedNode.data.description ?? "")}
            onChange={(value) => onUpdateNode(selectedNode.id, { description: value })}
          />
          <Field
            label="State"
            value={String(selectedNode.data.state ?? "")}
            onChange={(value) => onUpdateNode(selectedNode.id, { state: value })}
          />
          <Field
            label="Detail"
            value={String(selectedNode.data.detail ?? "")}
            multiline
            onChange={(value) => onUpdateNode(selectedNode.id, { detail: value })}
          />
        </div>
      </div>

      {hasContract ? (
        <ContractContent path={contractPath} url={contractUrl || contractUrlForPath(contractPath)} />
      ) : null}

      <div className="mt-4 shrink-0 space-y-2">
        <button
          type="button"
          onClick={() => onDuplicateNode(selectedNode.id)}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm hover:bg-[var(--surface-3)]"
        >
          Duplicate node
        </button>
        <button
          type="button"
          onClick={() => onDeleteNode(selectedNode.id)}
          className="w-full rounded-lg border border-[var(--red-soft)] bg-[var(--red-soft)] px-3 py-2 text-sm font-medium text-[var(--red)] hover:opacity-90"
        >
          Delete node
        </button>
      </div>
    </aside>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
      {label}
      {multiline ? (
        <textarea
          value={value}
          rows={3}
          onChange={(event) => onChange(event.target.value)}
          className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
        />
      )}
    </label>
  );
}
