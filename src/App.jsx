import { useState, useEffect, useRef } from 'react'
import { 
  Home, MessageCircle, ShoppingCart, Heart, Phone, 
  Send, MapPin, Star, Search, Filter, ArrowLeft, ChevronLeft,
  FileText, Users, Clock, Shield
} from 'lucide-react'

// ============================================================
// QUESTIONS CONFIGURATION
// ============================================================

const QUESTIONS = {
  location: {
    id: 'location',
    prompt: 'Where did the death occur?',
    description: 'This helps us provide the right guidance for your situation',
    type: 'single',
    options: [
      { value: 'home-expected', label: 'At home (expected)', next: 'postcode' },
      { value: 'home-unexpected', label: 'At home (unexpected)', next: 'police_coroner' },
      { value: 'hospital', label: 'In hospital', next: 'postcode' },
      { value: 'care-home', label: 'In a care home', next: 'postcode' },
      { value: 'abroad', label: 'Abroad', next: 'abroad_country' },
      { value: 'crime-scene', label: 'Suspicious circumstances', next: 'police_coroner' }
    ]
  },
  police_coroner: {
    id: 'police_coroner',
    prompt: 'Have you contacted the police or coroner?',
    description: 'For unexpected deaths or suspicious circumstances, the police and coroner must be involved',
    type: 'single',
    options: [
      { value: 'yes', label: 'Yes, already contacted', next: 'postcode' },
      { value: 'no', label: 'No, not yet', next: 'postcode' }
    ],
    visibleIf: (answers) => answers.location === 'home-unexpected' || answers.location === 'crime-scene'
  },
  abroad_country: {
    id: 'abroad_country',
    prompt: 'Which country did the death occur in?',
    description: 'This helps us provide country-specific repatriation guidance',
    type: 'text',
    placeholder: 'e.g., Spain, France, USA',
    next: 'repatriation',
    visibleIf: (answers) => answers.location === 'abroad'
  },
  repatriation: {
    id: 'repatriation',
    prompt: 'Do you need help arranging repatriation to the UK?',
    description: 'We can connect you with specialists who handle international repatriation',
    type: 'single',
    options: [
      { value: 'yes', label: 'Yes, I need help', next: 'postcode' },
      { value: 'no', label: 'No, already arranged', next: 'postcode' }
    ],
    visibleIf: (answers) => answers.location === 'abroad'
  },
  postcode: {
    id: 'postcode',
    prompt: 'What is your postcode?',
    description: 'This helps us find local services and provide jurisdiction-specific guidance',
    type: 'text',
    placeholder: 'e.g., SW1A 1AA',
    next: 'age'
  },
  age: {
    id: 'age',
    prompt: 'Age category of the deceased',
    type: 'single',
    options: [
      { value: 'adult', label: 'Adult', next: 'religion' },
      { value: 'child', label: 'Child (under 18)', next: 'religion' },
      { value: 'stillbirth', label: 'Stillbirth', next: 'religion' }
    ]
  },
  religion: {
    id: 'religion',
    prompt: 'Religious or cultural background',
    description: 'This helps us provide culturally appropriate guidance',
    type: 'single',
    options: [
      { value: 'islam', label: 'Islam', next: 'urgent_burial' },
      { value: 'judaism', label: 'Judaism', next: 'urgent_burial' },
      { value: 'hindu', label: 'Hindu', next: 'burial_cremation' },
      { value: 'sikh', label: 'Sikh', next: 'burial_cremation' },
      { value: 'christian', label: 'Christian', next: 'burial_cremation' },
      { value: 'catholic', label: 'Catholic', next: 'burial_cremation' },
      { value: 'none', label: 'None/Humanist', next: 'burial_cremation' }
    ]
  },
  urgent_burial: {
    id: 'urgent_burial',
    prompt: 'Do you have a community contact or preferred religious funeral director?',
    description: 'Islamic and Jewish traditions typically require burial within 24 hours. We can connect you with specialist funeral directors immediately.',
    type: 'single',
    options: [
      { value: 'yes', label: 'Yes, I have a contact', next: 'burial_cremation' },
      { value: 'no', label: 'No, I need help urgently', next: 'burial_cremation' }
    ],
    visibleIf: (answers) => answers.religion === 'islam' || answers.religion === 'judaism'
  },
  burial_cremation: {
    id: 'burial_cremation',
    prompt: 'Burial or cremation preference?',
    type: 'single',
    options: [
      { value: 'burial', label: 'Burial', next: 'will' },
      { value: 'cremation', label: 'Cremation', next: 'will' },
      { value: 'unsure', label: 'Not sure yet', next: 'will' }
    ]
  },
  will: {
    id: 'will',
    prompt: 'Is there a Will?',
    description: 'The Will names the executor and may contain funeral wishes',
    type: 'single',
    options: [
      { value: 'yes', label: 'Yes, Will found', next: 'funeral_plan' },
      { value: 'no', label: 'No Will found', next: 'funeral_plan' },
      { value: 'unsure', label: 'Not sure / Still looking', next: 'funeral_plan' }
    ]
  },
  funeral_plan: {
    id: 'funeral_plan',
    prompt: 'Is there a pre-paid funeral plan?',
    description: 'A funeral plan may cover significant costs',
    type: 'single',
    options: [
      { value: 'yes', label: 'Yes, there is a plan', next: 'complete' },
      { value: 'no', label: 'No plan', next: 'complete' },
      { value: 'unsure', label: 'Not sure', next: 'complete' }
    ]
  },
  complete: {
    id: 'complete',
    prompt: 'Assessment Complete',
    type: 'single',
    options: []
  }
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

const suppliers = [
  { id: '1', name: 'Dignity Funeral Directors', type: 'funeral-director', location: 'Westminster, London', postcode: 'SW1A 1AA', description: 'Compassionate funeral services with over 50 years of experience.', priceRange: '£1,500 - £5,000', rating: 4.8, reviewCount: 127, phone: '020 7123 4567', email: 'london@dignity.co.uk', services: ['Traditional Funeral', 'Direct Cremation', 'Burial', 'Repatriation'], verified: true },
  { id: '1b', name: 'London Funeral Services', type: 'funeral-director', location: 'Camden, London', postcode: 'NW1 2DB', description: 'North London family funeral directors with over 30 years serving the community.', priceRange: '£1,400 - £4,200', rating: 4.7, reviewCount: 89, phone: '020 7387 1234', email: 'info@londonfuneralservices.co.uk', services: ['Traditional Funeral', 'Direct Cremation', 'Green Burial'], verified: true },
  { id: '1c', name: 'East London Funerals', type: 'funeral-director', location: 'Stratford, London', postcode: 'E15 1XA', description: 'Serving East London communities with dignity and respect.', priceRange: '£1,300 - £3,800', rating: 4.6, reviewCount: 76, phone: '020 8534 5678', email: 'care@eastlondonfunerals.co.uk', services: ['Traditional Funeral', 'Direct Cremation', 'Multi-faith Services'], verified: true },
  { id: '2', name: 'Co-op Funeralcare Manchester', type: 'funeral-director', location: 'Manchester City Centre', postcode: 'M1 1AA', description: 'Trusted funeral directors offering transparent pricing and personalized services.', priceRange: '£1,200 - £4,500', rating: 4.7, reviewCount: 98, phone: '0161 234 5678', email: 'manchester@coop.co.uk', services: ['Traditional Funeral', 'Direct Cremation', 'Green Burial', 'Memorial Services'], verified: true },
  { id: '2b', name: 'North Manchester Funeral Home', type: 'funeral-director', location: 'Salford', postcode: 'M5 4WT', description: 'Family-run funeral home serving Greater Manchester for three generations.', priceRange: '£1,100 - £3,900', rating: 4.8, reviewCount: 112, phone: '0161 736 4567', email: 'info@northmanchesterfunerals.co.uk', services: ['Traditional Funeral', 'Direct Cremation', 'Burial', 'Pre-paid Plans'], verified: true },
  { id: '3', name: 'Austin & Sons Funeral Directors', type: 'funeral-director', location: 'St Albans', postcode: 'AL1 3JQ', description: 'Family-run funeral directors serving St Albans and Hertfordshire for over 40 years.', priceRange: '£1,800 - £4,200', rating: 4.9, reviewCount: 145, phone: '01727 123456', email: 'info@austinfunerals.co.uk', services: ['Traditional Funeral', 'Direct Cremation', 'Burial', 'Pre-paid Plans'], verified: true },
  { id: '4', name: 'Harpenden Funeral Services', type: 'funeral-director', location: 'Harpenden', postcode: 'AL5 2JX', description: 'Independent funeral directors providing compassionate care to families in Harpenden.', priceRange: '£1,600 - £3,800', rating: 4.8, reviewCount: 89, phone: '01582 765432', email: 'care@harpendenfunerals.co.uk', services: ['Traditional Funeral', 'Direct Cremation', 'Green Burial', 'Home Visits'], verified: true },
  { id: '4b', name: 'Hertfordshire Memorials', type: 'stonemason', location: 'Hatfield', postcode: 'AL10 9AB', description: 'Local stonemasons specializing in bespoke headstones and memorial restoration.', priceRange: '£600 - £2,500', rating: 4.7, reviewCount: 52, phone: '01707 654321', email: 'info@hertsmemorials.co.uk', services: ['Headstones', 'Plaques', 'Restoration', 'Cleaning'], verified: true },
  { id: '4c', name: 'St Albans Florist', type: 'florist', location: 'St Albans', postcode: 'AL1 1AG', description: 'Beautiful sympathy flowers and funeral tributes. Same-day delivery available.', priceRange: '£40 - £400', rating: 4.9, reviewCount: 203, phone: '01727 987654', email: 'orders@stalbansflowers.co.uk', services: ['Wreaths', 'Casket Sprays', 'Standing Sprays', 'Sympathy Bouquets'], verified: true },
  { id: '5', name: 'Bloom & Wild Funeral Flowers', type: 'florist', location: 'Birmingham City Centre', postcode: 'B1 1AA', description: 'Beautiful funeral flowers and tributes, delivered with care and respect.', priceRange: '£50 - £500', rating: 4.9, reviewCount: 156, phone: '0121 345 6789', email: 'funeral@bloomandwild.com', services: ['Wreaths', 'Casket Sprays', 'Standing Sprays', 'Sympathy Bouquets'], verified: true },
  { id: '5b', name: 'Birmingham Funeral Directors', type: 'funeral-director', location: 'Edgbaston, Birmingham', postcode: 'B15 3ES', description: 'Professional funeral services for the Birmingham community.', priceRange: '£1,300 - £4,000', rating: 4.6, reviewCount: 87, phone: '0121 456 7890', email: 'info@birminghamfunerals.co.uk', services: ['Traditional Funeral', 'Direct Cremation', 'Burial'], verified: true },
  { id: '6', name: 'Memorial Masonry Ltd', type: 'stonemason', location: 'Leeds City Centre', postcode: 'LS1 1AA', description: 'Expert stonemasons crafting beautiful headstones and memorials.', priceRange: '£800 - £3,000', rating: 4.6, reviewCount: 67, phone: '0113 456 7890', email: 'info@memorialmasonry.co.uk', services: ['Headstones', 'Plaques', 'Restoration', 'Inscriptions'], verified: true },
  { id: '6b', name: 'Yorkshire Funeral Services', type: 'funeral-director', location: 'Leeds', postcode: 'LS2 7EW', description: 'Serving families across Yorkshire with care and professionalism.', priceRange: '£1,200 - £3,800', rating: 4.8, reviewCount: 134, phone: '0113 234 5678', email: 'info@yorkshirefunerals.co.uk', services: ['Traditional Funeral', 'Direct Cremation', 'Green Burial', 'Pre-paid Plans'], verified: true },
  { id: '7', name: 'The Garden Room', type: 'venue', location: 'Brighton', postcode: 'BN1 1AA', description: 'Peaceful venue for memorial services and celebration of life events.', priceRange: '£300 - £1,500', rating: 4.8, reviewCount: 89, phone: '01273 567 890', email: 'bookings@thegardenroom.co.uk', services: ['Memorial Services', 'Wake Hosting', 'Catering Available', 'AV Equipment'], verified: true },
  { id: '7b', name: 'Brighton & Hove Funerals', type: 'funeral-director', location: 'Hove', postcode: 'BN3 2DF', description: 'Compassionate funeral care on the South Coast.', priceRange: '£1,500 - £4,200', rating: 4.7, reviewCount: 91, phone: '01273 321 456', email: 'care@brightonhovefunerals.co.uk', services: ['Traditional Funeral', 'Direct Cremation', 'Natural Burial'], verified: true },
  { id: '8', name: 'Heritage Catering', type: 'caterer', location: 'Oxford', postcode: 'OX1 1AA', description: 'Sensitive and professional catering for funeral receptions and wakes.', priceRange: '£15 - £45 per head', rating: 4.7, reviewCount: 54, phone: '01865 678 901', email: 'events@heritagecatering.co.uk', services: ['Buffets', 'Afternoon Tea', 'Hot Meals', 'Dietary Options'], verified: true },
  { id: '8b', name: 'Oxford Funeral Services', type: 'funeral-director', location: 'Oxford', postcode: 'OX2 6HT', description: 'Serving Oxford and surrounding villages with dignity.', priceRange: '£1,600 - £4,500', rating: 4.8, reviewCount: 78, phone: '01865 123 456', email: 'info@oxfordfunerals.co.uk', services: ['Traditional Funeral', 'Direct Cremation', 'College Chapel Services'], verified: true },
  { id: '9', name: 'Bristol Funeral Care', type: 'funeral-director', location: 'Bristol', postcode: 'BS1 4DJ', description: 'Friendly, professional funeral services in Bristol and South Gloucestershire.', priceRange: '£1,400 - £4,000', rating: 4.7, reviewCount: 95, phone: '0117 929 1234', email: 'care@bristolfuneralcare.co.uk', services: ['Traditional Funeral', 'Direct Cremation', 'Woodland Burial'], verified: true },
  { id: '10', name: 'Liverpool Memorial Services', type: 'funeral-director', location: 'Liverpool', postcode: 'L1 8JQ', description: 'Serving Liverpool families with compassion since 1952.', priceRange: '£1,200 - £3,800', rating: 4.8, reviewCount: 167, phone: '0151 709 5678', email: 'info@liverpoolmemorial.co.uk', services: ['Traditional Funeral', 'Direct Cremation', 'Catholic Services', 'Repatriation'], verified: true },
  { id: '11', name: 'Edinburgh Funeral Directors', type: 'funeral-director', location: 'Edinburgh', postcode: 'EH1 1RE', description: 'Traditional Scottish funeral services with modern options.', priceRange: '£1,500 - £4,200', rating: 4.9, reviewCount: 112, phone: '0131 225 1234', email: 'info@edinburghfunerals.co.uk', services: ['Traditional Funeral', 'Direct Cremation', 'Highland Services'], verified: true },
  { id: '12', name: 'Glasgow Funeral Care', type: 'funeral-director', location: 'Glasgow', postcode: 'G1 1XQ', description: 'Compassionate funeral services across Greater Glasgow.', priceRange: '£1,300 - £3,900', rating: 4.7, reviewCount: 143, phone: '0141 221 5678', email: 'info@glasgowfuneralcare.co.uk', services: ['Traditional Funeral', 'Direct Cremation', 'Celtic Services'], verified: true }
]

const supplierTypeLabels = { 'funeral-director': 'Funeral Directors', 'florist': 'Florists', 'stonemason': 'Stonemasons', 'venue': 'Venues', 'caterer': 'Caterers' }

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
// MARKETPLACE
// ============================================================

function MarketplacePage({ setCurrentPage, postcode, setPostcode }) {
  const [searchQuery, setSearchQuery] = useState(postcode || '')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedSupplier, setSelectedSupplier] = useState(null)

  const filteredSuppliers = suppliers.filter(s => {
    const matchesType = selectedType === 'all' || s.type === selectedType
    let matchesSearch = true
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim()
      const qArea = getPostcodeArea(searchQuery)
      const sArea = getPostcodeArea(s.postcode)
      matchesSearch = s.location.toLowerCase().includes(q) || s.postcode.toLowerCase().replace(/\s/g, '').includes(q.replace(/\s/g, '')) || s.name.toLowerCase().includes(q) || (qArea && sArea && sArea.startsWith(qArea.substring(0, 2)))
    }
    return matchesType && matchesSearch
  })

  return (
    <div className="page-container">
      <div className="page-content">
        <button className="back-btn" onClick={() => setCurrentPage('home')}><ArrowLeft size={18} /> Back to Home</button>
        <h1 className="page-title">Find Local Services</h1>
        <p className="page-subtitle">Verified professionals in your area. Enter your postcode to find services near you.</p>
        <div style={{ marginBottom: '24px', position: 'relative' }}>
          <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
          <input type="text" className="search-input" placeholder="Enter postcode or location..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); if (e.target.value.match(/^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i)) setPostcode(e.target.value); }} />
        </div>
        <div className="marketplace-filters">
          <button className={`filter-btn ${selectedType === 'all' ? 'active' : ''}`} onClick={() => setSelectedType('all')}><Filter size={16} style={{ marginRight: '8px' }} /> All</button>
          {Object.entries(supplierTypeLabels).map(([t, l]) => (<button key={t} className={`filter-btn ${selectedType === t ? 'active' : ''}`} onClick={() => setSelectedType(t)}>{l}</button>))}
        </div>
        <div className="suppliers-grid">
          {filteredSuppliers.map(s => (
            <div key={s.id} className="supplier-card" onClick={() => setSelectedSupplier(s)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}><h3 className="supplier-name">{s.name}</h3>{s.verified && <span className="verified-badge">Verified</span>}</div>
              <div className="supplier-location"><MapPin size={14} /> {s.location} • {s.postcode}</div>
              <p className="supplier-description">{s.description}</p>
              <div className="supplier-rating"><Star size={16} fill="#fbbf24" color="#fbbf24" /><span style={{ fontWeight: 600 }}>{s.rating}</span><span style={{ color: 'rgba(255,255,255,0.5)' }}>({s.reviewCount})</span><span style={{ marginLeft: 'auto', color: 'var(--color-primary)', fontWeight: 600 }}>{s.priceRange}</span></div>
              <div className="supplier-services">{s.services.slice(0, 3).map((svc, i) => (<span key={i} className="service-tag">{svc}</span>))}</div>
            </div>
          ))}
        </div>
        {filteredSuppliers.length === 0 && <div style={{ textAlign: 'center', padding: '60px 20px' }}><p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '16px' }}>No suppliers found matching your criteria.</p><button className="btn-secondary" onClick={() => { setSearchQuery(''); setSelectedType('all') }}>Clear Filters</button></div>}
      </div>
      {selectedSupplier && (
        <div className="modal-overlay" onClick={() => setSelectedSupplier(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div><h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>{selectedSupplier.name}</h2><p style={{ color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14} /> {selectedSupplier.location} • {selectedSupplier.postcode}</p></div>
              <button onClick={() => setSelectedSupplier(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: '24px', cursor: 'pointer' }}>×</button>
            </div>
            <p style={{ marginBottom: '20px', lineHeight: 1.6 }}>{selectedSupplier.description}</p>
            <div style={{ marginBottom: '20px' }}><h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>Services</h3><div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>{selectedSupplier.services.map((svc, i) => (<span key={i} className="service-tag">{svc}</span>))}</div></div>
            <div style={{ marginBottom: '20px' }}><h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>Contact</h3><p style={{ marginBottom: '8px' }}><Phone size={14} style={{ marginRight: '8px', opacity: 0.6 }} /><a href={`tel:${selectedSupplier.phone}`} style={{ color: 'var(--color-primary)' }}>{selectedSupplier.phone}</a></p><p><span style={{ marginRight: '8px', opacity: 0.6 }}>✉</span><a href={`mailto:${selectedSupplier.email}`} style={{ color: 'var(--color-primary)' }}>{selectedSupplier.email}</a></p></div>
            <button className="btn-primary" style={{ width: '100%' }}>Request Quote</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// OTHER PAGES
// ============================================================

function MemorialPage({ setCurrentPage }) {
  return (<div className="page-container"><div className="page-content"><button className="back-btn" onClick={() => setCurrentPage('home')}><ArrowLeft size={18} /> Back to Home</button><h1 className="page-title">Digital Memorials</h1><p className="page-subtitle">Create a beautiful online tribute to celebrate and remember your loved one.</p><div className="card" style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center', padding: '60px 40px' }}><Heart size={48} style={{ color: 'var(--color-primary)', marginBottom: '24px' }} /><h2 style={{ fontSize: '24px', marginBottom: '16px' }}>Coming Soon</h2><p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '24px' }}>We're working on a beautiful way to create and share digital memorials.</p><input type="email" placeholder="Enter your email" className="chat-input" style={{ maxWidth: '300px', marginBottom: '16px' }} /><br /><button className="btn-primary">Notify Me</button></div></div></div>)
}

function ConciergePage({ setCurrentPage }) {
  return (<div className="page-container"><div className="page-content" style={{ maxWidth: '900px' }}><button className="back-btn" onClick={() => setCurrentPage('home')}><ArrowLeft size={18} /> Back to Home</button><h1 className="page-title">Concierge Service</h1><p className="page-subtitle">Let us handle the difficult calls and paperwork on your behalf.</p><div style={{ display: 'grid', gap: '24px', marginTop: '32px' }}><div className="card"><div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}><div className="feature-icon" style={{ flexShrink: 0 }}><Phone size={24} /></div><div><h3 className="card-title">Phone Calls On Your Behalf</h3><p className="card-description">We'll contact utility companies, banks, subscription services, and government departments to notify them and close or transfer accounts.</p></div></div></div><div className="card"><div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}><div className="feature-icon" style={{ flexShrink: 0 }}><FileText size={24} /></div><div><h3 className="card-title">Paperwork Assistance</h3><p className="card-description">We'll help you complete essential forms including Tell Us Once registration, probate applications, and insurance claims.</p></div></div></div><div className="card"><div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}><div className="feature-icon" style={{ flexShrink: 0 }}><Shield size={24} /></div><div><h3 className="card-title">Expert Guidance</h3><p className="card-description">Our experienced team understands the UK bereavement process. We'll ensure nothing is missed and deadlines are met.</p></div></div></div></div><div className="card" style={{ marginTop: '40px', textAlign: 'center', padding: '40px' }}><h2 style={{ fontSize: '24px', marginBottom: '16px' }}>Request a Callback</h2><p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '24px' }}>Our team is available Monday to Friday, 9am - 5pm.</p><form style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px', margin: '0 auto' }}><input type="text" placeholder="Your name" className="chat-input" style={{ width: '100%' }} /><input type="tel" placeholder="Phone number" className="chat-input" style={{ width: '100%' }} /><input type="email" placeholder="Email address" className="chat-input" style={{ width: '100%' }} /><select className="chat-input" style={{ width: '100%' }}><option value="">What do you need help with?</option><option value="calls">Phone calls on my behalf</option><option value="paperwork">Paperwork assistance</option><option value="both">Both</option></select><button type="submit" className="btn-primary">Request Callback</button></form></div></div></div>)
}

function AboutPage({ setCurrentPage }) {
  return (<div className="page-container"><div className="page-content" style={{ maxWidth: '800px' }}><button className="back-btn" onClick={() => setCurrentPage('home')}><ArrowLeft size={18} /> Back to Home</button><h1 className="page-title">About AfterLife</h1><div style={{ marginTop: '32px', lineHeight: 1.8, color: 'rgba(255,255,255,0.85)' }}><p style={{ marginBottom: '24px' }}>AfterLife was created with a simple mission: to provide compassionate, practical support to those navigating the difficult journey of bereavement.</p><p style={{ marginBottom: '24px' }}>When someone dies, their loved ones are often overwhelmed by grief while simultaneously facing a complex web of legal, administrative, and practical tasks. Our platform brings together AI-powered guidance, verified local services, and human support to help you through this challenging time.</p><h2 style={{ fontSize: '24px', marginBottom: '16px', marginTop: '40px' }}>Our Values</h2><div className="features-grid" style={{ marginTop: '24px' }}><div className="card"><h3 className="card-title">Compassion First</h3><p className="card-description">Every feature is designed with empathy for what you're going through.</p></div><div className="card"><h3 className="card-title">Accurate Information</h3><p className="card-description">We provide reliable, up-to-date guidance based on UK law.</p></div><div className="card"><h3 className="card-title">Verified Professionals</h3><p className="card-description">All service providers in our marketplace are vetted for quality.</p></div></div></div></div></div>)
}

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
