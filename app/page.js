'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const sessionIdRef = useRef(null)

  // Generate or retrieve session ID on mount
  useEffect(() => {
    let sessionId = sessionStorage.getItem('chat_session_id')
    if (!sessionId) {
      sessionId = crypto.randomUUID()
      sessionStorage.setItem('chat_session_id', sessionId)
    }
    sessionIdRef.current = sessionId
  }, [])

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

    // Add user message to chat
    const newUserMessage = { role: 'user', content: userMessage }
    const updatedMessages = [...messages, newUserMessage]
    setMessages(updatedMessages)
    setLoading(true)

    // Save user message to Supabase
    saveMessage('user', userMessage)

    try {
      // Send full conversation history to API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong')
      }

      // Add Claude's response to chat
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])

      // Save assistant message to Supabase
      saveMessage('assistant', data.response)
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
      <h1>🍥 Jalan Ninjaku</h1>
      
      <div className="chat-box">
        {messages.length === 0 && (
          <p style={{ color: '#666', textAlign: 'center', marginTop: '50px' }}>
            Ketik sesuatu untuk mulai chat dengan Claude...
          </p>
        )}
        
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}-message`}>
            <strong>{msg.role === 'user' ? 'Lo' : 'Claude'}:</strong>
            <p style={{ marginTop: '5px', whiteSpace: 'pre-wrap' }}>{msg.content}</p>
          </div>
        ))}
        
        {loading && (
          <div className="message assistant-message loading">
            Claude lagi mikir...
          </div>
        )}
        
        {error && (
          <div className="error">
            Error: {error}
          </div>
        )}
      </div>

      <div className="input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ketik pesan lo di sini..."
          disabled={loading}
        />
        <button onClick={sendMessage} disabled={loading}>
          {loading ? '...' : 'Kirim'}
        </button>
      </div>
    </div>
  )
}
