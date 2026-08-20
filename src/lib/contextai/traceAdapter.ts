import dagre from "dagre";
import type { FlowDocument, FlowEdge, FlowNode } from "../flow/schema";
import { createEdgeId, createFlowId, createNode, touchFlow } from "../flow/schema";

export type ContextAiTraceItem = {
  name?: string;
  state?: string;
  detail?: string | null;
};

export type ContextAiTraceRecord = {
  schema_version?: number;
  record_id?: string;
  route?: string;
  summary?: string;
  selection_basis?: string;
  workflow_steps?: ContextAiTraceItem[];
  operating_models?: ContextAiTraceItem[];
  skills?: ContextAiTraceItem[];
  next_handoff?: string | null;
  blocker?: string | null;
};

const NODE_WIDTH = 220;
const NODE_HEIGHT = 88;

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function validateContextAiTrace(value: unknown): ContextAiTraceRecord {
  if (!value || typeof value !== "object") {
    throw new Error("ContextAi trace must be an object.");
  }

  const record = value as ContextAiTraceRecord;

  if (!text(record.route) && !Array.isArray(record.workflow_steps)) {
    throw new Error("ContextAi trace must include route or workflow_steps.");
  }

  return record;
}

function makeEdge(source: string, target: string, label?: string): FlowEdge {
  return {
    id: createEdgeId(source, target),
    source,
    target,
    label,
  };
}

export function traceToFlowDocument(
  trace: ContextAiTraceRecord,
  importedFrom?: string,
  name?: string,
): FlowDocument {
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];

  const routeNode = createNode("route", { x: 0, y: 0 }, {
    label: text(trace.route, "Unknown route"),
    description: "Selected route",
    state: trace.blocker ? "blocked" : "recorded",
    detail: trace.selection_basis ? `Selection basis: ${trace.selection_basis}` : undefined,
  });
  nodes.push(routeNode);

  let previousId = routeNode.id;

  const operatingModels = Array.isArray(trace.operating_models) ? trace.operating_models : [];
  for (const item of operatingModels) {
    const node = createNode("operatingModel", { x: 0, y: 0 }, {
      label: text(item.name, "Operating model"),
      state: text(item.state, "recorded"),
      detail: text(item.detail ?? undefined),
    });
    nodes.push(node);
    edges.push(makeEdge(previousId, node.id, "model"));
    previousId = node.id;
  }

  const skills = Array.isArray(trace.skills) ? trace.skills : [];
  for (const item of skills) {
    const node = createNode("skill", { x: 0, y: 0 }, {
      label: text(item.name, "Skill"),
      state: text(item.state, "recorded"),
      detail: text(item.detail ?? undefined),
    });
    nodes.push(node);
    edges.push(makeEdge(previousId, node.id, "skill"));
    previousId = node.id;
  }

  const workflowSteps = Array.isArray(trace.workflow_steps) ? trace.workflow_steps : [];
  for (const [index, item] of workflowSteps.entries()) {
    const node = createNode("workflowStep", { x: 0, y: 0 }, {
      label: text(item.name, `Step ${index + 1}`),
      state: text(item.state, "recorded"),
      detail: text(item.detail ?? undefined),
    });
    nodes.push(node);
    edges.push(makeEdge(previousId, node.id, index === 0 ? "workflow" : "next"));
    previousId = node.id;
  }

  const handoffNode = createNode("handoff", { x: 0, y: 0 }, {
    label: text(trace.next_handoff, trace.blocker ? "Blocked" : "No handoff recorded"),
    description: "Next handoff",
    state: trace.blocker ? "blocked" : "recorded",
    detail: trace.summary ? `Summary: ${trace.summary}` : undefined,
  });
  nodes.push(handoffNode);
  edges.push(makeEdge(previousId, handoffNode.id, "handoff"));

  const layouted = autoLayoutFlow(nodes, edges);

  return touchFlow({
    schemaVersion: 1,
    id: createFlowId(),
    name:
      name ??
      (trace.record_id
        ? `Trace: ${trace.record_id}`
        : trace.route
          ? `Trace: ${trace.route}`
          : "Imported ContextAi Trace"),
    nodes: layouted.nodes,
    edges: layouted.edges,
    metadata: {
      source: "contextai-trace",
      importedFrom,
    },
  });
}

export function importContextAiTraceJson(raw: string, importedFrom?: string): FlowDocument {
  const parsed = validateContextAiTrace(JSON.parse(raw));
  return traceToFlowDocument(parsed, importedFrom);
}

export function autoLayoutFlow(
  nodes: FlowNode[],
  edges: FlowEdge[],
): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({ rankdir: "LR", nodesep: 70, ranksep: 90, marginx: 40, marginy: 40 });

  for (const node of nodes) {
    graph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }

  for (const edge of edges) {
    graph.setEdge(edge.source, edge.target);
  }

  dagre.layout(graph);

  const layoutedNodes = nodes.map((node) => {
    const layout = graph.node(node.id);
    return {
      ...node,
      position: {
        x: layout.x - NODE_WIDTH / 2,
        y: layout.y - NODE_HEIGHT / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

export function relayoutFlowDocument(flow: FlowDocument): FlowDocument {
  const layouted = autoLayoutFlow(flow.nodes, flow.edges);
  return touchFlow({
    ...flow,
    nodes: layouted.nodes,
    edges: layouted.edges,
  });
}
