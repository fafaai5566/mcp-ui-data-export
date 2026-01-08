"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useMcpStore } from "@/lib/store/useMcpStore"

export function StartScreen() {
  const startQuery = useMcpStore((s) => s.startQuery)
  const [value, setValue] = React.useState(
    "I want to download ESG data of European listed companies from 2000 - 2025"
  )

  return (
    <div className="min-h-[calc(100vh-0px)] flex items-center justify-center px-6">
      <div className="w-full max-w-3xl text-center space-y-6">
        <h1 className="text-2xl font-semibold">What would you like help with?</h1>

        <div className="flex gap-2">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ask anything"
            className="h-12"
          />
          <Button
            className="h-12 px-6"
            onClick={() => startQuery(value.trim())}
            disabled={!value.trim()}
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}
