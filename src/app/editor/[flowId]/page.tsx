"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FlowCanvas } from "@/components/flow/FlowCanvas";
import { createFlow, loadFlow } from "@/lib/flow/storage";
import type { FlowDocument } from "@/lib/flow/schema";

export default function EditorPage() {
  const params = useParams<{ flowId: string }>();
  const router = useRouter();
  const [flow, setFlow] = useState<FlowDocument | null>(null);

  useEffect(() => {
    const existing = loadFlow(params.flowId);
    if (existing) {
      setFlow(existing);
      return;
    }

    const created = createFlow("Untitled Flow");
    if (created.id !== params.flowId) {
      router.replace(`/editor/${created.id}`);
      return;
    }
    setFlow(created);
  }, [params.flowId, router]);

  if (!flow) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-[var(--muted)]">
        Loading editor...
      </div>
    );
  }

  return <FlowCanvas initialFlow={flow} />;
}
