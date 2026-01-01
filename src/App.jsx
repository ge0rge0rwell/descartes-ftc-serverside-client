import React, { useState, useEffect, useRef } from 'react'
import { FTC_KNOWLEDGE_BASE, DESCARTES_SYSTEM_PROMPT } from './utils/ftcKnowledge'
import { callGemini } from './services/geminiService'
import './styles/main.css'

const DescartesAI = () => {
  const [messages, setMessages] = useState([
    { role: 'system', content: DESCARTES_SYSTEM_PROMPT },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isLoaded, setIsLoaded] = useState(true)
  const [showSidebar, setShowSidebar] = useState(false)
  const [pdfPage, setPdfPage] = useState(1)
  const messagesEndRef = useRef(null)
  const pdfRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    setMessages(prev => [...prev, { role: 'assistant', content: "Bulut sentezi tamamlandı. Descartes AI artık Türkçe biliyor ve DECODE (2025-2026) sezonuna hazır. Stratejimizi planlamaya başlayalım mı, Takım Arkadaşı?" }])
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleCitationClick = (page) => {
    setPdfPage(page);
    // If using Adobe SDK, we would call the API here.
    // For now, we rely on the iframe source refresh or communication.
  }

  // Simple Markdown-style link parser for citations [[Page X]](#X)
  const renderMessageContent = (content) => {
    const parts = content.split(/(\[\[.*?\]\]\(#\d+\))/g);
    return parts.map((part, index) => {
      const match = part.match(/\[\[(.*?)\]\]\(#(\d+)\)/);
      if (match) {
        const [full, label, page] = match;
        return (
          <a
            key={index}
            href={`#${page}`}
            className="citation-link"
            onClick={(e) => {
              e.preventDefault();
              handleCitationClick(parseInt(page));
            }}
          >
            {label}
          </a>
        );
      }
      return part;
    });
  }

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    try {
      const assistantResponse = await callGemini([...messages, userMessage]);
      setMessages(prev => [...prev, { role: 'assistant', content: assistantResponse }]);
    } catch (error) {
      console.error("Gemini Error:", error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Buluta bağlanırken bir sorun oluştu: ${error.message}. Lütfen bağlantını kontrol et.`
      }]);
    } finally {
      setIsTyping(false);
    }
  }

  return (
    <div className="app-container">
      <nav className="navbar glass-card">
        <div className="logo-container">
          <button
            className="mobile-toggle"
            onClick={() => setShowSidebar(!showSidebar)}
            aria-label="Toggle Menu"
          >
            ☰
          </button>
          <img src="/logo.png" alt="Descartes Logo" className="navbar-logo" />
          <div className="logo ftc-text">
            <span className="descartes-glow">DESCARTES</span> <span className="mobile-hide" style={{ color: 'var(--text-secondary)', fontWeight: '400', fontSize: '1rem', marginLeft: '5px' }}>MANUAL AI</span>
          </div>
        </div>
        <div className="nav-links mobile-hide">
          <button className="btn-secondary">Kılavuzlar</button>
          <button className="btn-secondary" style={{ marginLeft: '10px' }}>Kaynaklar</button>
        </div>
      </nav>

      <main className="main-content">
        {/* SIDEBAR AS OVERLAY/DRAWER */}
        <aside className={`sidebar glass-card ${showSidebar ? 'show' : ''}`}>
          <div className="sidebar-header">
            <h3 style={{ margin: 0 }}>MENÜ</h3>
            <button className="close-sidebar" onClick={() => setShowSidebar(false)}>✕</button>
          </div>
          <div className="sidebar-section">
            <h3 style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '15px' }}>DÖKÜMANTASYON</h3>
            <ul>
              <li className="glass-card-interactive" onClick={() => { setPdfPage(1); setShowSidebar(false); }}>Kapak Sayfası</li>
              <li className="glass-card-interactive" onClick={() => { setPdfPage(5); setShowSidebar(false); }}>Oyun Kuralları</li>
              <li className="glass-card-interactive" onClick={() => { setPdfPage(12); setShowSidebar(false); }}>Robot Kısıtlamaları</li>
              <li className="glass-card-interactive" onClick={() => { setPdfPage(24); setShowSidebar(false); }}>Puanlama Tablosu</li>
            </ul>
          </div>
          <div className="sidebar-footer">
            <p>DESIGNED FOR DECODE</p>
          </div>
        </aside>
        {/* PDF VIEW PANE */}
        <section className="pdf-pane">
          <iframe
            ref={pdfRef}
            src={`/game-manual.pdf#page=${pdfPage}&view=FitH`}
            width="100%"
            height="100%"
            style={{ border: 'none' }}
            title="FTC Game Manual"
          ></iframe>
          {!isLoaded && (
            <div className="pdf-overlay">
              <h3>PDF Yükleniyor...</h3>
            </div>
          )}
        </section>

        {/* CHAT INTERACTION PANE */}
        <section className="chat-pane">
          <div className="messages-container">
            {messages.filter(m => m.role !== 'system').map((msg, i) => (
              <div key={i} className={`message-wrapper ${msg.role}`}>
                <div className={`message glass-card ${msg.role === 'assistant' ? 'glow-border' : ''}`}>
                  <div className="message-content">
                    {renderMessageContent(msg.content)}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="message-wrapper assistant">
                <div className="message glass-card typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="input-container glass-card">
            <input
              type="text"
              placeholder="Kurallar veya oyun hakkında bir şey sor..."
              value={input}
              disabled={!isLoaded}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <button className="btn-primary" onClick={handleSend} disabled={!isLoaded || isTyping}>
              {isTyping ? '...' : 'Sor'}
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}

export default DescartesAI

