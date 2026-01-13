"use client"

import * as React from "react"
import { useMcpStore } from "@/lib/store/useMcpStore"

import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

import { dataItems } from "@/lib/data/dataLibraryMock"

type Props = {
  className?: string
}

export function ItemDetails({ className }: Props) {
  const activeItemId = useMcpStore((s) => s.libraryActiveItemId)
  const item = React.useMemo(
    () => dataItems.find((d) => d.id === activeItemId),
    [activeItemId]
  )

  if (!item) {
    return (
      <div className={cn("h-full p-3 text-sm text-muted-foreground", className)}>
        Select a data item to see details.
      </div>
    )
  }

  return (
    <div className={cn("h-full min-h-0 flex flex-col", className)}>
      <div className="p-2 border-b">
        <div className="px-1 font-medium">Definition</div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-3 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
            {item.definition}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
