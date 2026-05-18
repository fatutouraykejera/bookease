import { useState, useEffect } from "react"
import axios from "axios"

const API = "https://bookease-booking-service.onrender.com"
const ADMIN_TOKEN = "MrsAnn0803!"

export default function Admin({ navigate }) {
  const [password, setPassword] = useState("")
  const [authed, setAuthed] = useState(false)
  const [businesses, setBusinesses] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [tab, setTab] = useState("businesses")

  const handleLogin = e => {
    e.preventDefault()
    if (password === ADMIN_TOKEN) {
      setAuthed(true)
      fetchData()
    } else {
      setError("Incorrect password")
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const [bizRes, statsRes] = await Promise.all([
        axios.get(`${API}/admin/businesses`, { params: { token: ADMIN_TOKEN } }),
        axios.get(`${API}/admin/stats`, { params: { token: ADMIN_TOKEN } }),
      ])
      setBusinesses(bizRes.data)
      setStats(statsRes.data)
    } catch (e) {
      setError("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const handleSuspend = async (id, name) => {
    if (!confirm(`Suspend ${name}? They will be hidden from customers.`)) return
    try {
      await axios.patch(`${API}/admin/businesses/${id}/suspend`, null, { params: { token: ADMIN_TOKEN } })
      setBusinesses(businesses.map(b => b.id === id ? { ...b, is_active: false } : b))
      fetchData()
    } catch { alert("Failed to suspend") }
  }

  const handleActivate = async (id, name) => {
    try {
      await axios.patch(`${API}/admin/businesses/${id}/activate`, null, { params: { token: ADMIN_TOKEN } })
      setBusinesses(businesses.map(b => b.id === id ? { ...b, is_active: true } : b))
      fetchData()
    } catch { alert("Failed to activate") }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`PERMANENTLY DELETE ${name}? This cannot be undone.`)) return
    try {
      await axios.delete(`${API}/admin/businesses/${id}`, { params: { token: ADMIN_TOKEN } })
      setBusinesses(businesses.filter(b => b.id !== id))
      fetchData()
    } catch { alert("Failed to delete") }
  }

  if (!authed) {
    return (
      <div className="profile-page">
        <div className="card">
          <h2>🔒 Admin Panel</h2>
          <p className="muted" style={{marginBottom:"1.5rem"}}>BookEase administration — authorised access only.</p>
          <form onSubmit={handleLogin} className="form">
            <div className="form-row">
              <label>Admin password</label>
              <input
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError("") }}
                required
              />
            </div>
            {error && <p className="error">{error}</p>}
            <button type="submit" className="btn-primary">Login</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div style={{maxWidth:"900px", margin:"0 auto"}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem"}}>
        <h2 style={{color:"#2C1810"}}>Admin Panel</h2>
        <button className="back-btn" onClick={() => navigate("home")}>← Back to site</button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="admin-stats">
          <div className="stat-card">
            <div className="stat-number">{stats.total_businesses}</div>
            <div className="stat-label">Total businesses</div>
          </div>
          <div className="stat-card">
            <div className="stat-number" style={{color:"#2E7D32"}}>{stats.active_businesses}</div>
            <div className="stat-label">Active</div>
          </div>
          <div className="stat-card">
            <div className="stat-number" style={{color:"#8B2500"}}>{stats.suspended_businesses}</div>
            <div className="stat-label">Suspended</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.total_bookings}</div>
            <div className="stat-label">Total bookings</div>
          </div>
          <div className="stat-card">
            <div className="stat-number" style={{color:"#3B2314"}}>D{stats.monthly_revenue}</div>
            <div className="stat-label">Monthly revenue</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="admin-tabs">
        <button className={`admin-tab ${tab === "businesses" ? "active" : ""}`} onClick={() => setTab("businesses")}>
          Businesses ({businesses.length})
        </button>
        <button className={`admin-tab ${tab === "suspended" ? "active" : ""}`} onClick={() => setTab("suspended")}>
          Suspended ({businesses.filter(b => !b.is_active).length})
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="admin-list">
          {businesses
            .filter(b => tab === "businesses" ? b.is_active : !b.is_active)
            .map(b => (
              <div key={b.id} className={`admin-card ${!b.is_active ? "suspended" : ""}`}>
                <div className="admin-card-info">
                  <div style={{display:"flex", alignItems:"center", gap:"0.5rem"}}>
                    <span className={`status-dot ${b.is_active ? "active" : "inactive"}`}></span>
                    <h3>{b.name}</h3>
                  </div>
                  <p className="muted">{b.category} · {b.city} · {b.address}</p>
                  <p className="muted">📞 {b.phone}</p>
                  <p className="muted" style={{fontSize:"0.75rem"}}>
                    Joined: {new Date(b.created_at).toLocaleDateString()} ·
                    Fee: D150/month ·
                    Status: {b.is_active ? "✅ Active" : "❌ Suspended"}
                  </p>
                </div>
                <div className="admin-actions">
                  {b.is_active ? (
                    <button className="admin-btn suspend" onClick={() => handleSuspend(b.id, b.name)}>
                      Suspend
                    </button>
                  ) : (
                    <button className="admin-btn activate" onClick={() => handleActivate(b.id, b.name)}>
                      Activate
                    </button>
                  )}
                  <button className="admin-btn delete" onClick={() => handleDelete(b.id, b.name)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          {businesses.filter(b => tab === "businesses" ? b.is_active : !b.is_active).length === 0 && (
            <p className="muted" style={{padding:"2rem", textAlign:"center"}}>
              {tab === "businesses" ? "No active businesses." : "No suspended businesses."}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
