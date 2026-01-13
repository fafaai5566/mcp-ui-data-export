"use client"

import * as React from "react"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"
import { useMcpStore } from "@/lib/store/useMcpStore"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"

import { dataItems } from "@/lib/data/dataLibraryMock"

type Props = {
  className?: string
}

export function SelectedItemsList({ className }: Props) {
  const selectedIds = useMcpStore((s) => s.librarySelectedIds)
  const activeItemId = useMcpStore((s) => s.libraryActiveItemId)

  const setActiveItem = useMcpStore((s) => s.setLibraryActiveItem)
  const toggleItem = useMcpStore((s) => s.toggleLibraryItem)

  const selectedItems = React.useMemo(() => {
    const byId = new Map(dataItems.map((d) => [d.id, d]))
    return selectedIds.map((id) => byId.get(id)).filter(Boolean)
  }, [selectedIds])

  return (
    <div className={cn("h-full min-h-0 bg-background", className)}>
      <ScrollArea className="h-full min-h-0">
        <div className="p-0 space-y-0">
          {selectedItems.length === 0 ? (
            <div className="text-sm p-4 text-muted-foreground">
              No selected items yet. Use the list on the right to add data items.
            </div>
          ) : (
            selectedItems.map((item) => {
              const isActive = item!.id === activeItemId
              return (
                <div
                  key={item!.id}
                  className={cn(
                    "group flex items-start gap-2 bg-background border-b px-3 py-2 cursor-pointer hover:bg-muted/30",
                    isActive && "bg-muted"
                  )}
                  onClick={() => setActiveItem(item!.id)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm leading-snug whitespace-normal break-words">
                      {item!.name}
                    </div>
                  </div>

                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 shrink-0 opacity-70 hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleItem(item!.id) // toggling removes it
                    }}
                    aria-label="Remove selected item"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )
            })
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
