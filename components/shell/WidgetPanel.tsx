"use client"

import { useMcpStore } from "@/lib/store/useMcpStore"
import { ScreenerWidget } from "@/components/widgets/screener/ScreenerWidget"

export function WidgetPanel() {
  const activeWidget = useMcpStore((s) => s.activeWidget)
  const isThinking = useMcpStore((s) => s.isThinking)

  return (
    <div className="h-full p-0">
        {isThinking ? (
          <div className="animate-pulse space-y-4 p-6">
              <div className="h-6 w-48 bg-muted rounded" />
              <div className="h-24 w-full bg-muted rounded" />
              <div className="h-10 w-2/3 bg-muted rounded" />
              <div className="h-64 w-full bg-muted rounded" />
            
          </div>
        ) : activeWidget === "screener" ? (
          <ScreenerWidget />
        ) : (
          
            <div className="text-muted-foreground">Widget: {activeWidget}</div>
          
        )}
      </div>
  
  )
}
