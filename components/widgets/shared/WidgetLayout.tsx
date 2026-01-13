"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useMcpStore } from "@/lib/store/useMcpStore"
import { Button } from "@/components/ui/button"
import { WidgetFooter } from "./WidgetFooter"

type WidgetLayoutProps = {
  title: string
  description?: string

  callout?: React.ReactNode

  children?: React.ReactNode

  /** Provide a fully custom footer (overrides footerLeft/footerRight + store footer) */
  footer?: React.ReactNode

  /** Optional footer areas (if you pass these, they override store-driven footer) */
  footerLeft?: React.ReactNode
  footerRight?: React.ReactNode

  /** Hide footer entirely */
  hideFooter?: boolean

  className?: string
  footerClassName?: string

  //scroll//
    scroll?: "layout" | "body"

}

export function WidgetLayout({
  title,
  description,
  callout,
  children,
  footer,
  footerLeft,
  footerRight,
  scroll = "body",
  hideFooter = false,
  className,
  footerClassName,
}: WidgetLayoutProps) {
    const layoutScroll = scroll === "layout"

  const footerState = useMcpStore((s) => s.footer)
  const runFooterAction = useMcpStore((s) => s.runFooterAction)

  const storeFooterLeft =
    footerState?.leftLines && footerState.leftLines.length > 0 ? (
      <div className="space-y-1">
        {footerState.leftLines.map((line) => (
          <div key={line} className="text-sm font-medium text-foreground">
            {line}
          </div>
        ))}
      </div>
    ) : null

  const storeFooterRight =
    footerState?.primaryLabel || footerState?.secondaryLabel ? (
      <div className="flex items-center gap-2">
        {footerState.secondaryLabel ? (
          <Button
            variant="secondary"
            disabled={!!footerState.secondaryDisabled}
            onClick={() => runFooterAction(footerState.secondaryAction)}
          >
            {footerState.secondaryLabel}
          </Button>
        ) : null}

        {footerState.primaryLabel ? (
          <Button
            disabled={!!footerState.primaryDisabled}
            onClick={() => runFooterAction(footerState.primaryAction)}
          >
            {footerState.primaryLabel}
          </Button>
        ) : null}
      </div>
    ) : null

  // If the caller provided footerLeft/right, use them. Otherwise, fall back to store.
  const resolvedFooterLeft = footerLeft ?? storeFooterLeft
  const resolvedFooterRight = footerRight ?? storeFooterRight

  const shouldShowFooter =
    !hideFooter && (footer || resolvedFooterLeft || resolvedFooterRight)

  return (
    <div className={cn("flex h-full flex-col overflow-hidden", className)}>
      {/* Header */}
      <div className="shrink-0">
        <div className="px-8 pt-8">
          <div className="text-2xl font-semibold">{title}</div>
          {description ? (
            <div className="mt-1 text-sm text-muted-foreground">
              {description}
            </div>
          ) : null}
        </div>

        {callout ? <div className="px-8 pb-4 pt-4">{callout}</div> : null}
      </div>

      {/* Body */}
      <div
  className={cn(
    "flex-1 min-h-0 px-8",
    layoutScroll ? "overflow-hidden" : "overflow-auto"
  )}
>
  {children}
</div>

      {/* Footer */}
      {shouldShowFooter ? (
        <div className="shrink-0 pt-4 px-8 pb-8">
          {footer ? (
            footer
          ) : (
            <WidgetFooter
              className={footerClassName}
              left={resolvedFooterLeft}
              right={resolvedFooterRight}
            />
          )}
        </div>
      ) : null}
    </div>
  )
}
