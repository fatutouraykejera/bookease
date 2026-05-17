import { useState, useEffect } from "react"
import axios from "axios"

const API = "https://bookease-booking-service.onrender.com"

const CATEGORY_ICONS = {
  "Hair Salon": "✂️",
  "Barber": "💈",
  "Nail Salon": "💅",
  "Tailor": "🧵",
  "Clinic": "🏥",
  "Pharmacy": "💊",
  "Restaurant": "🍽️",
  "Gym": "💪",
  "Spa": "🧖",
  "Photography": "📸",
  "Tutoring": "📚",
  "Other": "🏪",
}

export default function Home({ navigate }) {
  const [businesses, setBusinesses] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState("")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCategories()
    fetchBusinesses()
  }, [])

  useEffect(() => {
    fetchBusinesses()
  }, [selectedCategory, search])

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API}/categories`)
      setCategories(res.data.categories)
    } catch (e) {}
  }

  const fetchBusinesses = async () => {
    setLoading(true)
    try {
      const params = {}
      if (selectedCategory) params.category = selectedCategory
      if (search) params.search = search
      const res = await axios.get(`${API}/businesses`, { params })
      setBusinesses(res.data)
    } catch (e) {
      setBusinesses([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="home">
      <div className="hero">
        <h2>Book any service in The Gambia</h2>
        <p>Hair, barbers, tailors, clinics and more — all in one place</p>
        <div className="search-bar">
          <input
            placeholder="Search businesses..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="categories">
        <button
          className={`cat-btn ${selectedCategory === "" ? "active" : ""}`}
          onClick={() => setSelectedCategory("")}
        >
          🏪 All
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            className={`cat-btn ${selectedCategory === cat ? "active" : ""}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {CATEGORY_ICONS[cat] || "🏪"} {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">Loading businesses...</div>
      ) : businesses.length === 0 ? (
        <div className="empty">
          <p>No businesses found.</p>
          <button className="btn-primary" onClick={() => navigate("business-signup")}>
            Be the first to list your business!
          </button>
        </div>
      ) : (
        <div className="business-grid">
          {businesses.map(b => (
            <div key={b.id} className="business-card" onClick={() => navigate("business", { business: b })}>
              <div className="business-card-icon">
                {CATEGORY_ICONS[b.category] || "🏪"}
              </div>
              <div className="business-card-info">
                <h3>{b.name}</h3>
                <p className="muted">{b.category} · {b.city}</p>
                {b.description && <p className="business-desc">{b.description}</p>}
                <p className="muted" style={{fontSize:"0.8rem"}}>📍 {b.address}</p>
              </div>
              <button className="btn-book">Book →</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
