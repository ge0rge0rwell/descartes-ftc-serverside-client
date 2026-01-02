import React, { useState, useEffect, useRef } from 'react'
import { DESCARTES_SYSTEM_PROMPT } from './utils/ftcKnowledge'
import { callGemini } from './services/geminiService'
import AdobeViewer from './components/AdobeViewer'
import './styles/main.css'

const App = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'system', content: DESCARTES_SYSTEM_PROMPT },
    { role: 'assistant', content: "Hello teammate! I'm Descartes. I'm ready to help you with the FTC rulebook, engineering processes, and general competition info. What would you like to learn?" }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [pdfPage, setPdfPage] = useState(1)
  const [activeTab, setActiveTab] = useState('chat') // mobile tab: 'pdf' or 'chat'
  const [isMaximized, setIsMaximized] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [tickerText, setTickerText] = useState('SYSTEM READY...')
  const messagesEndRef = useRef(null)

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    const statuses = ['ANALYZING PROTOCOLS...', 'INDEXING KNOWLEDGE...', 'DESCARTES ONLINE', 'SYNCING PDF...', 'ENCRYPTING CHANNEL...']
    let i = 0
    const interval = setInterval(() => {
      setTickerText(statuses[i])
      i = (i + 1) % statuses.length
    }, 4000)
    return () => clearInterval(interval)
  }, [])

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

      // UI-Level Escape Hatch: Final scorched-earth check
      let superCleaned = response;
      const finalMarkers = ["</think>", "</thought>", "</reasoning>", "--- END OF SEARCH ---"];
      finalMarkers.forEach(m => {
        if (superCleaned.includes(m)) {
          superCleaned = superCleaned.substring(superCleaned.lastIndexOf(m) + m.length);
        }
      });

      superCleaned = superCleaned
        .replace(/<(?:think|thought)>[\s\S]*?(?:<\/(?:think|thought)>|$)/gi, "")
        .replace(/^[\s\S]*?<\/think>/gi, "")
        .trim();

      setMessages(prev => [...prev, { role: 'assistant', content: superCleaned }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, an error occurred: " + error.message }]);
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
              setActiveTab('pdf');
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
    <div className="chat-widget-container">
      <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
        <defs>
          <filter id="gooey">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="gooey" />
            <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
          </filter>
        </defs>
      </svg>
      <button
        className={`chat-fab ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Chat with Descartes"
      >
        {isOpen ? (
          <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
        ) : (
          <img
            src={window.descartesConfig?.pluginUrl ? `${window.descartesConfig.pluginUrl}public/logo-cartesian.jpg` : "/logo-cartesian.jpg"}
            alt="Descartes Logo"
            className="fab-logo-img"
          />
        )}
      </button>

      <div className={`chat-overlay ${isOpen ? 'open' : 'closed'} ${isMaximized ? 'maximized' : ''}`}>
        <div className="app-container">
          <header className="header">
            <div className="logo-container">
              <div className="logo-wrapper">
                <img
                  src={window.descartesConfig?.pluginUrl ? `${window.descartesConfig.pluginUrl}public/logo-cartesian.jpg` : "/logo-cartesian.jpg"}
                  alt="DESCARTES"
                  className="header-logo-img"
                />
              </div>
              <div className="logo-text">
                DESCARTES <span style={{ color: 'white', fontWeight: '300' }}>FTC AI</span>
              </div>
            </div>
            <div className="header-actions">
              <button
                className="maximize-btn"
                onClick={() => setIsMaximized(!isMaximized)}
                aria-label={isMaximized ? "Restore size" : "Maximize chat"}
              >
                {isMaximized ? (
                  <svg viewBox="0 0 24 24"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" /></svg>
                )}
              </button>
              <button className="close-btn-mobile" onClick={() => setIsOpen(false)}>&times;</button>
            </div>
          </header>

          <nav className="mobile-tabs">
            <button
              className={activeTab === 'chat' ? 'active' : ''}
              onClick={() => setActiveTab('chat')}
            >
              Chat
            </button>
            <button
              className={activeTab === 'pdf' ? 'active' : ''}
              onClick={() => setActiveTab('pdf')}
            >
              Manual
            </button>
          </nav>

          <main className="main-content">
            <div className={`pdf-pane ${activeTab === 'pdf' ? 'active' : ''}`}>
              <AdobeViewer
                pdfUrl={window.descartesConfig?.pdfUrl || "/game-manual.pdf"}
                pageNum={pdfPage}
              />
            </div>

            <div className={`chat-pane ${activeTab === 'chat' ? 'active' : ''}`}>
              <div className="chat-messages">
                {messages.filter(m => m.role !== 'system').map((msg, i) => (
                  <div key={i} className={`message ${msg.role}`}>
                    <div className="message-bubble">
                      {msg.role === 'assistant' ? parseCitations(msg.content) : msg.content}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="message assistant">
                    <div className="message-bubble typing">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                )}
                <div className="system-ticker">{tickerText}</div>
                <div ref={messagesEndRef} />
              </div>

              <div className="input-area">
                <input
                  type="text"
                  placeholder="Ask about a rule or page number..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                />
                <button onClick={handleSend} disabled={isTyping}>Ask</button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default App
