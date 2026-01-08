"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import type { WorkflowCardState } from "@/lib/store/useMcpStore"

type WorkflowStepCardProps = {
  title: string
  subtitle: string
  summary?: string
  state: WorkflowCardState
  onClick?: () => void
}

export function WorkflowStepCard({
  title,
  subtitle,
  summary,
  state,
  onClick,
}: WorkflowStepCardProps) {
  const isDisabled = state === "disabled"

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-xl border transition",
        "px-4 py-4",
        // pressed state (no store needed)
        "active:scale-[0.99]",
        // focus
        "focus:outline-none focus:ring-primary/20",
        // states
        state === "default" && "bg-white hover:bg-slate-50 border-slate-200",
        state === "selected" &&
          "bg-slate-100 border-slate-300 ring-primary/10 shadow-sm",
        state === "disabled" &&
          "bg-slate-100/70 border-slate-200 opacity-60 cursor-not-allowed"
      )}
    >
      <div className="space-y-1">
        <div className="text-lg font-semibold">{title}</div>
        <div className="text-sm text-muted-foreground">{subtitle}</div>

        {summary ? (
          <div className="pt-2 text-sm text-foreground/80">{summary}</div>
        ) : null}
      </div>
    </button>
  )
}
