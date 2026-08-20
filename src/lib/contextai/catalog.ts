import catalog from "@/data/contextai-catalog.json";
import type { FlowNodeType } from "../flow/schema";

export type CatalogEntry = {
  type: FlowNodeType;
  label: string;
  description?: string;
};

export type CatalogGroup = {
  id: string;
  title: string;
  entries: CatalogEntry[];
};

const typedCatalog = catalog as {
  operatingModels: string[];
  skills: string[];
};

export function getCatalogGroups(): CatalogGroup[] {
  return [
    {
      id: "primitives",
      title: "Primitives",
      entries: [
        { type: "route", label: "Route", description: "Routing decision" },
        { type: "operatingModel", label: "Operating Model", description: "Named operating model" },
        { type: "skill", label: "Skill", description: "Named skill" },
        { type: "workflowStep", label: "Workflow Step", description: "Observable workflow step" },
        { type: "handoff", label: "Handoff", description: "Next handoff" },
        { type: "note", label: "Note", description: "Freeform annotation" },
      ],
    },
    {
      id: "operating-models",
      title: "ContextAi Operating Models",
      entries: typedCatalog.operatingModels.map((label) => ({
        type: "operatingModel" as const,
        label,
        description: "ContextAi operating model preset",
      })),
    },
    {
      id: "skills",
      title: "ContextAi Skills",
      entries: typedCatalog.skills.map((label) => ({
        type: "skill" as const,
        label,
        description: "ContextAi skill preset",
      })),
    },
  ];
}

export function searchCatalog(query: string): CatalogEntry[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return getCatalogGroups().flatMap((group) => group.entries);
  }

  return getCatalogGroups()
    .flatMap((group) => group.entries)
    .filter((entry) =>
      `${entry.label} ${entry.description ?? ""} ${entry.type}`.toLowerCase().includes(normalized),
    );
}
