const CONTEXTAI_GITHUB_ROOT = "https://github.com/rickvang/ContextAi/blob/main";

/** Mermaid node id → ContextAi repo-relative contract path */
const CONTRACT_BY_ID: Record<string, string> = {
  AG: "AGENTS.md",
  O: "IDENTITY.md",
  R: "CONTEXT.md",
  CO: "operating-models/conductor/CONTEXT.md",
  PM: "operating-models/product-manager/CONTEXT.md",
  PJ: "operating-models/project-manager/CONTEXT.md",
  SOL: "operating-models/solution-architect/CONTEXT.md",
  SEC: "operating-models/security-compliance/CONTEXT.md",
  MKT: "operating-models/marketing-growth/CONTEXT.md",
  BU: "operating-models/builder/CONTEXT.md",
  IT: "skills/coordination/issue-triage-and-sequencing/SKILL.md",
  PCI: "skills/coordination/project-context-intake/SKILL.md",
  BH: "skills/coordination/build-readiness/SKILL.md",
  RC: "skills/coordination/requirements-check/SKILL.md",
  TR: "skills/coordination/record-workflow-trace/SKILL.md",
  NR: "skills/coordination/record-workflow-trace/SKILL.md",
  PR: "skills/engineering/prototype/SKILL.md",
  BE: "skills/engineering/browser-evidence/SKILL.md",
  UX: "skills/design/ux-ui-review/SKILL.md",
  ID: "ideas/IDENTITY.md",
  E: "skills/coordination/workspace-reconciliation/SKILL.md",
  P: "CONTEXT.md",
};

const CONTRACT_BY_LABEL: Array<{ match: RegExp; path: string }> = [
  { match: /agents\.md/i, path: "AGENTS.md" },
  { match: /identity\.md/i, path: "IDENTITY.md" },
  { match: /context\.md/i, path: "CONTEXT.md" },
  { match: /product manager/i, path: "operating-models/product-manager/CONTEXT.md" },
  { match: /project manager/i, path: "operating-models/project-manager/CONTEXT.md" },
  { match: /solution architect/i, path: "operating-models/solution-architect/CONTEXT.md" },
  { match: /security/i, path: "operating-models/security-compliance/CONTEXT.md" },
  { match: /marketing/i, path: "operating-models/marketing-growth/CONTEXT.md" },
  { match: /conductor/i, path: "operating-models/conductor/CONTEXT.md" },
  { match: /\bbuilder\b/i, path: "operating-models/builder/CONTEXT.md" },
  { match: /issue triage/i, path: "skills/coordination/issue-triage-and-sequencing/SKILL.md" },
  { match: /project context intake/i, path: "skills/coordination/project-context-intake/SKILL.md" },
  { match: /build-readiness/i, path: "skills/coordination/build-readiness/SKILL.md" },
  { match: /requirements check/i, path: "skills/coordination/requirements-check/SKILL.md" },
  { match: /workflow trace/i, path: "skills/coordination/record-workflow-trace/SKILL.md" },
  { match: /workspace reconcili/i, path: "skills/coordination/workspace-reconciliation/SKILL.md" },
  { match: /prototype/i, path: "skills/engineering/prototype/SKILL.md" },
  { match: /browser evidence/i, path: "skills/engineering/browser-evidence/SKILL.md" },
  { match: /ux\/ui/i, path: "skills/design/ux-ui-review/SKILL.md" },
  { match: /ideas workspace/i, path: "ideas/IDENTITY.md" },
];

export type ContractRef = {
  path: string;
  url: string;
};

export function contractUrlForPath(path: string): string {
  return `${CONTEXTAI_GITHUB_ROOT}/${path.split("/").map(encodeURIComponent).join("/")}`;
}

export function resolveContract(nodeId: string, label: string): ContractRef | null {
  const byId = CONTRACT_BY_ID[nodeId];
  if (byId) {
    return { path: byId, url: contractUrlForPath(byId) };
  }

  for (const rule of CONTRACT_BY_LABEL) {
    if (rule.match.test(label)) {
      return { path: rule.path, url: contractUrlForPath(rule.path) };
    }
  }

  return null;
}
