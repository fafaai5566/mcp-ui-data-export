"use client"

import * as React from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useMcpStore } from "@/lib/store/useMcpStore"
import { ThumbsDown, ThumbsUp } from "lucide-react"

type Vote = "up" | "down" | null

export function ChatPanel() {
  const messages = useMcpStore((s) => s.messages)
  const sendMessage = useMcpStore((s) => s.sendMessage)
  const [value, setValue] = React.useState("")
  const [votes, setVotes] = React.useState<Record<string, Vote>>({})
//bottom sentinel
  const bottomRef = React.useRef<HTMLDivElement | null>(null)

//end bottom sentinel
  const onSend = () => {
    const text = value.trim()
    if (!text) return
    sendMessage(text)
    setValue("")
  }

  const setVote = (messageId: string, next: Vote) => {
    setVotes((prev) => ({
      ...prev,
      [messageId]: prev[messageId] === next ? null : next, // click again to unselect
    }))
  }

  //effect to scroll to bottom on new message
    React.useEffect(() => {
    // Wait for layout so Radix viewport updates first
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
    })
  }, [messages.length])

  //end effect to scroll to bottom on new message

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden">

      <div className="px-4 py-3 border-b">
        <div className="font-semibold">Chat</div>
      </div>

      <ScrollArea className="flex-1 min-h-0 px-4 py-4">

        <div className="space-y-4">
          {messages.map((m) => {
            const isUser = m.role === "user"
            const vote = votes[m.id] ?? null

            return (
              <div key={m.id} className={isUser ? "flex justify-end" : "flex justify-start"}>
                <div className="max-w-[92%]">
                  <div
                    className={[
                      "rounded-xl px-3 py-2 text-sm leading-relaxed",
                      isUser
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-transparent text-foreground",
                    ].join(" ")}
                  >
                    <div className="whitespace-pre-wrap">{m.content}</div>

                  </div>

                  {!isUser && (
                    <div className="mt-2 flex items-center gap-1 text-muted-foreground">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={[
                          "h-8 w-8",
                          vote === "up" ? "text-foreground" : "",
                        ].join(" ")}
                        onClick={() => setVote(m.id, "up")}
                        aria-label="Like"
                      >
                        <ThumbsUp className="h-4 w-4" />
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={[
                          "h-8 w-8",
                          vote === "down" ? "text-foreground" : "",
                        ].join(" ")}
                        onClick={() => setVote(m.id, "down")}
                        aria-label="Dislike"
                      >
                        <ThumbsDown className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <div className="shrink-0 p-4 border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70 space-y-2">

        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Ask anything"
          className="min-h-[44px] resize-none"
        />
        <div className="flex justify-end">
          <Button onClick={onSend} disabled={!value.trim()}>
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}
