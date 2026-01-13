"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { useMcpStore } from "@/lib/store/useMcpStore"

import { SelectedItemsList } from "./SelectedItemsList"

type LeftPanelProps = {
  className?: string
}

export function LeftPanel({ className }: LeftPanelProps) {
  const selectedCount = useMcpStore((s) => s.librarySelectedIds.length)

  return (
    <div
      className={cn(
        "h-full min-h-0 p-4 pb-0 overflow-hidden flex flex-col",
        className
      )}
    >
      <div className="flex-1 min-h-0 flex flex-col">
        
        <div className="font-semibold text-base pb-2">Selected items</div>
        

        <div className="flex-1 min-h-0 overflow-hidden border rounded-xl">
          <SelectedItemsList />
        </div>
      </div>
    </div>
  )
}
