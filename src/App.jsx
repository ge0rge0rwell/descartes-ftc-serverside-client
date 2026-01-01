import React, { useState, useEffect, useRef } from 'react'
import { FTC_KNOWLEDGE_BASE, DESCARTES_SYSTEM_PROMPT } from './utils/ftcKnowledge'
import { callGemini } from './services/geminiService'

const DescartesAI = () => {
  const [messages, setMessages] = useState([
    { role: 'system', content: DESCARTES_SYSTEM_PROMPT },
    { role: 'assistant', content: "Greetings, Partner. I am Descartes AI. I've switched to the Gemini 2.0 Pro core to ensure a stable and powerful partnership. Ready to approach the field?" }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isLoaded, setIsLoaded] = useState(true)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    // Gemini API is cloud-based, no local model loading required
    setMessages(prev => [...prev, { role: 'assistant', content: "Cloud synthesis complete. Descartes FTC is now powered by Gemini 2.0 Pro. Trained on the DECODE (2025-2026) manual. Ready to build the winning strategy, Partner?" }])
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    // Gemini Integration (Cloud-side)
    try {
      // Send the conversation context to Gemini
      // We pass the full history (except system prompt which is already in memory or passed as first message)
      const assistantResponse = await callGemini([...messages, userMessage]);

      setMessages(prev => [...prev, { role: 'assistant', content: assistantResponse }]);
    } catch (error) {
      console.error("Gemini Error:", error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `I hit a snag connecting to the cloud: ${error.message}. Please check your connection.`
      }]);
    } finally {
      setIsTyping(false);
    }
  }

  return (
    <div className="app-container">
      <nav className="navbar glass-card">
        <div className="logo-container">
          <img src="/logo.png" alt="Descartes Logo" className="navbar-logo" />
          <div className="logo ftc-text">
            <span className="descartes-glow">DESCARTES</span> <span style={{ color: 'var(--primary)' }}>FTC</span>
          </div>
        </div>
        <div className="nav-links">
          <button className="btn-secondary" style={{ padding: '5px 15px', fontSize: '0.8rem' }}>Game Manuals</button>
          <button className="btn-secondary" style={{ padding: '5px 15px', fontSize: '0.8rem', marginLeft: '10px' }}>Resources</button>
        </div>
      </nav>

      <main className="main-layout">
        <aside className="sidebar glass-card">
          <div className="sidebar-section">
            <h3>Knowledge Base</h3>
            <ul>
              <li>Season Rules 2025-26</li>
              <li>Artifact Handling Tips</li>
              <li>Motif Decoding Guide</li>
              <li>Base Zone Strategy</li>
            </ul>
          </div>
          <div className="sidebar-footer">
            <p>Powered by Gemini 2.0 Pro</p>
          </div>
        </aside>

        <section className="chat-area">
          <div className="messages-container">
            {messages.map((msg, i) => (
              <div key={i} className={`message-wrapper ${msg.role}`}>
                <div className={`message glass-card ${msg.role === 'assistant' ? 'glow-border' : ''}`}>
                  <div className="message-header">
                    {msg.role === 'assistant' ? 'DESCARTES AI' : 'PARTNER'}
                  </div>
                  <div className="message-content">
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="message-wrapper assistant">
                <div className="message glass-card typing-indicator">
                  Descartes is thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="input-container glass-card">
            <input
              type="text"
              placeholder="Ask about rules, scoring, or hardware..."
              value={input}
              disabled={!isLoaded}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <button className="btn-primary" onClick={handleSend} disabled={!isLoaded || isTyping}>
              {isTyping ? 'Thinking...' : 'Send'}
            </button>
          </div>
        </section>
      </main>

      <style dangerouslySetInnerHTML={{
        __html: `
        .app-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          max-height: 100vh;
        }

        .navbar {
          padding: 0.5rem 2rem;
          margin: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 100;
        }

        .logo-container {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .navbar-logo {
          height: 40px;
          width: 40px;
          border-radius: 4px;
        }

        .logo {
          font-size: 1.5rem;
          font-weight: 800;
        }

        .main-layout {
          display: flex;
          flex: 1;
          gap: 10px;
          padding: 0 10px 10px 10px;
          overflow: hidden;
        }

        .sidebar {
          width: 280px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .sidebar-section h3 {
          color: var(--secondary);
          font-size: 0.9rem;
          text-transform: uppercase;
          margin-bottom: 1rem;
          letter-spacing: 1px;
        }

        .sidebar-section ul {
          list-style: none;
        }

        .sidebar-section li {
          padding: 10px;
          margin-bottom: 5px;
          border-radius: 6px;
          transition: 0.3s;
          cursor: pointer;
          font-size: 0.9rem;
          color: var(--text-muted);
        }

        .sidebar-section li:hover {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-main);
        }

        .sidebar-footer {
          font-size: 0.8rem;
          color: var(--text-muted);
          text-align: center;
          border-top: 1px solid var(--border);
          padding-top: 1rem;
        }

        .chat-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 10px;
          overflow: hidden;
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .message-wrapper {
          display: flex;
          width: 100%;
        }

        .message-wrapper.user {
          justify-content: flex-end;
        }

        .message {
          max-width: 80%;
          padding: 1rem;
          position: relative;
        }

        .message.assistant.glow-border {
          border-left: 3px solid var(--accent);
          box-shadow: var(--glow-blue);
        }

        .message-header {
          font-weight: 700;
          font-size: 0.7rem;
          text-transform: uppercase;
          margin-bottom: 0.5rem;
          letter-spacing: 1px;
        }

        .message-wrapper.user .message-header {
          color: var(--secondary);
          text-align: right;
        }

        .message-wrapper.assistant .message-header {
          color: var(--accent);
          text-shadow: 0 0 5px rgba(0, 163, 255, 0.3);
        }

        .message-content {
          font-size: 1rem;
          white-space: pre-wrap;
        }

        .input-container {
          padding: 1rem;
          display: flex;
          gap: 10px;
        }

        .input-container input {
          flex: 1;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 12px 16px;
          color: var(--text-main);
          outline: none;
          transition: 0.3s;
        }

        .input-container input:focus {
          border-color: var(--primary);
          box-shadow: var(--glow-blue);
        }

        .typing-indicator {
          font-style: italic;
          color: var(--text-muted);
          font-size: 0.8rem;
        }

        @media (max-width: 768px) {
          .sidebar {
            display: none;
          }
          .message {
            max-width: 95%;
          }
        }
      `}} />
    </div>
  )
}

export default DescartesAI
