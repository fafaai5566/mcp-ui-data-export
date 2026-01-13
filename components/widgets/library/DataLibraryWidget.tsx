// components/widgets/library/DataLibraryWidget.tsx
"use client"

import * as React from "react"
import { CheckCircle2 } from "lucide-react"

import { useMcpStore } from "@/lib/store/useMcpStore"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

import { WidgetLayout } from "@/components/widgets/shared/WidgetLayout"
import { WidgetCallout } from "@/components/widgets/shared/WidgetCallout"
import {
  SuggestionChips,
  type SuggestionChip,
} from "@/components/widgets/shared/SuggestionChips"

import { LeftPanel } from "./LeftPanel"
import { RightPanel } from "./RightPanel"

// ✅ Use the category counts to compute 753 (E 225 + S 332 + G 196)
import { categoryTree, type CategoryNode } from "@/lib/data/dataLibraryMock"

function findNode(nodes: CategoryNode[], id: string): CategoryNode | undefined {
  for (const n of nodes) {
    if (n.id === id) return n
    const hit = n.children ? findNode(n.children, id) : undefined
    if (hit) return hit
  }
  return undefined
}


export function DataLibraryWidget() {
  // -------- Store bindings --------
  const selectedIds = useMcpStore((s) => s.librarySelectedIds)
  const suggestedIds = useMcpStore((s) => s.librarySuggestedIds)

  const applySuggestions = useMcpStore((s) => s.applyLibrarySuggestions)
  const skipSuggestions = useMcpStore((s) => s.skipLibrarySuggestions)
  const resetLibrary = useMcpStore((s) => s.resetLibrary)

  const setFooter = useMcpStore((s) => s.setFooter)
  const markStepDone = useMcpStore((s) => s.markStepDone)
  const setWorkflowStep = useMcpStore((s) => s.setWorkflowStep)
  const setActiveWidget = useMcpStore((s) => s.setActiveWidget)
  const addAssistantMessage = useMcpStore((s) => s.addAssistantMessage)

  // ✅ for "came back from later step" behavior (same pattern as ScreenerWidget)
  const workflowSteps = useMcpStore((s) => s.workflowSteps)
  const hasVisitedLaterStep = React.useMemo(() => {
    const idx = workflowSteps.findIndex((x) => x.id === "dataLibrary")
    return workflowSteps.some((step, i) => i > idx && step.status !== "upcoming")
  }, [workflowSteps])

  const selectedCount = selectedIds.length

  // ✅ ESG baseline total = env + social + gov counts
  const esgBaselineTotal = React.useMemo(() => {
    const env = findNode(categoryTree, "env")?.count ?? 0
    const social = findNode(categoryTree, "social")?.count ?? 0
    const gov = findNode(categoryTree, "gov")?.count ?? 0
    return env + social + gov // should be 753 in your mock tree
  }, [])

  // -------- Local UI state for callout --------
  type ChipId = "esgBaseline"
  const defaultChipIds: ChipId[] = ["esgBaseline"]
  const [visibleChipIds, setVisibleChipIds] =
    React.useState<ChipId[]>(defaultChipIds)

  const [suggestionsSkipped, setSuggestionsSkipped] = React.useState(false)

  // ✅ NEW: Applied state (ONLY after user clicks Add)
  const [appliedSuggested, setAppliedSuggested] = React.useState(false)

  const chipsChanged = visibleChipIds.join("|") !== defaultChipIds.join("|")
  const showRestoreDefaults =
    appliedSuggested || suggestionsSkipped || chipsChanged || hasVisitedLaterStep

  const restoreDefaults = () => {
    // Restore store defaults (baseline selected, suggested list restored, etc.)
    resetLibrary()

    // Restore callout UI defaults (NOT applied)
    setVisibleChipIds(defaultChipIds)
    setSuggestionsSkipped(false)
    setAppliedSuggested(false)
  }

  // Scroll highlight (optional)
  const [highlightTargetId, setHighlightTargetId] =
    React.useState<string | null>(null)

  const highlightWrap = (targetId: string) =>
    cn(
      "rounded-xl p-2 -m-2 scroll-mt-24 transition-all",
      highlightTargetId === targetId && "bg-sky-600/10"
    )

  const onJumpTo = (targetId: string) => {
    const el = document.getElementById(targetId)
    if (!el) return
    el.scrollIntoView({ behavior: "smooth", block: "center" })

    setHighlightTargetId(targetId)
    window.setTimeout(() => setHighlightTargetId(null), 1200)
  }

  const onRemoveChip = (chipId: string) => {
    // removing chip => back to "not applied"
    setAppliedSuggested(false)
    setSuggestionsSkipped(false)
    setVisibleChipIds((prev) => prev.filter((x) => x !== chipId as ChipId))
  }

  const chips: SuggestionChip[] = React.useMemo(() => {
    const map: Record<ChipId, SuggestionChip> = {
      esgBaseline: {
        id: "esgBaseline",
        label: "ESG baseline",
        targetId: "dl-category-tree",
      },
    }
    return visibleChipIds.map((id) => map[id])
  }, [visibleChipIds])

  // -------- Footer --------
  React.useEffect(() => {
    setFooter({
      leftLines: [`Total ${selectedCount} data items`],
      primaryLabel: "Next - Export data",
      primaryDisabled: selectedCount === 0,
    })
  }, [selectedCount, setFooter])

  // -------- Guided intro message (sent once) --------
  const introSentRef = React.useRef(false)

  React.useEffect(() => {
    if (introSentRef.current) return
    introSentRef.current = true

    addAssistantMessage(
      [
        "Now we’ll choose the ESG data items to export.",
        "",
        `I’ve prepared an **ESG baseline** (Environment + Social + Governance) — **${esgBaselineTotal} items**.`,
        "",
        "What you can do now:",
        `- Click **Add ${esgBaselineTotal} items** to confirm the baseline selection.`,
        "- Or **Skip suggestions** to start from an empty selection and pick manually.",
      ].join("\n")
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // -------- Handlers --------
  const onAddSuggested = () => {
    // merges suggested into selected (idempotent if already selected)
    applySuggestions()

    // ✅ important: this flips the callout into "Applied suggestion"
    setAppliedSuggested(true)
    setSuggestionsSkipped(false)

    addAssistantMessage(`✅ Added **${esgBaselineTotal}** ESG baseline items.`)
  }

  const onSkipSuggested = () => {
    setSuggestionsSkipped(true)
    setAppliedSuggested(false)
    skipSuggestions()

    addAssistantMessage(
      "Skipped suggestions — selection cleared. You can now pick items manually from the category list."
    )
  }

  const onNextExport = () => {
    if (selectedCount === 0) return
    markStepDone("dataLibrary", `Total ${selectedCount} data items`)
    setWorkflowStep("exporter", { status: "current" })
    setActiveWidget("exporter")

    addAssistantMessage(
      [
        `✅ Selected **${selectedCount}** data items.`,
        "Proceeding to **Export data** setup.",
      ].join("\n")
    )
  }

  // -------- Callout --------
  const callout = (() => {
    const restoreDefaultsChip = showRestoreDefaults ? (
      <button
        type="button"
        onClick={restoreDefaults}
        className="inline-flex items-center rounded-full border bg-background px-3 py-1 text-xs font-medium hover:bg-muted"
      >
        Restore defaults
      </button>
    ) : null

    // ✅ If user comes back from later steps, hide apply/skip UI
    if (hasVisitedLaterStep) {
      return (
        <WidgetCallout
          title="Suggested data items group"
          headerOnly
          headerRight={restoreDefaultsChip}
        />
      )
    }

    // ✅ Applied state (only after clicking Add)
    if (appliedSuggested) {
      return (
        <WidgetCallout
          variant="subtle"
          headerOnly
          title={
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6" />
              <span className="text-lg font-semibold">Applied suggestion</span>
            </div>
          }
          headerRight={restoreDefaultsChip}
        />
      )
    }

    // Skipped OR no chips -> header-only + restore
    if (suggestionsSkipped || chips.length === 0) {
      return (
        <WidgetCallout
          title="Suggested data items group"
          headerOnly
          headerRight={restoreDefaultsChip}
        />
      )
    }

    // Default state
    return (
      <WidgetCallout
        title="Suggested data items group"
        badges={
          <SuggestionChips
            chips={chips}
            onRemove={onRemoveChip}
            onJump={onJumpTo}
            after={restoreDefaultsChip}
          />
        }
        left={
          <span className="font-medium text-foreground">
            Total {esgBaselineTotal} items
          </span>
        }
        right={
          <>
            <Button onClick={onAddSuggested}>Add {esgBaselineTotal} items</Button>
            <Button variant="secondary" onClick={onSkipSuggested}>
              Skip suggestions
            </Button>
          </>
        }
      />
    )
  })()

  return (
    <WidgetLayout
      title="Data item library"
      description="Select ESG data items to export."
      callout={callout}
      scroll="layout"
      footerLeft={
        <div className="text-sm font-medium text-foreground">
          Total {selectedCount} data items
        </div>
      }
      footerRight={
        <Button disabled={selectedCount === 0} onClick={onNextExport}>
          Next - Export data
        </Button>
      }
    >
      <div className="h-full min-h-0 bg-neutral-50 rounded-2xl overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full min-h-0">
          <ResizablePanel defaultSize={22} minSize={20}>
            <div
              id="dl-left-panel"
              className={cn("h-full min-h-0", highlightWrap("dl-left-panel"))}
            >
              <LeftPanel className="h-full min-h-0" />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={65} minSize={30}>
            <div
              id="dl-category-tree"
              className={cn("h-full min-h-0", highlightWrap("dl-category-tree"))}
            >
              <RightPanel className="h-full min-h-0" />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </WidgetLayout>
  )
}
