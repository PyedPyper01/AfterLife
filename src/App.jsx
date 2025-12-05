import { useState, useEffect, useRef } from 'react'
import { 
  Home, MessageCircle, ShoppingCart, Heart, Phone, 
  Send, MapPin, Star, Search, Filter, ArrowLeft, ChevronLeft,
  FileText, Users, Clock, Shield, Upload, Share2, Calendar, X, Image
} from 'lucide-react'

// ============================================================
// QUESTIONS CONFIGURATION
// ============================================================

const QUESTIONS = {
  location: { id: 'location', prompt: 'Where did the death occur?', description: 'This helps us provide the right guidance for your situation', type: 'single', options: [
    { value: 'home-expected', label: 'At home (expected)', next: 'postcode' },
    { value: 'home-unexpected', label: 'At home (unexpected)', next: 'police_coroner' },
    { value: 'hospital', label: 'In hospital', next: 'postcode' },
    { value: 'care-home', label: 'In a care home', next: 'postcode' },
    { value: 'abroad', label: 'Abroad', next: 'abroad_country' },
    { value: 'crime-scene', label: 'Suspicious circumstances', next: 'police_coroner' }
  ]},
  police_coroner: { id: 'police_coroner', prompt: 'Have you contacted the police or coroner?', description: 'For unexpected deaths or suspicious circumstances, the police and coroner must be involved', type: 'single', options: [
    { value: 'yes', label: 'Yes, already contacted', next: 'postcode' },
    { value: 'no', label: 'No, not yet', next: 'postcode' }
  ], visibleIf: (answers) => answers.location === 'home-unexpected' || answers.location === 'crime-scene' },
  abroad_country: { id: 'abroad_country', prompt: 'Which country did the death occur in?', description: 'This helps us provide country-specific repatriation guidance', type: 'text', placeholder: 'e.g., Spain, France, USA', next: 'repatriation', visibleIf: (answers) => answers.location === 'abroad' },
  repatriation: { id: 'repatriation', prompt: 'Do you need help arranging repatriation to the UK?', description: 'We can connect you with specialists who handle international repatriation', type: 'single', options: [
    { value: 'yes', label: 'Yes, I need help', next: 'postcode' },
    { value: 'no', label: 'No, already arranged', next: 'postcode' }
  ], visibleIf: (answers) => answers.location === 'abroad' },
  postcode: { id: 'postcode', prompt: 'What is your postcode?', description: 'This helps us find local services and provide jurisdiction-specific guidance', type: 'text', placeholder: 'e.g., SW1A 1AA', next: 'age' },
  age: { id: 'age', prompt: 'Age category of the deceased', type: 'single', options: [
    { value: 'adult', label: 'Adult', next: 'religion' },
    { value: 'child', label: 'Child (under 18)', next: 'religion' },
    { value: 'stillbirth', label: 'Stillbirth', next: 'religion' }
  ]},
  religion: { id: 'religion', prompt: 'Religious or cultural background', description: 'This helps us provide culturally appropriate guidance', type: 'single', options: [
    { value: 'islam', label: 'Islam', next: 'urgent_burial' },
    { value: 'judaism', label: 'Judaism', next: 'urgent_burial' },
    { value: 'hindu', label: 'Hindu', next: 'burial_cremation' },
    { value: 'sikh', label: 'Sikh', next: 'burial_cremation' },
    { value: 'christian', label: 'Christian', next: 'burial_cremation' },
    { value: 'catholic', label: 'Catholic', next: 'burial_cremation' },
    { value: 'none', label: 'None/Humanist', next: 'burial_cremation' }
  ]},
  urgent_burial: { id: 'urgent_burial', prompt: 'Do you have a community contact or preferred religious funeral director?', description: 'Islamic and Jewish traditions typically require burial within 24 hours. We can connect you with specialist funeral directors immediately.', type: 'single', options: [
    { value: 'yes', label: 'Yes, I have a contact', next: 'burial_cremation' },
    { value: 'no', label: 'No, I need help urgently', next: 'burial_cremation' }
  ], visibleIf: (answers) => answers.religion === 'islam' || answers.religion === 'judaism' },
  burial_cremation: { id: 'burial_cremation', prompt: 'Burial or cremation preference?', type: 'single', options: [
    { value: 'burial', label: 'Burial', next: 'will' },
    { value: 'cremation', label: 'Cremation', next: 'will' },
    { value: 'unsure', label: 'Not sure yet', next: 'will' }
  ]},
  will: { id: 'will', prompt: 'Is there a Will?', description: 'The Will names the executor and may contain funeral wishes', type: 'single', options: [
    { value: 'yes', label: 'Yes, Will found', next: 'funeral_plan' },
    { value: 'no', label: 'No Will found', next: 'funeral_plan' },
    { value: 'unsure', label: 'Not sure / Still looking', next: 'funeral_plan' }
  ]},
  funeral_plan: { id: 'funeral_plan', prompt: 'Is there a pre-paid funeral plan?', description: 'A funeral plan may cover significant costs', type: 'single', options: [
    { value: 'yes', label: 'Yes, there is a plan', next: 'complete' },
    { value: 'no', label: 'No plan', next: 'complete' },
    { value: 'unsure', label: 'Not sure', next: 'complete' }
  ]},
  complete: { id: 'complete', prompt: 'Assessment Complete', type: 'single', options: [] }
}

const getNextQuestion = (currentId, answer, answers) => {
  const question = QUESTIONS[currentId]
  if (!question) return null
  if (question.next) return question.next
  if (question.options && question.type === 'single') {
    const selectedOption = question.options.find(opt => opt.value === answer)
    if (selectedOption?.next) return selectedOption.next
  }
  return null
}

// ============================================================
// SUPPLIERS DATA
// ============================================================

const getPostcodeArea = (postcode) => {
  if (!postcode) return ''
  const clean = postcode.toUpperCase().replace(/\s/g, '')
  const match = clean.match(/^([A-Z]{1,2}\d{1,2}[A-Z]?)/)
  return match ? match[1] : ''
}

const supplierTypeLabels = { 
  'funeral-director': 'Funeral Directors', 
  'crematorium': 'Crematoriums',
  'cemetery': 'Cemeteries',
  'natural-burial': 'Natural Burial Sites',
  'florist': 'Florists', 
  'stonemason': 'Stonemasons', 
  'venue': 'Venues', 
  'caterer': 'Caterers',
  'solicitor': 'Probate Solicitors',
  'will-writer': 'Will Writers',
  'accountant': 'Accountants',
  'celebrant': 'Celebrants',
  'musician': 'Musicians',
  'photographer': 'Photographers',
  'videographer': 'Videographers',
  'transport': 'Specialist Transport',
  'house-clearance': 'House Clearance',
  'counsellor': 'Grief Counsellors',
  'printer': 'Order of Service Printing',
  'memorial-jewellery': 'Memorial Jewellery',
  'locksmith': 'Locksmiths',
  'cleaning': 'Cleaning Services',
  'pet-services': 'Pet Services',
  'repatriation': 'Repatriation Services'
}

// ============================================================
// NAVIGATION
// ============================================================

function Navigation({ currentPage, setCurrentPage }) {
  return (
    <nav className="nav-header">
      <div className="nav-links">
        <button className={`nav-link ${currentPage === 'home' ? 'active' : ''}`} onClick={() => setCurrentPage('home')}>Home</button>
        <button className={`nav-link ${currentPage === 'about' ? 'active' : ''}`} onClick={() => setCurrentPage('about')}>About</button>
        <button className={`nav-link ${currentPage === 'guide' ? 'active' : ''}`} onClick={() => setCurrentPage('guide')}>AI Guide</button>
        <button className={`nav-link ${currentPage === 'marketplace' ? 'active' : ''}`} onClick={() => setCurrentPage('marketplace')}>Marketplace</button>
        <button className={`nav-link ${currentPage === 'memorial' ? 'active' : ''}`} onClick={() => setCurrentPage('memorial')}>Memorial</button>
        <button className={`nav-link ${currentPage === 'concierge' ? 'active' : ''}`} onClick={() => setCurrentPage('concierge')}>Concierge</button>
        <button className={`nav-link ${currentPage === 'contact' ? 'active' : ''}`} onClick={() => setCurrentPage('contact')}>Contact</button>
      </div>
    </nav>
  )
}

// ============================================================
// HOME PAGE
// ============================================================

function HomePage({ setCurrentPage }) {
  return (
    <div className="hero-section">
      <img src="https://customer-assets.emergentagent.com/job_griefhelp-portal/artifacts/f3bwrmaw_X2dsu6Y5A-nrnFWHDtX0r.png" alt="AfterLife Logo" className="hero-logo" />
      <h1 className="hero-title">Compassionate <span className="accent">Guidance</span> When You Need It Most</h1>
      <p className="hero-subtitle">AfterLife transforms the overwhelming journey through bereavement into a clear, supported path forward. AI-powered guidance, verified professionals, and human compassion—all in one place.</p>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button className="btn-primary" onClick={() => setCurrentPage('guide')}>Start Your Journey</button>
        <button className="btn-secondary" onClick={() => setCurrentPage('marketplace')}>Find Local Services</button>
      </div>
      <div className="features-grid">
        <div className="feature-card" onClick={() => setCurrentPage('guide')}><div className="feature-icon"><MessageCircle size={28} /></div><h3 className="card-title">AI Bereavement Guide</h3><p className="card-description">Get compassionate, accurate answers about the bereavement process 24/7.</p></div>
        <div className="feature-card" onClick={() => setCurrentPage('marketplace')}><div className="feature-icon"><ShoppingCart size={28} /></div><h3 className="card-title">Local Services Marketplace</h3><p className="card-description">Find verified funeral directors, florists, stonemasons and more.</p></div>
        <div className="feature-card" onClick={() => setCurrentPage('memorial')}><div className="feature-icon"><Heart size={28} /></div><h3 className="card-title">Digital Memorials</h3><p className="card-description">Create beautiful online tributes to celebrate loved ones.</p></div>
        <div className="feature-card"><div className="feature-icon"><FileText size={28} /></div><h3 className="card-title">Document Vault</h3><p className="card-description">Securely store important documents in one safe place.</p></div>
        <div className="feature-card"><div className="feature-icon"><Clock size={28} /></div><h3 className="card-title">Task Checklist</h3><p className="card-description">Never miss an important deadline with guided checklists.</p></div>
        <div className="feature-card" onClick={() => setCurrentPage('concierge')}><div className="feature-icon"><Users size={28} /></div><h3 className="card-title">Concierge Service</h3><p className="card-description">Our team can handle calls and paperwork on your behalf.</p></div>
      </div>
    </div>
  )
}

// ============================================================
// TRIAGE WIZARD
// ============================================================

function TriageWizard({ onComplete, onBack }) {
  const [currentQuestionId, setCurrentQuestionId] = useState('location')
  const [answers, setAnswers] = useState({})
  const [history, setHistory] = useState([])
  const [inputValue, setInputValue] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('afterlife-triage-progress')
    if (saved) { try { const { answers: s, currentQuestion: c } = JSON.parse(saved); setAnswers(s); setCurrentQuestionId(c); } catch (e) {} }
  }, [])

  useEffect(() => { localStorage.setItem('afterlife-triage-progress', JSON.stringify({ answers, currentQuestion: currentQuestionId })) }, [answers, currentQuestionId])

  useEffect(() => {
    if (currentQuestionId === 'postcode' && answers.postcode) {
      const p = answers.postcode.toUpperCase()
      let j = 'england-wales'
      if (p.match(/^(BT)/)) j = 'northern-ireland'
      else if (p.match(/^(AB|DD|DG|EH|FK|G|HS|IV|KA|KW|KY|ML|PA|PH|TD|ZE)/)) j = 'scotland'
      if (answers.jurisdiction !== j) setAnswers(prev => ({ ...prev, jurisdiction: j }))
    }
  }, [answers.postcode, currentQuestionId])

  const currentQuestion = QUESTIONS[currentQuestionId]

  const handleAnswer = (value) => {
    const newAnswers = { ...answers, [currentQuestionId]: value }
    setAnswers(newAnswers)
    const nextId = getNextQuestion(currentQuestionId, value, newAnswers)
    if (nextId === 'complete' || !nextId) { onComplete(newAnswers); localStorage.removeItem('afterlife-triage-progress'); }
    else {
      const nextQ = QUESTIONS[nextId]
      if (nextQ?.visibleIf && !nextQ.visibleIf(newAnswers)) {
        const skipId = getNextQuestion(nextId, null, newAnswers)
        if (skipId) { setHistory([...history, currentQuestionId]); setCurrentQuestionId(skipId); }
      } else { setHistory([...history, currentQuestionId]); setCurrentQuestionId(nextId); }
      setInputValue('')
    }
  }

  const handleBack = () => {
    if (history.length > 0) { const prev = history[history.length - 1]; setHistory(history.slice(0, -1)); setCurrentQuestionId(prev); setInputValue(answers[prev] || ''); }
    else onBack()
  }

  if (!currentQuestion) return null
  if (currentQuestion.visibleIf && !currentQuestion.visibleIf(answers)) {
    const nextId = getNextQuestion(currentQuestionId, null, answers)
    if (nextId) setTimeout(() => setCurrentQuestionId(nextId), 0)
    return null
  }

  const isUrgent = currentQuestionId === 'urgent_burial' || currentQuestionId === 'police_coroner'

  return (
    <div className="page-container">
      <div className="page-content" style={{ maxWidth: '700px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <button className="back-btn" onClick={handleBack} style={{ marginBottom: 0 }}>{history.length > 0 ? <><ChevronLeft size={18} /> Back</> : <><Home size={18} /> Home</>}</button>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>Question {history.length + 1}</span>
        </div>
        <div style={{ marginBottom: '32px' }}><div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}><div style={{ height: '100%', width: `${((history.length + 1) / 10) * 100}%`, background: 'linear-gradient(90deg, #4682B4, #87CEEB)', transition: 'width 0.3s ease' }} /></div></div>
        <div className={`card ${isUrgent ? 'urgent' : ''}`} style={{ padding: '40px' }}>
          <h2 style={{ fontSize: '28px', marginBottom: '12px' }}>{currentQuestion.prompt}</h2>
          {currentQuestion.description && <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '32px' }}>{currentQuestion.description}</p>}
          {isUrgent && <div style={{ background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: '12px', padding: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}><Clock size={20} style={{ color: '#fbbf24' }} /><span style={{ color: '#fbbf24' }}><strong>Time-sensitive:</strong> This requires immediate attention</span></div>}
          {currentQuestion.type === 'text' && (
            <div>
              <input type="text" className="chat-input" style={{ width: '100%', marginBottom: '16px', fontSize: '18px', padding: '18px' }} placeholder={currentQuestion.placeholder} value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && inputValue.trim() && handleAnswer(inputValue.trim())} autoFocus />
              {currentQuestionId === 'postcode' && answers.jurisdiction && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '16px' }}>Detected: {answers.jurisdiction === 'england-wales' ? 'England/Wales' : answers.jurisdiction === 'scotland' ? 'Scotland' : 'Northern Ireland'}</p>}
              <button className="btn-primary" style={{ width: '100%' }} disabled={!inputValue.trim()} onClick={() => handleAnswer(inputValue.trim())}>Continue</button>
            </div>
          )}
          {currentQuestion.type === 'single' && currentQuestion.options && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {currentQuestion.options.map((opt) => (<button key={opt.value} className="option-btn" onClick={() => handleAnswer(opt.value)}>{opt.label}</button>))}
            </div>
          )}
        </div>
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', marginTop: '24px', fontSize: '14px' }}>Your answers are saved automatically. You can return anytime to continue.</p>
      </div>
    </div>
  )
}

// ============================================================
// GUIDANCE SCREEN
// ============================================================

function GuidanceScreen({ triageData, setCurrentPage, setPostcode }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    const j = triageData.jurisdiction || 'england-wales'
    const jName = j === 'scotland' ? 'Scotland' : j === 'northern-ireland' ? 'Northern Ireland' : 'England & Wales'
    const deadline = j === 'scotland' ? '8 days' : '5 days'
    let msg = `Based on your answers, here's your personalized guidance for ${jName}:\n\n📋 **Immediate Steps:**\n• Register the death within ${deadline}\n• Obtain the Medical Certificate of Cause of Death\n`
    if (triageData.police_coroner === 'no') msg += `• ⚠️ Contact the police/coroner immediately for unexpected deaths\n`
    if (triageData.religion === 'islam' || triageData.religion === 'judaism') msg += `• 🕐 Contact a religious funeral director urgently for burial arrangements\n`
    msg += `\n📍 Your postcode: ${triageData.postcode || 'Not provided'}\n\nHow can I help you further?`
    setMessages([{ role: 'assistant', content: msg }])
    if (triageData.postcode) setPostcode(triageData.postcode)
  }, [triageData])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const quickTopics = ['How do I register the death?', 'What documents do I need?', 'Find funeral directors near me', 'What is Tell Us Once?', 'Explain probate', 'What are the costs involved?']

  const handleSend = async () => {
    if (!input.trim()) return
    setMessages(prev => [...prev, { role: 'user', content: input }])
    const currentInput = input
    setInput('')
    setIsTyping(true)
    try {
      const res = await fetch('/.netlify/functions/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: currentInput, postcode: triageData.postcode, context: triageData }) })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
    } catch (e) { setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting right now. Please try again." }]) }
    finally { setIsTyping(false) }
  }

  return (
    <div className="page-container">
      <div className="page-content">
        <button className="back-btn" onClick={() => setCurrentPage('home')}><ArrowLeft size={18} /> Back to Home</button>
        <div className="chat-container">
          <div className="chat-header"><MessageCircle size={24} style={{ color: 'var(--color-primary)' }} /><h2 style={{ fontSize: '20px', fontWeight: 600 }}>Your Personalized Guidance</h2></div>
          <div className="chat-messages">
            {messages.map((msg, i) => (<div key={i} className={`chat-message ${msg.role}`}>{msg.content}</div>))}
            {isTyping && <div className="typing-indicator"><div className="typing-dot"></div><div className="typing-dot"></div><div className="typing-dot"></div></div>}
            <div ref={messagesEndRef} />
          </div>
          <div className="quick-topics">{quickTopics.map((t, i) => (<button key={i} className="quick-topic-btn" onClick={() => setInput(t)}>{t}</button>))}</div>
          <div className="chat-input-container">
            <input type="text" className="chat-input" placeholder="Ask me anything..." value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} />
            <button className="chat-send-btn" onClick={handleSend} disabled={!input.trim() || isTyping}><Send size={20} /></button>
          </div>
        </div>
        <div style={{ marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button className="btn-secondary" onClick={() => setCurrentPage('marketplace')}>Find Local Services</button>
          <button className="btn-secondary" onClick={() => setCurrentPage('concierge')}>Get Human Help</button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// GUIDE PAGE
// ============================================================

function GuidePage({ setCurrentPage, postcode, setPostcode }) {
  const [triageComplete, setTriageComplete] = useState(false)
  const [triageData, setTriageData] = useState(null)
  const handleComplete = (answers) => { setTriageData(answers); setTriageComplete(true); if (answers.postcode) setPostcode(answers.postcode); }
  if (!triageComplete) return <TriageWizard onComplete={handleComplete} onBack={() => setCurrentPage('home')} />
  return <GuidanceScreen triageData={triageData} setCurrentPage={setCurrentPage} setPostcode={setPostcode} />
}

// ============================================================
// MARKETPLACE - WITH GOOGLE PLACES API
// ============================================================

function MarketplacePage({ setCurrentPage, postcode, setPostcode }) {
  const [searchQuery, setSearchQuery] = useState(postcode || '')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [suppliers, setSuppliers] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [error, setError] = useState(null)

  // Search for suppliers using Google Places API
  const searchSuppliers = async (query, category) => {
    if (!query || query.length < 2) return
    
    setIsLoading(true)
    setError(null)
    setHasSearched(true)
    
    try {
      const response = await fetch('/.netlify/functions/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postcode: query, category: category })
      })
      
      if (!response.ok) throw new Error('Search failed')
      
      const data = await response.json()
      setSuppliers(data.suppliers || [])
      
      if (data.suppliers?.length === 0) {
        setError('No services found near this postcode. Try a different postcode or category.')
      }
    } catch (err) {
      console.error('Search error:', err)
      setError('Unable to search. Please check your postcode and try again.')
      setSuppliers([])
    } finally {
      setIsLoading(false)
    }
  }

  // Debounced search on postcode change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery && searchQuery.match(/^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d?[A-Z]{0,2}$/i)) {
        searchSuppliers(searchQuery, selectedType)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Re-search when category changes
  useEffect(() => {
    if (hasSearched && searchQuery) {
      searchSuppliers(searchQuery, selectedType)
    }
  }, [selectedType])

  const handleSearch = () => {
    if (searchQuery) {
      searchSuppliers(searchQuery, selectedType)
      setPostcode(searchQuery)
    }
  }

  const filteredSuppliers = selectedType === 'all' 
    ? suppliers 
    : suppliers.filter(s => s.type === selectedType)

  return (
    <div className="page-container">
      <div className="page-content">
        <button className="back-btn" onClick={() => setCurrentPage('home')}><ArrowLeft size={18} /> Back to Home</button>
        <h1 className="page-title">Find Local Services</h1>
        <p className="page-subtitle">Real businesses near you. Enter your postcode to search within 5 miles.</p>
        
        <div style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Enter postcode (e.g., AL1 3JQ)..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button className="btn-primary" onClick={handleSearch} disabled={isLoading}>
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>

        <div className="marketplace-filters">
          <button className={`filter-btn ${selectedType === 'all' ? 'active' : ''}`} onClick={() => setSelectedType('all')}><Filter size={16} style={{ marginRight: '8px' }} /> All</button>
          {Object.entries(supplierTypeLabels).map(([t, l]) => (<button key={t} className={`filter-btn ${selectedType === t ? 'active' : ''}`} onClick={() => setSelectedType(t)}>{l}</button>))}
        </div>

        {isLoading && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div className="typing-indicator" style={{ justifyContent: 'center' }}>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '16px' }}>Searching for services near {searchQuery}...</p>
          </div>
        )}

        {!isLoading && !hasSearched && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <MapPin size={48} style={{ color: 'var(--color-primary)', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Enter your postcode</h3>
            <p style={{ color: 'rgba(255,255,255,0.6)' }}>We'll find funeral directors, florists, stonemasons and more within 5 miles</p>
          </div>
        )}

        {!isLoading && hasSearched && error && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '16px' }}>{error}</p>
            <button className="btn-secondary" onClick={() => { setSearchQuery(''); setHasSearched(false); setError(null) }}>Try Again</button>
          </div>
        )}

        {!isLoading && hasSearched && !error && filteredSuppliers.length > 0 && (
          <>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '20px' }}>Found {filteredSuppliers.length} services near {searchQuery}</p>
            <div className="suppliers-grid">
              {filteredSuppliers.map(s => (
                <div key={s.id} className="supplier-card" onClick={() => setSelectedSupplier(s)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 className="supplier-name">{s.name}</h3>
                    <span className="service-tag" style={{ textTransform: 'capitalize' }}>{s.type.replace('-', ' ')}</span>
                  </div>
                  <div className="supplier-location"><MapPin size={14} /> {s.location}</div>
                  {s.rating && (
                    <div className="supplier-rating">
                      <Star size={16} fill="#fbbf24" color="#fbbf24" />
                      <span style={{ fontWeight: 600 }}>{s.rating}</span>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>({s.reviewCount} reviews)</span>
                      {s.isOpen !== undefined && (
                        <span style={{ marginLeft: 'auto', color: s.isOpen ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                          {s.isOpen ? 'Open Now' : 'Closed'}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {!isLoading && hasSearched && !error && filteredSuppliers.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '16px' }}>No {selectedType === 'all' ? 'services' : supplierTypeLabels[selectedType]} found in this area.</p>
            <button className="btn-secondary" onClick={() => setSelectedType('all')}>Show All Categories</button>
          </div>
        )}
      </div>

      {selectedSupplier && (
        <div className="modal-overlay" onClick={() => setSelectedSupplier(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>{selectedSupplier.name}</h2>
                <p style={{ color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14} /> {selectedSupplier.location}</p>
              </div>
              <button onClick={() => setSelectedSupplier(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: '24px', cursor: 'pointer' }}>×</button>
            </div>
            
            {selectedSupplier.rating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Star size={20} fill="#fbbf24" color="#fbbf24" />
                <span style={{ fontSize: '18px', fontWeight: 600 }}>{selectedSupplier.rating}</span>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>({selectedSupplier.reviewCount} reviews)</span>
              </div>
            )}
            
            <div style={{ marginBottom: '20px' }}>
              <span className="service-tag" style={{ textTransform: 'capitalize' }}>{selectedSupplier.type.replace('-', ' ')}</span>
              {selectedSupplier.isOpen !== undefined && (
                <span style={{ marginLeft: '12px', color: selectedSupplier.isOpen ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                  {selectedSupplier.isOpen ? '● Open Now' : '● Closed'}
                </span>
              )}
            </div>

            {selectedSupplier.phone && (
              <a 
                href={`tel:${selectedSupplier.phone}`}
                className="btn-primary" 
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none', marginBottom: '12px' }}
              >
                <Phone size={18} /> {selectedSupplier.phone}
              </a>
            )}
            
            {selectedSupplier.website && (
              <a 
                href={selectedSupplier.website}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary" 
                style={{ width: '100%', display: 'block', textAlign: 'center', textDecoration: 'none', marginBottom: '12px' }}
              >
                Visit Website
              </a>
            )}

            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedSupplier.name + ' ' + selectedSupplier.location)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ width: '100%', display: 'block', textAlign: 'center', textDecoration: 'none', color: 'var(--color-primary)', fontSize: '14px' }}
            >
              View on Google Maps
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// MEMORIAL PAGE - FULL FUNCTIONALITY
// ============================================================

function MemorialPage({ setCurrentPage }) {
  const [memorials, setMemorials] = useState([])
  const [selectedMemorial, setSelectedMemorial] = useState(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newMemorial, setNewMemorial] = useState({ name: '', dateOfBirth: '', dateOfDeath: '', biography: '', photos: [] })
  const [condolenceMessage, setCondolenceMessage] = useState('')
  const [condolenceAuthor, setCondolenceAuthor] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    const saved = localStorage.getItem('afterlife-memorials')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setMemorials(parsed.map(m => ({ ...m, createdAt: new Date(m.createdAt), condolences: m.condolences.map(c => ({ ...c, timestamp: new Date(c.timestamp) })) })))
      } catch (e) {}
    }
  }, [])

  const saveMemorials = (updated) => { localStorage.setItem('afterlife-memorials', JSON.stringify(updated)); setMemorials(updated) }

  const handlePhotoUpload = (e) => {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (event) => { if (event.target?.result) setNewMemorial(prev => ({ ...prev, photos: [...prev.photos, event.target.result] })) }
      reader.readAsDataURL(file)
    })
  }

  const handleCreateMemorial = () => {
    if (!newMemorial.name || !newMemorial.dateOfBirth || !newMemorial.dateOfDeath) { alert('Please fill in all required fields'); return }
    const memorial = { id: Date.now().toString(), ...newMemorial, condolences: [], createdAt: new Date() }
    saveMemorials([...memorials, memorial])
    setNewMemorial({ name: '', dateOfBirth: '', dateOfDeath: '', biography: '', photos: [] })
    setIsCreating(false)
    setSelectedMemorial(memorial)
  }

  const handleAddCondolence = () => {
    if (!selectedMemorial || !condolenceMessage || !condolenceAuthor) { alert('Please fill in your name and message'); return }
    const updated = memorials.map(m => m.id === selectedMemorial.id ? { ...m, condolences: [...m.condolences, { author: condolenceAuthor, message: condolenceMessage, timestamp: new Date() }] } : m)
    saveMemorials(updated)
    setSelectedMemorial(updated.find(m => m.id === selectedMemorial.id))
    setCondolenceMessage('')
    setCondolenceAuthor('')
  }

  const handleShare = (memorial) => {
    const url = `${window.location.origin}/memorial/${memorial.id}`
    if (navigator.share) { navigator.share({ title: `In loving memory of ${memorial.name}`, url }) }
    else { navigator.clipboard.writeText(url); alert('Memorial link copied to clipboard!') }
  }

  // Creating new memorial
  if (isCreating) {
    return (
      <div className="page-container">
        <div className="page-content" style={{ maxWidth: '700px' }}>
          <button className="back-btn" onClick={() => setIsCreating(false)}><ArrowLeft size={18} /> Back to Memorials</button>
          <h1 className="page-title">Create Memorial Page</h1>
          <p className="page-subtitle">Create a beautiful, permanent tribute that's free forever</p>
          <div className="card" style={{ marginTop: '24px' }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Full Name *</label>
              <input type="text" className="chat-input" style={{ width: '100%' }} placeholder="Enter full name" value={newMemorial.name} onChange={(e) => setNewMemorial({ ...newMemorial, name: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Date of Birth *</label>
                <input type="date" className="chat-input" style={{ width: '100%' }} value={newMemorial.dateOfBirth} onChange={(e) => setNewMemorial({ ...newMemorial, dateOfBirth: e.target.value })} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Date of Death *</label>
                <input type="date" className="chat-input" style={{ width: '100%' }} value={newMemorial.dateOfDeath} onChange={(e) => setNewMemorial({ ...newMemorial, dateOfDeath: e.target.value })} />
              </div>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Life Story</label>
              <textarea className="chat-input" style={{ width: '100%', minHeight: '150px', resize: 'vertical' }} placeholder="Share their story, achievements, and what made them special..." value={newMemorial.biography} onChange={(e) => setNewMemorial({ ...newMemorial, biography: e.target.value })} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Photos</label>
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} multiple accept="image/*" onChange={handlePhotoUpload} />
              <button className="btn-secondary" onClick={() => fileInputRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Upload size={18} /> Upload Photos</button>
              {newMemorial.photos.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '16px' }}>
                  {newMemorial.photos.map((photo, i) => (
                    <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: '8px', overflow: 'hidden' }}>
                      <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button onClick={() => setNewMemorial(prev => ({ ...prev, photos: prev.photos.filter((_, idx) => idx !== i) }))} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: '24px', height: '24px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button className="btn-primary" style={{ width: '100%' }} onClick={handleCreateMemorial}>Create Memorial</button>
          </div>
        </div>
      </div>
    )
  }

  // Viewing a memorial
  if (selectedMemorial) {
    return (
      <div className="page-container">
        <div className="page-content" style={{ maxWidth: '800px' }}>
          <button className="back-btn" onClick={() => setSelectedMemorial(null)}><ArrowLeft size={18} /> Back to All Memorials</button>
          <div className="card" style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h1 style={{ fontSize: '32px', fontWeight: 600, marginBottom: '8px' }}>{selectedMemorial.name}</h1>
                <p style={{ color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={16} /> {new Date(selectedMemorial.dateOfBirth).toLocaleDateString()} - {new Date(selectedMemorial.dateOfDeath).toLocaleDateString()}</p>
              </div>
              <button className="btn-secondary" onClick={() => handleShare(selectedMemorial)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Share2 size={16} /> Share</button>
            </div>
            {selectedMemorial.photos.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
                {selectedMemorial.photos.map((photo, i) => (<div key={i} style={{ aspectRatio: '1', borderRadius: '8px', overflow: 'hidden' }}><img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>))}
              </div>
            )}
            {selectedMemorial.biography && (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px' }}>Life Story</h3>
                <p style={{ lineHeight: 1.8, whiteSpace: 'pre-wrap', color: 'rgba(255,255,255,0.85)' }}>{selectedMemorial.biography}</p>
              </div>
            )}
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><MessageCircle size={20} /> Condolences ({selectedMemorial.condolences.length})</h3>
              {selectedMemorial.condolences.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  {selectedMemorial.condolences.map((c, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', marginBottom: '12px' }}>
                      <p style={{ marginBottom: '8px', lineHeight: 1.6 }}>{c.message}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                        <span style={{ fontWeight: 600 }}>— {c.author}</span>
                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>{new Date(c.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ background: 'rgba(135,206,235,0.1)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(135,206,235,0.3)' }}>
                <h4 style={{ marginBottom: '12px', fontWeight: 600 }}>Leave a Condolence</h4>
                <input type="text" className="chat-input" style={{ width: '100%', marginBottom: '12px' }} placeholder="Your name" value={condolenceAuthor} onChange={(e) => setCondolenceAuthor(e.target.value)} />
                <textarea className="chat-input" style={{ width: '100%', minHeight: '100px', marginBottom: '12px', resize: 'vertical' }} placeholder="Share your memories and condolences..." value={condolenceMessage} onChange={(e) => setCondolenceMessage(e.target.value)} />
                <button className="btn-primary" onClick={handleAddCondolence}>Post Condolence</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Memorial list
  return (
    <div className="page-container">
      <div className="page-content">
        <button className="back-btn" onClick={() => setCurrentPage('home')}><ArrowLeft size={18} /> Back to Home</button>
        <h1 className="page-title">Memorial Pages</h1>
        <p className="page-subtitle">Create beautiful, permanent tributes — free forever</p>
        
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', padding: '16px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Heart size={24} style={{ color: '#10b981' }} />
          <p style={{ color: 'rgba(255,255,255,0.85)' }}>Memorial pages are completely free and will remain online permanently. Share photos, stories, and collect condolences from family and friends.</p>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '48px', marginBottom: '32px', cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => setIsCreating(true)} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
          <Heart size={48} style={{ color: 'var(--color-primary)', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>Create a Memorial Page</h3>
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>Honor their memory with a beautiful tribute</p>
        </div>

        {memorials.length > 0 && (
          <>
            <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '20px' }}>Your Memorials</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {memorials.map(m => (
                <div key={m.id} className="card" style={{ cursor: 'pointer', overflow: 'hidden' }} onClick={() => setSelectedMemorial(m)}>
                  {m.photos.length > 0 && (
                    <div style={{ height: '160px', margin: '-24px -24px 16px -24px', overflow: 'hidden' }}>
                      <img src={m.photos[0]} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>{m.name}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '12px' }}>{new Date(m.dateOfBirth).getFullYear()} - {new Date(m.dateOfDeath).getFullYear()}</p>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>
                    <span><Image size={14} style={{ marginRight: '4px' }} />{m.photos.length} photos</span>
                    <span><MessageCircle size={14} style={{ marginRight: '4px' }} />{m.condolences.length} condolences</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ============================================================
// ABOUT PAGE - IMPROVED
// ============================================================

function AboutPage({ setCurrentPage }) {
  return (
    <div className="page-container">
      <div className="page-content" style={{ maxWidth: '900px' }}>
        <button className="back-btn" onClick={() => setCurrentPage('home')}><ArrowLeft size={18} /> Back to Home</button>
        <h1 className="page-title">About AfterLife</h1>
        
        <div style={{ marginTop: '40px' }}>
          <div className="card" style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '16px', color: 'var(--color-primary)' }}>Our Mission</h2>
            <p style={{ lineHeight: 1.8, color: 'rgba(255,255,255,0.85)', fontSize: '18px' }}>
              AfterLife was created with a simple but profound mission: to provide compassionate, practical support to those navigating the difficult journey of bereavement.
            </p>
          </div>

          <div className="card" style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '16px', color: 'var(--color-primary)' }}>The Problem We Solve</h2>
            <p style={{ lineHeight: 1.8, color: 'rgba(255,255,255,0.85)', marginBottom: '16px' }}>
              When someone dies, their loved ones are often overwhelmed by grief while simultaneously facing a complex web of legal, administrative, and practical tasks. In the UK alone:
            </p>
            <ul style={{ lineHeight: 2, color: 'rgba(255,255,255,0.85)', marginLeft: '20px' }}>
              <li>Over 600,000 people die each year, affecting millions of bereaved families</li>
              <li>The average person must complete 40+ administrative tasks following a death</li>
              <li>Families often overpay for funeral services due to lack of price transparency</li>
              <li>Many are unaware of their legal obligations and deadlines</li>
            </ul>
          </div>

          <div className="card" style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '16px', color: 'var(--color-primary)' }}>Our Solution</h2>
            <p style={{ lineHeight: 1.8, color: 'rgba(255,255,255,0.85)' }}>
              AfterLife brings together AI-powered guidance, verified local services, and human support to help you through this challenging time. Our platform provides jurisdiction-specific advice for England & Wales, Scotland, and Northern Ireland, ensuring you receive accurate information relevant to your situation.
            </p>
          </div>

          <h2 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '24px', textAlign: 'center' }}>Our Values</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            <div className="card" style={{ textAlign: 'center' }}>
              <Heart size={40} style={{ color: 'var(--color-primary)', marginBottom: '16px' }} />
              <h3 className="card-title">Compassion First</h3>
              <p className="card-description">Every feature is designed with empathy and understanding for what you're going through.</p>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <Shield size={40} style={{ color: 'var(--color-primary)', marginBottom: '16px' }} />
              <h3 className="card-title">Accurate Information</h3>
              <p className="card-description">We provide reliable, up-to-date guidance based on current UK law and regulations.</p>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <Star size={40} style={{ color: 'var(--color-primary)', marginBottom: '16px' }} />
              <h3 className="card-title">Verified Professionals</h3>
              <p className="card-description">All service providers in our marketplace are carefully vetted for quality and reliability.</p>
            </div>
          </div>

          <div className="card" style={{ marginTop: '32px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '16px' }}>Part of the AfterLife Technologies Group</h2>
            <p style={{ lineHeight: 1.8, color: 'rgba(255,255,255,0.85)' }}>
              AfterLife is part of AfterLife Technologies Ltd, a UK-based company dedicated to transforming the deathcare industry through technology and compassionate service.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// CONCIERGE PAGE
// ============================================================

function ConciergePage({ setCurrentPage }) {
  return (<div className="page-container"><div className="page-content" style={{ maxWidth: '900px' }}><button className="back-btn" onClick={() => setCurrentPage('home')}><ArrowLeft size={18} /> Back to Home</button><h1 className="page-title">Concierge Service</h1><p className="page-subtitle">Let us handle the difficult calls and paperwork on your behalf.</p><div style={{ display: 'grid', gap: '24px', marginTop: '32px' }}><div className="card"><div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}><div className="feature-icon" style={{ flexShrink: 0 }}><Phone size={24} /></div><div><h3 className="card-title">Phone Calls On Your Behalf</h3><p className="card-description">We'll contact utility companies, banks, subscription services, and government departments to notify them and close or transfer accounts.</p></div></div></div><div className="card"><div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}><div className="feature-icon" style={{ flexShrink: 0 }}><FileText size={24} /></div><div><h3 className="card-title">Paperwork Assistance</h3><p className="card-description">We'll help you complete essential forms including Tell Us Once registration, probate applications, and insurance claims.</p></div></div></div><div className="card"><div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}><div className="feature-icon" style={{ flexShrink: 0 }}><Shield size={24} /></div><div><h3 className="card-title">Expert Guidance</h3><p className="card-description">Our experienced team understands the UK bereavement process. We'll ensure nothing is missed and deadlines are met.</p></div></div></div></div><div className="card" style={{ marginTop: '40px', textAlign: 'center', padding: '40px' }}><h2 style={{ fontSize: '24px', marginBottom: '16px' }}>Request a Callback</h2><p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '24px' }}>Our team is available Monday to Friday, 9am - 5pm.</p><form style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px', margin: '0 auto' }}><input type="text" placeholder="Your name" className="chat-input" style={{ width: '100%' }} /><input type="tel" placeholder="Phone number" className="chat-input" style={{ width: '100%' }} /><input type="email" placeholder="Email address" className="chat-input" style={{ width: '100%' }} /><select className="chat-input" style={{ width: '100%' }}><option value="">What do you need help with?</option><option value="calls">Phone calls on my behalf</option><option value="paperwork">Paperwork assistance</option><option value="both">Both</option></select><button type="submit" className="btn-primary">Request Callback</button></form></div></div></div>)
}

// ============================================================
// CONTACT PAGE
// ============================================================

function ContactPage({ setCurrentPage }) {
  return (<div className="page-container"><div className="page-content" style={{ maxWidth: '600px' }}><button className="back-btn" onClick={() => setCurrentPage('home')}><ArrowLeft size={18} /> Back to Home</button><h1 className="page-title">Contact Us</h1><p className="page-subtitle">We're here to help. Reach out with any questions.</p><div className="card" style={{ marginTop: '32px' }}><form style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}><div><label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Name</label><input type="text" className="chat-input" style={{ width: '100%' }} /></div><div><label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Email</label><input type="email" className="chat-input" style={{ width: '100%' }} /></div><div><label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Message</label><textarea className="chat-input" style={{ width: '100%', minHeight: '150px', resize: 'vertical' }} placeholder="How can we help?" /></div><button type="submit" className="btn-primary">Send Message</button></form></div><div style={{ marginTop: '40px', textAlign: 'center' }}><p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '16px' }}>For urgent support:</p><a href="https://www.cruse.org.uk" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)' }}>Cruse Bereavement Care: 0808 808 1677</a></div></div></div>)
}

// ============================================================
// MAIN APP
// ============================================================

function App() {
  const [currentPage, setCurrentPage] = useState('home')
  const [postcode, setPostcode] = useState('')
  return (
    <div>
      <Navigation currentPage={currentPage} setCurrentPage={setCurrentPage} />
      {currentPage === 'home' && <HomePage setCurrentPage={setCurrentPage} />}
      {currentPage === 'guide' && <GuidePage setCurrentPage={setCurrentPage} postcode={postcode} setPostcode={setPostcode} />}
      {currentPage === 'marketplace' && <MarketplacePage setCurrentPage={setCurrentPage} postcode={postcode} setPostcode={setPostcode} />}
      {currentPage === 'memorial' && <MemorialPage setCurrentPage={setCurrentPage} />}
      {currentPage === 'concierge' && <ConciergePage setCurrentPage={setCurrentPage} />}
      {currentPage === 'about' && <AboutPage setCurrentPage={setCurrentPage} />}
      {currentPage === 'contact' && <ContactPage setCurrentPage={setCurrentPage} />}
      <a href="https://www.cruse.org.uk" target="_blank" rel="noopener noreferrer" className="crisis-btn"><Phone size={18} /> Crisis Support</a>
    </div>
  )
}

export default App
