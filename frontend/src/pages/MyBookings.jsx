import { useState } from "react"
import axios from "axios"

const API = "https://bookease-booking-service.onrender.com"

export default function MyBookings({ navigate }) {
  const [email, setEmail] = useState("")
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState("")

  const handleSearch = async e => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await axios.get(`${API}/bookings`, { params: { customer_email: email } })
      setBookings(res.data)
      setSearched(true)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (bookingId) => {
    if (!confirm("Cancel this booking?")) return
    try {
      await axios.patch(`${API}/bookings/${bookingId}/cancel`)
      setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: "cancelled" } : b))
    } catch {
      alert("Could not cancel booking.")
    }
  }

  return (
    <div className="profile-page">
      <div className="card">
        <h2>My Bookings</h2>
        <p className="muted" style={{marginBottom:"1.5rem"}}>Enter your email to see your bookings.</p>

        <form onSubmit={handleSearch} className="form">
          <div className="form-row">
            <label>Your email address</label>
            <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Searching..." : "Find my bookings"}
          </button>
        </form>

        {searched && (
          <div style={{marginTop:"1.5rem"}}>
            {bookings.length === 0 ? (
              <p className="muted">No bookings found for {email}.</p>
            ) : (
              <div className="bookings-list">
                {bookings.map(b => (
                  <div key={b.id} className={`booking-item ${b.status === "cancelled" ? "cancelled" : ""}`}>
                    <div>
                      <p className="service-name">Booking #{b.id}</p>
                      <p className="muted">{b.appointment_date} at {b.appointment_time}</p>
                      <p className="muted">Notes: {b.notes || "None"}</p>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <span className={`status-badge ${b.status}`}>{b.status}</span>
                      {b.status === "confirmed" && (
                        <button className="cancel-btn" onClick={() => handleCancel(b.id)}>Cancel</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
