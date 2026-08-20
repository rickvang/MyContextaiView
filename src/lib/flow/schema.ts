export const FLOW_SCHEMA_VERSION = 1 as const;

export type FlowNodeType =
  | "route"
  | "operatingModel"
  | "skill"
  | "workflowStep"
  | "handoff"
  | "note";

export type FlowMetadata = {
  source?: "manual" | "contextai-trace";
  importedFrom?: string;
  updatedAt?: string;
};

export type FlowNodeData = {
  label: string;
  description?: string;
  state?: string;
  detail?: string;
};

export type FlowNode = {
  id: string;
  type: FlowNodeType;
  position: { x: number; y: number };
  data: FlowNodeData;
};

export type FlowEdge = {
  id: string;
  source: string;
  target: string;
  label?: string;
};

export type FlowDocument = {
  schemaVersion: typeof FLOW_SCHEMA_VERSION;
  id: string;
  name: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  metadata?: FlowMetadata;
};

export type FlowSummary = {
  id: string;
  name: string;
  updatedAt?: string;
  nodeCount: number;
  source?: FlowMetadata["source"];
};

export const NODE_TYPE_LABELS: Record<FlowNodeType, string> = {
  route: "Route",
  operatingModel: "Operating Model",
  skill: "Skill",
  workflowStep: "Workflow Step",
  handoff: "Handoff",
  note: "Note",
};

export const DEFAULT_NODE_DATA: Record<FlowNodeType, FlowNodeData> = {
  route: { label: "New Route", description: "Selected routing decision" },
  operatingModel: { label: "Operating Model", description: "Named operating model" },
  skill: { label: "Skill", description: "Named skill" },
  workflowStep: { label: "Workflow Step", description: "Observable workflow step" },
  handoff: { label: "Next Handoff", description: "Recorded next action" },
  note: { label: "Note", description: "Freeform annotation" },
};

export function createFlowId(): string {
  return `flow-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createNodeId(type: FlowNodeType): string {
  return `${type}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function createEdgeId(source: string, target: string): string {
  return `edge-${source}-${target}-${Math.random().toString(36).slice(2, 6)}`;
}

export function createBlankFlow(name = "Untitled Flow"): FlowDocument {
  const now = new Date().toISOString();
  return {
    schemaVersion: FLOW_SCHEMA_VERSION,
    id: createFlowId(),
    name,
    nodes: [],
    edges: [],
    metadata: {
      source: "manual",
      updatedAt: now,
    },
  };
}

export function cloneFlowDocument(flow: FlowDocument, name?: string): FlowDocument {
  const now = new Date().toISOString();
  return {
    ...flow,
    id: createFlowId(),
    name: name ?? `${flow.name} (copy)`,
    metadata: {
      ...flow.metadata,
      updatedAt: now,
    },
  };
}

export function validateFlowDocument(value: unknown): FlowDocument {
  if (!value || typeof value !== "object") {
    throw new Error("Flow document must be an object.");
  }

  const doc = value as Partial<FlowDocument>;

  if (doc.schemaVersion !== FLOW_SCHEMA_VERSION) {
    throw new Error(`Unsupported schema version: ${String(doc.schemaVersion)}`);
  }

  if (!doc.id || typeof doc.id !== "string") {
    throw new Error("Flow document requires an id.");
  }

  if (!doc.name || typeof doc.name !== "string") {
    throw new Error("Flow document requires a name.");
  }

  if (!Array.isArray(doc.nodes) || !Array.isArray(doc.edges)) {
    throw new Error("Flow document requires nodes and edges arrays.");
  }

  for (const node of doc.nodes) {
    if (!node.id || !node.type || !node.position || !node.data?.label) {
      throw new Error("Each node requires id, type, position, and data.label.");
    }
  }

  for (const edge of doc.edges) {
    if (!edge.id || !edge.source || !edge.target) {
      throw new Error("Each edge requires id, source, and target.");
    }
  }

  return doc as FlowDocument;
}

export function toFlowSummary(flow: FlowDocument): FlowSummary {
  return {
    id: flow.id,
    name: flow.name,
    updatedAt: flow.metadata?.updatedAt,
    nodeCount: flow.nodes.length,
    source: flow.metadata?.source,
  };
}

export function touchFlow(flow: FlowDocument): FlowDocument {
  return {
    ...flow,
    metadata: {
      ...flow.metadata,
      updatedAt: new Date().toISOString(),
    },
  };
}

export function createNode(
  type: FlowNodeType,
  position: { x: number; y: number },
  overrides?: Partial<FlowNodeData>,
): FlowNode {
  return {
    id: createNodeId(type),
    type,
    position,
    data: {
      ...DEFAULT_NODE_DATA[type],
      ...overrides,
    },
  };
}
