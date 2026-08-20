import type { FlowDocument, FlowEdge, FlowNode, FlowNodeType } from "../flow/schema";
import { createEdgeId, createFlowId, createNode, touchFlow } from "../flow/schema";
import { autoLayoutFlow } from "./traceAdapter";
import workspaceFlowMermaid from "@/data/contextai-workspace-flow.mmd";

type MermaidNodeShape = "rectangle" | "diamond";

type ParsedMermaidNode = {
  id: string;
  label: string;
  shape: MermaidNodeShape;
};

type ParsedMermaidEdge = {
  source: string;
  target: string;
  label?: string;
};

const OPERATING_MODEL_IDS = new Set(["PM", "PJ", "SOL", "SEC", "MKT", "CO", "BU"]);
const SKILL_IDS = new Set(["IT", "PCI", "PR", "UX", "BE", "RC", "BH", "TR", "NR"]);
const HANDOFF_IDS = new Set(["STOP", "H", "BR", "U"]);
const ROUTE_IDS = new Set(["A", "DA", "ID", "IMP", "W", "R", "SRC"]);

function stripQuotes(value: string): string {
  return value.replace(/^["'`]+|["'`]+$/g, "").trim();
}

function classifyNode(id: string, label: string, shape: MermaidNodeShape): FlowNodeType {
  if (OPERATING_MODEL_IDS.has(id)) return "operatingModel";
  if (SKILL_IDS.has(id)) return "skill";
  if (HANDOFF_IDS.has(id)) return "handoff";
  if (ROUTE_IDS.has(id) || shape === "diamond") return "route";

  const normalized = label.toLowerCase();
  if (
    normalized.includes("product manager") ||
    normalized.includes("project manager") ||
    normalized.includes("solution architect") ||
    normalized.includes("security") ||
    normalized.includes("marketing") ||
    normalized.includes("conductor") ||
    normalized === "builder"
  ) {
    return "operatingModel";
  }
  if (
    normalized.includes("skill") ||
    normalized.includes("requirements check") ||
    normalized.includes("build-readiness") ||
    normalized.includes("issue triage") ||
    normalized.includes("project context intake") ||
    normalized.includes("prototype") ||
    normalized.includes("browser evidence") ||
    normalized.includes("ux/ui") ||
    normalized.includes("workflow trace")
  ) {
    return "skill";
  }
  if (
    normalized.includes("stop") ||
    normalized.includes("handoff") ||
    normalized.includes("unavailable") ||
    normalized.includes("deliver handoff")
  ) {
    return "handoff";
  }
  if (
    normalized.includes("answer") ||
    normalized.includes("ideas") ||
    normalized.includes("implementation request") ||
    normalized.includes("source analysis") ||
    normalized.includes("new user turn") ||
    normalized.includes("select the smallest")
  ) {
    return "route";
  }
  return "workflowStep";
}

function parseNodeToken(token: string): ParsedMermaidNode | null {
  const match = token.match(/^([A-Za-z0-9_]+)(?:(\["([^"]*)"\])|(\{"([^"]*)"\})|(\[([^\]]+)\])|(\{([^}]+)\}))?$/);
  if (!match) return null;

  const id = match[1];
  const diamond = Boolean(match[4] || match[8]);
  const label = stripQuotes(match[3] ?? match[5] ?? match[7] ?? match[9] ?? id);
  return {
    id,
    label,
    shape: diamond ? "diamond" : "rectangle",
  };
}

function ensureNode(
  nodes: Map<string, ParsedMermaidNode>,
  incoming: ParsedMermaidNode,
): void {
  const existing = nodes.get(incoming.id);
  if (!existing) {
    nodes.set(incoming.id, incoming);
    return;
  }
  if (incoming.label && (existing.label === existing.id || incoming.label.length >= existing.label.length)) {
    existing.label = incoming.label;
  }
  if (incoming.shape === "diamond") {
    existing.shape = "diamond";
  }
}

export function parseMermaidFlowchart(source: string): {
  nodes: ParsedMermaidNode[];
  edges: ParsedMermaidEdge[];
} {
  const nodes = new Map<string, ParsedMermaidNode>();
  const edges: ParsedMermaidEdge[] = [];

  const lines = source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("flowchart") && !line.startsWith("graph ") && !line.startsWith("%%"));

  for (const line of lines) {
    if (!line.includes("-->")) {
      const node = parseNodeToken(line);
      if (node) ensureNode(nodes, node);
      continue;
    }

    const edgeMatch = line.match(/^(.+?)\s*-->\s*(?:\|"([^"]*)"\|\s*)?(.+)$/);
    if (!edgeMatch) continue;

    const sourceNode = parseNodeToken(edgeMatch[1].trim());
    const targetNode = parseNodeToken(edgeMatch[3].trim());
    if (!sourceNode || !targetNode) continue;

    ensureNode(nodes, sourceNode);
    ensureNode(nodes, targetNode);
    edges.push({
      source: sourceNode.id,
      target: targetNode.id,
      label: edgeMatch[2] ? stripQuotes(edgeMatch[2]) : undefined,
    });
  }

  if (nodes.size === 0) {
    throw new Error("No mermaid flowchart nodes were found.");
  }

  return {
    nodes: [...nodes.values()],
    edges,
  };
}

export function mermaidToFlowDocument(
  source: string,
  options?: {
    name?: string;
    importedFrom?: string;
    rankdir?: "TB" | "LR";
  },
): FlowDocument {
  const parsed = parseMermaidFlowchart(source);
  const nodes: FlowNode[] = parsed.nodes.map((node) => {
    const type = classifyNode(node.id, node.label, node.shape);
    return createNode(type, { x: 0, y: 0 }, {
      label: node.label,
      description:
        node.shape === "diamond"
          ? "Decision"
          : type === "operatingModel"
            ? "Operating model route"
            : type === "skill"
              ? "Skill route"
              : type === "handoff"
                ? "Terminal or handoff"
                : "Workspace flow step",
      state: node.shape === "diamond" ? "decision" : "contract",
      detail: `ContextAi node id: ${node.id}`,
    });
  });

  const idMap = new Map<string, string>();
  parsed.nodes.forEach((parsedNode, index) => {
    idMap.set(parsedNode.id, nodes[index].id);
  });

  const edges: FlowEdge[] = parsed.edges.map((edge) => ({
    id: createEdgeId(edge.source, edge.target),
    source: idMap.get(edge.source) ?? edge.source,
    target: idMap.get(edge.target) ?? edge.target,
    label: edge.label,
  }));

  const layouted = autoLayoutFlow(nodes, edges, { rankdir: options?.rankdir ?? "TB" });

  return touchFlow({
    schemaVersion: 1,
    id: createFlowId(),
    name: options?.name ?? "ContextAi Workspace Flow",
    nodes: layouted.nodes,
    edges: layouted.edges,
    metadata: {
      source: "contextai-routing",
      importedFrom: options?.importedFrom ?? "CONTEXT.md#workspace-flow",
    },
  });
}

export function createContextAiRoutingFlow(): FlowDocument {
  return mermaidToFlowDocument(String(workspaceFlowMermaid), {
    name: "ContextAi Workspace Flow",
    importedFrom: "ContextAi/CONTEXT.md#workspace-flow",
    rankdir: "TB",
  });
}

export function importContextAiMermaid(source: string, importedFrom?: string): FlowDocument {
  return mermaidToFlowDocument(source, {
    name: "Imported ContextAi Routing Graph",
    importedFrom: importedFrom ?? "mermaid-import",
    rankdir: "TB",
  });
}
