'use client'

import { useState, useEffect, useRef } from 'react'
import { useMessages } from '@/lib/hooks/useMessages'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button, SectionLabel } from '@/components/ui'
import clsx from 'clsx'
import { formatDistanceToNow } from 'date-fns'

export function MessageThread({ jobId, role }: { jobId: string; role: 'client' | 'tradie' }) {
  const { messages, loading, sendMessage, suggestions, fetchSuggestions } = useMessages(jobId)
  const { user } = useAuth()
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    fetchSuggestions(role)
  }, [jobId, role])

  const handleSend = async (text?: string) => {
    const msg = text ?? body.trim()
    if (!msg) return
    setSending(true)
    await sendMessage(msg, !!text)
    setBody('')
    setSending(false)
  }

  return (
    <div className="flex flex-col h-full">
      {/* AI suggestions */}
      {suggestions.length > 0 && (
        <div className="px-4 py-3 bg-stage-1/5 border-b border-ink/8">
          <div className="text-[10px] tracking-[0.8px] uppercase font-medium text-stage-1 mb-2">
            💡 Suggested messages
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSend(s)}
                className="text-[11px] text-stage-1 bg-off border border-ink/15 rounded-full px-3 py-1 hover:bg-stage-1/10 hover:border-stage-1/30 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-[260px] max-h-[360px]">
        {loading && (
          <div className="text-center text-[13px] text-muted py-8">Loading messages...</div>
        )}
        {!loading && messages.length === 0 && (
          <div className="text-center text-[13px] text-muted py-8">
            No messages yet. Start the conversation.
          </div>
        )}
        {messages.map((msg) => {
          const isMine = msg.sender_id === user?.id
          return (
            <div key={msg.id} className={clsx('flex gap-2.5 items-end', isMine && 'flex-row-reverse')}>
              {/* Avatar */}
              <div
                className={clsx(
                  'w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white font-display',
                  isMine ? 'bg-terra' : 'bg-stage-1'
                )}
              >
                {msg.sender?.full_name?.charAt(0) ?? '?'}
              </div>
              <div className={clsx('max-w-[72%]', isMine && 'items-end flex flex-col')}>
                {msg.ai_suggested && (
                  <div className="text-[9px] text-muted-l mb-0.5 px-1">AI suggested</div>
                )}
                <div
                  className={clsx(
                    'px-3 py-2.5 text-[13px] leading-[1.55]',
                    isMine
                      ? 'bg-ink text-mist-l rounded-xl rounded-br-sm'
                      : 'bg-mist border border-ink/10 text-ink rounded-xl rounded-bl-sm'
                  )}
                >
                  {msg.body}
                </div>
                <div className={clsx('text-[10px] text-muted-l mt-1 px-1', isMine && 'text-right')}>
                  {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-3 border-t border-ink/10 flex gap-2.5 items-end">
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }}}
          placeholder="Type a message... (Enter to send)"
          className="flex-1 border-[1.5px] border-ink/18 focus:border-terra rounded-lg px-3 py-2 text-[13px] bg-off text-ink outline-none resize-none h-[60px] transition-colors"
        />
        <Button
          variant="ink"
          size="sm"
          loading={sending}
          onClick={() => handleSend()}
          disabled={!body.trim()}
        >
          Send
        </Button>
      </div>
    </div>
  )
}
