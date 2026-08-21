"use client";

import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CatalogEntry } from "@/lib/contextai/catalog";
import { autoLayoutFlow } from "@/lib/contextai/traceAdapter";
import {
  FlowHistory,
  duplicateSelectedNode,
  fromReactFlowEdges,
  fromReactFlowNodes,
  snapshotFromFlow,
  toReactFlowEdges,
  toReactFlowNodes,
} from "@/lib/flow/history";
import {
  createEdgeId,
  createNode,
  touchFlow,
  type FlowDocument,
  type FlowNodeType,
} from "@/lib/flow/schema";
import { downloadFlow, importFlowJson, readFileAsText, saveFlow } from "@/lib/flow/storage";
import { NodeInspector } from "./NodeInspector";
import { NodePalette } from "./NodePalette";
import { flowNodeTypes } from "./nodes";

type FlowCanvasProps = {
  initialFlow: FlowDocument;
};

function FlowCanvasInner({ initialFlow }: FlowCanvasProps) {
  const [flow, setFlow] = useState(initialFlow);
  const [nodes, setNodes, onNodesChange] = useNodesState(toReactFlowNodes(initialFlow.nodes));
  const [edges, setEdges, onEdgesChange] = useEdgesState(toReactFlowEdges(initialFlow.edges));
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [paletteCollapsed, setPaletteCollapsed] = useState(false);
  const [saveState, setSaveState] = useState<"saved" | "dirty">("saved");
  const historyRef = useRef(new FlowHistory());
  const reactFlow = useReactFlow();
  const importFlowRef = useRef<HTMLInputElement>(null);
  const importTraceRef = useRef<HTMLInputElement>(null);

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  );
  const selectedEdge = useMemo(
    () => edges.find((edge) => edge.id === selectedEdgeId) ?? null,
    [edges, selectedEdgeId],
  );

  const commitSnapshot = useCallback(() => {
    historyRef.current.push({
      nodes: fromReactFlowNodes(nodes),
      edges: fromReactFlowEdges(edges),
    });
  }, [nodes, edges]);

  const persistFlow = useCallback(
    (nextNodes: Node[], nextEdges: Edge[], nextFlow?: Partial<FlowDocument>) => {
      const updated = touchFlow({
        ...flow,
        ...nextFlow,
        nodes: fromReactFlowNodes(nextNodes),
        edges: fromReactFlowEdges(nextEdges),
      });
      setFlow(updated);
      saveFlow(updated);
      setSaveState("saved");
      return updated;
    },
    [flow],
  );

  const markDirty = useCallback(() => setSaveState("dirty"), []);

  useEffect(() => {
    historyRef.current.clear();
    historyRef.current.push(snapshotFromFlow(initialFlow));
  }, [initialFlow]);

  useEffect(() => {
    if (saveState !== "dirty") return;
    const timer = window.setTimeout(() => {
      persistFlow(nodes, edges);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [saveState, nodes, edges, persistFlow]);

  const onConnect = useCallback(
    (connection: Connection) => {
      commitSnapshot();
      setEdges((current) => {
        const next = addEdge(
          {
            ...connection,
            id: createEdgeId(connection.source ?? "source", connection.target ?? "target"),
            animated: true,
            style: { stroke: "#8ba7ff" },
          },
          current,
        );
        markDirty();
        return next;
      });
    },
    [commitSnapshot, setEdges, markDirty],
  );

  const onAddNode = useCallback(
    (type: FlowNodeType, preset?: Partial<CatalogEntry>) => {
      commitSnapshot();
      const center = reactFlow.screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });
      const node = createNode(type, center, {
        label: preset?.label ?? undefined,
        description: preset?.description ?? undefined,
      });
      setNodes((current) => {
        const next = [...current, ...toReactFlowNodes([node])];
        markDirty();
        return next;
      });
    },
    [commitSnapshot, reactFlow, setNodes, markDirty],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const raw = event.dataTransfer.getData("application/agent-builder-node");
      if (!raw) return;

      try {
        const preset = JSON.parse(raw) as CatalogEntry;
        commitSnapshot();
        const position = reactFlow.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });
        const node = createNode(preset.type, position, {
          label: preset.label,
          description: preset.description,
        });
        setNodes((current) => {
          const next = [...current, ...toReactFlowNodes([node])];
          markDirty();
          return next;
        });
      } catch {
        // ignore invalid drag payload
      }
    },
    [commitSnapshot, reactFlow, setNodes, markDirty],
  );

  const onUpdateNode = useCallback(
    (nodeId: string, patch: Record<string, string | undefined>) => {
      commitSnapshot();
      setNodes((current) => {
        const next = current.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  ...patch,
                },
              }
            : node,
        );
        markDirty();
        return next;
      });
    },
    [commitSnapshot, setNodes, markDirty],
  );

  const onUpdateEdge = useCallback(
    (edgeId: string, label: string) => {
      commitSnapshot();
      setEdges((current) => {
        const next = current.map((edge) => (edge.id === edgeId ? { ...edge, label } : edge));
        markDirty();
        return next;
      });
    },
    [commitSnapshot, setEdges, markDirty],
  );

  const onDeleteNode = useCallback(
    (nodeId: string) => {
      commitSnapshot();
      setNodes((current) => {
        const next = current.filter((node) => node.id !== nodeId);
        markDirty();
        return next;
      });
      setEdges((current) => {
        const next = current.filter((edge) => edge.source !== nodeId && edge.target !== nodeId);
        markDirty();
        return next;
      });
      setSelectedNodeId(null);
    },
    [commitSnapshot, setNodes, setEdges, markDirty],
  );

  const onDeleteEdge = useCallback(
    (edgeId: string) => {
      commitSnapshot();
      setEdges((current) => {
        const next = current.filter((edge) => edge.id !== edgeId);
        markDirty();
        return next;
      });
      setSelectedEdgeId(null);
    },
    [commitSnapshot, setEdges, markDirty],
  );

  const onDuplicateNode = useCallback(
    (nodeId: string) => {
      commitSnapshot();
      const snapshot = duplicateSelectedNode(fromReactFlowNodes(nodes), fromReactFlowEdges(edges), nodeId);
      setNodes(toReactFlowNodes(snapshot.nodes));
      setEdges(toReactFlowEdges(snapshot.edges));
      markDirty();
    },
    [commitSnapshot, nodes, edges, setNodes, setEdges, markDirty],
  );

  const applyHistory = useCallback(
    (snapshot: { nodes: FlowDocument["nodes"]; edges: FlowDocument["edges"] } | null) => {
      if (!snapshot) return;
      setNodes(toReactFlowNodes(snapshot.nodes));
      setEdges(toReactFlowEdges(snapshot.edges));
      markDirty();
    },
    [setNodes, setEdges, markDirty],
  );

  const handleUndo = useCallback(() => {
    const current = {
      nodes: fromReactFlowNodes(nodes),
      edges: fromReactFlowEdges(edges),
    };
    const previous = historyRef.current.undo(current);
    applyHistory(previous);
  }, [nodes, edges, applyHistory]);

  const handleRedo = useCallback(() => {
    const current = {
      nodes: fromReactFlowNodes(nodes),
      edges: fromReactFlowEdges(edges),
    };
    const next = historyRef.current.redo(current);
    applyHistory(next);
  }, [nodes, edges, applyHistory]);

  const handleRelayout = useCallback(() => {
    commitSnapshot();
    const rankdir = flow.metadata?.source === "contextai-routing" ? "TB" : "LR";
    const current = {
      ...flow,
      nodes: fromReactFlowNodes(nodes),
      edges: fromReactFlowEdges(edges),
    };
    const layouted = autoLayoutFlow(current.nodes, current.edges, { rankdir });
    const relayouted = touchFlow({
      ...current,
      nodes: layouted.nodes,
      edges: layouted.edges,
    });
    setFlow(relayouted);
    setNodes(toReactFlowNodes(relayouted.nodes));
    setEdges(toReactFlowEdges(relayouted.edges));
    persistFlow(toReactFlowNodes(relayouted.nodes), toReactFlowEdges(relayouted.edges), relayouted);
  }, [commitSnapshot, flow, nodes, edges, setNodes, setEdges, persistFlow]);

  const handleExport = useCallback(() => {
    downloadFlow({
      ...flow,
      nodes: fromReactFlowNodes(nodes),
      edges: fromReactFlowEdges(edges),
    });
  }, [flow, nodes, edges]);

  const handleLoadRoutingGraph = useCallback(() => {
    void import("@/lib/contextai/routingAdapter").then(({ createContextAiRoutingFlow }) => {
      const imported = createContextAiRoutingFlow();
      historyRef.current.clear();
      historyRef.current.push(snapshotFromFlow(imported));
      setFlow(imported);
      setNodes(toReactFlowNodes(imported.nodes));
      setEdges(toReactFlowEdges(imported.edges));
      setSaveState("saved");
      saveFlow(imported);
    });
  }, [setNodes, setEdges]);

  const handleLoadPerspective = useCallback(
    (modelId: string) => {
      void import("@/lib/contextai/perspectiveAdapter").then(({ createOperatingModelPerspectiveFlow }) => {
        const imported = createOperatingModelPerspectiveFlow(modelId);
        historyRef.current.clear();
        historyRef.current.push(snapshotFromFlow(imported));
        setFlow(imported);
        setNodes(toReactFlowNodes(imported.nodes));
        setEdges(toReactFlowEdges(imported.edges));
        setSaveState("saved");
        saveFlow(imported);
      });
    },
    [setNodes, setEdges],
  );

  const handleImportFlow = useCallback(
    async (file: File) => {
      try {
        const raw = await readFileAsText(file);
        const imported = importFlowJson(raw);
        historyRef.current.clear();
        historyRef.current.push(snapshotFromFlow(imported));
        setFlow(imported);
        setNodes(toReactFlowNodes(imported.nodes));
        setEdges(toReactFlowEdges(imported.edges));
        setSaveState("saved");
      } catch (error) {
        window.alert(error instanceof Error ? error.message : "Failed to import flow.");
      }
    },
    [setNodes, setEdges],
  );

  const handleImportTrace = useCallback(
    async (file: File) => {
      try {
        const raw = await readFileAsText(file);
        const { importContextAiTraceJson } = await import("@/lib/contextai/traceAdapter");
        const imported = importContextAiTraceJson(raw, file.name);
        historyRef.current.clear();
        historyRef.current.push(snapshotFromFlow(imported));
        setFlow(imported);
        setNodes(toReactFlowNodes(imported.nodes));
        setEdges(toReactFlowEdges(imported.edges));
        setSaveState("saved");
      } catch (error) {
        window.alert(error instanceof Error ? error.message : "Failed to import ContextAi trace.");
      }
    },
    [setNodes, setEdges],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        persistFlow(nodes, edges);
        return;
      }

      if (isTyping) return;

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z" && !event.shiftKey) {
        event.preventDefault();
        handleUndo();
        return;
      }

      if (
        (event.ctrlKey || event.metaKey) &&
        (event.key.toLowerCase() === "y" || (event.key.toLowerCase() === "z" && event.shiftKey))
      ) {
        event.preventDefault();
        handleRedo();
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        if (selectedNodeId) {
          event.preventDefault();
          onDeleteNode(selectedNodeId);
        } else if (selectedEdgeId) {
          event.preventDefault();
          onDeleteEdge(selectedEdgeId);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    nodes,
    edges,
    persistFlow,
    handleUndo,
    handleRedo,
    selectedNodeId,
    selectedEdgeId,
    onDeleteNode,
    onDeleteEdge,
  ]);

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between gap-4 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3">
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--accent)]">Agent Builder</div>
          <div className="flex items-center gap-3">
            <h1 className="truncate text-lg font-semibold">{flow.name}</h1>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]"
              style={{
                background: saveState === "saved" ? "var(--green-soft)" : "var(--amber-soft)",
                color: saveState === "saved" ? "var(--green)" : "var(--amber)",
              }}
            >
              {saveState === "saved" ? "Saved" : "Saving..."}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ToolbarButton onClick={handleUndo} disabled={!historyRef.current.canUndo()}>
            Undo
          </ToolbarButton>
          <ToolbarButton onClick={handleRedo} disabled={!historyRef.current.canRedo()}>
            Redo
          </ToolbarButton>
          <ToolbarButton onClick={handleRelayout}>Auto-layout</ToolbarButton>
          <ToolbarButton onClick={handleLoadRoutingGraph}>Load Routing Graph</ToolbarButton>
          <label className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1.5 text-sm">
            <span className="text-[var(--muted)]">Perspective</span>
            <select
              className="max-w-[10rem] bg-transparent outline-none"
              defaultValue=""
              onChange={(event) => {
                if (event.target.value) {
                  handleLoadPerspective(event.target.value);
                  event.target.value = "";
                }
              }}
            >
              <option value="" disabled>
                Choose…
              </option>
              <option value="conductor">Conductor</option>
              <option value="product-manager">Product Manager</option>
              <option value="project-manager">Project Manager</option>
              <option value="solution-architect">Solution Architect</option>
              <option value="builder">Builder</option>
              <option value="marketing-growth">Marketing/Growth</option>
              <option value="security-compliance">Security &amp; Compliance</option>
            </select>
          </label>
          <ToolbarButton onClick={() => importFlowRef.current?.click()}>Import Flow</ToolbarButton>
          <ToolbarButton onClick={() => importTraceRef.current?.click()}>Import Trace</ToolbarButton>
          <ToolbarButton onClick={handleExport}>Export JSON</ToolbarButton>
          <Link
            href="/"
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm hover:bg-[var(--surface-3)]"
          >
            All flows
          </Link>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <NodePalette
          onAddNode={onAddNode}
          collapsed={paletteCollapsed}
          onToggleCollapse={() => setPaletteCollapsed((value) => !value)}
        />

        <div className="relative min-w-0 flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={flowNodeTypes}
            onNodesChange={(changes) => {
              onNodesChange(changes);
              markDirty();
            }}
            onEdgesChange={(changes) => {
              onEdgesChange(changes);
              markDirty();
            }}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={(_, node) => {
              setSelectedNodeId(node.id);
              setSelectedEdgeId(null);
            }}
            onEdgeClick={(_, edge) => {
              setSelectedEdgeId(edge.id);
              setSelectedNodeId(null);
            }}
            onPaneClick={() => {
              setSelectedNodeId(null);
              setSelectedEdgeId(null);
            }}
            fitView
            snapToGrid
            snapGrid={[16, 16]}
            defaultEdgeOptions={{ animated: true }}
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={16} size={1} color="var(--border)" />
            <MiniMap
              nodeColor={(node) => {
                switch (node.type) {
                  case "route":
                    return "#8ba7ff";
                  case "operatingModel":
                    return "#c398ff";
                  case "skill":
                    return "#62c8e8";
                  case "workflowStep":
                    return "#65d6a0";
                  case "handoff":
                    return "#f5c46c";
                  default:
                    return "#7786a3";
                }
              }}
              maskColor="rgba(11, 16, 32, 0.75)"
            />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>

        <NodeInspector
          selectedNode={selectedNode}
          selectedEdge={selectedEdge}
          onUpdateNode={onUpdateNode}
          onUpdateEdge={onUpdateEdge}
          onDeleteNode={onDeleteNode}
          onDeleteEdge={onDeleteEdge}
          onDuplicateNode={onDuplicateNode}
        />
      </div>

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
    </div>
  );
}

function ToolbarButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm hover:bg-[var(--surface-3)] disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

export function FlowCanvas(props: FlowCanvasProps) {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
