import { useState, useEffect } from "react"
import axios from "axios"

const API = "https://bookease-booking-service.onrender.com"

const TIME_SLOTS = [
  "09:00","09:30","10:00","10:30","11:00","11:30",
  "12:00","12:30","13:00","13:30","14:00","14:30",
  "15:00","15:30","16:00","16:30","17:00"
]

export default function BookingForm({ onSuccess }) {
  const [form, setForm] = useState({
    customer_name: "",
    customer_email: "",
    appointment_date: "",
    appointment_time: "",
    notes: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const goOnline = () => setIsOnline(true)
    const goOffline = () => setIsOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await axios.post(`${API}/bookings`, {
        ...form,
        service_id: 2,
        business_id: 1,
      })

      // Handle offline queued response from service worker
      if (res.data.offline) {
        onSuccess({
          id: "pending",
          customer_name: form.customer_name,
          customer_email: form.customer_email,
          appointment_date: form.appointment_date,
          appointment_time: form.appointment_time,
          status: "queued — will sync when online",
        })
        return
      }

      onSuccess(res.data)
    } catch (err) {
      if (err.response?.status === 409) {
        setError("That time slot is already booked. Please pick another.")
      } else if (!isOnline) {
        setError("You are offline. Please check your connection and try again.")
      } else {
        setError("Something went wrong. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const today = new Date().toISOString().split("T")[0]

  return (
    <div className="card">
      {!isOnline && (
        <div className="offline-banner">
          📵 You are offline — bookings will sync when you reconnect
        </div>
      )}

      <div className="business-info">
        <div className="business-avatar">FH</div>
        <div>
          <h2>Fatu Hair Salon</h2>
          <p className="muted">✂️ Haircut · 60 min · $25</p>
          <p className="muted">📍 123 Main St</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="form">
        <div className="form-row">
          <label>Your name</label>
          <input name="customer_name" placeholder="Jane Smith" value={form.customer_name} onChange={handleChange} required />
        </div>
        <div className="form-row">
          <label>Email</label>
          <input name="customer_email" type="email" placeholder="jane@example.com" value={form.customer_email} onChange={handleChange} required />
        </div>
        <div className="form-row">
          <label>Date</label>
          <input name="appointment_date" type="date" min={today} value={form.appointment_date} onChange={handleChange} required />
        </div>
        <div className="form-row">
          <label>Time</label>
          <select name="appointment_time" value={form.appointment_time} onChange={handleChange} required>
            <option value="">Select a time</option>
            {TIME_SLOTS.map((t) => (<option key={t} value={t}>{t}</option>))}
          </select>
        </div>
        <div className="form-row">
          <label>Notes (optional)</label>
          <textarea name="notes" placeholder="Anything we should know?" value={form.notes} onChange={handleChange} rows={3} />
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Booking..." : isOnline ? "Book appointment" : "Save for later"}
        </button>
      </form>
    </div>
  )
}
