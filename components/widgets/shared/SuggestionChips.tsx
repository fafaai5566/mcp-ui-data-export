"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export type SuggestionChip = {
  id: string
  label: string
  targetId: string // element id to scroll to
}

type Props = {
  chips: SuggestionChip[]
  onRemove: (id: string) => void
  onJump: (targetId: string) => void
  className?: string
  after?: React.ReactNode
}


export function SuggestionChips({ chips, onRemove, onJump, className, after }: Props) {

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {chips.map((chip) => (
        <div
          key={chip.id}
          className={cn(
            "inline-flex items-center overflow-hidden rounded-full border bg-background shadow-none"
          )}
          
        >
          {/* Jump button */}
          <button
            type="button"
            onClick={() => onJump(chip.targetId)}
            className={cn(
              "px-2.5 h-7 text-xs font-medium",
              "hover:bg-muted transition",
              "focus:outline-none focus:ring-2 focus:ring-primary/30"
            )}
          >
            {chip.label}
          </button>

          {/* Remove button (NOT nested inside the jump button) */}
          <button
            type="button"
            aria-label={`Remove ${chip.label}`}
            onClick={() => onRemove(chip.id)}
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center",
              "hover:bg-muted transition",
              "focus:outline-none focus:ring-2 focus:ring-primary/30"
            )}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      {/* 👇 ADD IT HERE */}
      {after ? after : null}
    </div>
  )
}
