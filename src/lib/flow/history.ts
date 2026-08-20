import type { Edge, Node } from "@xyflow/react";
import type { FlowDocument, FlowEdge, FlowNode, FlowNodeType } from "./schema";

export type HistorySnapshot = {
  nodes: FlowNode[];
  edges: FlowEdge[];
};

const MAX_HISTORY = 50;

export class FlowHistory {
  private past: HistorySnapshot[] = [];
  private future: HistorySnapshot[] = [];

  push(snapshot: HistorySnapshot): void {
    this.past.push(cloneSnapshot(snapshot));
    if (this.past.length > MAX_HISTORY) {
      this.past.shift();
    }
    this.future = [];
  }

  undo(current: HistorySnapshot): HistorySnapshot | null {
    if (this.past.length === 0) return null;
    this.future.push(cloneSnapshot(current));
    return this.past.pop() ?? null;
  }

  redo(current: HistorySnapshot): HistorySnapshot | null {
    if (this.future.length === 0) return null;
    this.past.push(cloneSnapshot(current));
    return this.future.pop() ?? null;
  }

  canUndo(): boolean {
    return this.past.length > 0;
  }

  canRedo(): boolean {
    return this.future.length > 0;
  }

  clear(): void {
    this.past = [];
    this.future = [];
  }
}

function cloneSnapshot(snapshot: HistorySnapshot): HistorySnapshot {
  return {
    nodes: snapshot.nodes.map((node) => ({
      ...node,
      position: { ...node.position },
      data: { ...node.data },
    })),
    edges: snapshot.edges.map((edge) => ({ ...edge })),
  };
}

export function toReactFlowNodes(nodes: FlowNode[]): Node[] {
  return nodes.map((node) => ({
    id: node.id,
    type: node.type,
    position: node.position,
    data: node.data,
  }));
}

export function toReactFlowEdges(edges: FlowEdge[]): Edge[] {
  return edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    animated: true,
    style: { stroke: "#8ba7ff" },
    labelStyle: { fill: "#a7b4cb", fontSize: 10 },
  }));
}

export function fromReactFlowNodes(nodes: Node[]): FlowNode[] {
  return nodes.map((node) => ({
    id: node.id,
    type: (node.type ?? "note") as FlowNodeType,
    position: node.position,
    data: {
      label: String(node.data.label ?? "Untitled"),
      description: node.data.description ? String(node.data.description) : undefined,
      state: node.data.state ? String(node.data.state) : undefined,
      detail: node.data.detail ? String(node.data.detail) : undefined,
      contractPath: node.data.contractPath ? String(node.data.contractPath) : undefined,
      contractUrl: node.data.contractUrl ? String(node.data.contractUrl) : undefined,
    },
  }));
}

export function fromReactFlowEdges(edges: Edge[]): FlowEdge[] {
  return edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label ? String(edge.label) : undefined,
  }));
}

export function snapshotFromFlow(flow: FlowDocument): HistorySnapshot {
  return cloneSnapshot({ nodes: flow.nodes, edges: flow.edges });
}

export function applySnapshot(flow: FlowDocument, snapshot: HistorySnapshot): FlowDocument {
  return {
    ...flow,
    nodes: cloneSnapshot(snapshot).nodes,
    edges: cloneSnapshot(snapshot).edges,
  };
}

export function duplicateSelectedNode(
  nodes: FlowNode[],
  edges: FlowEdge[],
  nodeId: string,
): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const source = nodes.find((node) => node.id === nodeId);
  if (!source) return { nodes, edges };

  const copy: FlowNode = {
    ...source,
    id: `${source.type}-${Date.now().toString(36)}-copy`,
    position: {
      x: source.position.x + 40,
      y: source.position.y + 40,
    },
    data: { ...source.data, label: `${source.data.label} (copy)` },
  };

  return {
    nodes: [...nodes, copy],
    edges,
  };
}
