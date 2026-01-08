"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type WidgetFooterProps = {
  left?: React.ReactNode
  right?: React.ReactNode
  className?: string
}

export function WidgetFooter({ left, right, className }: WidgetFooterProps) {
  return (
    <div
      className={cn(
        "shrink-0 rounded-xl shadow-md border border-slate-200",
        className
      )}
    >
      <div className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">{left}</div>
          <div className="flex items-center gap-2">{right}</div>
        </div>
      </div>
    </div>
  )
}
