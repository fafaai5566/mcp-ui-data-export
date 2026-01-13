"use client"

import { create, type StateCreator } from "zustand"

import {
  categoryTree,
  dataItems,
  getDescendantCategoryIds,
  esgBaselineItemIds,
} from "@/lib/data/dataLibraryMock"

// -------------------------
// Types
// -------------------------

export type WidgetId =
  | "start"
  | "screener"
  | "dataParameter"
  | "dataLibrary"
  | "exporter"

export type WorkflowStepId = Exclude<WidgetId, "start">

export type ChatRole = "user" | "assistant"
export type ChatMessage = {
  id: string
  role: ChatRole
  content: string
  createdAt: number
}

export type WorkflowStepStatus = "upcoming" | "current" | "done"

export type WorkflowCardState = "default" | "selected" | "disabled"

export type WorkflowStep = {
  id: WorkflowStepId
  title: string
  subtitle: string
  status: WorkflowStepStatus
  summary?: string
}

export type WidgetFooterVariant = "default" | "progress"

export type FooterAction =
  | { type: "setActiveWidget"; widget: WidgetId }
  | { type: "advanceWorkflow"; from: WorkflowStepId; to: WorkflowStepId }
  | { type: "noop" }

export type WidgetFooterState = {
  variant: WidgetFooterVariant
  leftLines?: string[]
  primaryLabel?: string
  secondaryLabel?: string
  primaryDisabled?: boolean
  secondaryDisabled?: boolean
  primaryAction?: FooterAction
  secondaryAction?: FooterAction
  progress?: {
    completed: number
    total: number
    percent: number
    label?: string
  }
}

/** Data Parameter (step 2) schema */
export type DataParameters = {
  type: "fiscalYear" | "calendarYear"
  fromYear: number
  toYear: number
  displayOrder: "newest" | "oldest"
  financePeriod: "FY0" | "FY1"
  rollPeriods: boolean
  addSource: boolean
  includePartialYear: boolean
  serious: boolean
}

/** Data Library - global parameter schema (kept for compatibility) */
export type LibraryGlobalParams = {
  last: number
  periodType: "FY" | "FQ"
  displayOrder: "newest" | "oldest"
  financePeriod: "FY0" | "FY1"
  rollPeriods: boolean
  addSource: boolean
  includePartialYear: boolean
  serious: boolean
}

export type LibrarySuggestionState = "pending" | "applied" | "skipped"

// -------------------------
// Store (combined state type)
// -------------------------
export type McpState = {
  // App
  activeWidget: WidgetId
  setActiveWidget: (id: WidgetId) => void
  isWidgetLoading: boolean
  transitionToWidget: (next: WidgetId, opts?: { delayMs?: number }) => void

  // Start screen
  startQuery: (text: string) => void

  // Chat
  messages: ChatMessage[]
  isThinking: boolean
  sendMessage: (text: string) => void
  addAssistantMessage: (content: string) => void

  // Workflow panel
  workflowCollapsed: boolean
  setWorkflowCollapsed: (next: boolean) => void
  toggleWorkflow: () => void
  workflowSteps: WorkflowStep[]
  setWorkflowStep: (id: WorkflowStepId, patch: Partial<WorkflowStep>) => void
  markStepDone: (id: WorkflowStepId, summary?: string) => void
  advanceTo: (from: WorkflowStepId, to: WorkflowStepId) => void

  // Footer
  footer: WidgetFooterState
  setFooter: (patch: Partial<WidgetFooterState>) => void
  resetFooter: () => void
  runFooterAction: (action?: FooterAction) => void

  // Data Parameter (step 2)
  dataParameters: DataParameters
  suggestedDataParameters: DataParameters
  setDataParameters: (patch: Partial<DataParameters>) => void
  applySuggestedDataParameters: () => void
  resetDataParameters: () => void

  // Data Library
  librarySelectedIds: string[]
  librarySuggestedIds: string[]
  librarySuggestionState: LibrarySuggestionState

  libraryActiveCategoryId?: string
  libraryActiveItemId?: string
  librarySearch: string
  libraryGlobalParams: LibraryGlobalParams

  toggleLibraryItem: (id: string) => void
  applyLibrarySuggestions: () => void
  skipLibrarySuggestions: () => void
  setLibraryActiveCategory: (id?: string) => void
  setLibraryActiveItem: (id?: string) => void
  setLibrarySearch: (v: string) => void
  setLibraryGlobalParam: <K extends keyof LibraryGlobalParams>(
    k: K,
    v: LibraryGlobalParams[K]
  ) => void
  resetLibrary: () => void
}

// -------------------------
// Helpers / initial state
// -------------------------
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
    id: "dataParameter",
    title: "Data parameter",
    subtitle: "Time range & options",
    status: "upcoming",
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

const initialMessages: ChatMessage[] = []
const initialFooter: WidgetFooterState = { variant: "default" }

const initialDataParameters: DataParameters = {
  type: "fiscalYear",
  fromYear: 2000,
  toYear: 2025,
  displayOrder: "newest",
  financePeriod: "FY0",
  rollPeriods: false,
  addSource: false,
  includePartialYear: false,
  serious: true,
}

const suggestedDataParameters: DataParameters = {
  ...initialDataParameters,
  fromYear: 2000,
  toYear: 2025,
  type: "fiscalYear",
}

const initialDataParameterState = {
  dataParameters: { ...initialDataParameters },
  suggestedDataParameters: { ...suggestedDataParameters },
}

const initialLibraryGlobalParams: LibraryGlobalParams = {
  last: 20,
  periodType: "FY",
  displayOrder: "newest",
  financePeriod: "FY0",
  rollPeriods: false,
  addSource: false,
  includePartialYear: false,
  serious: false,
}

const initialLibraryState = {
  // ✅ baseline selected on first load
  librarySelectedIds: [...esgBaselineItemIds],
  librarySuggestedIds: [...esgBaselineItemIds],

  // ✅ but NOT "applied" yet (this is the key fix)
  librarySuggestionState: "pending" as const,

  libraryActiveCategoryId: "esg",
  libraryActiveItemId: esgBaselineItemIds[0],

  librarySearch: "",
  libraryGlobalParams: { ...initialLibraryGlobalParams },
}

// -------------------------
// Slice creators
// -------------------------
type Slice<T> = StateCreator<McpState, [], [], T>

const createAppSlice: Slice<
  Pick<
    McpState,
    | "activeWidget"
    | "setActiveWidget"
    | "isWidgetLoading"
    | "transitionToWidget"
    | "startQuery"
  >
> = (set, get) => ({
  activeWidget: "start",
  setActiveWidget: (id) => set(() => ({ activeWidget: id })),
  isWidgetLoading: false,

  transitionToWidget: (next, opts) => {
    const delayMs = opts?.delayMs ?? 600
    set({ isWidgetLoading: true })
    window.setTimeout(() => {
      set({ activeWidget: next, isWidgetLoading: false })
    }, delayMs)
  },

  startQuery: (text) => {
    const trimmed = text.trim()
    if (!trimmed) return

    set(() => ({
      activeWidget: "screener",
      workflowCollapsed: false,
      workflowSteps: initialWorkflowSteps.map((s) => ({ ...s })),
      footer: { ...initialFooter },
      messages: [...initialMessages],
      isThinking: false,
      isWidgetLoading: false,
      ...initialDataParameterState,
      ...initialLibraryState,
    }))

    get().sendMessage(trimmed)
  },
})

const createChatSlice: Slice<
  Pick<McpState, "messages" | "isThinking" | "sendMessage" | "addAssistantMessage">
> = (set) => ({
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

  addAssistantMessage: (content) => {
    const msg: ChatMessage = {
      id: uid("m"),
      role: "assistant",
      content,
      createdAt: Date.now(),
    }
    set((s) => ({ messages: [...s.messages, msg] }))
  },
})

const createWorkflowSlice: Slice<
  Pick<
    McpState,
    | "workflowCollapsed"
    | "setWorkflowCollapsed"
    | "toggleWorkflow"
    | "workflowSteps"
    | "setWorkflowStep"
    | "markStepDone"
    | "advanceTo"
  >
> = (set) => ({
  workflowCollapsed: false,
  workflowSteps: initialWorkflowSteps.map((s) => ({ ...s })),

  setWorkflowCollapsed: (next) => set(() => ({ workflowCollapsed: next })),
  toggleWorkflow: () => set((s) => ({ workflowCollapsed: !s.workflowCollapsed })),

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
          ? { ...step, status: "done", summary: summary ?? step.summary }
          : step
      ),
    })),

  advanceTo: (from, to) =>
    set((s) => ({
      workflowSteps: s.workflowSteps.map((step) => {
        if (step.id === from) return { ...step, status: "done" }
        if (step.id === to) return { ...step, status: "current" }
        return step
      }),
      activeWidget: to,
    })),
})

const createFooterSlice: Slice<
  Pick<McpState, "footer" | "setFooter" | "resetFooter" | "runFooterAction">
> = (set, get) => ({
  footer: { ...initialFooter },

  setFooter: (patch) => set((s) => ({ footer: { ...s.footer, ...patch } })),
  resetFooter: () => set(() => ({ footer: { ...initialFooter } })),

  runFooterAction: (action) => {
    if (!action || action.type === "noop") return

    if (action.type === "setActiveWidget") {
      get().transitionToWidget(action.widget, { delayMs: 600 })
      return
    }

    if (action.type === "advanceWorkflow") {
      set((s) => ({
        workflowSteps: s.workflowSteps.map((step) => {
          if (step.id === action.from) return { ...step, status: "done" }
          if (step.id === action.to) return { ...step, status: "current" }
          return step
        }),
      }))
      get().transitionToWidget(action.to, { delayMs: 600 })
      return
    }

    const _exhaustive: never = action
    return _exhaustive
  },
})

const createDataParameterSlice: Slice<
  Pick<
    McpState,
    | "dataParameters"
    | "suggestedDataParameters"
    | "setDataParameters"
    | "applySuggestedDataParameters"
    | "resetDataParameters"
  >
> = (set) => ({
  ...initialDataParameterState,

  setDataParameters: (patch) =>
    set((s) => ({ dataParameters: { ...s.dataParameters, ...patch } })),

  applySuggestedDataParameters: () =>
    set((s) => ({ dataParameters: { ...s.suggestedDataParameters } })),

  resetDataParameters: () => set(() => ({ dataParameters: { ...initialDataParameters } })),
})

const createDataLibrarySlice: Slice<
  Pick<
    McpState,
    | "librarySelectedIds"
    | "librarySuggestedIds"
    | "librarySuggestionState"
    | "libraryActiveCategoryId"
    | "libraryActiveItemId"
    | "librarySearch"
    | "libraryGlobalParams"
    | "toggleLibraryItem"
    | "applyLibrarySuggestions"
    | "skipLibrarySuggestions"
    | "setLibraryActiveCategory"
    | "setLibraryActiveItem"
    | "setLibrarySearch"
    | "setLibraryGlobalParam"
    | "resetLibrary"
  >
> = (set) => ({
  ...initialLibraryState,

  toggleLibraryItem: (id) =>
    set((s) => {
      const has = s.librarySelectedIds.includes(id)
      const next = has
        ? s.librarySelectedIds.filter((x) => x !== id)
        : [...s.librarySelectedIds, id]
      const nextActive = s.libraryActiveItemId ?? id
      return { librarySelectedIds: next, libraryActiveItemId: nextActive }
    }),

  // ✅ this now means “user explicitly confirmed / applied suggestion”
  applyLibrarySuggestions: () =>
    set((s) => {
      if (s.librarySuggestedIds.length === 0) {
        return { librarySuggestionState: "applied" }
      }
      const merged = new Set([...s.librarySelectedIds, ...s.librarySuggestedIds])
      return {
        librarySelectedIds: Array.from(merged),
        librarySuggestionState: "applied",
      }
    }),

  // ✅ skip = empty selection + hide suggestion actions
  skipLibrarySuggestions: () =>
    set(() => ({
      librarySelectedIds: [],
      librarySuggestedIds: [],
      librarySuggestionState: "skipped",
      libraryActiveItemId: undefined,
    })),

  setLibraryActiveCategory: (id) => set(() => ({ libraryActiveCategoryId: id })),
  setLibraryActiveItem: (id) => set(() => ({ libraryActiveItemId: id })),
  setLibrarySearch: (v) => set(() => ({ librarySearch: v })),

  setLibraryGlobalParam: (k, v) =>
    set((s) => ({ libraryGlobalParams: { ...s.libraryGlobalParams, [k]: v } })),

  // ✅ restore defaults = baseline selected again, but still "pending"
  resetLibrary: () => set(() => ({ ...initialLibraryState })),
})

// -------------------------
// Store creation
// -------------------------
export const useMcpStore = create<McpState>()((set, get, store) => ({
  ...createChatSlice(set, get, store),
  ...createWorkflowSlice(set, get, store),
  ...createFooterSlice(set, get, store),
  ...createDataParameterSlice(set, get, store),
  ...createDataLibrarySlice(set, get, store),
  ...createAppSlice(set, get, store),
}))
