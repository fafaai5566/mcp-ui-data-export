"use client"

import { useMcpStore } from "@/lib/store/useMcpStore"
import { WorkflowStepCard } from "@/components/shell/WorkflowStepCard"
import type { WorkflowCardState } from "@/lib/store/useMcpStore"
import { cn } from "@/lib/utils"
import { PanelRightClose } from "lucide-react"

export function WorkflowPanel() {
  const setWorkflowCollapsed = useMcpStore((s) => s.setWorkflowCollapsed)

  const steps = useMcpStore((s) => s.workflowSteps) ?? []
  const activeWidget = useMcpStore((s) => s.activeWidget)
  const setActiveWidget = useMcpStore((s) => s.setActiveWidget)

  return (
    <div className="h-full flex flex-col border-none bg-slate-50/40">
      <div className="shrink-0 px-4 py-4 flex items-center justify-between">
        <div className="text-xl font-semibold">Workflow</div>

        <button
          type="button"
          onClick={() => setWorkflowCollapsed(true)}
          className={cn(
            "inline-flex items-center justify-center rounded-md",
            "h-9 w-9 hover:bg-slate-100",
            "focus:outline-none focus:ring-2 focus:ring-primary/20"
          )}
          aria-label="Collapse workflow"
        >
          <PanelRightClose className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-auto px-4 pb-4 space-y-4">
        {steps.map((step) => {
          const isSelected = activeWidget === step.id
          const isDisabled = step.status === "upcoming"

          const state: WorkflowCardState = isDisabled
            ? "disabled"
            : isSelected
            ? "selected"
            : "default"

          const summary = step.status === "done" ? step.summary : undefined

          return (
            <WorkflowStepCard
              key={step.id}
              title={step.title}
              subtitle={step.subtitle}
              summary={summary}
              state={state}
              onClick={isDisabled ? undefined : () => setActiveWidget(step.id)}
            />
          )
        })}
      </div>
    </div>
  )
}
