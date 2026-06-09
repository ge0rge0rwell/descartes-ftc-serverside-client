import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  lazy,
  Suspense,
} from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { DESCARTES_SYSTEM_PROMPT } from './utils/ftcKnowledge'
import { callGemini } from './services/geminiService'
import './styles/main.css'

/* The Adobe View SDK is heavy and third-party. Load the viewer chunk (and the
 * SDK script it pulls in) lazily, only once the user actually opens the Manual,
 * so chat-only visitors never pay for it. */
const AdobeViewer = lazy(() => import('./components/AdobeViewer'))

/* ------------------------------------------------------------------ *
 *  Icons — small, dependency-free inline SVGs
 * ------------------------------------------------------------------ */
const Icon = {
  Close: (props) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M18.3 5.71 12 12.01l-6.3-6.3-1.42 1.41L10.59 13.4l-6.3 6.3 1.41 1.42 6.3-6.3 6.3 6.3 1.42-1.42-6.3-6.3 6.3-6.3z" />
    </svg>
  ),
  Maximize: (props) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
    </svg>
  ),
  Restore: (props) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
    </svg>
  ),
  Send: (props) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M3.4 20.4 21 12 3.4 3.6 3.39 10.2 15.6 12 3.39 13.8z" />
    </svg>
  ),
  Copy: (props) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M16 1H4a2 2 0 0 0-2 2v12h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14z" />
    </svg>
  ),
  Check: (props) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </svg>
  ),
  ArrowDown: (props) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M12 16.5 5 9.5l1.41-1.42L12 13.67l5.59-5.59L19 9.5z" />
    </svg>
  ),
  Spark: (props) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M12 2l1.9 5.6L19.5 9l-5.6 1.9L12 16.5l-1.9-5.6L4.5 9l5.6-1.4L12 2z" />
    </svg>
  ),
  Refresh: (props) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M17.65 6.35A8 8 0 1 0 19.74 14h-2.08A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
    </svg>
  ),
}

/* Quick-start prompts grounded in the DECODE knowledge base. */
const SUGGESTIONS = [
  { label: 'How does autonomous scoring work?', icon: 'auto' },
  { label: 'What are the robot size limits?', icon: 'size' },
  { label: 'Explain the endgame Uplink', icon: 'end' },
  { label: 'Which penalties should I avoid?', icon: 'pen' },
]

/* Strip any reasoning artifacts that slip past the service layer. */
const FINAL_MARKERS = ['</think>', '</thought>', '</reasoning>', '--- END OF SEARCH ---']
const scrubResponse = (raw) => {
  let out = String(raw ?? '')
  FINAL_MARKERS.forEach((m) => {
    if (out.includes(m)) out = out.substring(out.lastIndexOf(m) + m.length)
  })
  return out
    .replace(/<(?:think|thought)>[\s\S]*?(?:<\/(?:think|thought)>|$)/gi, '')
    .replace(/^[\s\S]*?<\/think>/gi, '')
    .trim()
}

/* Monotonic message ids give every bubble a stable React key, so list
 * re-renders never re-mount existing messages (and re-parse their markdown). */
let _messageSeq = 0
const nextMessageId = () => `m${++_messageSeq}`

const INITIAL_MESSAGES = [
  { id: 'system', role: 'system', content: DESCARTES_SYSTEM_PROMPT },
  {
    id: 'welcome',
    role: 'assistant',
    content:
      "Hello teammate! I'm **Descartes** — your FTC mentor for the **DECODE** season. Ask me about the rulebook, scoring, robot constraints, or engineering strategy, and I'll cite the manual pages so you can verify everything.",
  },
]

/* ------------------------------------------------------------------ *
 *  Memoized single message row (avatar + bubble + actions)
 * ------------------------------------------------------------------ */
const Message = React.memo(function Message({
  msg,
  isCopied,
  onCopy,
  renderContent,
  logoSrc,
}) {
  const isUser = msg.role === 'user'
  return (
    <div className={`message ${msg.role}`}>
      {!isUser && (
        <div className="avatar" aria-hidden="true">
          <img src={logoSrc} alt="" />
        </div>
      )}
      <div className="message-col">
        <div className={`message-bubble ${msg.isError ? 'error' : ''}`}>
          {isUser ? msg.content : renderContent(msg.content)}
        </div>
        {!isUser && !msg.isError && (
          <div className="message-actions">
            <button
              type="button"
              className={`copy-btn ${isCopied ? 'copied' : ''}`}
              onClick={() => onCopy(msg.content, msg.id)}
              aria-label={isCopied ? 'Copied' : 'Copy message'}
            >
              {isCopied ? <Icon.Check /> : <Icon.Copy />}
              <span>{isCopied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
})

/* ------------------------------------------------------------------ *
 *  App
 * ------------------------------------------------------------------ */
const App = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [isMaximized, setIsMaximized] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [pdfPage, setPdfPage] = useState(1)
  const [activeTab, setActiveTab] = useState('chat') // 'pdf' | 'chat'
  const [pdfMounted, setPdfMounted] = useState(false)
  const [copiedId, setCopiedId] = useState(null)
  const [showScrollBtn, setShowScrollBtn] = useState(false)

  const messagesEndRef = useRef(null)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)
  const copyTimer = useRef(null)

  const logoSrc = useMemo(
    () =>
      window.descartesConfig?.pluginUrl
        ? `${window.descartesConfig.pluginUrl}public/logo-cartesian.jpg`
        : '/logo-cartesian.jpg',
    [],
  )

  const visibleMessages = useMemo(
    () => messages.filter((m) => m.role !== 'system'),
    [messages],
  )
  // The intro hero stands in for the canned welcome message, so we don't also
  // render that bubble. `chatStarted` flips once the user sends their first
  // turn — the hero stays (as a compact header), only the chips go away.
  const conversation = useMemo(
    () => visibleMessages.filter((m) => m.id !== 'welcome'),
    [visibleMessages],
  )
  const chatStarted = conversation.length > 0

  /* ---- scrolling -------------------------------------------------- */
  const scrollToBottom = useCallback((behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [visibleMessages.length, isTyping, scrollToBottom])

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    setShowScrollBtn(distanceFromBottom > 120)
  }, [])

  /* ---- open/close side-effects ------------------------------------ */
  useEffect(() => {
    if (!isOpen) return
    const t = setTimeout(() => inputRef.current?.focus(), 120)
    const onKey = (e) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(t)
      window.removeEventListener('keydown', onKey)
    }
  }, [isOpen])

  useEffect(() => () => clearTimeout(copyTimer.current), [])

  /* ---- lazy-mount the PDF viewer on first reveal ------------------ */
  // Once the Manual pane (or split/maximized view) is shown, keep the viewer
  // mounted; it never needs to load for users who only ever use chat.
  useEffect(() => {
    if (activeTab === 'pdf' || isMaximized) setPdfMounted(true)
  }, [activeTab, isMaximized])

  /* ---- markdown renderer (stable) --------------------------------- */
  const markdownComponents = useMemo(
    () => ({
      a: ({ href, children }) => {
        const pageMatch = href && href.match(/^#(\d+)$/)
        if (pageMatch) {
          return (
            <a
              href={href}
              className="citation-link"
              onClick={(e) => {
                e.preventDefault()
                setPdfPage(parseInt(pageMatch[1], 10))
                setActiveTab('pdf')
              }}
            >
              {children}
            </a>
          )
        }
        return (
          <a href={href} target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        )
      },
    }),
    [],
  )

  const renderContent = useCallback(
    (content) => (
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    ),
    [markdownComponents],
  )

  /* ---- copy ------------------------------------------------------- */
  const handleCopy = useCallback((content, id) => {
    const done = () => {
      setCopiedId(id)
      clearTimeout(copyTimer.current)
      copyTimer.current = setTimeout(() => setCopiedId(null), 1600)
    }
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(content).then(done).catch(done)
    } else {
      done()
    }
  }, [])

  /* ---- send ------------------------------------------------------- */
  // Run a completion for an already-finalized message list (the list must end
  // with the user turn we want answered). Shared by first-send and retry so
  // neither path can duplicate the user message or strip the other's logic.
  const runCompletion = useCallback(async (list) => {
    setIsTyping(true)
    try {
      const response = await callGemini(list)
      setMessages([
        ...list,
        { id: nextMessageId(), role: 'assistant', content: scrubResponse(response) },
      ])
    } catch (error) {
      setMessages([
        ...list,
        {
          id: nextMessageId(),
          role: 'assistant',
          content: `**Connection issue.** ${error.message}`,
          isError: true,
        },
      ])
    } finally {
      setIsTyping(false)
    }
  }, [])

  const handleSend = useCallback(
    (overrideText) => {
      const text = (overrideText ?? input).trim()
      if (!text || isTyping) return

      const userMessage = { id: nextMessageId(), role: 'user', content: text }
      const nextMessages = [...messages, userMessage]
      setMessages(nextMessages)
      setInput('')
      if (inputRef.current) inputRef.current.style.height = 'auto'
      runCompletion(nextMessages)
    },
    [input, isTyping, messages, runCompletion],
  )

  const handleRetry = useCallback(() => {
    if (isTyping) return
    // Drop the trailing error (and any non-user tail) so we re-send the same
    // user turn instead of appending a duplicate copy of it.
    let list = messages
    while (list.length && list[list.length - 1].role !== 'user') {
      list = list.slice(0, -1)
    }
    if (list.length && list[list.length - 1].role === 'user') {
      setMessages(list)
      runCompletion(list)
    }
  }, [messages, isTyping, runCompletion])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = (e) => {
    setInput(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`
  }

  const lastIsError =
    visibleMessages.length > 0 &&
    visibleMessages[visibleMessages.length - 1].isError

  /* ---------------------------------------------------------------- */
  return (
    <div className="chat-widget-container">
      {/* Floating action button */}
      <button
        className={`chat-fab ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? 'Close Descartes chat' : 'Chat with Descartes'}
        aria-expanded={isOpen}
      >
        <span className="fab-ring" aria-hidden="true" />
        {isOpen ? (
          <Icon.Close className="fab-icon" />
        ) : (
          <img src={logoSrc} alt="Descartes" className="fab-logo-img" />
        )}
      </button>

      {/* Chat window */}
      <div
        className={`chat-overlay ${isOpen ? 'open' : 'closed'} ${
          isMaximized ? 'maximized' : ''
        }`}
        role="dialog"
        aria-label="Descartes FTC AI assistant"
        aria-hidden={!isOpen}
      >
        <div className="app-container">
          <header className="header">
            <div className="logo-container">
              <div className="logo-text">
                <span className="title-line">
                  DESCARTES <span className="brand-accent">FTC AI</span>
                </span>
              </div>
            </div>
            <div className="header-actions">
              <button
                type="button"
                className="icon-btn maximize-btn"
                onClick={() => setIsMaximized((v) => !v)}
                aria-label={isMaximized ? 'Restore size' : 'Maximize chat'}
              >
                {isMaximized ? <Icon.Restore /> : <Icon.Maximize />}
              </button>
              <button
                type="button"
                className="icon-btn close-btn-mobile"
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
              >
                <Icon.Close />
              </button>
            </div>
          </header>

          <nav className="mobile-tabs" role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === 'chat'}
              className={activeTab === 'chat' ? 'active' : ''}
              onClick={() => setActiveTab('chat')}
            >
              Chat
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'pdf'}
              className={activeTab === 'pdf' ? 'active' : ''}
              onClick={() => setActiveTab('pdf')}
            >
              Manual
            </button>
          </nav>

          <main className="main-content">
            <div className={`pdf-pane ${activeTab === 'pdf' ? 'active' : ''}`}>
              {pdfMounted && (
                <Suspense
                  fallback={
                    <div className="pdf-loading">
                      <span className="pdf-loading-spinner" aria-hidden="true" />
                      <span className="pdf-loading-text">Loading manual…</span>
                    </div>
                  }
                >
                  <AdobeViewer
                    pdfUrl={window.descartesConfig?.pdfUrl || '/game-manual.pdf'}
                    pageNum={pdfPage}
                  />
                </Suspense>
              )}
            </div>

            <div className={`chat-pane ${activeTab === 'chat' ? 'active' : ''}`}>
              <div
                className="chat-messages"
                ref={scrollRef}
                onScroll={handleScroll}
                aria-live="polite"
              >
                <div className={`empty-state ${chatStarted ? 'started' : ''}`}>
                  <div className="empty-hero-row">
                    <div className="empty-logo">
                      <img src={logoSrc} alt="" />
                    </div>
                    <div className="empty-hero-text">
                      <span className="empty-eyebrow">
                        FTC DECODE · AI Assistant
                      </span>
                      <h2 className="empty-title">
                        Hi, I&apos;m{' '}
                        <span className="brand-accent">Descartes</span>
                      </h2>
                      <p className="empty-sub">
                        Your mentor for the DECODE season — ask about rules,
                        scoring, robot limits, or strategy, and I&apos;ll cite
                        the exact manual pages so you can verify every answer.
                      </p>
                    </div>
                  </div>
                  {!chatStarted && (
                    <>
                      <span className="suggest-head">Suggested questions</span>
                      <div className="suggestions">
                        {SUGGESTIONS.map((s) => (
                          <button
                            key={s.label}
                            type="button"
                            className="suggestion-chip"
                            onClick={() => handleSend(s.label)}
                          >
                            <Icon.Spark className="chip-spark" />
                            <span>{s.label}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {conversation.map((msg) => (
                  <Message
                    key={msg.id}
                    msg={msg}
                    isCopied={copiedId === msg.id}
                    onCopy={handleCopy}
                    renderContent={renderContent}
                    logoSrc={logoSrc}
                  />
                ))}

                {isTyping && (
                  <div className="message assistant">
                    <div className="avatar" aria-hidden="true">
                      <img src={logoSrc} alt="" />
                    </div>
                    <div className="message-col">
                      <div className="message-bubble typing-bubble">
                        <span
                          className="typing-indicator"
                          aria-label="Descartes is typing"
                        >
                          <span className="typing-dot" />
                          <span className="typing-dot" />
                          <span className="typing-dot" />
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {lastIsError && !isTyping && (
                  <div className="retry-row">
                    <button
                      type="button"
                      className="retry-btn"
                      onClick={handleRetry}
                    >
                      <Icon.Refresh /> Try again
                    </button>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              <button
                type="button"
                className={`scroll-bottom-btn ${showScrollBtn ? 'visible' : ''}`}
                onClick={() => scrollToBottom()}
                aria-label="Scroll to latest"
                tabIndex={showScrollBtn ? 0 : -1}
              >
                <Icon.ArrowDown />
              </button>

              <div className="input-area">
                <div className="input-wrapper">
                  <textarea
                    ref={inputRef}
                    className="chat-textarea"
                    rows={1}
                    placeholder="Ask about a rule, page, or strategy…"
                    value={input}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                  />
                  <button
                    type="button"
                    className="send-btn"
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isTyping}
                    aria-label={isTyping ? 'Waiting for reply' : 'Send message'}
                  >
                    {isTyping ? (
                      <span className="send-spinner" aria-hidden="true" />
                    ) : (
                      <Icon.Send />
                    )}
                  </button>
                </div>
                <p className="input-hint">
                  Enter to send · Shift+Enter for a new line
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default App
