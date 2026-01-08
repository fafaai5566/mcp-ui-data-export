"use client"

import { StartScreen } from "@/components/shell/StartScreen"
import { AppShell } from "@/components/shell/AppShell"
import { useMcpStore } from "@/lib/store/useMcpStore"


export default function Page() {
  const activeWidget = useMcpStore((s) => s.activeWidget)
  return activeWidget === "start" ? <StartScreen /> : <AppShell />
}
