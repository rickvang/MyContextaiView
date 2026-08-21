import perspectives from "@/data/operating-model-perspectives.json";
import { contractUrlForPath, resolveContract } from "./contracts";
import { autoLayoutFlow } from "./traceAdapter";
import {
  createEdgeId,
  createFlowId,
  createNode,
  touchFlow,
  type FlowDocument,
  type FlowEdge,
  type FlowNode,
  type FlowNodeType,
} from "../flow/schema";

type PerspectiveHandoff = {
  label: string;
  target: string;
  kind: FlowNodeType | "route";
};

type PerspectiveModel = {
  id: string;
  name: string;
  contractPath: string;
  entry: string;
  purpose: string;
  steps: string[];
  handoffs: PerspectiveHandoff[];
  doesNot: string[];
  decisions?: Array<{
    afterStep: number;
    label: string;
    branches: Array<{
      label: string;
      resumeAtStep?: number;
      target?: string;
      kind?: FlowNodeType | "route";
    }>;
  }>;
};

const typedPerspectives = perspectives as { models: PerspectiveModel[] };

const TARGET_CONTRACT_ALIASES: Record<string, string> = {
  "Product Manager": "PM",
  "Project Manager": "PJ",
  "Solution Architect": "SOL",
  "Security & Compliance": "SEC",
  "Marketing/Growth": "MKT",
  Builder: "BU",
  Conductor: "CO",
  "Requirements Check": "RC",
  "Build-readiness": "BH",
  "Issue Triage and Sequencing": "IT",
  "Ideas workspace": "ID",
};

function kindToNodeType(kind: PerspectiveHandoff["kind"]): FlowNodeType {
  if (kind === "route") return "route";
  return kind;
}

function attachContract(label: string, type: FlowNodeType) {
  const alias = TARGET_CONTRACT_ALIASES[label];
  const contract = resolveContract(alias ?? "", label);
  return {
    type,
    contractPath: contract?.path,
    contractUrl: contract?.url,
  };
}

export function listOperatingModelPerspectives(): Array<{ id: string; name: string; purpose: string }> {
  return typedPerspectives.models.map((model) => ({
    id: model.id,
    name: model.name,
    purpose: model.purpose,
  }));
}

export function getOperatingModelPerspective(id: string): PerspectiveModel | null {
  return typedPerspectives.models.find((model) => model.id === id) ?? null;
}

export function createOperatingModelPerspectiveFlow(modelId: string): FlowDocument {
  const model = getOperatingModelPerspective(modelId);
  if (!model) {
    throw new Error(`Unknown operating model perspective: ${modelId}`);
  }

  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];

  const selfContract = resolveContract("", model.name);
  const selfNode = createNode("operatingModel", { x: 0, y: 0 }, {
    label: model.name,
    description: "Perspective focus",
    state: "contract",
    detail: model.purpose,
    contractPath: model.contractPath,
    contractUrl: selfContract?.url ?? contractUrlForPath(model.contractPath),
  });
  nodes.push(selfNode);

  const entryNode = createNode("route", { x: 0, y: 0 }, {
    label: model.entry,
    description: "Entry condition",
    state: "decision",
    detail: `When to use ${model.name}`,
  });
  nodes.push(entryNode);
  edges.push({
    id: createEdgeId(entryNode.id, selfNode.id),
    source: entryNode.id,
    target: selfNode.id,
    label: "enter",
  });

  let previousId = selfNode.id;
  const stepIds: string[] = [];

  for (const [index, step] of model.steps.entries()) {
    const stepNode = createNode("workflowStep", { x: 0, y: 0 }, {
      label: step,
      description: `Process step ${index + 1}`,
      state: "contract",
      detail: `${model.name} process`,
    });
    nodes.push(stepNode);
    stepIds.push(stepNode.id);
    edges.push({
      id: createEdgeId(previousId, stepNode.id),
      source: previousId,
      target: stepNode.id,
      label: index === 0 ? "process" : "next",
    });
    previousId = stepNode.id;
  }

  for (const decision of model.decisions ?? []) {
    const afterId = stepIds[decision.afterStep] ?? previousId;
    const decisionNode = createNode("route", { x: 0, y: 0 }, {
      label: decision.label,
      description: "Decision",
      state: "decision",
    });
    nodes.push(decisionNode);
    edges.push({
      id: createEdgeId(afterId, decisionNode.id),
      source: afterId,
      target: decisionNode.id,
      label: "check",
    });

    for (const branch of decision.branches) {
      if (typeof branch.resumeAtStep === "number" && stepIds[branch.resumeAtStep]) {
        edges.push({
          id: createEdgeId(decisionNode.id, stepIds[branch.resumeAtStep]),
          source: decisionNode.id,
          target: stepIds[branch.resumeAtStep],
          label: branch.label,
        });
        continue;
      }

      if (branch.target) {
        const type = kindToNodeType(branch.kind ?? "handoff");
        const linked = attachContract(branch.target, type);
        const targetNode = createNode(linked.type, { x: 0, y: 0 }, {
          label: branch.target,
          description: branch.label,
          state: "handoff",
          contractPath: linked.contractPath,
          contractUrl: linked.contractUrl,
        });
        nodes.push(targetNode);
        edges.push({
          id: createEdgeId(decisionNode.id, targetNode.id),
          source: decisionNode.id,
          target: targetNode.id,
          label: branch.label,
        });
      }
    }
  }

  for (const handoff of model.handoffs) {
    const type = kindToNodeType(handoff.kind);
    const linked = attachContract(handoff.target, type);
    const handoffNode = createNode(type === "handoff" ? "handoff" : linked.type, { x: 0, y: 0 }, {
      label: handoff.target,
      description: handoff.label,
      state: "handoff",
      detail: `From ${model.name}`,
      contractPath: linked.contractPath,
      contractUrl: linked.contractUrl,
    });
    nodes.push(handoffNode);
    edges.push({
      id: createEdgeId(previousId, handoffNode.id),
      source: previousId,
      target: handoffNode.id,
      label: "handoff",
    });
  }

  for (const boundary of model.doesNot) {
    const note = createNode("note", { x: 0, y: 0 }, {
      label: boundary,
      description: "Boundary — does not",
      state: "boundary",
      detail: `${model.name} authority boundary`,
    });
    nodes.push(note);
    edges.push({
      id: createEdgeId(selfNode.id, note.id),
      source: selfNode.id,
      target: note.id,
      label: "does not",
    });
  }

  const layouted = autoLayoutFlow(nodes, edges, { rankdir: "TB" });

  return touchFlow({
    schemaVersion: 1,
    id: createFlowId(),
    name: `${model.name} perspective`,
    nodes: layouted.nodes,
    edges: layouted.edges,
    metadata: {
      source: "contextai-routing",
      importedFrom: `operating-models/${model.id} perspective`,
    },
  });
}
