"use client"

import * as React from "react"
import { Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { useMcpStore } from "@/lib/store/useMcpStore"

import { Input } from "@/components/ui/input"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { CategoryTree } from "./CategoryTree"
import { DataItemsList } from "./DataItemsList"
import { ItemDetails } from "./ItemDetails"

type RightPanelProps = {
  className?: string
}

/**
 * Right panel (All data items)
 * - Header: title + search input
 * - Section label: "Category"
 * - 3-column content: CategoryTree | DataItemsList | ItemDetails
 *
 * Designed to match the screenshot:
 *   - right side is a large card with internal scrolling per column
 *   - the outer card does NOT scroll; each inner column scrolls
 */
export function RightPanel({ className }: RightPanelProps) {
  const search = useMcpStore((s) => s.librarySearch)
  const setSearch = useMcpStore((s) => s.setLibrarySearch)

  return (
    <div
      className={cn(
        "h-full overflow-hidden flex flex-col p-4 pb-0",
        className
      )}
    >
      {/* Header */}
      <div className="shrink-0 p-0 border-none">
        <div className="font-semibold text-base">All data items</div>

        <div className="mt-3 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search data item"
            className="pl-9 bg-white"
          />
        </div>
      </div>

      {/* Section label */}
      <div className="shrink-0 px-0 pt-4 pb-2 text-sm font-medium">
        Category
      </div>

      {/* 3-column content area */}
      <div className="flex-1 min-h-0 px-0 pb-0 rounded-xl border bg-background">
        <ResizablePanelGroup direction="horizontal" className="h-full min-h-0">
          <ResizablePanel defaultSize={40} minSize={20}>
            <div className="h-full min-h-0 overflow-hidden flex flex-col">
              <CategoryTree className="flex-1 min-h-0" />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={35} minSize={20}>
            <div className="h-full min-h-0 overflow-hidden flex flex-col">
              <DataItemsList className="flex-1 min-h-0" />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={25} minSize={20}>
            <div className="h-full min-h-0 overflow-hidden flex flex-col">
              <ItemDetails className="flex-1 min-h-0" />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}
