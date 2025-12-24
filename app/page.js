'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [streamingContent, setStreamingContent] = useState('')
  const sessionIdRef = useRef(null)
  const chatBoxRef = useRef(null)

  // Generate or retrieve session ID on mount
  useEffect(() => {
    let sessionId = sessionStorage.getItem('chat_session_id')
    if (!sessionId) {
      sessionId = crypto.randomUUID()
      sessionStorage.setItem('chat_session_id', sessionId)
    }
    sessionIdRef.current = sessionId
  }, [])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight
    }
  }, [messages, streamingContent])

  // Save a message to Supabase
  const saveMessage = async (role, content) => {
    try {
      await supabase.from('messages').insert({
        session_id: sessionIdRef.current,
        role,
        content
      })
    } catch (err) {
      console.error('Failed to save message:', err)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setError(null)
    setStreamingContent('')

    // Add user message to chat
    const newUserMessage = { role: 'user', content: userMessage }
    const updatedMessages = [...messages, newUserMessage]
    setMessages(updatedMessages)
    setLoading(true)

    // Save user message to Supabase
    saveMessage('user', userMessage)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Something went wrong')
      }

      // Handle streaming response
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              // Streaming complete, add final message
              setMessages(prev => [...prev, { role: 'assistant', content: fullContent }])
              setStreamingContent('')
              saveMessage('assistant', fullContent)
            } else {
              try {
                const parsed = JSON.parse(data)
                if (parsed.text) {
                  fullContent += parsed.text
                  setStreamingContent(fullContent)
                }
              } catch (e) {
                // Ignore parse errors for incomplete chunks
              }
            }
          }
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="container">
      <header className="header">
        <h1>jalanninjaku</h1>
        <p className="tagline">Ngobrol soal kerjaan, usaha, arah hidup</p>
      </header>

      <div className="chat-box" ref={chatBoxRef}>
        {messages.length === 0 && !streamingContent && (
          <div className="welcome-section">
            <div className="welcome-card">
              <p className="welcome-text">
                Hai! Gue di sini buat nemenin lo ngobrol soal kerjaan, usaha, atau arah hidup.
                Bukan sebagai coach atau konsultan — lebih kayak temen yang kebetulan udah liat
                banyak jalan orang dan bisa bantu lo mikirin jalan lo sendiri.
              </p>
              <p className="welcome-text">
                Lo bisa cerita apa aja — lagi bingung mau kemana, stuck di kerjaan,
                mau mulai usaha, atau cuma butuh perspektif lain. Gue dengerin dulu,
                baru kita obrolin bareng.
              </p>
              <p className="welcome-hint">
                Mulai aja cerita, gak usah formal.
              </p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}-message`}>
            <div className="message-label">{msg.role === 'user' ? 'Lo' : 'Gue'}</div>
            <p className="message-content">{msg.content}</p>
          </div>
        ))}

        {streamingContent && (
          <div className="message assistant-message">
            <div className="message-label">Gue</div>
            <p className="message-content">{streamingContent}</p>
          </div>
        )}

        {loading && !streamingContent && (
          <div className="message assistant-message typing">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}

        {error && (
          <div className="error">
            Waduh, ada masalah: {error}
          </div>
        )}
      </div>

      <div className="input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Cerita aja..."
          disabled={loading}
        />
        <button onClick={sendMessage} disabled={loading}>
          Kirim
        </button>
      </div>
    </div>
  )
}
