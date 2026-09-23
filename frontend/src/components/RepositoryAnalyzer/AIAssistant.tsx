import { useState, useRef, useEffect } from "react"
import { Send, Bot } from "lucide-react"
import { INITIAL_CHAT, getAIResponse, PRESET_REPOS, type ChatMessage } from "@/data/mockRepo"

const SUGGESTED_QUESTIONS = [
  "What is the highest-risk module?",
  "Explain the architecture layers",
  "What security issues were found?",
  "How are dependencies structured?",
  "Where is authentication handled?",
  "What are the webpack config issues?",
]

let msgCounter = 100

export default function AIAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_CHAT)
  const [input, setInput] = useState("")
  const [typing, setTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, typing])

  const sendMessage = (text: string) => {
    if (!text.trim() || typing) return
    const userMsg: ChatMessage = { id: String(++msgCounter), role: "user", text: text.trim(), timestamp: "just now" }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setTyping(true)

    setTimeout(() => {
      const response = getAIResponse(text)
      const aiMsg: ChatMessage = {
        id: String(++msgCounter),
        role: "ai",
        text: response.text,
        refs: response.refs,
        timestamp: "just now",
      }
      setMessages(prev => [...prev, aiMsg])
      setTyping(false)
    }, 900 + Math.random() * 600)
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 520 }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4" style={{ maxHeight: 400 }}>
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "ai" && (
              <div className="w-7 h-7 rounded-full bg-violet-500/20 border border-violet-500/30 flex-shrink-0 mt-1 flex items-center justify-center">
                <Bot size={13} className="text-violet-400" />
              </div>
            )}
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
              msg.role === "user"
                ? "bg-violet-600/20 border border-violet-500/25 rounded-tr-sm"
                : "bg-white/[0.04] border border-white/[0.07] rounded-tl-sm"
            }`}>
              <p className="text-sm text-gray-200 leading-relaxed">{msg.text}</p>
              {msg.refs && msg.refs.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {msg.refs.map(ref => (
                    <span key={ref}
                      className="font-mono text-xs text-cyan-400/80 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-md hover:border-cyan-500/50 cursor-pointer transition-colors truncate max-w-[200px]"
                      title={ref}>
                      {ref.split("/").slice(-1)[0]}
                    </span>
                  ))}
                </div>
              )}
              <div className="text-xs text-gray-600 mt-1.5">{msg.timestamp}</div>
            </div>
            {msg.role === "user" && (
              <div className="w-7 h-7 rounded-full bg-violet-500/30 flex-shrink-0 mt-1 flex items-center justify-center text-xs text-violet-200 font-semibold">U</div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {typing && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-violet-500/20 border border-violet-500/30 flex-shrink-0 mt-1 flex items-center justify-center">
              <Bot size={13} className="text-violet-400" />
            </div>
            <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
              {[0, 1, 2].map(i => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested questions */}
      <div className="py-3 border-t border-white/[0.06]">
        <div className="font-mono text-xs text-gray-600 mb-2">Suggested questions</div>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED_QUESTIONS.map(q => (
            <button key={q}
              onClick={() => sendMessage(q)}
              disabled={typing}
              className="text-xs px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.07] text-gray-400 hover:text-violet-300 hover:border-violet-500/30 transition-all disabled:opacity-40">
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="pt-3">
        <div className="flex gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl p-2 focus-within:border-violet-500/30 transition-colors">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about vercel/next.js..."
            disabled={typing}
            className="flex-1 bg-transparent text-sm text-gray-300 placeholder-gray-600 outline-none px-2 disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || typing}
            className="btn-primary text-white text-xs px-3 py-2 rounded-lg font-medium flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none transition-all"
          >
            <Send size={12} />
            <span>Send</span>
          </button>
        </div>
        <div className="flex items-center gap-1.5 mt-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="font-mono text-xs text-gray-600">RAG context: vercel/next.js · 2,400 files indexed</span>
        </div>
      </div>
    </div>
  )
}
