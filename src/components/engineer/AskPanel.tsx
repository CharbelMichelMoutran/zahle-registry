"use client";

import { motion } from "motion/react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/client-fetch";
import { springSnappy } from "@/lib/motion";
import { QUERY_PRESETS, type QueryPreset, type QueryResult } from "@/lib/query";
import { inputClass } from "../report/ui";
import { HowRanked, ResultList } from "../ResultList";
import { Button, IconButton, Spinner } from "../ui/Button";

type Status = { kind: "idle" } | { kind: "busy"; claude: boolean } | { kind: "note"; text: string };

const CLAUDE_NOTES: Record<string, string> = {
  off: "Claude is not connected yet. Try a ready-made search below.",
  busy: "Claude has answered many questions from this connection in the last hour. Try a ready-made search, or again later.",
  failed: "Claude could not read that question. Try again, or use a ready-made search.",
  "not-understood": "Claude could not turn that into a search of the record. Try other words, or a ready-made search.",
};

/**
 * "Ask" on the engineer map (plan.md items 21 and 29): a question in plain words,
 * or a ready-made search. Results are listed and highlighted on the map; tapping
 * one folds the panel away and flies to the building. Mounted only while open,
 * so closing forgets the results (the parent clears the highlight).
 */
export function AskPanel({
  onClose,
  onResult,
  onShow,
}: {
  onClose: () => void;
  /** The buildings to highlight on the map; empty clears them. */
  onResult: (ids: string[]) => void;
  onShow: (id: string) => void;
}) {
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [result, setResult] = useState<QueryResult | null>(null);
  const [folded, setFolded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function run(body: { preset: QueryPreset } | { question: string }) {
    setStatus({ kind: "busy", claude: "question" in body });
    try {
      const res = await apiFetch("/api/engineer/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not search the record. Please try again.");
      if (!data.result) return setStatus({ kind: "note", text: CLAUDE_NOTES[data.claudeStatus] ?? CLAUDE_NOTES.failed });
      setResult(data.result);
      onResult(data.result.rows.map((r: { id: string }) => r.id));
      setStatus({ kind: "idle" });
    } catch (err) {
      setStatus({ kind: "note", text: err instanceof Error ? err.message : "Could not search the record." });
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (question.trim()) run({ question: question.trim() });
  }

  function clear() {
    setResult(null);
    setStatus({ kind: "idle" });
    onResult([]);
  }

  if (folded && result) {
    return (
      <div className="absolute top-3 right-3 z-[1100] md:top-4 md:right-4">
        <Button variant="secondary" onClick={() => setFolded(false)} className="shadow-soft">
          Back to results ({result.total})
        </Button>
      </div>
    );
  }

  return (
      <motion.section
        aria-label="Ask about the buildings"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={springSnappy}
        className="absolute inset-x-3 top-3 z-[1100] flex max-h-[min(36rem,calc(100%-6rem))] flex-col overflow-hidden rounded-card border border-line bg-surface shadow-tray md:right-4 md:left-auto md:top-4 md:w-[400px]"
      >
        <div className="flex items-center gap-2 border-b border-line py-1 pr-1 pl-3.5">
          <h2 className="flex-1 text-body font-medium text-ink">Ask about the buildings</h2>
          <IconButton label="Close" onClick={onClose}>
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
            </svg>
          </IconButton>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3.5">
          <form onSubmit={submit} className="flex gap-2">
            <label htmlFor="ask-question" className="sr-only">
              Your question
            </label>
            <input
              ref={inputRef}
              id="ask-question"
              dir="auto"
              value={question}
              maxLength={500}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask about the buildings…"
              className={`${inputClass} min-w-0 flex-1`}
            />
            <Button type="submit" disabled={!question.trim() || status.kind === "busy"}>
              Ask
            </Button>
          </form>

          <div className="flex flex-wrap gap-1.5" aria-label="Ready-made searches">
            {QUERY_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => run({ preset: p.id })}
                disabled={status.kind === "busy"}
                className="min-h-9 rounded-chip border border-line bg-surface px-3 text-micro font-medium text-ink transition-colors hover:bg-surface-soft focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50"
              >
                {p.label}
              </button>
            ))}
          </div>

          {status.kind === "busy" && (
            <p role="status" className="flex items-center gap-2 text-body text-ink">
              <Spinner /> {status.claude ? "Claude is reading your question…" : "Searching the record…"}
            </p>
          )}
          {status.kind === "note" && (
            <p role="status" className="text-body text-attention">
              {status.text}
            </p>
          )}

          {result && status.kind !== "busy" && (
            <div className="space-y-2">
              <p className="text-micro text-muted">
                <span className="font-medium text-ink">Searched for: </span>
                {result.reading}
              </p>
              <div className="flex items-center justify-between gap-2">
                <p className="text-body font-medium text-ink">
                  {result.total} {result.total === 1 ? "building" : "buildings"}
                  {result.total > result.rows.length && <span className="font-normal text-muted"> · first {result.rows.length} shown</span>}
                </p>
                <button type="button" onClick={clear} className="min-h-11 text-micro text-accent underline underline-offset-2">
                  Clear
                </button>
              </div>
              <ResultList
                rows={result.rows}
                onShow={(id) => {
                  setFolded(true);
                  onShow(id);
                }}
              />
              <HowRanked />
            </div>
          )}
        </div>
      </motion.section>
  );
}
