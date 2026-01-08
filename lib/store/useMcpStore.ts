"use client"

import { create } from "zustand"

// 1) Add "start" so page.tsx can compare activeWidget === "start"
export type WidgetId = "start" | "screener" | "dataLibrary" | "exporter"

// 2) Workflow steps should NOT include "start"
export type WorkflowStepId = Exclude<WidgetId, "start">

export type ChatRole = "user" | "assistant"
export type ChatMessage = {
  id: string
  role: ChatRole
  content: string
  createdAt: number
}

export type WorkflowStepStatus = "upcoming" | "current" | "done"

/**
 * UI state for styling cards (NOT the process status).
 * Pressed is handled via CSS `active:` in the button.
 */
export type WorkflowCardState = "default" | "selected" | "disabled"

export type WorkflowStep = {
  id: WorkflowStepId
  title: string
  subtitle: string
  status: WorkflowStepStatus
  /** Third line summary shown when status === "done" */
  summary?: string
}

export type WidgetFooterVariant = "default" | "progress"
export type WidgetFooterState = {
  variant: WidgetFooterVariant
  // Keep this as “data”, not ReactNode, so it’s safe in a store
  leftLines?: string[]
  primaryLabel?: string
  secondaryLabel?: string
  primaryDisabled?: boolean
  secondaryDisabled?: boolean
  progress?: {
    completed: number
    total: number
    percent: number
    label?: string
  }
}

export type McpState = {

  //push assistant message
  addAssistantMessage: (content: string) => void


  // App
  activeWidget: WidgetId
  setActiveWidget: (id: WidgetId) => void

  // Start screen
  startQuery: (text: string) => void

  // Chat
  messages: ChatMessage[]
  isThinking: boolean
  sendMessage: (text: string) => void

  // Workflow panel
  workflowCollapsed: boolean
  setWorkflowCollapsed: (next: boolean) => void
  toggleWorkflow: () => void
  workflowSteps: WorkflowStep[]
  setWorkflowStep: (id: WorkflowStepId, patch: Partial<WorkflowStep>) => void
  markStepDone: (id: WorkflowStepId, summary?: string) => void

  // Widget footer (state in store)
  footer: WidgetFooterState
  setFooter: (patch: Partial<WidgetFooterState>) => void
  resetFooter: () => void
}

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`
}

const initialWorkflowSteps: WorkflowStep[] = [
  {
    id: "screener",
    title: "Screener",
    subtitle: "Define universe & filters",
    status: "current",
    summary: "Total 12871 companies",
  },
  {
    id: "dataLibrary",
    title: "Data item library",
    subtitle: "Pick ESG variables",
    status: "upcoming",
  },
  {
    id: "exporter",
    title: "Data exporter",
    subtitle: "Export data",
    status: "upcoming",
  },
]

// Keep chat empty until the user clicks Send on StartScreen.
// (Otherwise you end up with duplicated “default” messages.)
const initialMessages: ChatMessage[] = []

export const useMcpStore = create<McpState>((set, get) => ({

  // push assistant message
  addAssistantMessage: (content) => {
  const msg: ChatMessage = {
    id: uid("m"),
    role: "assistant",
    content,
    createdAt: Date.now(),
  }
  set((s) => ({ messages: [...s.messages, msg] }))
},

  // App
  activeWidget: "start",
  setActiveWidget: (id) => set(() => ({ activeWidget: id })),

  // Start screen
  startQuery: (text) => {
    const trimmed = text.trim()
    if (!trimmed) return

    // Reset “session” state when starting
    set(() => ({
      activeWidget: "screener",
      workflowCollapsed: false,
      workflowSteps: initialWorkflowSteps.map((s) => ({ ...s })),
      footer: { variant: "default" },
      messages: [],
      isThinking: false,
    }))

    // Reuse the existing chat pipeline
    get().sendMessage(trimmed)
  },

  // Chat
  messages: initialMessages,
  isThinking: false,
  sendMessage: (text) => {
    const trimmed = text.trim()
    if (!trimmed) return

    const userMsg: ChatMessage = {
      id: uid("m"),
      role: "user",
      content: trimmed,
      createdAt: Date.now(),
    }

    set((s) => ({
      messages: [...s.messages, userMsg],
      isThinking: true,
    }))

    // Demo “assistant response”
    setTimeout(() => {
      const assistantMsg: ChatMessage = {
        id: uid("m"),
        role: "assistant",
        content: "Noted — updating the widget based on your request.",
        createdAt: Date.now(),
      }
      set((s) => ({
        messages: [...s.messages, assistantMsg],
        isThinking: false,
      }))
    }, 600)
  },

  // Workflow panel
  workflowCollapsed: false,
  setWorkflowCollapsed: (next) => set(() => ({ workflowCollapsed: next })),
  toggleWorkflow: () =>
    set((s) => ({ workflowCollapsed: !s.workflowCollapsed })),

  workflowSteps: initialWorkflowSteps,

  setWorkflowStep: (id, patch) =>
    set((s) => ({
      workflowSteps: s.workflowSteps.map((step) =>
        step.id === id ? { ...step, ...patch } : step
      ),
    })),

  markStepDone: (id, summary) =>
    set((s) => ({
      workflowSteps: s.workflowSteps.map((step) =>
        step.id === id
          ? {
              ...step,
              status: "done",
              summary: summary ?? step.summary,
            }
          : step
      ),
    })),

  // Footer
  footer: { variant: "default" },
  setFooter: (patch) =>
    set((s) => ({
      footer: { ...s.footer, ...patch },
    })),
  resetFooter: () => set(() => ({ footer: { variant: "default" } })),
}))
