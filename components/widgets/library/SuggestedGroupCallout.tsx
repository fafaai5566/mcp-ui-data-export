"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { WidgetCallout } from "@/components/widgets/shared/WidgetCallout"
import {
  SuggestionChips,
  type SuggestionChip,
} from "@/components/widgets/shared/SuggestionChips"

type SuggestedGroupCalloutProps = {
  /** Chips shown under the title (e.g. Environmental, Global parameters: 2000–2025) */
  chips: SuggestionChip[]

  /** Used for “Total X data items” + “Add X items” label */
  totalSuggested: number

  /** Primary action: add all suggested items */
  onAddAll: () => void

  /** Secondary action: clear/skip suggestions */
  onSkip: () => void

  /** Optional: remove a chip (if you support removing a suggestion pill) */
  onRemoveChip?: (id: string) => void

  /**
   * Optional: when user clicks a chip label, jump to a target section.
   * If omitted, defaults to scrollIntoView(targetId).
   */
  onJumpTo?: (targetId: string) => void

  /** Optional: add extra UI after chips (e.g. Restore defaults) */
  afterChips?: React.ReactNode

  /** Optional: override the title text */
  title?: React.ReactNode

  /** Optional: override the total label */
  totalLabel?: (n: number) => string

  /** Optional: disable buttons externally */
  disabled?: boolean

  className?: string
}

export function SuggestedGroupCallout({
  chips,
  totalSuggested,
  onAddAll,
  onSkip,
  onRemoveChip,
  onJumpTo,
  afterChips,
  title = "Suggested data items group",
  totalLabel = (n) => `Total ${n} data items`,
  disabled = false,
  className,
}: SuggestedGroupCalloutProps) {
  const canAct = !disabled && totalSuggested > 0

  const handleJump = React.useCallback(
    (targetId: string) => {
      if (onJumpTo) return onJumpTo(targetId)
      const el = document.getElementById(targetId)
      if (!el) return
      el.scrollIntoView({ behavior: "smooth", block: "center" })
    },
    [onJumpTo]
  )

  const handleRemove = React.useCallback(
    (id: string) => {
      // If you don’t want removal, just omit onRemoveChip
      onRemoveChip?.(id)
    },
    [onRemoveChip]
  )

  return (
    <WidgetCallout
      variant="subtle"
      className={className}
      title={title}
      headerRight={
        <div className="flex items-center gap-2">
          <Button onClick={onAddAll} disabled={!canAct}>
            Add {totalSuggested} items
          </Button>
          <Button variant="outline" onClick={onSkip} disabled={!canAct}>
            Skip suggestions
          </Button>
        </div>
      }
      badges={
        <SuggestionChips
          chips={chips}
          onRemove={handleRemove}
          onJump={handleJump}
          after={afterChips}
        />
      }
      left={<span className="text-sm font-medium">{totalLabel(totalSuggested)}</span>}
    />
  )
}
