"use client"

import { StartScreen } from "@/components/shell/StartScreen"
import { AppShell } from "@/components/shell/AppShell"
import { useMcpStore } from "@/lib/store/useMcpStore"
import { Analytics } from "@vercel/analytics/next"

export default function Page() {
  const activeWidget = useMcpStore((s) => s.activeWidget)
  return activeWidget === "start" ? <StartScreen /> : <AppShell />
}
