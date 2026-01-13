"use client"

import { useMcpStore } from "@/lib/store/useMcpStore"
import { ScreenerWidget } from "@/components/widgets/screener/ScreenerWidget"
import { DataLibraryWidget } from "@/components/widgets/library/DataLibraryWidget"
import { DataParameterWidget } from "@/components/widgets/parameter/DataParameterWidget"


export function WidgetPanel() {
  const activeWidget = useMcpStore((s) => s.activeWidget)
  const isThinking = useMcpStore((s) => s.isThinking)
  const isWidgetLoading = useMcpStore((s) => s.isWidgetLoading)

  const showSkeleton = isWidgetLoading || isThinking

  return (
    <div className="h-full p-0">
      {showSkeleton ? (
        <div className="animate-pulse space-y-4 p-6">
          <div className="h-6 w-48 bg-muted rounded" />
          <div className="h-24 w-full bg-muted rounded" />
          <div className="h-10 w-2/3 bg-muted rounded" />
          <div className="h-64 w-full bg-muted rounded" />
        </div>
      ) : activeWidget === "screener" ? (
        <ScreenerWidget />
      ) : activeWidget === "dataParameter" ? (
  <DataParameterWidget />
      ) : activeWidget === "dataLibrary" ? (
        <DataLibraryWidget />
      ) : (
        <div className="text-muted-foreground">Widget: {activeWidget}</div>
      )}
    </div>
  )
}
