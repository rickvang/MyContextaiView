import {
  cloneFlowDocument,
  createBlankFlow,
  toFlowSummary,
  touchFlow,
  validateFlowDocument,
  type FlowDocument,
  type FlowSummary,
} from "./schema";

const INDEX_KEY = "agent-builder:flow-index";
const FLOW_PREFIX = "agent-builder:flow:";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readIndex(): string[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(INDEX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function writeIndex(ids: string[]): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(INDEX_KEY, JSON.stringify(ids));
}

function flowKey(id: string): string {
  return `${FLOW_PREFIX}${id}`;
}

export function listFlows(): FlowSummary[] {
  if (!isBrowser()) return [];

  return readIndex()
    .map((id) => {
      const raw = window.localStorage.getItem(flowKey(id));
      if (!raw) return null;
      try {
        return toFlowSummary(validateFlowDocument(JSON.parse(raw)));
      } catch {
        return null;
      }
    })
    .filter((item): item is FlowSummary => item !== null)
    .sort((a, b) => {
      const aTime = a.updatedAt ? Date.parse(a.updatedAt) : 0;
      const bTime = b.updatedAt ? Date.parse(b.updatedAt) : 0;
      return bTime - aTime;
    });
}

export function loadFlow(id: string): FlowDocument | null {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem(flowKey(id));
  if (!raw) return null;
  try {
    return validateFlowDocument(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveFlow(flow: FlowDocument): FlowDocument {
  if (!isBrowser()) return flow;

  const next = touchFlow(flow);
  const ids = readIndex();
  if (!ids.includes(next.id)) {
    writeIndex([next.id, ...ids]);
  }
  window.localStorage.setItem(flowKey(next.id), JSON.stringify(next));
  return next;
}

export function deleteFlow(id: string): void {
  if (!isBrowser()) return;
  writeIndex(readIndex().filter((item) => item !== id));
  window.localStorage.removeItem(flowKey(id));
}

export function createFlow(name?: string): FlowDocument {
  const flow = createBlankFlow(name);
  return saveFlow(flow);
}

export function duplicateFlow(id: string): FlowDocument | null {
  const existing = loadFlow(id);
  if (!existing) return null;
  return saveFlow(cloneFlowDocument(existing));
}

export function renameFlow(id: string, name: string): FlowDocument | null {
  const existing = loadFlow(id);
  if (!existing) return null;
  return saveFlow({ ...existing, name: name.trim() || existing.name });
}

export function exportFlowJson(flow: FlowDocument): string {
  return JSON.stringify(flow, null, 2);
}

export function importFlowJson(raw: string): FlowDocument {
  const parsed = validateFlowDocument(JSON.parse(raw));
  const imported = {
    ...parsed,
    id: parsed.id || crypto.randomUUID(),
    metadata: {
      ...parsed.metadata,
      updatedAt: new Date().toISOString(),
    },
  };
  return saveFlow(imported);
}

export function downloadFlow(flow: FlowDocument): void {
  if (!isBrowser()) return;
  const blob = new Blob([exportFlowJson(flow)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${flow.name.replace(/[^a-z0-9-_]+/gi, "-").toLowerCase() || "flow"}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file."));
    reader.readAsText(file);
  });
}

export function clearAllFlows(): void {
  if (!isBrowser()) return;
  for (const id of readIndex()) {
    window.localStorage.removeItem(flowKey(id));
  }
  window.localStorage.removeItem(INDEX_KEY);
}
