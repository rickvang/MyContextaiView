"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";

type BaseNodeData = {
  label: string;
  description?: string;
  state?: string;
  detail?: string;
  contractPath?: string;
  contractUrl?: string;
};

const stateColors: Record<string, string> = {
  completed: "var(--green)",
  used: "var(--cyan)",
  recorded: "var(--accent)",
  blocked: "var(--red)",
  unknown: "var(--amber)",
  decision: "var(--accent)",
  contract: "var(--violet)",
};

function ContractLink({ path, url }: { path: string; url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      className="mt-2 inline-flex max-w-full items-center gap-1 truncate text-[11px] font-medium text-[var(--accent)] hover:underline"
      title={path}
    >
      Open contract
    </a>
  );
}

function NodeShell({
  kind,
  accent,
  data,
  selected,
}: {
  kind: string;
  accent: string;
  data: BaseNodeData;
  selected?: boolean;
}) {
  const stateColor = data.state ? stateColors[data.state.toLowerCase()] ?? "var(--faint)" : "var(--faint)";

  return (
    <div
      className="min-w-[200px] max-w-[240px] rounded-xl border bg-[var(--surface)] shadow-lg"
      style={{
        borderColor: selected ? accent : "var(--border)",
        boxShadow: selected ? `0 0 0 1px ${accent}` : undefined,
        borderLeftWidth: 4,
        borderLeftColor: accent,
      }}
    >
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-[var(--border)] !bg-[var(--surface-3)]" />
      <div className="px-3 py-2.5">
        <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--muted)]">{kind}</div>
        <div className="text-sm font-semibold leading-tight text-[var(--text)]">{data.label}</div>
        {data.description ? (
          <div className="mt-1 text-xs text-[var(--muted)]">{data.description}</div>
        ) : null}
        {data.state ? (
          <div
            className="mt-2 inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]"
            style={{ background: "var(--surface-3)", color: stateColor }}
          >
            {data.state}
          </div>
        ) : null}
        {data.contractUrl && data.contractPath ? (
          <div>
            <ContractLink path={data.contractPath} url={data.contractUrl} />
          </div>
        ) : null}
      </div>
      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-[var(--border)] !bg-[var(--surface-3)]" />
    </div>
  );
}

export function RouteNode({ data, selected }: NodeProps) {
  return <NodeShell kind="Route" accent="var(--accent)" data={data as BaseNodeData} selected={selected} />;
}

export function OperatingModelNode({ data, selected }: NodeProps) {
  return <NodeShell kind="Operating Model" accent="var(--violet)" data={data as BaseNodeData} selected={selected} />;
}

export function SkillNode({ data, selected }: NodeProps) {
  return <NodeShell kind="Skill" accent="var(--cyan)" data={data as BaseNodeData} selected={selected} />;
}

export function WorkflowStepNode({ data, selected }: NodeProps) {
  return <NodeShell kind="Workflow Step" accent="var(--green)" data={data as BaseNodeData} selected={selected} />;
}

export function HandoffNode({ data, selected }: NodeProps) {
  return <NodeShell kind="Handoff" accent="var(--amber)" data={data as BaseNodeData} selected={selected} />;
}

export function NoteNode({ data, selected }: NodeProps) {
  const noteData = data as BaseNodeData;
  return (
    <div
      className="min-w-[180px] max-w-[220px] rounded-xl border border-dashed bg-[var(--surface-2)] px-3 py-2.5"
      style={{
        borderColor: selected ? "var(--accent)" : "var(--border)",
      }}
    >
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-[var(--border)] !bg-[var(--surface-3)]" />
      <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--faint)]">Note</div>
      <div className="mt-1 text-sm text-[var(--text)]">{String(noteData.label ?? "Note")}</div>
      {noteData.description ? <div className="mt-1 text-xs text-[var(--muted)]">{String(noteData.description)}</div> : null}
      {noteData.contractUrl && noteData.contractPath ? (
        <ContractLink path={noteData.contractPath} url={noteData.contractUrl} />
      ) : null}
      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-[var(--border)] !bg-[var(--surface-3)]" />
    </div>
  );
}

export const flowNodeTypes = {
  route: RouteNode,
  operatingModel: OperatingModelNode,
  skill: SkillNode,
  workflowStep: WorkflowStepNode,
  handoff: HandoffNode,
  note: NoteNode,
};
