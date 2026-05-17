import { useState, useEffect } from "react"
import axios from "axios"

const API = "https://bookease-booking-service.onrender.com"

const TIME_SLOTS = [
  "08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30",
  "12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30",
  "16:00","16:30","17:00","17:30","18:00"
]

export default function BookingPage({ business, service, navigate }) {
  const [form, setForm] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    appointment_date: "",
    appointment_time: "",
    notes: "",
  })
  const [bookedSlots, setBookedSlots] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (form.appointment_date && business) fetchAvailability()
  }, [form.appointment_date])

  const fetchAvailability = async () => {
    try {
      const res = await axios.get(`${API}/availability`, {
        params: { business_id: business.id, date: form.appointment_date }
      })
      setBookedSlots(res.data.booked_slots)
    } catch (e) {}
  }

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError("")
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await axios.post(`${API}/bookings`, {
        ...form,
        service_id: service.id,
        business_id: business.id,
      })
      navigate("confirmed", { booking: res.data })
    } catch (err) {
      if (err.response?.status === 409) {
        setError("That time slot is already booked. Please pick another.")
      } else {
        setError("Something went wrong. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const today = new Date().toISOString().split("T")[0]

  return (
    <div className="profile-page">
      <button className="back-btn" onClick={() => navigate("business", { business })}>← Back</button>

      <div className="card">
        <div className="booking-header">
          <h2>Book appointment</h2>
          <div className="booking-summary">
            <p><strong>{business?.name}</strong></p>
            <p className="muted">✂️ {service?.name} · ⏱ {service?.duration_minutes} min · 💵 {service?.price ? `D${service.price}` : "Ask for price"}</p>
            <p className="muted" style={{fontSize:"0.8rem", marginTop:"0.25rem"}}>💵 Payment is cash on arrival</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="form">
          <div className="form-row">
            <label>Your name</label>
            <input name="customer_name" placeholder="Your full name" value={form.customer_name} onChange={handleChange} required />
          </div>
          <div className="form-row">
            <label>Email</label>
            <input name="customer_email" type="email" placeholder="your@email.com" value={form.customer_email} onChange={handleChange} required />
          </div>
          <div className="form-row">
            <label>Phone number</label>
            <input name="customer_phone" placeholder="+220 XXX XXXX" value={form.customer_phone} onChange={handleChange} />
          </div>
          <div className="form-row">
            <label>Date</label>
            <input name="appointment_date" type="date" min={today} value={form.appointment_date} onChange={handleChange} required />
          </div>
          <div className="form-row">
            <label>Time</label>
            <select name="appointment_time" value={form.appointment_time} onChange={handleChange} required>
              <option value="">Select a time</option>
              {TIME_SLOTS.map(t => (
                <option key={t} value={t} disabled={bookedSlots.includes(t)}>
                  {t} {bookedSlots.includes(t) ? "— Booked" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <label>Notes (optional)</label>
            <textarea name="notes" placeholder="Anything you'd like them to know?" value={form.notes} onChange={handleChange} rows={3} />
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Booking..." : "Confirm booking"}
          </button>
        </form>
      </div>
    </div>
  )
}
