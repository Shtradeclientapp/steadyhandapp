'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Message } from '@/types'

export function useMessages(jobId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const supabase = createClient()

  // Fetch existing messages
  useEffect(() => {
    if (!jobId) return

    const fetchMessages = async () => {
      const res = await fetch(`/api/messages?job_id=${jobId}`)
      const { messages: msgs } = await res.json()
      setMessages(msgs || [])
      setLoading(false)
    }

    fetchMessages()

    // Subscribe to real-time inserts on this job's messages
    const channel = supabase
      .channel(`messages:${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `job_id=eq.${jobId}`,
        },
        async (payload) => {
          // Fetch full message with sender profile
          const { data } = await supabase
            .from('messages')
            .select('*, sender:profiles(id, full_name, avatar_url, role)')
            .eq('id', payload.new.id)
            .single()
          if (data) setMessages(prev => [...prev, data as Message])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [jobId])

  const sendMessage = useCallback(async (body: string, aiSuggested = false) => {
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_id: jobId, body, ai_suggested: aiSuggested }),
    })
  }, [jobId])

  const fetchSuggestions = useCallback(async (role: 'client' | 'tradie') => {
    const res = await fetch(`/api/messages/suggestions?job_id=${jobId}&role=${role}`)
    const { suggestions: s } = await res.json()
    setSuggestions(s || [])
  }, [jobId])

  return { messages, loading, sendMessage, suggestions, fetchSuggestions }
}
