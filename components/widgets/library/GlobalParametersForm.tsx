"use client"

import * as React from "react"

import { useMcpStore } from "@/lib/store/useMcpStore"
import { cn } from "@/lib/utils"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Props = {
  className?: string
}

export function GlobalParametersForm({ className }: Props) {
  const gp = useMcpStore((s) => s.libraryGlobalParams)
  const setGP = useMcpStore((s) => s.setLibraryGlobalParam)

  return (
    <div className={cn("h-full min-h-0", className)}>
      <ScrollArea className="h-full min-h-0">
        <div className="p-3 space-y-5">
          <div className="text-sm text-muted-foreground leading-relaxed">
            Applied to all selected items, you can click on the individual item
            to override the settings.
          </div>

          {/* Time range */}
          <section className="space-y-3">
            <div className="font-medium text-sm">Time range</div>

            <div className="flex items-center gap-2">
              <Switch
                checked={gp.serious}
                onCheckedChange={(v) => setGP("serious", v)}
                id="serious"
              />
              <Label htmlFor="serious">Serious</Label>
            </div>

            <div className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-3 text-sm text-muted-foreground">
                Last
              </div>

              <div className="col-span-4">
                <Select
                  value={String(gp.last)}
                  onValueChange={(v) => setGP("last", Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 10, 15, 20, 25].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-5">
                <Select
                  value={gp.periodType}
                  onValueChange={(v) => setGP("periodType", v as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FY">FY</SelectItem>
                    <SelectItem value="FQ">FQ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* Display order */}
          <RowSelect
            label="Display order"
            value={gp.displayOrder}
            onChange={(v) => setGP("displayOrder", v as any)}
            options={[
              { value: "newest", label: "Newest to oldest" },
              { value: "oldest", label: "Oldest to newest" },
            ]}
          />

          {/* Finance period */}
          <RowSelect
            label="Finance period"
            value={gp.financePeriod}
            onChange={(v) => setGP("financePeriod", v as any)}
            options={[
              { value: "FY0", label: "FY0" },
              { value: "FY1", label: "FY1" },
            ]}
          />

          {/* Booleans as True/False selects (matches your screenshot) */}
          <RowSelectBool
            label="Roll periods"
            value={gp.rollPeriods}
            onChange={(v) => setGP("rollPeriods", v)}
          />

          <RowSelectBool
            label="Add source"
            value={gp.addSource}
            onChange={(v) => setGP("addSource", v)}
          />

          <RowSelectBool
            label="Include Partial year"
            value={gp.includePartialYear}
            onChange={(v) => setGP("includePartialYear", v)}
          />
        </div>
      </ScrollArea>
    </div>
  )
}

function RowSelect(props: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="grid grid-cols-12 gap-2 items-center">
      <div className="col-span-5 text-sm text-muted-foreground">
        {props.label}
      </div>
      <div className="col-span-7">
        <Select value={props.value} onValueChange={props.onChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {props.options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

function RowSelectBool(props: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <RowSelect
      label={props.label}
      value={String(props.value)}
      onChange={(v) => props.onChange(v === "true")}
      options={[
        { value: "true", label: "True" },
        { value: "false", label: "False" },
      ]}
    />
  )
}
