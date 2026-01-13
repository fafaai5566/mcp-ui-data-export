"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

import { useMcpStore } from "@/lib/store/useMcpStore"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"

import {
  categoryTree,
  dataItems,
  getDescendantCategoryIds,
  type DataItem,
} from "@/lib/data/dataLibraryMock"

type Props = {
  className?: string
}

export function DataItemsList({ className }: Props) {
  const activeCategoryId = useMcpStore((s) => s.libraryActiveCategoryId)
  const activeItemId = useMcpStore((s) => s.libraryActiveItemId)
  const setActiveItem = useMcpStore((s) => s.setLibraryActiveItem)

  const search = useMcpStore((s) => s.librarySearch).trim().toLowerCase()
  const selectedIds = useMcpStore((s) => s.librarySelectedIds)
  const toggleItem = useMcpStore((s) => s.toggleLibraryItem)

  const allowedCategoryIds = React.useMemo(
    () => new Set(getDescendantCategoryIds(categoryTree, activeCategoryId)),
    [activeCategoryId]
  )

  const filtered = React.useMemo(() => {
    return dataItems.filter((it) => {
      const inCategory = allowedCategoryIds.has(it.categoryId)
      const inSearch = !search || it.name.toLowerCase().includes(search)
      return inCategory && inSearch
    })
  }, [allowedCategoryIds, search])

  return (
    <div className={cn("h-full min-h-0", className)}>
      <ScrollArea className="h-full min-h-0">
        <div className="p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground">
              No data items match your filters.
            </div>
          ) : (
            filtered.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                checked={selectedIds.includes(item.id)}
                active={activeItemId === item.id}
                onToggle={() => toggleItem(item.id)}
                onPick={() => setActiveItem(item.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

function ItemRow(props: {
  item: DataItem
  checked: boolean
  active: boolean
  onToggle: () => void
  onPick: () => void
}) {
  const { item, checked, active, onToggle, onPick } = props

  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg px-2 py-2 hover:bg-muted/40 cursor-pointer",
        active && "bg-muted"
      )}
      onClick={onPick}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={onToggle}
        onClick={(e) => e.stopPropagation()}
      />
      <div className="text-sm leading-snug">{item.name}</div>
    </div>
  )
}
