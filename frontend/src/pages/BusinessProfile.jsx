import { useState, useEffect } from "react"
import axios from "axios"

const API = "https://bookease-booking-service.onrender.com"

export default function BusinessProfile({ business, navigate }) {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (business) fetchServices()
  }, [business])

  const fetchServices = async () => {
    try {
      const res = await axios.get(`${API}/businesses/${business.id}/services`)
      setServices(res.data)
    } catch (e) {}
    finally { setLoading(false) }
  }

  if (!business) return null

  return (
    <div className="profile-page">
      <button className="back-btn" onClick={() => navigate("home")}>← Back</button>

      <div className="card">
        <div className="profile-header">
          <div className="profile-icon">{business.name[0]}</div>
          <div>
            <h2>{business.name}</h2>
            <p className="muted">{business.category} · {business.city}</p>
            <p className="muted">📍 {business.address}</p>
            <p className="muted">📞 {business.phone}</p>
          </div>
        </div>

        {business.description && (
          <p style={{color:"#5C3D2E", marginTop:"1rem", lineHeight:"1.6"}}>{business.description}</p>
        )}

        <div className="services-section">
          <h3>Services</h3>
          {loading ? (
            <p className="muted">Loading services...</p>
          ) : services.length === 0 ? (
            <p className="muted">No services listed yet.</p>
          ) : (
            <div className="services-list">
              {services.map(s => (
                <div key={s.id} className="service-item">
                  <div>
                    <p className="service-name">{s.name}</p>
                    {s.description && <p className="muted">{s.description}</p>}
                    <p className="muted">⏱ {s.duration_minutes} min · 💵 {s.price ? `D${s.price}` : "Ask for price"}</p>
                  </div>
                  <button
                    className="btn-primary"
                    onClick={() => navigate("book", { business, service: s })}
                  >
                    Book
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
