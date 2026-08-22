"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import exampleFlow from "@/data/examples/contextai-route.flow.json";
import experimentCoordinationFlow from "@/data/examples/experiment-coordination.flow.json";
import { validateFlowDocument, type FlowSummary } from "@/lib/flow/schema";
import {
  createFlow,
  deleteFlow,
  duplicateFlow,
  importFlowJson,
  listFlows,
  readFileAsText,
  renameFlow,
  saveFlow,
} from "@/lib/flow/storage";
import { editorHref } from "@/lib/flow/paths";
import { listOperatingModelPerspectives } from "@/lib/contextai/perspectiveAdapter";

export default function HomePage() {
  const router = useRouter();
  const [flows, setFlows] = useState<FlowSummary[]>([]);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [perspectives] = useState(() => listOperatingModelPerspectives());
  const importFlowRef = useRef<HTMLInputElement>(null);
  const importTraceRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFlows(listFlows());
  }, []);

  const refresh = () => setFlows(listFlows());

  const handleCreate = () => {
    const flow = createFlow("Untitled Flow");
    router.push(editorHref(flow.id));
  };

  const handleDuplicate = (id: string) => {
    const copy = duplicateFlow(id);
    refresh();
    if (copy) router.push(editorHref(copy.id));
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Delete this flow?")) return;
    deleteFlow(id);
    refresh();
  };

  const handleRename = (id: string) => {
    renameFlow(id, renameValue);
    setRenameId(null);
    setRenameValue("");
    refresh();
  };

  const handleImportExample = () => {
    const imported = saveFlow(validateFlowDocument(exampleFlow));
    refresh();
    router.push(editorHref(imported.id));
  };

  const handleImportExperimentExample = () => {
    const imported = saveFlow(validateFlowDocument(experimentCoordinationFlow));
    refresh();
    router.push(editorHref(imported.id));
  };

  const handleOpenRoutingGraph = () => {
    void import("@/lib/contextai/routingAdapter").then(({ createContextAiRoutingFlow }) => {
      const imported = saveFlow(createContextAiRoutingFlow());
      refresh();
      router.push(editorHref(imported.id));
    });
  };

  const handleOpenPerspective = (modelId: string) => {
    void import("@/lib/contextai/perspectiveAdapter").then(({ createOperatingModelPerspectiveFlow }) => {
      const imported = saveFlow(createOperatingModelPerspectiveFlow(modelId));
      refresh();
      router.push(editorHref(imported.id));
    });
  };

  const handleImportFlow = async (file: File) => {
    try {
      const raw = await readFileAsText(file);
      const imported = importFlowJson(raw);
      refresh();
      router.push(editorHref(imported.id));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Failed to import flow.");
    }
  };

  const handleImportTrace = async (file: File) => {
    try {
      const raw = await readFileAsText(file);
      const { importContextAiTraceJson } = await import("@/lib/contextai/traceAdapter");
      const imported = importContextAiTraceJson(raw, file.name);
      saveFlow(imported);
      refresh();
      router.push(editorHref(imported.id));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Failed to import ContextAi trace.");
    }
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-10">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--accent)]">Agent Builder</div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Flowise-like Visual Builder</h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
            Build and save ContextAi-aligned workflow graphs. Open the workspace routing graph, an operating-model perspective, or import traces.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ActionButton onClick={handleCreate}>New Flow</ActionButton>
          <ActionButton onClick={handleOpenRoutingGraph}>Open Routing Graph</ActionButton>
          <ActionButton onClick={handleImportExample}>Open Trace Example</ActionButton>
          <ActionButton onClick={handleImportExperimentExample}>Open Experiment Handoff Example</ActionButton>
          <ActionButton onClick={() => importFlowRef.current?.click()}>Import Flow JSON</ActionButton>
          <ActionButton onClick={() => importTraceRef.current?.click()}>Import ContextAi Trace</ActionButton>
        </div>
      </header>

      <section className="mb-8 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_24px_60px_rgba(0,0,0,0.25)]">
        <div className="border-b border-[var(--border)] px-5 py-4">
          <h2 className="text-lg font-semibold">Operating Model Perspectives</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            See each operating model&apos;s process, handoffs, and boundaries from its own contract.
          </p>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {perspectives.map((model) => (
            <button
              key={model.id}
              type="button"
              onClick={() => handleOpenPerspective(model.id)}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-left transition hover:border-[var(--accent)] hover:bg-[var(--surface-3)]"
            >
              <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--violet)]">
                Operating model
              </div>
              <div className="mt-1 text-sm font-semibold">{model.name}</div>
              <div className="mt-1 text-xs text-[var(--muted)]">{model.purpose}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_24px_60px_rgba(0,0,0,0.25)]">
        <div className="border-b border-[var(--border)] px-5 py-4">
          <h2 className="text-lg font-semibold">Saved Flows</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Flows autosave to localStorage in this browser.
          </p>
        </div>

        {flows.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-[var(--muted)]">No flows yet. Open the ContextAi routing graph or create a blank flow.</p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {flows.map((flow) => (
              <li key={flow.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  {renameId === flow.id ? (
                    <form
                      className="flex items-center gap-2"
                      onSubmit={(event) => {
                        event.preventDefault();
                        handleRename(flow.id);
                      }}
                    >
                      <input
                        value={renameValue}
                        onChange={(event) => setRenameValue(event.target.value)}
                        className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                        autoFocus
                      />
                      <ActionButton type="submit">Save</ActionButton>
                      <ActionButton
                        type="button"
                        onClick={() => {
                          setRenameId(null);
                          setRenameValue("");
                        }}
                      >
                        Cancel
                      </ActionButton>
                    </form>
                  ) : (
                    <>
                      <Link href={editorHref(flow.id)} className="text-base font-semibold hover:text-[var(--accent)]">
                        {flow.name}
                      </Link>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                        <span>{flow.nodeCount} nodes</span>
                        {flow.source ? <Badge>{flow.source}</Badge> : null}
                        {flow.updatedAt ? <span>Updated {new Date(flow.updatedAt).toLocaleString()}</span> : null}
                      </div>
                    </>
                  )}
                </div>

                {renameId === flow.id ? null : (
                  <div className="flex flex-wrap gap-2">
                    <ActionButton onClick={() => router.push(editorHref(flow.id))}>Open</ActionButton>
                    <ActionButton
                      onClick={() => {
                        setRenameId(flow.id);
                        setRenameValue(flow.name);
                      }}
                    >
                      Rename
                    </ActionButton>
                    <ActionButton onClick={() => handleDuplicate(flow.id)}>Duplicate</ActionButton>
                    <ActionButton onClick={() => handleDelete(flow.id)} tone="danger">
                      Delete
                    </ActionButton>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <input
        ref={importFlowRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleImportFlow(file);
          event.target.value = "";
        }}
      />
      <input
        ref={importTraceRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleImportTrace(file);
          event.target.value = "";
        }}
      />
    </main>
  );
}

function ActionButton({
  children,
  onClick,
  type = "button",
  tone = "default",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  tone?: "default" | "danger";
}) {
  const styles =
    tone === "danger"
      ? "border-[var(--red-soft)] bg-[var(--red-soft)] text-[var(--red)]"
      : "border-[var(--border)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)]";

  return (
    <button
      type={type}
      onClick={onClick}
      className={`rounded-lg border px-3 py-2 text-sm ${styles}`}
    >
      {children}
    </button>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-[var(--surface-3)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--faint)]">
      {children}
    </span>
  );
}
