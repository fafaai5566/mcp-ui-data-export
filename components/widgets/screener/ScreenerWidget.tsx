"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

import { WidgetLayout } from "@/components/widgets/shared/WidgetLayout"
import { WidgetCallout } from "@/components/widgets/shared/WidgetCallout"
import {
  SuggestionChips,
  type SuggestionChip,
} from "@/components/widgets/shared/SuggestionChips"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"

import { CheckCircle2 } from "lucide-react"
import { useMcpStore, type FooterAction } from "@/lib/store/useMcpStore"




type Option = { label: string; value: string }

const NEXT_CTA_LABEL = "Next – Data parameters" // alt: "Next – Set time range"
const NEXT_CTA_ACTION: FooterAction = {
  type: "advanceWorkflow",
  from: "screener",
  to: "dataParameter",
}

function FieldRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-[180px_1fr] items-center gap-4 py-2">
      <div className="text-sm font-medium text-foreground">{label}</div>
      <div>{children}</div>
    </div>
  )
}

function ComboSelect({
  value,
  onChange,
  options,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
}: {
  value: string
  onChange: (v: string) => void
  options: Option[]
  placeholder?: string
  searchPlaceholder?: string
}) {
  const [open, setOpen] = React.useState(false)
  const selected = options.find((o) => o.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between font-normal">
          <span className="truncate">{selected?.label ?? placeholder}</span>
          <span className="ml-2 text-muted-foreground">▾</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.label}
                  onSelect={() => {
                    onChange(opt.value)
                    setOpen(false)
                  }}
                >
                  <span className="mr-2 inline-flex w-4 justify-center">
                    {opt.value === value ? "✓" : ""}
                  </span>
                  {opt.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}


//guided intro message
function buildScreenerIntroMessage(chips: { label: string }[]) {
  const lines = chips.map((c) => `- ${c.label}`).join("\n")
  const n = chips.length

  return [
    "Let’s start by defining the company universe in **Screener**.",
    `I’ve prepared a draft set of criteria — **not applied yet**:`,
    "",
    lines || "- (no suggestions)",
    "",
    "You can **remove a pill** to ignore it, or **click a pill** to jump to that filter (I’ll highlight it).",
    `When it looks right, click **Apply ${n} criteria**.`,
  ].join("\n")
}
// end guided intro message



type ChipId = "universe" | "listing" | "hq"

export function ScreenerWidget() {
  // --- demo state (move to Zustand later if you want) ---
  const totalCompanies = 12871

  const universeOptions: Option[] = [
    { label: "Public companies", value: "public" },
    { label: "Private companies", value: "private" },
  ]

  const listingOptions: Option[] = [
    { label: "Active, Inactive", value: "active_inactive" },
    { label: "Active only", value: "active" },
    { label: "Inactive only", value: "inactive" },
  ]

  const [universe, setUniverse] = React.useState("public")
  const [listingStatus, setListingStatus] = React.useState("active_inactive")


  // Suggested chips visibility
  const defaultChipIds: ChipId[] = ["universe", "listing", "hq"]
  const [visibleChipIds, setVisibleChipIds] =
    React.useState<ChipId[]>(defaultChipIds)

  // When true, we hide suggestions and show only "Restore defaults"
  const [suggestionsSkipped, setSuggestionsSkipped] = React.useState(false)

  const isModified =
    visibleChipIds.join("|") !== defaultChipIds.join("|")

  const restoreDefaults = () => {
  setVisibleChipIds(defaultChipIds)
  setSuggestionsSkipped(false)
  setAppliedCount(null)
  setWorkflowStep("screener", { status: "current", summary: undefined })
setWorkflowStep("dataParameter", { status: "upcoming", summary: undefined })

  setFooter({
  primaryLabel: NEXT_CTA_LABEL,
  primaryDisabled: true,
  primaryAction: NEXT_CTA_ACTION,
})


}


  // scroll highlight
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

  // Suggestion chips remove handler
  const onRemoveChip = (chipId: string) => {
  setSuggestionsSkipped(false)
  setAppliedCount(null)

  // disable CTA again until re-applied
  setFooter({
    primaryLabel: NEXT_CTA_LABEL,
    primaryDisabled: true,
    primaryAction: NEXT_CTA_ACTION,
  })

  setVisibleChipIds((prev) => prev.filter((x) => x !== chipId))
}


  // Add applied state + footer wiring

  const setFooter = useMcpStore((s) => s.setFooter)
  // optional but nice: keep workflow in sync
  const markStepDone = useMcpStore((s) => s.markStepDone)
  const setWorkflowStep = useMcpStore((s) => s.setWorkflowStep)
  const workflowSteps = useMcpStore((s) => s.workflowSteps)
  
  const hasVisitedLaterStep = React.useMemo(() => {
    const screenerIndex = workflowSteps.findIndex((x) => x.id === "screener")
    return workflowSteps.some(
      (step, i) => i > screenerIndex && step.status !== "upcoming"
    )
  }, [workflowSteps])

  const [appliedCount, setAppliedCount] = React.useState<number | null>(null)
  const showRestoreDefaults =
    isModified || suggestionsSkipped || appliedCount !== null


  //Guided intro message
  const addAssistantMessage = useMcpStore((s) => s.addAssistantMessage)
const introSentRef = React.useRef(false)


  // Add Apply handler
const onApplyCriteria = () => {
  const count = chips.length
  if (count === 0) return

  setAppliedCount(count)

  // Enable footer CTA (if you’re using store-driven footer)
  setFooter({
    leftLines: [`Total ${totalCompanies} companies`],
    primaryLabel: NEXT_CTA_LABEL,
    primaryDisabled: false,
    primaryAction: NEXT_CTA_ACTION,
  })

 setWorkflowStep("screener", { status: "current", summary: `Total ${totalCompanies} companies` })


  addAssistantMessage(
  [
    `✅ Applied **${count} criteria**.`,
    "",
    "Next, click **Next – Data parameters** to set the time range and options.",
    "You can always use **Restore defaults** to go back to the suggested setup.",
  ].join("\n")
)

}



  //end Apply handler

  const chips: SuggestionChip[] = React.useMemo(() => {
    const map: Record<ChipId, SuggestionChip> = {
      universe: {
        id: "universe",
        label:
          universeOptions.find((o) => o.value === universe)?.label ?? "Universe",
        targetId: "field-universe",
      },
      listing: {
        id: "listing",
        label:
          listingOptions.find((o) => o.value === listingStatus)?.label ??
          "Listing status",
        targetId: "field-listing",
      },
      hq: {
        id: "hq",
        label: "HQ - Europe",
        targetId: "section-preselected",
      },
    }

    return visibleChipIds.map((id) => map[id])
  }, [visibleChipIds, universe, listingStatus, universeOptions, listingOptions])

  // Pre-selected filter (as in your screenshot)
  const [preSelectedLabel] = React.useState("Country of incorporation")
  const [preSelectedSummary] = React.useState("Include Albania and 50 more")

  // Edit filter modal state
  const [editOpen, setEditOpen] = React.useState(false)
  const filterNameOptions: Option[] = [
    { label: "Country of incorporation", value: "incorporation" },
    { label: "Country of headquarters", value: "hq" },
  ]
  const includeExcludeOptions: Option[] = [
    { label: "Include", value: "include" },
    { label: "Exclude", value: "exclude" },
  ]

  const [editFilterName, setEditFilterName] = React.useState("hq")
  const [editMode, setEditMode] = React.useState("include")

  const regions = ["Asia", "Europe", "Africa", "Americas", "Oceania"]
  const [selectedRegions, setSelectedRegions] = React.useState<string[]>([
    "Europe",
  ])

  const toggleRegion = (r: string) => {
    setSelectedRegions((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
    )
  }

  //useEffect
React.useEffect(() => {
  setFooter({
    leftLines: [`Total ${totalCompanies} companies`],
    primaryLabel: NEXT_CTA_LABEL,
    primaryDisabled: appliedCount === null,
    primaryAction: NEXT_CTA_ACTION,
  })
}, [appliedCount, setFooter, totalCompanies])


//End useEffect


//guided intro message
React.useEffect(() => {
  if (introSentRef.current) return
  introSentRef.current = true

  addAssistantMessage(buildScreenerIntroMessage(chips))
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []) 

//end guided intro message


  return (
    <>
      <WidgetLayout
        title="Screener"
        description="Define the company universe and filters."
                callout={(() => {
  const isApplied = appliedCount !== null
  const isSkipped = suggestionsSkipped
  const noChips = chips.length === 0

  const restoreDefaultsChip = (
    <button
      type="button"
      onClick={restoreDefaults}
      className="inline-flex items-center rounded-full border bg-background px-3 py-1 text-xs font-medium hover:bg-muted"
    >
      Restore defaults
    </button>
  )

  // ✅ When user comes BACK from later steps, show only Restore defaults.
  // Title depends on whether they had applied suggestions before.
  if (hasVisitedLaterStep) {
    return (
      <WidgetCallout
        title={isApplied ? "Applied suggestion" : "Suggested criteria"}
        headerOnly
        headerRight={restoreDefaultsChip}
      />
    )
  }

  // ✅ Applied state (after clicking "Apply X criteria")
  if (isApplied) {
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

  // ✅ Skipped OR removed all chips => header-only + Restore defaults
  if (isSkipped || noChips) {
    return (
      <WidgetCallout
        title="Suggested criteria"
        headerOnly
        headerRight={restoreDefaultsChip}
      />
    )
  }

  // ✅ Default state (first time): NO restore defaults button
  return (
    <WidgetCallout
      title="Suggested criteria"
      badges={
        <SuggestionChips
          chips={chips}
          onRemove={onRemoveChip}
          onJump={onJumpTo}
          // ❌ don't pass restoreDefaults as a chip "after" item
        />
      }
      left={
        <span className="font-medium text-foreground">
          Total {totalCompanies} companies
        </span>
      }
      right={
        <>
          <Button disabled={chips.length === 0} onClick={onApplyCriteria}>
            Apply {chips.length} criteria
          </Button>
          <Button variant="secondary" onClick={() => setSuggestionsSkipped(true)}>
            Skip suggestions
          </Button>
        </>
      }
    />
  )
})()}


  




        
        scroll="body"
      >
        {/* One shared box for Universe + Filters */}
        <div className="rounded-2xl bg-muted/40 p-6">
          {/* Universe */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Universe</h3>

            <div id="field-universe" className={highlightWrap("field-universe")}>
              <FieldRow label="Universe">
                <ComboSelect
                  value={universe}
                  onChange={setUniverse}
                  options={universeOptions}
                  placeholder="Choose universe"
                  searchPlaceholder="Search universe…"
                />
              </FieldRow>
            </div>

            <div id="field-listing" className={highlightWrap("field-listing")}>
              <FieldRow label="Listing status">
                <ComboSelect
                  value={listingStatus}
                  onChange={setListingStatus}
                  options={listingOptions}
                  placeholder="Choose listing status"
                  searchPlaceholder="Search status…"
                />
              </FieldRow>
            </div>

            <FieldRow label="Include lists">
              <Button variant="outline" size="sm">
                Add
              </Button>
            </FieldRow>

            <FieldRow label="Exclude lists">
              <Button variant="outline" size="sm">
                Add
              </Button>
            </FieldRow>
          </div>

          <Separator className="my-6" />

          {/* Filters */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Filters</h3>

            <div className="flex gap-3">
              <div className="flex-1">
                <Input placeholder="Search filters" className="bg-background" />
              </div>
              <Button variant="outline">View all filters</Button>
            </div>

            <div className="pt-2">
              <div className="text-sm font-medium text-foreground">
                Quick filters
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" className="rounded-full">
                  Company market cap
                </Button>
                <Button variant="secondary" size="sm" className="rounded-full">
                  TRBC Industry name
                </Button>
                <Button variant="secondary" size="sm" className="rounded-full">
                  Average daily value traded - 52 weeks
                </Button>
              </div>
            </div>

            <div className="pt-4">
              <div className="text-sm font-medium text-foreground">
                Selected filters
              </div>

              <div
                id="section-preselected"
                className={highlightWrap("section-preselected")}
              >
                <Card className="mt-2 rounded-xl border bg-background p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold">
                        {preSelectedLabel}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {preSelectedSummary}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline">Remove</Button>
                      <Button variant="outline" onClick={() => setEditOpen(true)}>
                        Edit
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </WidgetLayout>

      {/* Edit filter modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit filter</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Filter name</div>
              <ComboSelect
                value={editFilterName}
                onChange={setEditFilterName}
                options={filterNameOptions}
                placeholder="Choose filter"
                searchPlaceholder="Search filter…"
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Mode</div>
              <ComboSelect
                value={editMode}
                onChange={setEditMode}
                options={includeExcludeOptions}
                placeholder="Include / Exclude"
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Items</div>
              <Input placeholder="Search (e.g. Europe)" />

              <div className="flex items-center justify-between text-sm">
                <Button
                  variant="ghost"
                  className="h-8 px-2"
                  onClick={() => setSelectedRegions(regions)}
                >
                  Select all
                </Button>
                <Button variant="ghost" className="h-8 px-2">
                  Expand all
                </Button>
              </div>

              <div className="space-y-1 rounded-lg border p-2">
                {regions.map((r) => (
                  <div
                    key={r}
                    className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={selectedRegions.includes(r)}
                      onCheckedChange={() => toggleRegion(r)}
                    />
                    <div className="text-sm">{r}</div>
                    <div className="ml-auto text-muted-foreground">▸</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setEditOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
