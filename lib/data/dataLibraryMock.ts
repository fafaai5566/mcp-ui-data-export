export type CategoryNode = {
  id: string
  name: string
  count?: number
  children?: CategoryNode[]
}

export type DataItem = {
  id: string
  name: string
  categoryId: string
  definition: string
  parameters?: Record<string, string>
}

export const categoryTree: CategoryNode[] = [
  {
    id: "esg",
    name: "Environmental, Social and Governance",
    count: 1759,
    children: [
      {
        id: "env",
        name: "Environmental",
        count: 225,
        children: [
          { id: "env_resource", name: "Resource Use", count: 91 },
          { id: "env_emissions", name: "Emissions", count: 93 },
          { id: "env_innovation", name: "Innovation", count: 41 },
        ],
      },
      { id: "social", name: "Social", count: 332 },
      { id: "gov", name: "Governance", count: 196 },
      { id: "esg_analytics", name: "ESG Analytics", count: 251 },
      { id: "cdp", name: "CDP", count: 323 },
      { id: "climate", name: "Climate", count: 432 },
    ],
  },
  { id: "equity_index", name: "Equity Index Information", count: 4 },
  { id: "etf_reports_plus", name: "ETF Reports Plus", count: 14 },
]

// ---- Seed (hand-written) items (kept) ----
const seedDataItems: DataItem[] = [
  {
    id: "env_assurance_standard",
    name: "Environmental Data Assurance Standard",
    categoryId: "env_resource",
    definition:
      "Where the company's operational environmental data has been verified by a third party, does the company disclose the international assurance standard used and the level of assurance?",
    parameters: { unit: "Text", scope: "Company" },
  },
  {
    id: "env_data_independent",
    name: "Environmental Data Independent",
    categoryId: "env_resource",
    definition:
      "Indicates whether environmental performance metrics disclosed by the company have been verified by an external auditor.",
    parameters: { unit: "Boolean", scope: "Company" },
  },
  {
    id: "policy_resource_efficiency",
    name: "Policy Resource Efficiency",
    categoryId: "env_resource",
    definition:
      "Does the company have a policy addressing resource efficiency (e.g., energy, materials, waste reduction)?",
    parameters: { unit: "Boolean" },
  },
  {
    id: "targets_resource_efficiency",
    name: "Targets Resource Efficiency",
    categoryId: "env_resource",
    definition:
      "Does the company have quantified targets for improving resource efficiency over a defined time horizon?",
    parameters: { unit: "Boolean" },
  },
  {
    id: "facilities_water_withdrawal",
    name: "Facilities Water Withdrawal",
    categoryId: "env_resource",
    definition:
      "Total volume of water withdrawn by company facilities during the reporting period.",
    parameters: { unit: "m³" },
  },
  {
    id: "water_incidents",
    name: "Water Incidents",
    categoryId: "env_resource",
    definition:
      "Number of significant water-related incidents (e.g., spills, contamination events) during the reporting period.",
    parameters: { unit: "Count" },
  },
  {
    id: "scope1_emissions",
    name: "Scope 1 Emissions",
    categoryId: "env_emissions",
    definition:
      "Direct greenhouse gas emissions from sources owned or controlled by the company.",
    parameters: { unit: "tCO₂e" },
  },
  {
    id: "scope2_emissions",
    name: "Scope 2 Emissions",
    categoryId: "env_emissions",
    definition:
      "Indirect greenhouse gas emissions from the generation of purchased electricity, steam, heating, and cooling consumed by the company.",
    parameters: { unit: "tCO₂e" },
  },
  {
    id: "innovation_rnd_spend",
    name: "Innovation R&D Spend",
    categoryId: "env_innovation",
    definition:
      "Total research and development expenditure related to environmental or sustainability innovation.",
    parameters: { unit: "Currency" },
  },
]

// ---- Generate baseline items to match counts (total = 753) ----
const BASELINE_COUNTS: Record<string, number> = {
  env_resource: 91,
  env_emissions: 93,
  env_innovation: 41,
  social: 332,
  gov: 196,
}

function pad(n: number, width = 4) {
  return String(n).padStart(width, "0")
}

function buildMockItems() {
  const items: DataItem[] = [...seedDataItems]
  const byCat = new Map<string, DataItem[]>()

  for (const it of items) {
    const arr = byCat.get(it.categoryId) ?? []
    arr.push(it)
    byCat.set(it.categoryId, arr)
  }

  // generate missing items per baseline category (so totals match EXACTLY)
  for (const [catId, targetCount] of Object.entries(BASELINE_COUNTS)) {
    const existingCount = byCat.get(catId)?.length ?? 0
    const need = Math.max(0, targetCount - existingCount)

    for (let i = 1; i <= need; i++) {
      const id = `${catId}_auto_${pad(i)}`
      items.push({
        id,
        name: `${catId.replaceAll("_", " ")} item ${i}`,
        categoryId: catId,
        definition: `Auto-generated baseline definition for ${catId}, item ${i}.`,
        parameters: { unit: "Text" },
      })
    }
  }

  // baseline IDs = ALL items in baseline categories (now totals match exactly)
  const baselineIds = items
    .filter((it) => Object.prototype.hasOwnProperty.call(BASELINE_COUNTS, it.categoryId))
    .map((it) => it.id)

  return { items, baselineIds }
}

const built = buildMockItems()

export const dataItems: DataItem[] = built.items

// ✅ This is what your store imports
export const esgBaselineItemIds: string[] = built.baselineIds

// Helpers
export function flattenCategoryTree(nodes: CategoryNode[]): CategoryNode[] {
  const out: CategoryNode[] = []
  const walk = (n: CategoryNode) => {
    out.push(n)
    n.children?.forEach(walk)
  }
  nodes.forEach(walk)
  return out
}

export function getDescendantCategoryIds(
  nodes: CategoryNode[],
  rootId?: string
): string[] {
  if (!rootId) return flattenCategoryTree(nodes).map((n) => n.id)

  let root: CategoryNode | undefined
  const find = (arr: CategoryNode[]): CategoryNode | undefined => {
    for (const n of arr) {
      if (n.id === rootId) return n
      const hit = n.children ? find(n.children) : undefined
      if (hit) return hit
    }
    return undefined
  }

  root = find(nodes)
  if (!root) return [rootId]

  const ids: string[] = []
  const walk = (n: CategoryNode) => {
    ids.push(n.id)
    n.children?.forEach(walk)
  }
  walk(root)
  return ids
}
