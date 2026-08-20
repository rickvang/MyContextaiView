"use client";

import { useEffect, useState } from "react";
import { fetchContractContent } from "@/lib/contextai/contracts";

type ContractContentProps = {
  path: string;
  url?: string;
};

export function ContractContent({ path, url }: ContractContentProps) {
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setContent(null);

    void fetchContractContent(path)
      .then((text) => {
        if (!cancelled) {
          setContent(text);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load contract.");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [path]);

  return (
    <section className="mt-4 flex min-h-0 flex-1 flex-col">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--muted)]">
          Contract
        </div>
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] font-medium text-[var(--accent)] hover:underline"
          >
            Open on GitHub
          </a>
        ) : null}
      </div>
      <div className="mb-2 truncate text-xs text-[var(--faint)]" title={path}>
        {path}
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
        {loading ? (
          <p className="text-sm text-[var(--muted)]">Loading contract…</p>
        ) : error ? (
          <p className="text-sm text-[var(--red)]">{error}</p>
        ) : (
          <pre className="whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-[var(--text)]">
            {content}
          </pre>
        )}
      </div>
    </section>
  );
}
