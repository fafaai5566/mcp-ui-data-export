"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type WidgetHeaderProps = {
  title: React.ReactNode
  description?: React.ReactNode
  right?: React.ReactNode
  meta?: React.ReactNode
  className?: string
}

export function WidgetHeader({
  title,
  description,
  right,
  meta,
  className,
}: WidgetHeaderProps) {
  return (
    <div className={cn("shrink-0", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xl font-semibold leading-tight">{title}</div>
          {description ? (
            <div className="mt-1 text-sm text-muted-foreground">{description}</div>
          ) : null}
          {meta ? <div className="mt-3">{meta}</div> : null}
        </div>

        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
    </div>
  )
}
