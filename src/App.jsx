import { useState, useEffect, useRef } from 'react'
import { 
  Home, MessageCircle, ShoppingCart, Heart, Phone, 
  Send, MapPin, Star, Search, Filter, ArrowLeft,
  FileText, Users, Clock, Shield
} from 'lucide-react'

// Helper function to extract postcode area (e.g., "AL1" from "AL1 3JQ")
const getPostcodeArea = (postcode) => {
  if (!postcode) return ''
  const clean = postcode.toUpperCase().replace(/\s/g, '')
  // Match outward code (area + district)
  const match = clean.match(/^([A-Z]{1,2}\d{1,2}[A-Z]?)/)
  return match ? match[1] : ''
}

// Supplier data - expanded with more locations
const suppliers = [
  // London area
  {
    id: '1',
    name: 'Dignity Funeral Directors',
    type: 'funeral-director',
    location: 'Westminster, London',
    postcode: 'SW1A 1AA',
    description: 'Compassionate funeral services with over 50 years of experience. Full service and direct cremation options available.',
    priceRange: '£1,500 - £5,000',
    rating: 4.8,
    reviewCount: 127,
    phone: '020 7123 4567',
    email: 'london@dignity.co.uk',
    services: ['Traditional Funeral', 'Direct Cremation', 'Burial', 'Repatriation'],
    verified: true
  },
  {
    id: '1b',
    name: 'London Funeral Services',
    type: 'funeral-director',
    location: 'Camden, London',
    postcode: 'NW1 2DB',
    description: 'North London family funeral directors with over 30 years serving the community.',
    priceRange: '£1,400 - £4,200',
    rating: 4.7,
    reviewCount: 89,
    phone: '020 7387 1234',
    email: 'info@londonfuneralservices.co.uk',
    services: ['Traditional Funeral', 'Direct Cremation', 'Green Burial'],
    verified: true
  },
  {
    id: '1c',
    name: 'East London Funerals',
    type: 'funeral-director',
    location: 'Stratford, London',
    postcode: 'E15 1XA',
    description: 'Serving East London communities with dignity and respect.',
    priceRange: '£1,300 - £3,800',
    rating: 4.6,
    reviewCount: 76,
    phone: '020 8534 5678',
    email: 'care@eastlondonfunerals.co.uk',
    services: ['Traditional Funeral', 'Direct Cremation', 'Multi-faith Services'],
    verified: true
  },
  // Manchester area
  {
    id: '2',
    name: 'Co-op Funeralcare Manchester',
    type: 'funeral-director',
    location: 'Manchester City Centre',
    postcode: 'M1 1AA',
    description: 'Trusted funeral directors offering transparent pricing and personalized services.',
    priceRange: '£1,200 - £4,500',
    rating: 4.7,
    reviewCount: 98,
    phone: '0161 234 5678',
    email: 'manchester@coop.co.uk',
    services: ['Traditional Funeral', 'Direct Cremation', 'Green Burial', 'Memorial Services'],
    verified: true
  },
  {
    id: '2b',
    name: 'North Manchester Funeral Home',
    type: 'funeral-director',
    location: 'Salford',
    postcode: 'M5 4WT',
    description: 'Family-run funeral home serving Greater Manchester for three generations.',
    priceRange: '£1,100 - £3,900',
    rating: 4.8,
    reviewCount: 112,
    phone: '0161 736 4567',
    email: 'info@northmanchesterfunerals.co.uk',
    services: ['Traditional Funeral', 'Direct Cremation', 'Burial', 'Pre-paid Plans'],
    verified: true
  },
  // Hertfordshire area (AL postcodes)
  {
    id: '3',
    name: 'Austin & Sons Funeral Directors',
    type: 'funeral-director',
    location: 'St Albans',
    postcode: 'AL1 3JQ',
    description: 'Family-run funeral directors serving St Albans and Hertfordshire for over 40 years.',
    priceRange: '£1,800 - £4,200',
    rating: 4.9,
    reviewCount: 145,
    phone: '01727 123456',
    email: 'info@austinfunerals.co.uk',
    services: ['Traditional Funeral', 'Direct Cremation', 'Burial', 'Pre-paid Plans'],
    verified: true
  },
  {
    id: '4',
    name: 'Harpenden Funeral Services',
    type: 'funeral-director',
    location: 'Harpenden',
    postcode: 'AL5 2JX',
    description: 'Independent funeral directors providing compassionate care to families in Harpenden.',
    priceRange: '£1,600 - £3,800',
    rating: 4.8,
    reviewCount: 89,
    phone: '01582 765432',
    email: 'care@harpendenfunerals.co.uk',
    services: ['Traditional Funeral', 'Direct Cremation', 'Green Burial', 'Home Visits'],
    verified: true
  },
  {
    id: '4b',
    name: 'Hertfordshire Memorials',
    type: 'stonemason',
    location: 'Hatfield',
    postcode: 'AL10 9AB',
    description: 'Local stonemasons specializing in bespoke headstones and memorial restoration.',
    priceRange: '£600 - £2,500',
    rating: 4.7,
    reviewCount: 52,
    phone: '01707 654321',
    email: 'info@hertsmemorials.co.uk',
    services: ['Headstones', 'Plaques', 'Restoration', 'Cleaning'],
    verified: true
  },
  {
    id: '4c',
    name: 'St Albans Florist',
    type: 'florist',
    location: 'St Albans',
    postcode: 'AL1 1AG',
    description: 'Beautiful sympathy flowers and funeral tributes. Same-day delivery available.',
    priceRange: '£40 - £400',
    rating: 4.9,
    reviewCount: 203,
    phone: '01727 987654',
    email: 'orders@stalbansflowers.co.uk',
    services: ['Wreaths', 'Casket Sprays', 'Standing Sprays', 'Sympathy Bouquets'],
    verified: true
  },
  // Birmingham area
  {
    id: '5',
    name: 'Bloom & Wild Funeral Flowers',
    type: 'florist',
    location: 'Birmingham City Centre',
    postcode: 'B1 1AA',
    description: 'Beautiful funeral flowers and tributes, delivered with care and respect.',
    priceRange: '£50 - £500',
    rating: 4.9,
    reviewCount: 156,
    phone: '0121 345 6789',
    email: 'funeral@bloomandwild.com',
    services: ['Wreaths', 'Casket Sprays', 'Standing Sprays', 'Sympathy Bouquets'],
    verified: true
  },
  {
    id: '5b',
    name: 'Birmingham Funeral Directors',
    type: 'funeral-director',
    location: 'Edgbaston, Birmingham',
    postcode: 'B15 3ES',
    description: 'Professional funeral services for the Birmingham community.',
    priceRange: '£1,300 - £4,000',
    rating: 4.6,
    reviewCount: 87,
    phone: '0121 456 7890',
    email: 'info@birminghamfunerals.co.uk',
    services: ['Traditional Funeral', 'Direct Cremation', 'Burial'],
    verified: true
  },
  // Leeds area
  {
    id: '6',
    name: 'Memorial Masonry Ltd',
    type: 'stonemason',
    location: 'Leeds City Centre',
    postcode: 'LS1 1AA',
    description: 'Expert stonemasons crafting beautiful headstones and memorials.',
    priceRange: '£800 - £3,000',
    rating: 4.6,
    reviewCount: 67,
    phone: '0113 456 7890',
    email: 'info@memorialmasonry.co.uk',
    services: ['Headstones', 'Plaques', 'Restoration', 'Inscriptions'],
    verified: true
  },
  {
    id: '6b',
    name: 'Yorkshire Funeral Services',
    type: 'funeral-director',
    location: 'Leeds',
    postcode: 'LS2 7EW',
    description: 'Serving families across Yorkshire with care and professionalism.',
    priceRange: '£1,200 - £3,800',
    rating: 4.8,
    reviewCount: 134,
    phone: '0113 234 5678',
    email: 'info@yorkshirefunerals.co.uk',
    services: ['Traditional Funeral', 'Direct Cremation', 'Green Burial', 'Pre-paid Plans'],
    verified: true
  },
  // Brighton area
  {
    id: '7',
    name: 'The Garden Room',
    type: 'venue',
    location: 'Brighton',
    postcode: 'BN1 1AA',
    description: 'Peaceful venue for memorial services and celebration of life events.',
    priceRange: '£300 - £1,500',
    rating: 4.8,
    reviewCount: 89,
    phone: '01273 567 890',
    email: 'bookings@thegardenroom.co.uk',
    services: ['Memorial Services', 'Wake Hosting', 'Catering Available', 'AV Equipment'],
    verified: true
  },
  {
    id: '7b',
    name: 'Brighton & Hove Funerals',
    type: 'funeral-director',
    location: 'Hove',
    postcode: 'BN3 2DF',
    description: 'Compassionate funeral care on the South Coast.',
    priceRange: '£1,500 - £4,200',
    rating: 4.7,
    reviewCount: 91,
    phone: '01273 321 456',
    email: 'care@brightonhovefunerals.co.uk',
    services: ['Traditional Funeral', 'Direct Cremation', 'Natural Burial'],
    verified: true
  },
  // Oxford area
  {
    id: '8',
    name: 'Heritage Catering',
    type: 'caterer',
    location: 'Oxford',
    postcode: 'OX1 1AA',
    description: 'Sensitive and professional catering for funeral receptions and wakes.',
    priceRange: '£15 - £45 per head',
    rating: 4.7,
    reviewCount: 54,
    phone: '01865 678 901',
    email: 'events@heritagecatering.co.uk',
    services: ['Buffets', 'Afternoon Tea', 'Hot Meals', 'Dietary Options'],
    verified: true
  },
  {
    id: '8b',
    name: 'Oxford Funeral Services',
    type: 'funeral-director',
    location: 'Oxford',
    postcode: 'OX2 6HT',
    description: 'Serving Oxford and surrounding villages with dignity.',
    priceRange: '£1,600 - £4,500',
    rating: 4.8,
    reviewCount: 78,
    phone: '01865 123 456',
    email: 'info@oxfordfunerals.co.uk',
    services: ['Traditional Funeral', 'Direct Cremation', 'College Chapel Services'],
    verified: true
  },
  // Bristol area
  {
    id: '9',
    name: 'Bristol Funeral Care',
    type: 'funeral-director',
    location: 'Bristol',
    postcode: 'BS1 4DJ',
    description: 'Friendly, professional funeral services in Bristol and South Gloucestershire.',
    priceRange: '£1,400 - £4,000',
    rating: 4.7,
    reviewCount: 95,
    phone: '0117 929 1234',
    email: 'care@bristolfuneralcare.co.uk',
    services: ['Traditional Funeral', 'Direct Cremation', 'Woodland Burial'],
    verified: true
  },
  // Liverpool area
  {
    id: '10',
    name: 'Liverpool Memorial Services',
    type: 'funeral-director',
    location: 'Liverpool',
    postcode: 'L1 8JQ',
    description: 'Serving Liverpool families with compassion since 1952.',
    priceRange: '£1,200 - £3,800',
    rating: 4.8,
    reviewCount: 167,
    phone: '0151 709 5678',
    email: 'info@liverpoolmemorial.co.uk',
    services: ['Traditional Funeral', 'Direct Cremation', 'Catholic Services', 'Repatriation'],
    verified: true
  },
  // Edinburgh (Scotland)
  {
    id: '11',
    name: 'Edinburgh Funeral Directors',
    type: 'funeral-director',
    location: 'Edinburgh',
    postcode: 'EH1 1RE',
    description: 'Traditional Scottish funeral services with modern options.',
    priceRange: '£1,500 - £4,200',
    rating: 4.9,
    reviewCount: 112,
    phone: '0131 225 1234',
    email: 'info@edinburghfunerals.co.uk',
    services: ['Traditional Funeral', 'Direct Cremation', 'Highland Services'],
    verified: true
  },
  // Glasgow
  {
    id: '12',
    name: 'Glasgow Funeral Care',
    type: 'funeral-director',
    location: 'Glasgow',
    postcode: 'G1 1XQ',
    description: 'Compassionate funeral services across Greater Glasgow.',
    priceRange: '£1,300 - £3,900',
    rating: 4.7,
    reviewCount: 143,
    phone: '0141 221 5678',
    email: 'info@glasgowfuneralcare.co.uk',
    services: ['Traditional Funeral', 'Direct Cremation', 'Celtic Services'],
    verified: true
  }
]

const supplierTypeLabels = {
  'funeral-director': 'Funeral Directors',
  'florist': 'Florists',
  'stonemason': 'Stonemasons',
  'venue': 'Venues',
  'caterer': 'Caterers'
}

// Navigation Component
function Navigation({ currentPage, setCurrentPage }) {
  return (
    <nav className="nav-header">
      <div className="nav-links">
        <button 
          className={`nav-link ${currentPage === 'home' ? 'active' : ''}`}
          onClick={() => setCurrentPage('home')}
        >
          Home
        </button>
        <button 
          className={`nav-link ${currentPage === 'about' ? 'active' : ''}`}
          onClick={() => setCurrentPage('about')}
        >
          About
        </button>
        <button 
          className={`nav-link ${currentPage === 'guide' ? 'active' : ''}`}
          onClick={() => setCurrentPage('guide')}
        >
          AI Guide
        </button>
        <button 
          className={`nav-link ${currentPage === 'marketplace' ? 'active' : ''}`}
          onClick={() => setCurrentPage('marketplace')}
        >
          Marketplace
        </button>
        <button 
          className={`nav-link ${currentPage === 'memorial' ? 'active' : ''}`}
          onClick={() => setCurrentPage('memorial')}
        >
          Memorial
        </button>
        <button 
          className={`nav-link ${currentPage === 'concierge' ? 'active' : ''}`}
          onClick={() => setCurrentPage('concierge')}
        >
          Concierge
        </button>
        <button 
          className={`nav-link ${currentPage === 'contact' ? 'active' : ''}`}
          onClick={() => setCurrentPage('contact')}
        >
          Contact
        </button>
      </div>
    </nav>
  )
}

// Home Page
function HomePage({ setCurrentPage }) {
  return (
    <div className="hero-section">
      <img 
        src="https://customer-assets.emergentagent.com/job_griefhelp-portal/artifacts/f3bwrmaw_X2dsu6Y5A-nrnFWHDtX0r.png"
        alt="AfterLife Logo"
        className="hero-logo"
      />
      
      <h1 className="hero-title">
        Compassionate <span className="accent">Guidance</span> When You Need It Most
      </h1>
      
      <p className="hero-subtitle">
        AfterLife transforms the overwhelming journey through bereavement into a clear, 
        supported path forward. AI-powered guidance, verified professionals, and human 
        compassion—all in one place.
      </p>
      
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button className="btn-primary" onClick={() => setCurrentPage('guide')}>
          Start Your Journey
        </button>
        <button className="btn-secondary" onClick={() => setCurrentPage('marketplace')}>
          Find Local Services
        </button>
      </div>
      
      <div className="features-grid">
        <div className="feature-card" onClick={() => setCurrentPage('guide')}>
          <div className="feature-icon">
            <MessageCircle size={28} />
          </div>
          <h3 className="card-title">AI Bereavement Guide</h3>
          <p className="card-description">
            Get compassionate, accurate answers about the bereavement process 24/7. 
            Our AI understands UK regulations and procedures.
          </p>
        </div>
        
        <div className="feature-card" onClick={() => setCurrentPage('marketplace')}>
          <div className="feature-icon">
            <ShoppingCart size={28} />
          </div>
          <h3 className="card-title">Local Services Marketplace</h3>
          <p className="card-description">
            Find verified funeral directors, florists, stonemasons and more in your 
            area. Compare prices and request quotes.
          </p>
        </div>
        
        <div className="feature-card" onClick={() => setCurrentPage('memorial')}>
          <div className="feature-icon">
            <Heart size={28} />
          </div>
          <h3 className="card-title">Digital Memorials</h3>
          <p className="card-description">
            Create beautiful online tributes to celebrate and remember loved ones. 
            Share memories with family and friends.
          </p>
        </div>
        
        <div className="feature-card">
          <div className="feature-icon">
            <FileText size={28} />
          </div>
          <h3 className="card-title">Document Vault</h3>
          <p className="card-description">
            Securely store important documents like wills, death certificates, and 
            insurance policies in one safe place.
          </p>
        </div>
        
        <div className="feature-card">
          <div className="feature-icon">
            <Clock size={28} />
          </div>
          <h3 className="card-title">Task Checklist</h3>
          <p className="card-description">
            Never miss an important deadline. Our guided checklist helps you navigate 
            all the necessary steps.
          </p>
        </div>
        
        <div className="feature-card">
          <div className="feature-icon">
            <Users size={28} />
          </div>
          <h3 className="card-title">Concierge Service</h3>
          <p className="card-description">
            Need human support? Our concierge team can handle calls and paperwork 
            on your behalf.
          </p>
        </div>
      </div>
    </div>
  )
}

// AI Guide / Chat Page
function GuidePage({ setCurrentPage, postcode, setPostcode }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello, I'm here to help guide you through this difficult time. I can answer questions about the bereavement process, explain legal terms, and help you understand what to expect at each step.\n\n📚 For comprehensive information, visit:\n• GOV.UK: gov.uk/after-a-death\n• Cruse Bereavement Care: cruse.org.uk\n• Citizens Advice: citizensadvice.org.uk/family/death-and-wills\n\nWhat would you like to know?"
    }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  
  const quickTopics = [
    'How do I register a death?',
    'What is probate?',
    'How much does a funeral cost?',
    'What is Tell Us Once?',
    'How do I find a Will?',
    'What is Inheritance Tax?'
  ]
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  const handleSend = async () => {
    if (!input.trim()) return
    
    const userMessage = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    const currentInput = input
    setInput('')
    setIsTyping(true)
    
    // Extract postcode if mentioned
    const postcodeMatch = currentInput.match(/\b([A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2})\b/i)
    if (postcodeMatch) {
      setPostcode(postcodeMatch[1])
    }
    
    try {
      const response = await fetch('/.netlify/functions/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: currentInput,
          postcode: postcodeMatch?.[1] || postcode
        })
      })
      
      const data = await response.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm having trouble connecting right now. Please try again in a moment." 
      }])
    } finally {
      setIsTyping(false)
    }
  }
  
  return (
    <div className="page-container">
      <div className="page-content">
        <button className="back-btn" onClick={() => setCurrentPage('home')}>
          <ArrowLeft size={18} />
          Back to Home
        </button>
        
        <div className="chat-container">
          <div className="chat-header">
            <MessageCircle size={24} style={{ color: 'var(--color-primary)' }} />
            <h2 style={{ fontSize: '20px', fontWeight: 600 }}>AI Bereavement Guide</h2>
          </div>
          
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-message ${msg.role}`}>
                {msg.content}
              </div>
            ))}
            
            {isTyping && (
              <div className="typing-indicator">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {messages.length === 1 && (
            <div className="quick-topics">
              {quickTopics.map((topic, i) => (
                <button 
                  key={i} 
                  className="quick-topic-btn"
                  onClick={() => setInput(topic)}
                >
                  {topic}
                </button>
              ))}
            </div>
          )}
          
          <div className="chat-input-container">
            <input
              type="text"
              className="chat-input"
              placeholder="Ask me anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <button 
              className="chat-send-btn"
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Marketplace Page
function MarketplacePage({ setCurrentPage, postcode, setPostcode }) {
  const [searchQuery, setSearchQuery] = useState(postcode || '')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  
  const filteredSuppliers = suppliers.filter(s => {
    const matchesType = selectedType === 'all' || s.type === selectedType
    
    // Improved postcode matching
    let matchesSearch = true
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim()
      const queryArea = getPostcodeArea(searchQuery)
      const supplierArea = getPostcodeArea(s.postcode)
      
      // Match by: location name, full postcode, or postcode area
      matchesSearch = 
        s.location.toLowerCase().includes(query) ||
        s.postcode.toLowerCase().replace(/\s/g, '').includes(query.replace(/\s/g, '')) ||
        s.name.toLowerCase().includes(query) ||
        (queryArea && supplierArea && supplierArea.startsWith(queryArea.substring(0, 2)))
    }
    
    return matchesType && matchesSearch
  })
  
  return (
    <div className="page-container">
      <div className="page-content">
        <button className="back-btn" onClick={() => setCurrentPage('home')}>
          <ArrowLeft size={18} />
          Back to Home
        </button>
        
        <h1 className="page-title">Find Local Services</h1>
        <p className="page-subtitle">
          Verified professionals in your area. Enter your postcode to find services near you.
        </p>
        
        <div style={{ marginBottom: '24px', position: 'relative' }}>
          <Search 
            size={20} 
            style={{ 
              position: 'absolute', 
              left: '16px', 
              top: '50%', 
              transform: 'translateY(-50%)',
              color: 'rgba(255,255,255,0.4)'
            }} 
          />
          <input
            type="text"
            className="search-input"
            placeholder="Enter postcode or location..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              // Update global postcode if it looks like a valid postcode
              if (e.target.value.match(/^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i)) {
                setPostcode(e.target.value)
              }
            }}
          />
        </div>
        
        <div className="marketplace-filters">
          <button 
            className={`filter-btn ${selectedType === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedType('all')}
          >
            <Filter size={16} style={{ marginRight: '8px' }} />
            All
          </button>
          {Object.entries(supplierTypeLabels).map(([type, label]) => (
            <button
              key={type}
              className={`filter-btn ${selectedType === type ? 'active' : ''}`}
              onClick={() => setSelectedType(type)}
            >
              {label}
            </button>
          ))}
        </div>
        
        <div className="suppliers-grid">
          {filteredSuppliers.map(supplier => (
            <div 
              key={supplier.id} 
              className="supplier-card"
              onClick={() => setSelectedSupplier(supplier)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 className="supplier-name">{supplier.name}</h3>
                {supplier.verified && <span className="verified-badge">Verified</span>}
              </div>
              
              <div className="supplier-location">
                <MapPin size={14} />
                {supplier.location} • {supplier.postcode}
              </div>
              
              <p className="supplier-description">{supplier.description}</p>
              
              <div className="supplier-rating">
                <Star size={16} fill="#fbbf24" color="#fbbf24" />
                <span style={{ fontWeight: 600 }}>{supplier.rating}</span>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>({supplier.reviewCount} reviews)</span>
                <span style={{ marginLeft: 'auto', color: 'var(--color-primary)', fontWeight: 600 }}>
                  {supplier.priceRange}
                </span>
              </div>
              
              <div className="supplier-services">
                {supplier.services.slice(0, 3).map((service, i) => (
                  <span key={i} className="service-tag">{service}</span>
                ))}
                {supplier.services.length > 3 && (
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
                    +{supplier.services.length - 3} more
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {filteredSuppliers.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '16px' }}>
              No suppliers found matching your criteria.
            </p>
            <button 
              className="btn-secondary" 
              onClick={() => { setSearchQuery(''); setSelectedType('all') }}
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
      
      {/* Supplier Modal */}
      {selectedSupplier && (
        <div className="modal-overlay" onClick={() => setSelectedSupplier(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>
                  {selectedSupplier.name}
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={14} />
                  {selectedSupplier.location} • {selectedSupplier.postcode}
                </p>
              </div>
              <button 
                onClick={() => setSelectedSupplier(null)}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: '24px', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>
            
            <p style={{ marginBottom: '20px', lineHeight: 1.6 }}>{selectedSupplier.description}</p>
            
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>Services</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {selectedSupplier.services.map((service, i) => (
                  <span key={i} className="service-tag">{service}</span>
                ))}
              </div>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>Contact</h3>
              <p style={{ marginBottom: '8px' }}>
                <Phone size={14} style={{ marginRight: '8px', opacity: 0.6 }} />
                <a href={`tel:${selectedSupplier.phone}`} style={{ color: 'var(--color-primary)' }}>
                  {selectedSupplier.phone}
                </a>
              </p>
              <p>
                <span style={{ marginRight: '8px', opacity: 0.6 }}>✉</span>
                <a href={`mailto:${selectedSupplier.email}`} style={{ color: 'var(--color-primary)' }}>
                  {selectedSupplier.email}
                </a>
              </p>
            </div>
            
            <button className="btn-primary" style={{ width: '100%' }}>
              Request Quote
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Memorial Page
function MemorialPage({ setCurrentPage }) {
  return (
    <div className="page-container">
      <div className="page-content">
        <button className="back-btn" onClick={() => setCurrentPage('home')}>
          <ArrowLeft size={18} />
          Back to Home
        </button>
        
        <h1 className="page-title">Digital Memorials</h1>
        <p className="page-subtitle">
          Create a beautiful online tribute to celebrate and remember your loved one.
        </p>
        
        <div className="card" style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center', padding: '60px 40px' }}>
          <Heart size={48} style={{ color: 'var(--color-primary)', marginBottom: '24px' }} />
          <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>Coming Soon</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '24px' }}>
            We're working on a beautiful way to create and share digital memorials. 
            Leave your email to be notified when this feature launches.
          </p>
          <input
            type="email"
            placeholder="Enter your email"
            className="chat-input"
            style={{ maxWidth: '300px', marginBottom: '16px' }}
          />
          <br />
          <button className="btn-primary">Notify Me</button>
        </div>
      </div>
    </div>
  )
}

// Concierge Page
function ConciergePage({ setCurrentPage }) {
  return (
    <div className="page-container">
      <div className="page-content" style={{ maxWidth: '900px' }}>
        <button className="back-btn" onClick={() => setCurrentPage('home')}>
          <ArrowLeft size={18} />
          Back to Home
        </button>
        
        <h1 className="page-title">Concierge Service</h1>
        <p className="page-subtitle">
          Let us handle the difficult calls and paperwork on your behalf.
        </p>
        
        <div style={{ display: 'grid', gap: '24px', marginTop: '32px' }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
              <div className="feature-icon" style={{ flexShrink: 0 }}>
                <Phone size={24} />
              </div>
              <div>
                <h3 className="card-title">Phone Calls On Your Behalf</h3>
                <p className="card-description">
                  We'll contact utility companies, banks, subscription services, and government 
                  departments to notify them and close or transfer accounts. No more waiting 
                  on hold during an already difficult time.
                </p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
              <div className="feature-icon" style={{ flexShrink: 0 }}>
                <FileText size={24} />
              </div>
              <div>
                <h3 className="card-title">Paperwork Assistance</h3>
                <p className="card-description">
                  We'll help you complete essential forms including Tell Us Once registration, 
                  probate applications, pension notifications, and insurance claims. Our team 
                  ensures everything is filed correctly.
                </p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
              <div className="feature-icon" style={{ flexShrink: 0 }}>
                <Shield size={24} />
              </div>
              <div>
                <h3 className="card-title">Expert Guidance</h3>
                <p className="card-description">
                  Our experienced team understands the UK bereavement process inside out. 
                  We'll guide you through each step, ensuring nothing is missed and deadlines 
                  are met.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card" style={{ marginTop: '40px', textAlign: 'center', padding: '40px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>Get Started</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '24px', maxWidth: '500px', margin: '0 auto 24px' }}>
            Our concierge team is available Monday to Friday, 9am - 5pm. 
            Leave your details and we'll call you back within 24 hours.
          </p>
          
          <form style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px', margin: '0 auto' }}>
            <input 
              type="text" 
              placeholder="Your name" 
              className="chat-input" 
              style={{ width: '100%' }} 
            />
            <input 
              type="tel" 
              placeholder="Phone number" 
              className="chat-input" 
              style={{ width: '100%' }} 
            />
            <input 
              type="email" 
              placeholder="Email address" 
              className="chat-input" 
              style={{ width: '100%' }} 
            />
            <select 
              className="chat-input" 
              style={{ width: '100%' }}
            >
              <option value="">What do you need help with?</option>
              <option value="calls">Phone calls on my behalf</option>
              <option value="paperwork">Paperwork assistance</option>
              <option value="both">Both</option>
              <option value="other">Something else</option>
            </select>
            <button type="submit" className="btn-primary" style={{ marginTop: '8px' }}>
              Request Callback
            </button>
          </form>
        </div>
        
        <div style={{ marginTop: '40px', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
            Need immediate assistance?
          </p>
          <p>
            <Phone size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            <a href="tel:03001234567" style={{ color: 'var(--color-primary)', fontSize: '18px', fontWeight: '600' }}>
              0300 123 4567
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

// About Page
function AboutPage({ setCurrentPage }) {
  return (
    <div className="page-container">
      <div className="page-content" style={{ maxWidth: '800px' }}>
        <button className="back-btn" onClick={() => setCurrentPage('home')}>
          <ArrowLeft size={18} />
          Back to Home
        </button>
        
        <h1 className="page-title">About AfterLife</h1>
        
        <div style={{ marginTop: '32px', lineHeight: 1.8, color: 'rgba(255,255,255,0.85)' }}>
          <p style={{ marginBottom: '24px' }}>
            AfterLife was created with a simple mission: to provide compassionate, 
            practical support to those navigating the difficult journey of bereavement.
          </p>
          
          <p style={{ marginBottom: '24px' }}>
            When someone dies, their loved ones are often overwhelmed by grief while 
            simultaneously facing a complex web of legal, administrative, and practical 
            tasks. Our platform brings together AI-powered guidance, verified local 
            services, and human support to help you through this challenging time.
          </p>
          
          <h2 style={{ fontSize: '24px', marginBottom: '16px', marginTop: '40px' }}>Our Values</h2>
          
          <div className="features-grid" style={{ marginTop: '24px' }}>
            <div className="card">
              <h3 className="card-title">Compassion First</h3>
              <p className="card-description">
                Every feature is designed with empathy and understanding for what 
                you're going through.
              </p>
            </div>
            
            <div className="card">
              <h3 className="card-title">Accurate Information</h3>
              <p className="card-description">
                We provide reliable, up-to-date guidance based on UK law and 
                best practices.
              </p>
            </div>
            
            <div className="card">
              <h3 className="card-title">Verified Professionals</h3>
              <p className="card-description">
                All service providers in our marketplace are vetted and verified 
                for quality.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Contact Page
function ContactPage({ setCurrentPage }) {
  return (
    <div className="page-container">
      <div className="page-content" style={{ maxWidth: '600px' }}>
        <button className="back-btn" onClick={() => setCurrentPage('home')}>
          <ArrowLeft size={18} />
          Back to Home
        </button>
        
        <h1 className="page-title">Contact Us</h1>
        <p className="page-subtitle">
          We're here to help. Reach out with any questions or feedback.
        </p>
        
        <div className="card" style={{ marginTop: '32px' }}>
          <form style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Name</label>
              <input type="text" className="chat-input" style={{ width: '100%' }} />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Email</label>
              <input type="email" className="chat-input" style={{ width: '100%' }} />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Message</label>
              <textarea 
                className="chat-input" 
                style={{ width: '100%', minHeight: '150px', resize: 'vertical' }}
                placeholder="How can we help?"
              />
            </div>
            
            <button type="submit" className="btn-primary">Send Message</button>
          </form>
        </div>
        
        <div style={{ marginTop: '40px', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '16px' }}>
            For urgent support, please contact:
          </p>
          <a 
            href="https://www.cruse.org.uk" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: 'var(--color-primary)' }}
          >
            Cruse Bereavement Care: 0808 808 1677
          </a>
        </div>
      </div>
    </div>
  )
}

// Main App
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
      
      {/* Crisis Support Button */}
      <a 
        href="https://www.cruse.org.uk" 
        target="_blank" 
        rel="noopener noreferrer"
        className="crisis-btn"
      >
        <Phone size={18} />
        Crisis Support
      </a>
    </div>
  )
}

export default App
