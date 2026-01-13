// components/widgets/parameter/DataParameterWidget.tsx
"use client"

import * as React from "react"
import { CheckCircle2 } from "lucide-react"

import { useMcpStore } from "@/lib/store/useMcpStore"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { WidgetLayout } from "@/components/widgets/shared/WidgetLayout"
import { WidgetCallout } from "@/components/widgets/shared/WidgetCallout"
import {
  SuggestionChips,
  type SuggestionChip,
} from "@/components/widgets/shared/SuggestionChips"

function typeLabel(t: string) {
  return t === "calendarYear" ? "Calendar year" : "Fiscal year"
}

function formatSummary(p: { fromYear: number; toYear: number; type: string }) {
  return `${p.fromYear} - ${p.toYear} (${typeLabel(p.type)})`
}

function years(from = 1990, to = 2026) {
  const arr: number[] = []
  for (let y = from; y <= to; y++) arr.push(y)
  return arr
}

function buildDataParameterIntroMessage() {
  return [
    "Now let’s set the **Data parameter** step.",
    "",
    "This controls *how* we pull the history (time range + fiscal/calendar logic) before you select variables.",
    "",
    "What you can do now:",
    "- Click **Apply suggestions** to use the recommended baseline (2000–2025, Fiscal year).",
    "- Or adjust the parameters manually.",
    "",
    "When you’re ready, click **Next – Select variables**.",
  ].join("\n")
}

export function DataParameterWidget() {
  // ---- Store bindings ----
  const dataParameters = useMcpStore((s) => (s as any).dataParameters)
  const suggestedDataParameters = useMcpStore((s) => (s as any).suggestedDataParameters)

  const setDataParameters = useMcpStore((s) => (s as any).setDataParameters) as
    | ((patch: any) => void)
    | undefined
  const resetDataParameters = useMcpStore((s) => (s as any).resetDataParameters) as
    | (() => void)
    | undefined
  const applySuggested = useMcpStore((s) => (s as any).applySuggestedDataParameters) as
    | (() => void)
    | undefined

  const markStepDone = useMcpStore((s) => s.markStepDone)
  const setWorkflowStep = useMcpStore((s) => s.setWorkflowStep)
  const transitionToWidget = useMcpStore((s) => s.transitionToWidget)
  const addAssistantMessage = useMcpStore((s) => s.addAssistantMessage)
  const workflowSteps = useMcpStore((s) => s.workflowSteps)

  // ✅ Determines “return mode”: user has progressed to step(s) after Data Parameter
  const hasVisitedLaterStep = React.useMemo(() => {
    const idx = workflowSteps.findIndex((x) => x.id === "dataParameter")
    if (idx < 0) return false
    return workflowSteps.some((step, i) => i > idx && step.status !== "upcoming")
  }, [workflowSteps])

  // If store isn’t updated yet, fail gracefully
  if (!dataParameters || !suggestedDataParameters || !setDataParameters || !applySuggested) {
    return (
      <WidgetLayout
        title="Data parameter"
        description="Set time range and options before selecting variables."
      >
        <div className="text-sm text-muted-foreground">
          Store not ready: please add <code>dataParameters</code> and related actions to{" "}
          <code>useMcpStore.ts</code>.
        </div>
      </WidgetLayout>
    )
  }

  // ---- Local UI state for suggestion bar ----
  type ChipId = "range"
  const defaultChipIds: ChipId[] = ["range"]
  const [visibleChipIds, setVisibleChipIds] = React.useState<ChipId[]>(defaultChipIds)

  const [suggestionsSkipped, setSuggestionsSkipped] = React.useState(false)
  const [appliedSuggested, setAppliedSuggested] = React.useState(false)

  const restoreDefaults = () => {
    // ✅ Restore to suggested baseline (matches your design intent)
    applySuggested?.()
    // If you prefer initial defaults instead, swap to:
    // resetDataParameters?.()

    setVisibleChipIds(defaultChipIds)
    setSuggestionsSkipped(false)
    setAppliedSuggested(false)

    addAssistantMessage("Restored data parameters to defaults.")
  }

  // Optional highlight (same pattern as other widgets)
  const [highlightTargetId, setHighlightTargetId] = React.useState<string | null>(null)

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
    setAppliedSuggested(false)
    setSuggestionsSkipped(false)
    setVisibleChipIds((prev) => prev.filter((x) => x !== chipId as ChipId))
  }

  const chips: SuggestionChip[] = React.useMemo(() => {
    const map: Record<ChipId, SuggestionChip> = {
      range: {
        id: "range",
        label: `${suggestedDataParameters.fromYear}-${suggestedDataParameters.toYear}`,
        targetId: "dp-time-range",
      },
    }
    return visibleChipIds.map((id) => map[id])
  }, [visibleChipIds, suggestedDataParameters.fromYear, suggestedDataParameters.toYear])

  // ---- Derived summary for footer + workflow card ----
  const summary = formatSummary(dataParameters)
  const suggestedSummary = formatSummary(suggestedDataParameters)

  // ---- Handlers ----
  const yearOptions = React.useMemo(() => years(1990, 2026), [])

  const onChangeFrom = (v: number) => {
    const nextFrom = v
    const nextTo = Math.max(dataParameters.toYear, nextFrom)
    setDataParameters({ fromYear: nextFrom, toYear: nextTo })
  }

  const onChangeTo = (v: number) => {
    const nextTo = v
    const nextFrom = Math.min(dataParameters.fromYear, nextTo)
    setDataParameters({ fromYear: nextFrom, toYear: nextTo })
  }

  const onApplySuggested = () => {
    applySuggested()
    setAppliedSuggested(true)
    addAssistantMessage(`✅ Applied suggested parameters: **${suggestedSummary}**.`)
  }

  const onSkipSuggested = () => {
    setSuggestionsSkipped(true)
    addAssistantMessage("Skipped suggestions — adjust the parameters manually if needed.")
  }

  const onNext = () => {
    markStepDone("dataParameter" as any, summary)
    setWorkflowStep("dataLibrary" as any, { status: "current" })

    addAssistantMessage(
      ["✅ Data parameters set.", `Proceeding to **Select variables** with: **${summary}**.`].join(
        "\n"
      )
    )

    transitionToWidget("dataLibrary" as any, { delayMs: 600 })
  }

  // ---- Guided intro message (sent once) ----
  const introSentRef = React.useRef(false)
  React.useEffect(() => {
    if (introSentRef.current) return
    introSentRef.current = true
    addAssistantMessage(buildDataParameterIntroMessage())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- Callout renderer ----
  const callout = (() => {
    const restoreDefaultsChip = (
      <button
        type="button"
        onClick={restoreDefaults}
        className="inline-flex items-center rounded-full border bg-background px-3 py-1 text-xs font-medium hover:bg-muted"
      >
        Restore defaults
      </button>
    )

    // ✅ KEY FIX:
    // When user comes back from step 3+, show ONLY Restore defaults (no Apply/Skip, no chips)
    if (hasVisitedLaterStep) {
      return (
        <WidgetCallout
          title="Suggested data parameters"
          headerOnly
          headerRight={restoreDefaultsChip}
        />
      )
    }

    // If suggestions are skipped OR user removed all chips -> header-only
    if (suggestionsSkipped || chips.length === 0) {
      return (
        <WidgetCallout
          title="Suggested data parameters"
          headerOnly
          headerRight={restoreDefaultsChip}
        />
      )
    }

    // If applied suggested -> compact applied state bar
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

    // Default suggestions state
    return (
      <WidgetCallout
        title="Suggested data parameters"
        badges={
          <SuggestionChips
            chips={chips}
            onRemove={onRemoveChip}
            onJump={onJumpTo}
            after={restoreDefaultsChip}
          />
        }
        left={
          <div className="text-sm text-foreground">
            <span className="font-medium">Time range</span>{" "}
            <span className="font-semibold">{suggestedSummary}</span>
          </div>
        }
        right={
          <>
            <Button onClick={onApplySuggested}>Apply suggestions</Button>
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
      title="Data parameter"
      description="Set time range and options before selecting variables."
      callout={callout}
      scroll="body"
      footerLeft={
        <div className="text-sm font-medium text-foreground">
          Time range <span className="font-semibold">{summary}</span>
        </div>
      }
      footerRight={<Button onClick={onNext}>Next - Select variables</Button>}
    >
      <div className="rounded-2xl bg-muted/40 p-6">
        <div id="dp-time-range" className={highlightWrap("dp-time-range")}>
          <div className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-12 sm:col-span-2 text-sm font-medium">
              Time range
            </div>
            <div className="col-span-12 sm:col-span-10 flex items-center gap-2">
              <Checkbox
                id="serious"
                checked={!!dataParameters.serious}
                onCheckedChange={(v) => setDataParameters({ serious: Boolean(v) })}
              />
              <Label htmlFor="serious">Serious</Label>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <RowSelect
              label="Type"
              value={dataParameters.type}
              onChange={(v) => setDataParameters({ type: v })}
              options={[
                { value: "fiscalYear", label: "Fiscal year" },
                { value: "calendarYear", label: "Calendar year" },
              ]}
            />

            <div className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-12 sm:col-span-2 text-sm font-medium">From</div>
              <div className="col-span-12 sm:col-span-2">
                <Select
                  value={String(dataParameters.fromYear)}
                  onValueChange={(v) => onChangeFrom(Number(v))}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-12 sm:col-span-1 text-sm font-medium sm:text-center">
                To
              </div>
              <div className="col-span-12 sm:col-span-5">
                <Select
                  value={String(dataParameters.toYear)}
                  onValueChange={(v) => onChangeTo(Number(v))}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <RowSelect
              label="Display order"
              value={dataParameters.displayOrder}
              onChange={(v) => setDataParameters({ displayOrder: v })}
              options={[
                { value: "newest", label: "Newest to oldest" },
                { value: "oldest", label: "Oldest to newest" },
              ]}
            />

            <RowSelect
              label="Finance period"
              value={dataParameters.financePeriod}
              onChange={(v) => setDataParameters({ financePeriod: v })}
              options={[
                { value: "FY0", label: "FY0" },
                { value: "FY1", label: "FY1" },
              ]}
            />

            <RowSwitch
              label="Roll periods"
              checked={!!dataParameters.rollPeriods}
              onCheckedChange={(v) => setDataParameters({ rollPeriods: v })}
            />

            <RowSwitch
              label="Add source"
              checked={!!dataParameters.addSource}
              onCheckedChange={(v) => setDataParameters({ addSource: v })}
            />

            <RowSwitch
              label="Include Partial year"
              checked={!!dataParameters.includePartialYear}
              onCheckedChange={(v) => setDataParameters({ includePartialYear: v })}
            />
          </div>
        </div>

        <Card className="mt-6 rounded-md border-none bg-slate-100 p-4 shadow-none">
          <div className="text-sm text-muted-foreground leading-relaxed">
            These parameters will apply to all variables you select in the next step.
            You can come back and edit them anytime before export.
          </div>
        </Card>
      </div>
    </WidgetLayout>
  )
}

function RowSelect(props: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="grid grid-cols-12 gap-2 items-center">
      <div className="col-span-12 sm:col-span-2 text-sm font-medium">{props.label}</div>
      <div className="col-span-12 sm:col-span-10">
        <Select value={props.value} onValueChange={props.onChange}>
          <SelectTrigger className="bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {props.options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

function RowSwitch(props: {
  label: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
}) {
  return (
    <div className="grid grid-cols-12 gap-2 items-center">
      <div className="col-span-12 sm:col-span-2 text-sm font-medium">{props.label}</div>
      <div className="col-span-12 sm:col-span-10 flex items-center">
        <Switch checked={props.checked} onCheckedChange={props.onCheckedChange} />
      </div>
    </div>
  )
}
