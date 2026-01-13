import * as React from "react"
import { cn } from "@/lib/utils"

type WidgetCalloutProps = {
  title: React.ReactNode
  description?: string

  badges?: React.ReactNode
  left?: React.ReactNode
  right?: React.ReactNode

  headerRight?: React.ReactNode
  headerOnly?: boolean

  variant?: "default" | "subtle"
  className?: string
}

export function WidgetCallout({
  title,
  description,
  badges,
  left,
  right,
  headerRight,
  headerOnly = false,
  variant = "default",
  className,
}: WidgetCalloutProps) {
  const rootClass =
    variant === "subtle"
      ? "rounded-xl border bg-sky-50/60 p-4"
      : "rounded-xl border bg-sky-50/60 p-4"

  return (
    <section className={cn(rootClass, "shadow-none", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-lg font-semibold leading-6">{title}</div>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>

        {headerRight ? <div className="shrink-0">{headerRight}</div> : null}
      </div>

      {headerOnly ? null : (
        <>
          {badges ? <div className="mt-4">{badges}</div> : null}

          {left || right ? (
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {left ? (
                <div className="text-sm text-foreground">{left}</div>
              ) : (
                <div />
              )}
              {right ? (
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  {right}
                </div>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </section>
  )
}
