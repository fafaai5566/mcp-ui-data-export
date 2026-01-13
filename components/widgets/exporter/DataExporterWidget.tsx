"use client"

import * as React from "react"
import { CheckCircle2, Download, FolderOpen, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { useMcpStore } from "@/lib/store/useMcpStore"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

import { WidgetLayout } from "@/components/widgets/shared/WidgetLayout"

// -------------------------
// Types
// -------------------------
type ExportShape = "long" | "wide"
type ExportFormat = "csv" | "parquet"
type ExportStatus = "idle" | "exporting" | "done" | "canceled" | "error"

// -------------------------
// Small helpers (mock/demo)
// -------------------------
function formatBytesMB(mb: number) {
  return `${mb.toFixed(1)}M`
}

function estimateFileSizeMB(args: {
  companies: number
  years: number
  dataItems: number
  shape: ExportShape
  format: ExportFormat
}) {
  // This is a *mock* estimator just to drive the UI.
  const base =
    args.shape === "long"
      ? args.companies * args.years * args.dataItems * 0.000002
      : args.companies * args.years * args.dataItems * 0.0000009

  const compressionFactor = args.format === "parquet" ? 0.35 : 1
  const mb = Math.max(1, base * compressionFactor)
  return mb
}

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function buildSample(shape: ExportShape) {
  if (shape === "long") {
    return [
      "ISIN,Year,Variable,Value",
      "SE0000114837,2000,ESG score,72.1",
      "SE0000114837,2000,Water incidents,3",
      "SE0000114837,2001,ESG score,70",
      "SE0000114837,2001,Water incidents,4",
    ].join("\n")
  }

  // wide
  return [
    "ISIN,Year,ESG score,Water incidents",
    "SE0000114837,2000,72.1,3",
    "SE0000114837,2001,70,4",
  ].join("\n")
}

// -------------------------
// Dialog: choose save location (mock path)
// -------------------------
function ChooseLocationDialog(props: {
  open: boolean
  onOpenChange: (v: boolean) => void
  value: string
  onChange: (v: string) => void
  onConfirm: () => void
}) {
  const { open, onOpenChange, value, onChange, onConfirm } = props

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Choose export location</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">
            For this demo, we store a “path string” (we don’t actually write to disk in-browser).
          </div>
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder='e.g. Local D:/ESG data'
          />
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={!value.trim()}>
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// -------------------------
// Main widget
// -------------------------
export function DataExporterWidget() {
  // Store
  const addAssistantMessage = useMcpStore((s) => s.addAssistantMessage)
  const setWorkflowStep = useMcpStore((s) => s.setWorkflowStep)
  const markStepDone = useMcpStore((s) => s.markStepDone)

  const dataParameters = useMcpStore((s) => (s as any).dataParameters)
  const librarySelectedIds = useMcpStore((s) => (s as any).librarySelectedIds) as
    | string[]
    | undefined

  // Local UI state
  const [shape, setShape] = React.useState<ExportShape>("long")
  const [format, setFormat] = React.useState<ExportFormat>("csv")
  const [saveTo, setSaveTo] = React.useState<string>("")
  const [status, setStatus] = React.useState<ExportStatus>("idle")

  const [chooseOpen, setChooseOpen] = React.useState(false)

  // Export progress (mock)
  const totalFiles: number = 26
// or: const totalFiles = 26 as number

  const [filesCompleted, setFilesCompleted] = React.useState(0)
  const timerRef = React.useRef<number | null>(null)
  const exportRunRef = React.useRef(false)

  // Derived content (use your store values where possible; fallback to your screenshot constants)
  const totalCompanies = 12871
  const fromYear = dataParameters?.fromYear ?? 2000
  const toYear = dataParameters?.toYear ?? 2025
  const yearCount = Math.max(1, toYear - fromYear + 1)
  const yearTypeLabel = dataParameters?.type === "calendarYear" ? "Calendar year" : "Fiscal year"

  const dataItems = (librarySelectedIds?.length ?? 0) || 723 // fallback to screenshot number
  const missing = "NA"

  const fileSizeMB = estimateFileSizeMB({
    companies: totalCompanies,
    years: yearCount,
    dataItems,
    shape,
    format,
  })

  const percent = totalFiles === 0 ? 0 : Math.round((filesCompleted / totalFiles) * 100)

  // Intro message (sent once)
  const introSentRef = React.useRef(false)
  React.useEffect(() => {
    if (introSentRef.current) return
    introSentRef.current = true

    addAssistantMessage(
      [
        "**Data exporter**",
        "",
        "Your dataset is ready to export.",
        "",
        "Choose:",
        "",
        "Format: Long (one row per ISIN–Year–Variable) or Wide (variables as columns)",
        "File type: CSV or Parquet",
        "Save to: choose a folder",
        "",
        "Next:",
        "",
        "Download a sample to validate the structure.",
        "When it looks right, click **Start export**.",
      ].join("\n")
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep workflow summary updated (right panel)
  React.useEffect(() => {
    const summary = `${shape === "long" ? "Long" : "Wide"} format, ${format.toUpperCase()} • File size est. ${formatBytesMB(fileSizeMB)}`
    setWorkflowStep("exporter", { summary })
  }, [shape, format, fileSizeMB, setWorkflowStep])

  // Cleanup timer
  React.useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [])

  const canStart = !!saveTo.trim() && status === "idle"

  const onDownloadSample = () => {
    const content = buildSample(shape)
    downloadTextFile(`sample_${shape}.${format === "csv" ? "csv" : "txt"}`, content)
    addAssistantMessage("Downloaded a sample preview using your current export shape.")
  }

  const startExport = () => {
    if (exportRunRef.current || status !== "idle") return
    exportRunRef.current = true
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }

    setStatus("exporting")
    setFilesCompleted(0)
    addAssistantMessage(
      `Started export: **${shape}**, **${format.toUpperCase()}**, saving to **${saveTo}**.`
    )

    // mock progress tick
    timerRef.current = window.setInterval(() => {
      setFilesCompleted((prev) => {
        const next = Math.min(totalFiles, prev + 1)
        if (next >= totalFiles) {
          if (timerRef.current) window.clearInterval(timerRef.current)
          timerRef.current = null
          setStatus("done")
          exportRunRef.current = false
          markStepDone("exporter", "Export completed")
          addAssistantMessage("✅ Export completed. You can open the export location or export again.")
        }
        return next
      })
    }, 350)
  }

  const cancelExport = () => {
    if (timerRef.current) window.clearInterval(timerRef.current)
    timerRef.current = null
    exportRunRef.current = false
    setStatus("canceled")
    addAssistantMessage("Export canceled.")
  }

  const exportAgain = () => {
    setStatus("idle")
    setFilesCompleted(0)
  }

  const openExportLocation = () => {
    // In a real desktop app you’d open Finder/Explorer. In a web demo, you can only simulate.
    addAssistantMessage(`Open export location: **${saveTo}** (demo action).`)
  }

  // Footer (3 states)
  const footer = (() => {
    if (status === "exporting") {
      return (
        <div className="shrink-0 rounded-xl shadow-md border border-slate-200">
          <div className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 space-y-1">
                <div className="text-sm font-medium text-foreground">
                  Files completed{" "}
                  <span className="font-semibold">
                    {filesCompleted}/{totalFiles}
                  </span>{" "}
                  <span className="text-muted-foreground">{percent}%</span>
                </div>
                <div className="text-sm text-foreground">
                  Save to <span className="font-semibold">{saveTo}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={cancelExport}>
                  Cancel
                </Button>
                <Button disabled className="gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Exporting...
                </Button>
              </div>
            </div>

            <Progress value={percent} />
          </div>
        </div>
      )
    }

    if (status === "done") {
      return (
        <div className="shrink-0 rounded-xl shadow-md border border-slate-200">
          <div className="p-4 flex items-center justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <CheckCircle2 className="h-4 w-4" />
                Export completed
              </div>
              <div className="text-sm text-foreground">
                Save to <span className="font-semibold">{saveTo}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={exportAgain}>
                Export again
              </Button>
              <Button onClick={openExportLocation}>Open export location</Button>
            </div>
          </div>
        </div>
      )
    }

    // idle / canceled / error
    return (
      <div className="shrink-0 rounded-xl shadow-md border border-slate-200">
        <div className="p-4 flex items-center justify-between gap-4">
          <div className="min-w-0 text-sm text-muted-foreground">
            {status === "canceled" ? "Export canceled. Adjust settings or start again." : ""}
          </div>
          <Button onClick={startExport} disabled={!canStart}>
            Start export
          </Button>
        </div>
      </div>
    )
  })()

  return (
    <>
      <WidgetLayout
        title="Data exporter"
        description="Export your dataset."
        footer={footer}
        scroll="body"
      >
        {/* Content summary */}
        <div className="mt-6 rounded-2xl bg-muted/40 p-6">
          <div className="text-base font-semibold mb-4">Content</div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground w-40 shrink-0">
                Total companies:
              </span>
              <span className="font-semibold">{totalCompanies}</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-muted-foreground w-40 shrink-0">
                Data items:
              </span>
              <span className="font-semibold">{dataItems}</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-muted-foreground w-40 shrink-0">
                Time range:
              </span>
              <span className="font-semibold">
                {fromYear}-{toYear} ({yearTypeLabel})
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-muted-foreground w-40 shrink-0">
                Missing:
              </span>
              <span className="font-semibold">{missing}</span>
            </div>

            <div className="flex items-center gap-3 sm:col-span-2">
              <span className="text-muted-foreground w-40 shrink-0">
                File size estimate:
              </span>
              <span className="font-semibold">{formatBytesMB(fileSizeMB)}</span>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="mt-6 rounded-2xl bg-muted/40 p-6">
          <div className="text-base font-semibold mb-4">Settings</div>

          {/* Export format (shape) */}
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium w-28">Export format</div>
            <div className="flex items-center gap-2">
              <Button
                variant={shape === "long" ? "default" : "secondary"}
                onClick={() => setShape("long")}
                disabled={status === "exporting"}
              >
                Long
              </Button>
              <Button
                variant={shape === "wide" ? "default" : "secondary"}
                onClick={() => setShape("wide")}
                disabled={status === "exporting"}
              >
                Wide
              </Button>
            </div>
          </div>

          {/* Preview + download sample */}
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm font-medium">Preview format</div>
            <Button
              variant="secondary"
              className="gap-2"
              onClick={onDownloadSample}
              disabled={status === "exporting"}
            >
              <Download className="h-4 w-4" />
              Download sample
            </Button>
          </div>

          {/* Preview table */}
          <div className="mt-4 overflow-hidden rounded-xl border bg-white">
            <div className="grid grid-cols-4 gap-2 px-4 py-3 text-sm font-semibold border-b bg-slate-50">
              {shape === "long" ? (
                <>
                  <div>ISIN</div>
                  <div>Year</div>
                  <div>Variable</div>
                  <div className="text-right">Value</div>
                </>
              ) : (
                <>
                  <div>ISIN</div>
                  <div>Year</div>
                  <div>ESG score</div>
                  <div className="text-right">Water incidents</div>
                </>
              )}
            </div>

            {/* rows */}
            <div className="divide-y text-sm">
              {shape === "long" ? (
                <>
                  <Row cols={["SE0000114837", "2000", "ESG score", "72.1"]} />
                  <Row cols={["SE0000114837", "2000", "Water incidents", "3"]} />
                  <Row cols={["SE0000114837", "2001", "ESG score", "70"]} />
                  <Row cols={["SE0000114837", "2001", "Water incidents", "4"]} />
                  <Row cols={["SE0000114837", "2001", "Water incidents", "4"]} />
                </>
              ) : (
                <>
                  <Row cols={["SE0000114837", "2000", "72.1", "3"]} />
                  <Row cols={["SE0000114837", "2001", "70", "4"]} />
                </>
              )}
            </div>
          </div>

          {/* Export as */}
          <div className="mt-6 flex items-center gap-4">
            <div className="text-sm font-medium w-28">Export as</div>
            <div className="flex items-center gap-2">
              <Button
                variant={format === "csv" ? "default" : "secondary"}
                onClick={() => setFormat("csv")}
                disabled={status === "exporting"}
              >
                CSV
              </Button>
              <Button
                variant={format === "parquet" ? "default" : "secondary"}
                onClick={() => setFormat("parquet")}
                disabled={status === "exporting"}
              >
                Parquet
              </Button>
            </div>
          </div>

          {/* Save to */}
          <div className="mt-6 flex items-center gap-4">
            <div className="text-sm font-medium w-28">Save to</div>

            {!saveTo ? (
              <Button
                variant="secondary"
                className="gap-2"
                onClick={() => setChooseOpen(true)}
                disabled={status === "exporting"}
              >
                <FolderOpen className="h-4 w-4" />
                Choose
              </Button>
            ) : (
              <div className="flex items-center gap-3">
                <div className="text-sm">
                  <span className="text-muted-foreground">Local</span>{" "}
                  <span className="font-semibold">{saveTo}</span>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => setChooseOpen(true)}
                  disabled={status === "exporting"}
                >
                  Change
                </Button>
              </div>
            )}
          </div>
        </div>
      </WidgetLayout>

      {/* Choose location dialog */}
      <ChooseLocationDialog
        open={chooseOpen}
        onOpenChange={setChooseOpen}
        value={saveTo}
        onChange={setSaveTo}
        onConfirm={() => {
          setChooseOpen(false)
          addAssistantMessage(`Save location set to: **${saveTo.trim()}**.`)
        }}
      />
    </>
  )
}

function Row({ cols }: { cols: string[] }) {
  return (
    <div className="grid grid-cols-4 gap-2 px-4 py-3">
      <div className="truncate">{cols[0]}</div>
      <div>{cols[1]}</div>
      <div className="truncate">{cols[2]}</div>
      <div className="text-right">{cols[3]}</div>
    </div>
  )
}
