'use client'
import { site } from '@/lib/site'

import { useState, useRef, useEffect, useId } from 'react'
import { MessageSquare, X, Send, Loader2, Bot, User, FileText, ArrowRight } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface QuoteItem { sku: string; qty: number }

const OPEN_TAG = '<quote_items>'
const CLOSE_TAG = '</quote_items>'

/** Split an assistant message into visible text + the structured quote handoff block (if any). */
export function splitQuoteBlock(content: string): { text: string; items: QuoteItem[] } {
  const start = content.indexOf('<quote_items')
  if (start < 0) return { text: content, items: [] }
  const end = content.indexOf(CLOSE_TAG, start)
  const text = (content.slice(0, start) + (end >= 0 ? content.slice(end + CLOSE_TAG.length) : '')).trimEnd()
  if (end < 0) return { text, items: [] } // still streaming the block
  let items: QuoteItem[] = []
  try {
    const parsed = JSON.parse(content.slice(start + OPEN_TAG.length, end))
    if (Array.isArray(parsed)) {
      items = parsed
        .map((x) => ({ sku: String(x?.sku ?? '').trim(), qty: Math.floor(Number(x?.qty ?? x?.quantity ?? 10)) }))
        .filter((x) => /^[A-Za-z0-9._\-/]{1,60}$/.test(x.sku) && x.qty >= 1 && x.qty <= 100000)
        .slice(0, 10)
    }
  } catch {
    items = []
  }
  return { text, items }
}

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

function parseMarkdown(text: string): string {
  // escape first, then apply a tiny safe subset of markdown; links only to site paths or https
  return escapeHtml(text)
    .replace(/\[([^\]]+)\]\(((?:\/|https:\/\/)[^)\s]*)\)/g, '<a href="$2" class="text-orange-600 underline hover:text-orange-700">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/(^|\s)_([^_\n]+)_/g, '$1<em class="text-slate-500">$2</em>')
    .replace(/\n/g, '<br>')
}

export function quoteHref(items: QuoteItem[]) {
  const p = new URLSearchParams({ from: 'chat', items: items.map((i) => `${i.sku}:${i.qty}`).join(',') })
  return `/bulk-quote?${p.toString()}`
}

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your tarp expert. Tell me what you're covering — size, how long it'll be outdoors, and how many you need — and I'll find the right tarp.",
    },
  ])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const panelId = useId()

  useEffect(() => {
    // also re-run when streaming ends: the quote handoff card appears only then
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [messages, streaming])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  const setLast = (content: string) =>
    setMessages((prev) => {
      const updated = [...prev]
      updated[updated.length - 1] = { role: 'assistant', content }
      return updated
    })

  const send = async (override?: string) => {
    const text = (override ?? input).trim()
    if (!text || streaming) return

    const nextMessages = [...messages, { role: 'user' as const, content: text }]
    setMessages([...nextMessages, { role: 'assistant', content: '' }])
    setInput('')
    setStreaming(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
      })
      if (!res.ok || !res.body) {
        setLast("Sorry, I'm having trouble connecting right now. Please try again or call us at " + site.phoneDisplay + ".")
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let assembled = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data)
            if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
              assembled += parsed.delta.text
              setLast(assembled)
            }
          } catch {
            // ignore partial lines
          }
        }
      }
    } catch {
      setLast('Sorry, something went wrong. Please try again.')
    } finally {
      setStreaming(false)
    }
  }

  return (
    <div className="print:hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 bg-orange-500 hover:bg-orange-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-colors"
        aria-label={open ? 'Close tarp expert chat' : 'Open tarp expert chat'}
        aria-expanded={open}
        aria-controls={panelId}
      >
        {open ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>

      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label="Tarp expert chat"
          className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden max-h-[min(600px,calc(100vh-8rem))]"
        >
          <div className="bg-slate-900 px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" aria-hidden />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Tarp Expert</p>
              <p className="text-slate-400 text-xs">AI assistant · hands off to our quote team</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]" aria-live="polite">
            {messages.map((msg, i) => {
              const { text, items } = msg.role === 'assistant' ? splitQuoteBlock(msg.content) : { text: msg.content, items: [] }
              const finished = !(streaming && i === messages.length - 1)
              return (
                <div key={i} className="space-y-2">
                  <div className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-slate-800' : 'bg-orange-100'}`}>
                      {msg.role === 'user' ? <User className="w-3.5 h-3.5 text-white" aria-hidden /> : <Bot className="w-3.5 h-3.5 text-orange-600" aria-hidden />}
                    </div>
                    <div
                      className={`rounded-2xl px-3 py-2 text-sm max-w-[80%] leading-relaxed ${
                        msg.role === 'user' ? 'bg-slate-800 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'
                      }`}
                    >
                      {msg.role === 'assistant' ? (
                        text ? <span dangerouslySetInnerHTML={{ __html: parseMarkdown(text) }} /> : <span className="text-slate-400 italic">Thinking…</span>
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                  {items.length > 0 && finished && (
                    <div className="ml-9 border border-orange-200 bg-orange-50 rounded-xl p-3">
                      <p className="text-xs font-semibold text-slate-700 mb-1.5">Ready to price this?</p>
                      <ul className="text-xs text-slate-600 mb-2.5 space-y-0.5">
                        {items.map((it) => (
                          <li key={it.sku} className="flex justify-between gap-2"><span className="font-mono">{it.sku}</span><span>× {it.qty}</span></li>
                        ))}
                      </ul>
                      <a
                        href={quoteHref(items)}
                        className="w-full inline-flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-lg px-3 py-2"
                      >
                        <FileText className="w-4 h-4" aria-hidden /> Turn this into a quote request <ArrowRight className="w-4 h-4" aria-hidden />
                      </a>
                    </div>
                  )}
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {messages.length === 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              {['Roofing tarps for 3 houses', '20x30 for hay, 40 of them', 'Fire retardant options?', 'Pallet pricing?'].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => send(prompt)}
                  className="text-xs bg-orange-50 text-orange-700 border border-orange-200 rounded-full px-3 py-1 hover:bg-orange-100 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          <form
            className="border-t border-slate-200 p-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              send()
            }}
          >
            <label htmlFor={`${panelId}-input`} className="sr-only">Message</label>
            <input
              id={`${panelId}-input`}
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about tarps…"
              disabled={streaming}
              maxLength={2000}
              className="flex-1 text-sm border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-orange-400 disabled:bg-slate-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || streaming}
              aria-label="Send message"
              className="w-9 h-9 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
            >
              {streaming ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
