"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { FlowCanvas } from "@/components/flow/FlowCanvas";
import { createFlow, loadFlow } from "@/lib/flow/storage";
import type { FlowDocument } from "@/lib/flow/schema";
import { editorHref } from "@/lib/flow/paths";

function EditorPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const flowId = searchParams.get("id");
  const [flow, setFlow] = useState<FlowDocument | null>(null);

  useEffect(() => {
    if (!flowId) {
      const created = createFlow("Untitled Flow");
      router.replace(editorHref(created.id));
      return;
    }

    const existing = loadFlow(flowId);
    if (existing) {
      setFlow(existing);
      return;
    }

    const created = createFlow("Untitled Flow");
    if (created.id !== flowId) {
      router.replace(editorHref(created.id));
      return;
    }
    setFlow(created);
  }, [flowId, router]);

  if (!flow) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-[var(--muted)]">
        Loading editor...
      </div>
    );
  }

  return <FlowCanvas initialFlow={flow} />;
}

export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-[var(--muted)]">
          Loading editor...
        </div>
      }
    >
      <EditorPageInner />
    </Suspense>
  );
}
