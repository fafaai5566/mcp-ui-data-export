"use client"

import { cn } from "@/lib/utils"
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable"
import { Button } from "@/components/ui/button"
import { PanelRightClose, PanelRightOpen } from "lucide-react"
import { useMcpStore } from "@/lib/store/useMcpStore"

import { ChatPanel } from "./ChatPanel"
import { WidgetPanel } from "./WidgetPanel"
import { WorkflowPanel } from "./WorkflowPanel"

export function AppShell() {
  const workflowCollapsed = useMcpStore((s) => s.workflowCollapsed)
  const setWorkflowCollapsed = useMcpStore((s) => s.setWorkflowCollapsed)

  return (
    <div className="h-dvh w-full bg-background">
      <ResizablePanelGroup direction="horizontal" className="h-full w-full">
        {/* Left: Chat */}
        <ResizablePanel
          defaultSize={22}
          minSize={22}
          maxSize={55}
          className="min-w-[280px]"
        >
          <ChatPanel />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Middle: Widget */}
        <ResizablePanel
          defaultSize={workflowCollapsed ? 68 : 48}
          minSize={30}
          className="min-w-[520px]"
        >
          <WidgetPanel />
        </ResizablePanel>

        {/* Right: Workflow (collapsible) */}
        {!workflowCollapsed && (
          <>
            <ResizableHandle withHandle />

            <ResizablePanel
              defaultSize={14}
              minSize={14}
              maxSize={28}
              className="min-w-[220px]"
            >
              <div className="h-full relative">
                <WorkflowPanel />

                {/* Optional: collapse button floating at top-right */}
                <div className="absolute right-3 top-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setWorkflowCollapsed(true)}
                    aria-label="Collapse workflow"
                  >
                    <PanelRightClose className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>

      {/* When collapsed, show a small “expand” affordance */}
      {workflowCollapsed && (
        <Button
          variant="outline"
          onClick={() => setWorkflowCollapsed(false)}
          className={cn("fixed right-3 top-3 z-50")}
          aria-label="Show workflow"
        >
          <PanelRightOpen className="h-5 w-5" />
          <span className="ml-0">Show workflow</span>
        </Button>
      )}
    </div>
  )
}
