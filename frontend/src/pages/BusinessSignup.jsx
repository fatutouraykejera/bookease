import { useState } from "react"
import axios from "axios"

const API = "https://bookease-booking-service.onrender.com"

const CATEGORIES = [
  "Hair Salon", "Barber", "Nail Salon", "Tailor", "Clinic",
  "Pharmacy", "Restaurant", "Gym", "Spa", "Photography", "Tutoring", "Other"
]

const CITIES = [
  "Banjul", "Serrekunda", "Brikama", "Bakau", "Farafenni",
  "Lamin", "Sukuta", "Gunjur", "Basse", "Janjanbureh", "Other"
]

export default function BusinessSignup({ navigate }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    owner_name: "",
    owner_email: "",
    owner_password: "",
    name: "",
    category: "",
    description: "",
    address: "",
    city: "Serrekunda",
    phone: "",
  })
  const [services, setServices] = useState([{ name: "", duration_minutes: 60, price: "" }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)
  const [createdBusiness, setCreatedBusiness] = useState(null)

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError("")
  }

  const handleServiceChange = (i, field, value) => {
    const updated = [...services]
    updated[i][field] = value
    setServices(updated)
  }

  const addService = () => {
    setServices([...services, { name: "", duration_minutes: 60, price: "" }])
  }

  const removeService = i => {
    setServices(services.filter((_, idx) => idx !== i))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      // Register business
      const res = await axios.post(`${API}/businesses/register`, form)
      const business = res.data
      setCreatedBusiness(business)

      // Add services
      for (const svc of services) {
        if (svc.name.trim()) {
          await axios.post(`${API}/services`, {
            business_id: business.id,
            name: svc.name,
            duration_minutes: parseInt(svc.duration_minutes),
            price: svc.price ? parseFloat(svc.price) : null,
          })
        }
      }
      setDone(true)
    } catch (err) {
      if (err.response?.status === 409) {
        setError("That email is already registered.")
      } else {
        setError("Something went wrong. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="card confirmation">
        <div className="checkmark">✓</div>
        <h2>You're listed!</h2>
        <p className="muted">Welcome to BookEase, {createdBusiness?.name}!</p>
        <div className="booking-details">
          <div className="detail-row"><span className="label">Business</span><span>{createdBusiness?.name}</span></div>
          <div className="detail-row"><span className="label">Category</span><span>{createdBusiness?.category}</span></div>
          <div className="detail-row"><span className="label">City</span><span>{createdBusiness?.city}</span></div>
        </div>
        <p className="muted" style={{marginTop:"1rem", fontSize:"0.85rem"}}>
          Customers can now find and book your services on BookEase!
        </p>
        <button className="btn-primary" onClick={() => navigate("home")} style={{marginTop:"1rem"}}>
          See your listing
        </button>
      </div>
    )
  }

  return (
    <div className="profile-page">
      <button className="back-btn" onClick={() => navigate("home")}>← Back</button>

      <div className="card">
        <h2>List your business</h2>
        <p className="muted" style={{marginBottom:"1.5rem"}}>Join BookEase and let customers book your services online — free forever.</p>

        <div className="steps">
          <div className={`step ${step >= 1 ? "active" : ""}`}>1. Your details</div>
          <div className="step-divider">→</div>
          <div className={`step ${step >= 2 ? "active" : ""}`}>2. Business info</div>
          <div className="step-divider">→</div>
          <div className={`step ${step >= 3 ? "active" : ""}`}>3. Services</div>
        </div>

        <form onSubmit={handleSubmit} className="form">
          {step === 1 && (
            <>
              <div className="form-row">
                <label>Your full name</label>
                <input name="owner_name" placeholder="Your name" value={form.owner_name} onChange={handleChange} required />
              </div>
              <div className="form-row">
                <label>Email address</label>
                <input name="owner_email" type="email" placeholder="your@email.com" value={form.owner_email} onChange={handleChange} required />
              </div>
              <div className="form-row">
                <label>Password</label>
                <input name="owner_password" type="password" placeholder="Create a password" value={form.owner_password} onChange={handleChange} required minLength={6} />
              </div>
              <button type="button" className="btn-primary" onClick={() => {
                if (!form.owner_name || !form.owner_email || !form.owner_password) {
                  setError("Please fill in all fields")
                  return
                }
                setError("")
                setStep(2)
              }}>Next →</button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="form-row">
                <label>Business name</label>
                <input name="name" placeholder="e.g. Fatou's Hair Salon" value={form.name} onChange={handleChange} required />
              </div>
              <div className="form-row">
                <label>Category</label>
                <select name="category" value={form.category} onChange={handleChange} required>
                  <option value="">Select a category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-row">
                <label>City</label>
                <select name="city" value={form.city} onChange={handleChange} required>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-row">
                <label>Address</label>
                <input name="address" placeholder="Street or area" value={form.address} onChange={handleChange} required />
              </div>
              <div className="form-row">
                <label>Phone number</label>
                <input name="phone" placeholder="+220 XXX XXXX" value={form.phone} onChange={handleChange} required />
              </div>
              <div className="form-row">
                <label>Description (optional)</label>
                <textarea name="description" placeholder="Tell customers about your business..." value={form.description} onChange={handleChange} rows={3} />
              </div>
              <div style={{display:"flex", gap:"0.5rem"}}>
                <button type="button" className="btn-secondary" onClick={() => setStep(1)}>← Back</button>
                <button type="button" className="btn-primary" onClick={() => {
                  if (!form.name || !form.category || !form.city || !form.address || !form.phone) {
                    setError("Please fill in all required fields")
                    return
                  }
                  setError("")
                  setStep(3)
                }}>Next →</button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <p className="muted" style={{marginBottom:"1rem"}}>Add the services you offer. You can add more later.</p>
              {services.map((svc, i) => (
                <div key={i} className="service-form-item">
                  <div className="form-row">
                    <label>Service name</label>
                    <input placeholder="e.g. Haircut, Braiding..." value={svc.name} onChange={e => handleServiceChange(i, "name", e.target.value)} required />
                  </div>
                  <div style={{display:"flex", gap:"0.5rem"}}>
                    <div className="form-row" style={{flex:1}}>
                      <label>Duration (mins)</label>
                      <input type="number" value={svc.duration_minutes} onChange={e => handleServiceChange(i, "duration_minutes", e.target.value)} min={15} step={15} />
                    </div>
                    <div className="form-row" style={{flex:1}}>
                      <label>Price (Dalasi)</label>
                      <input type="number" placeholder="Optional" value={svc.price} onChange={e => handleServiceChange(i, "price", e.target.value)} min={0} />
                    </div>
                  </div>
                  {services.length > 1 && (
                    <button type="button" className="remove-btn" onClick={() => removeService(i)}>Remove</button>
                  )}
                </div>
              ))}
              <button type="button" className="btn-secondary" onClick={addService}>+ Add another service</button>

              {error && <p className="error">{error}</p>}
              <div style={{display:"flex", gap:"0.5rem", marginTop:"0.5rem"}}>
                <button type="button" className="btn-secondary" onClick={() => setStep(2)}>← Back</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? "Creating listing..." : "List my business!"}
                </button>
              </div>
            </>
          )}

          {error && step !== 3 && <p className="error">{error}</p>}
        </form>
      </div>
    </div>
  )
}
