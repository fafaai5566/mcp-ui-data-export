"use client"

import * as React from "react"
import { ChevronDown, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { useMcpStore } from "@/lib/store/useMcpStore"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"

import {
  categoryTree,
  dataItems,
  getDescendantCategoryIds,
  type CategoryNode,
} from "@/lib/data/dataLibraryMock"

type Props = {
  className?: string
}

export function CategoryTree({ className }: Props) {
  const activeCategoryId = useMcpStore((s) => s.libraryActiveCategoryId)
  const setActiveCategory = useMcpStore((s) => s.setLibraryActiveCategory)
  const selectedIds = useMcpStore((s) => s.librarySelectedIds)
  const toggleItem = useMcpStore((s) => s.toggleLibraryItem)

  // Expanded by default: root + Environmental (to match your screenshot)
  const [expanded, setExpanded] = React.useState<Set<string>>(
    () => new Set(["esg", "env"])
  )

  // Map selected item ids -> categories (leaf categories)
  const selectedCategoryIdSet = React.useMemo(() => {
    const set = new Set<string>()
    for (const id of selectedIds) {
      const item = dataItems.find((d) => d.id === id)
      if (item) set.add(item.categoryId)
    }
    return set
  }, [selectedIds])

  const selectedIdSet = React.useMemo(() => new Set(selectedIds), [selectedIds])

  const getItemIdsForCategory = React.useCallback((categoryId: string) => {
    const descendantCategoryIds = new Set(
      getDescendantCategoryIds(categoryTree, categoryId)
    )
    return dataItems
      .filter((item) => descendantCategoryIds.has(item.categoryId))
      .map((item) => item.id)
  }, [])

  const toggleCategoryItems = React.useCallback(
    (categoryId: string, shouldSelect: boolean) => {
      const itemIds = getItemIdsForCategory(categoryId)
      if (itemIds.length === 0) return

      itemIds.forEach((id) => {
        const isSelected = selectedIdSet.has(id)
        if (shouldSelect && !isSelected) {
          toggleItem(id)
        } else if (!shouldSelect && isSelected) {
          toggleItem(id)
        }
      })
    },
    [getItemIdsForCategory, selectedIdSet, toggleItem]
  )

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className={cn("h-full min-h-0", className)}>
      <ScrollArea className="h-full min-h-0">
        <div className="p-2">
          {categoryTree.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              depth={0}
              expanded={expanded}
              onToggleExpand={toggleExpand}
              activeCategoryId={activeCategoryId}
              onPick={setActiveCategory}
              selectedCategoryIdSet={selectedCategoryIdSet}
              selectedIdSet={selectedIdSet}
              getItemIdsForCategory={getItemIdsForCategory}
              onToggleCategoryItems={toggleCategoryItems}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

function TreeNode(props: {
  node: CategoryNode
  depth: number
  expanded: Set<string>
  onToggleExpand: (id: string) => void
  activeCategoryId?: string
  onPick: (id?: string) => void
  selectedCategoryIdSet: Set<string>
  selectedIdSet: Set<string>
  getItemIdsForCategory: (categoryId: string) => string[]
  onToggleCategoryItems: (categoryId: string, shouldSelect: boolean) => void
}) {
  const {
    node,
    depth,
    expanded,
    onToggleExpand,
    activeCategoryId,
    onPick,
    selectedCategoryIdSet,
    selectedIdSet,
    getItemIdsForCategory,
    onToggleCategoryItems,
  } = props
  const hasChildren = !!node.children?.length
  const isExpanded = expanded.has(node.id)
  const isActive = activeCategoryId === node.id

  const showLeafCheckbox = !hasChildren
  const leafChecked = showLeafCheckbox ? selectedCategoryIdSet.has(node.id) : false
  const itemIds = getItemIdsForCategory(node.id)
  const selectedCount = itemIds.reduce(
    (acc, id) => (selectedIdSet.has(id) ? acc + 1 : acc),
    0
  )
  const isChecked = itemIds.length > 0 && selectedCount === itemIds.length
  const isIndeterminate = selectedCount > 0 && selectedCount < itemIds.length

  return (
    <div>
      <div
        className={cn(
          "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/40 cursor-pointer",
          isActive && "bg-muted"
        )}
        style={{ paddingLeft: 8 + depth * 14 }}
        onClick={() => onPick(node.id)}
      >
        {/* Checkbox (parents + leaves) */}
        <Checkbox
          checked={
            showLeafCheckbox
              ? leafChecked
              : isChecked
              ? true
              : isIndeterminate
              ? "indeterminate"
              : false
          }
          onCheckedChange={() => {
            const shouldSelect = !isChecked
            onToggleCategoryItems(node.id, shouldSelect)
          }}
          onClick={(e) => e.stopPropagation()}
        />

        {/* Label */}
        <div className="min-w-0 flex-1 text-sm whitespace-normal break-words">
          {node.name}
          {typeof node.count === "number" ? (
            <span className="text-muted-foreground"> ({node.count})</span>
          ) : null}
        </div>

        {/* Expand / collapse chevron (right-aligned) */}
        {hasChildren ? (
          <button
            type="button"
            className="ml-2 inline-flex h-6 w-6 items-center justify-center text-foreground"
            onClick={(e) => {
              e.stopPropagation()
              onToggleExpand(node.id)
            }}
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : null}
      </div>

      {/* Children */}
      {hasChildren && isExpanded ? (
        <div className="mt-1">
          {node.children!.map((c) => (
            <TreeNode
              key={c.id}
              node={c}
              depth={depth + 1}
              expanded={expanded}
              onToggleExpand={onToggleExpand}
              activeCategoryId={activeCategoryId}
              onPick={onPick}
              selectedCategoryIdSet={selectedCategoryIdSet}
              selectedIdSet={selectedIdSet}
              getItemIdsForCategory={getItemIdsForCategory}
              onToggleCategoryItems={onToggleCategoryItems}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
