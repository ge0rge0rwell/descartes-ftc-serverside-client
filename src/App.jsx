import React, { useState, useEffect, useRef } from 'react'
import { DESCARTES_SYSTEM_PROMPT } from './utils/ftcKnowledge'
import { callGemini } from './services/geminiService'
import AdobeViewer from './components/AdobeViewer'
import './styles/main.css'

const App = () => {
  const [messages, setMessages] = useState([
    { role: 'system', content: DESCARTES_SYSTEM_PROMPT },
    { role: 'assistant', content: "Merhaba Takım Arkadaşı! Ben Descartes. FTC DECODE kural kitabı konusunda sana yardımcı olmaya hazırım. Ne sormak istersin?" }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [pdfPage, setPdfPage] = useState(1)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    try {
      const response = await callGemini([...messages, userMessage]);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Üzgünüm, bir hata oluştu: " + error.message }]);
    } finally {
      setIsTyping(false);
    }
  }

  const parseCitations = (content) => {
    const parts = content.split(/(\[\[\d+\]\]\(#\d+\))/g);
    return parts.map((part, i) => {
      const match = part.match(/\[\[(\d+)\]\]\(#(\d+)\)/);
      if (match) {
        return (
          <a
            key={i}
            href={`#${match[2]}`}
            className="citation-link"
            onClick={(e) => {
              e.preventDefault();
              setPdfPage(parseInt(match[2]));
            }}
          >
            [{match[1]}]
          </a>
        );
      }
      return part;
    });
  }

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo" style={{ color: 'var(--primary)', letterSpacing: '1px' }}>
          DESCARTES <span style={{ color: 'white', fontWeight: '300' }}>MANUAL AI</span>
        </div>
        <div className="status" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          DECODE SEASON // 2025-26
        </div>
      </header>

      <main className="main-content">
        <div className="pdf-pane">
          <AdobeViewer
            pdfUrl="/game-manual.pdf"
            pageNum={pdfPage}
          />
        </div>

        <div className="chat-pane">
          <div className="chat-messages">
            {messages.filter(m => m.role !== 'system').map((msg, i) => (
              <div key={i} className={`message ${msg.role}`}>
                <div className="message-bubble">
                  {msg.role === 'assistant' ? parseCitations(msg.content) : msg.content}
                </div>
              </div>
            ))}
            {isTyping && <div className="message assistant"><div className="message-bubble typing">...</div></div>}
            <div ref={messagesEndRef} />
          </div>

          <div className="input-area">
            <input
              type="text"
              placeholder="Kural veya sayfa numarası sor..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend} disabled={isTyping}>Sor</button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
