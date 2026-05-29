import { useState } from "react"
import axios from "axios"
import MediaUpload from "../components/MediaUpload"

const API = "https://bookease-booking-service.onrender.com"

const CATEGORIES = [
  "Hair Salon", "Barber", "Nail Salon", "Tailor", "Clinic",
  "Pharmacy", "Restaurant", "Gym", "Spa", "Photography", "Tutoring", "Other"
]

const CITY_CONFIG = {
  "Banjul":      { currency: "D",   label: "Dalasi (D)",             phone_prefix: "+220" },
  "Serrekunda":  { currency: "D",   label: "Dalasi (D)",             phone_prefix: "+220" },
  "Brikama":     { currency: "D",   label: "Dalasi (D)",             phone_prefix: "+220" },
  "Bakau":       { currency: "D",   label: "Dalasi (D)",             phone_prefix: "+220" },
  "Farafenni":   { currency: "D",   label: "Dalasi (D)",             phone_prefix: "+220" },
  "Lamin":       { currency: "D",   label: "Dalasi (D)",             phone_prefix: "+220" },
  "Sukuta":      { currency: "D",   label: "Dalasi (D)",             phone_prefix: "+220" },
  "Gunjur":      { currency: "D",   label: "Dalasi (D)",             phone_prefix: "+220" },
  "Basse":       { currency: "D",   label: "Dalasi (D)",             phone_prefix: "+220" },
  "Janjanbureh": { currency: "D",   label: "Dalasi (D)",             phone_prefix: "+220" },
  "Dakar":       { currency: "CFA", label: "CFA Franc (CFA)",        phone_prefix: "+221" },
  "Accra":       { currency: "GH₵", label: "Ghanaian Cedi (GH₵)",   phone_prefix: "+233" },
  "Lagos":       { currency: "₦",   label: "Nigerian Naira (₦)",    phone_prefix: "+234" },
  "Abidjan":     { currency: "CFA", label: "CFA Franc (CFA)",        phone_prefix: "+225" },
  "Nairobi":     { currency: "KSh", label: "Kenyan Shilling (KSh)",  phone_prefix: "+254" },
  "London":      { currency: "£",   label: "British Pound (£)",      phone_prefix: "+44"  },
  "Barcelona":   { currency: "€",   label: "Euro (€)",               phone_prefix: "+34"  },
  "Madrid":      { currency: "€",   label: "Euro (€)",               phone_prefix: "+34"  },
  "Paris":       { currency: "€",   label: "Euro (€)",               phone_prefix: "+33"  },
  "New York":    { currency: "$",   label: "US Dollar ($)",          phone_prefix: "+1"   },
  "Other":       { currency: "",    label: "Enter currency manually", phone_prefix: "+"   },
}

const CITIES = Object.keys(CITY_CONFIG)

export default function BusinessSignup({ navigate }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    owner_name: "", owner_email: "", owner_password: "",
    name: "", category: "", description: "",
    address: "", city: "Serrekunda", phone: "+220 ", currency: "D",
  })
  const [services, setServices] = useState([{ name: "", duration_minutes: "", price: "" }])
  const [media, setMedia] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)
  const [createdBusiness, setCreatedBusiness] = useState(null)

  const goToStep = (n) => {
    setError("")
    setLoading(false)
    setStep(n)
  }

  const handleChange = e => {
    const { name, value } = e.target
    if (name === "city") {
      const cfg = CITY_CONFIG[value] || {}
      setForm(f => ({ ...f, city: value, currency: cfg.currency || "", phone: (cfg.phone_prefix || "+") + " " }))
    } else {
      setForm(f => ({ ...f, [name]: value }))
    }
    setError("")
  }

  const handleServiceChange = (i, field, value) => {
    const updated = [...services]
    updated[i][field] = value
    setServices(updated)
  }

  const addService = () => setServices([...services, { name: "", duration_minutes: "", price: "" }])
  const removeService = i => setServices(services.filter((_, idx) => idx !== i))

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Step 1: Register business
    let business = null
    try {
      const res = await axios.post(`${API}/businesses/register`, {
        owner_name: form.owner_name,
        owner_email: form.owner_email,
        owner_password: form.owner_password,
        name: form.name,
        category: form.category,
        description: form.description || "",
        address: form.address,
        phone: form.phone,
        city: form.city,
        media: []
      })
      business = res.data
      setCreatedBusiness(business)
    } catch (err) {
      if (err.response?.status === 409) {
        setError("That email is already registered.")
      } else {
        const detail = err.response?.data?.detail
        if (Array.isArray(detail)) {
          setError("Error: " + detail.map(d => d.msg + " (" + (d.loc || []).join(".") + ")").join(", "))
        } else {
          setError("Registration failed: " + (typeof detail === "string" ? detail : err.message))
        }
      }
      setLoading(false)
      return
    }

    // Step 2: Add services (failures are silent)
    for (const svc of services) {
      if (!svc.name || !svc.name.trim()) continue
      try {
        await axios.post(`${API}/services`, {
          business_id: business.id,
          name: svc.name.trim(),
          duration_minutes: svc.duration_minutes ? parseInt(svc.duration_minutes) : 60,
          price: svc.price ? parseFloat(svc.price) : null,
        })
      } catch (e) {
        console.error("Service error:", e)
      }
    }

    setLoading(false)
    setDone(true)
  }

  const currency = form.currency || "D"

  if (done) {
    return (
      <div className="card confirmation">
        <div className="checkmark">✓</div>
        <h2>You're listed!</h2>
        <p className="muted">Welcome to BookEase, {form.name}!</p>
        <div className="booking-details">
          <div className="detail-row"><span className="label">Business</span><span>{form.name}</span></div>
          <div className="detail-row"><span className="label">Category</span><span>{form.category}</span></div>
          <div className="detail-row"><span className="label">City</span><span>{form.city}</span></div>
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
      <button className="back-btn" onClick={() => navigate("home")}>Back</button>
      <div className="card">
        <h2>List your business</h2>
        <p className="muted" style={{marginBottom:"1rem"}}>Join BookEase and let customers book your services online.</p>

        <div className="steps">
          <div className={`step ${step >= 1 ? "active" : ""}`}>1. Your details</div>
          <div className="step-divider">-</div>
          <div className={`step ${step >= 2 ? "active" : ""}`}>2. Business info</div>
          <div className="step-divider">-</div>
          <div className={`step ${step >= 3 ? "active" : ""}`}>3. Services</div>
          <div className="step-divider">-</div>
          <div className={`step ${step >= 4 ? "active" : ""}`}>4. Photos</div>
        </div>

        <form onSubmit={handleSubmit} className="form">

          {step === 1 && (
            <>
              <div className="form-row">
                <label>Your full name</label>
                <input name="owner_name" placeholder="Your name" value={form.owner_name} onChange={handleChange} required />
              </div>
              <div cl
cat > ~/bookease/frontend/src/pages/BusinessSignup.jsx << 'JSEOF'
import { useState } from "react"
import axios from "axios"
import MediaUpload from "../components/MediaUpload"

const API = "https://bookease-booking-service.onrender.com"

const CATEGORIES = [
  "Hair Salon", "Barber", "Nail Salon", "Tailor", "Clinic",
  "Pharmacy", "Restaurant", "Gym", "Spa", "Photography", "Tutoring", "Other"
]

const CITY_CONFIG = {
  "Banjul":      { currency: "D",   label: "Dalasi (D)",             phone_prefix: "+220" },
  "Serrekunda":  { currency: "D",   label: "Dalasi (D)",             phone_prefix: "+220" },
  "Brikama":     { currency: "D",   label: "Dalasi (D)",             phone_prefix: "+220" },
  "Bakau":       { currency: "D",   label: "Dalasi (D)",             phone_prefix: "+220" },
  "Farafenni":   { currency: "D",   label: "Dalasi (D)",             phone_prefix: "+220" },
  "Lamin":       { currency: "D",   label: "Dalasi (D)",             phone_prefix: "+220" },
  "Sukuta":      { currency: "D",   label: "Dalasi (D)",             phone_prefix: "+220" },
  "Gunjur":      { currency: "D",   label: "Dalasi (D)",             phone_prefix: "+220" },
  "Basse":       { currency: "D",   label: "Dalasi (D)",             phone_prefix: "+220" },
  "Janjanbureh": { currency: "D",   label: "Dalasi (D)",             phone_prefix: "+220" },
  "Dakar":       { currency: "CFA", label: "CFA Franc (CFA)",        phone_prefix: "+221" },
  "Accra":       { currency: "GH₵", label: "Ghanaian Cedi (GH₵)",   phone_prefix: "+233" },
  "Lagos":       { currency: "₦",   label: "Nigerian Naira (₦)",    phone_prefix: "+234" },
  "Abidjan":     { currency: "CFA", label: "CFA Franc (CFA)",        phone_prefix: "+225" },
  "Nairobi":     { currency: "KSh", label: "Kenyan Shilling (KSh)",  phone_prefix: "+254" },
  "London":      { currency: "£",   label: "British Pound (£)",      phone_prefix: "+44"  },
  "Barcelona":   { currency: "€",   label: "Euro (€)",               phone_prefix: "+34"  },
  "Madrid":      { currency: "€",   label: "Euro (€)",               phone_prefix: "+34"  },
  "Paris":       { currency: "€",   label: "Euro (€)",               phone_prefix: "+33"  },
  "New York":    { currency: "$",   label: "US Dollar ($)",          phone_prefix: "+1"   },
  "Other":       { currency: "",    label: "Enter currency manually", phone_prefix: "+"   },
}

const CITIES = Object.keys(CITY_CONFIG)

export default function BusinessSignup({ navigate }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    owner_name: "", owner_email: "", owner_password: "",
    name: "", category: "", description: "",
    address: "", city: "Serrekunda", phone: "+220 ", currency: "D",
  })
  const [services, setServices] = useState([{ name: "", duration_minutes: "", price: "" }])
  const [media, setMedia] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)
  const [createdBusiness, setCreatedBusiness] = useState(null)

  const goToStep = (n) => {
    setError("")
    setLoading(false)
    setStep(n)
  }

  const handleChange = e => {
    const { name, value } = e.target
    if (name === "city") {
      const cfg = CITY_CONFIG[value] || {}
      setForm(f => ({ ...f, city: value, currency: cfg.currency || "", phone: (cfg.phone_prefix || "+") + " " }))
    } else {
      setForm(f => ({ ...f, [name]: value }))
    }
    setError("")
  }

  const handleServiceChange = (i, field, value) => {
    const updated = [...services]
    updated[i][field] = value
    setServices(updated)
  }

  const addService = () => setServices([...services, { name: "", duration_minutes: "", price: "" }])
  const removeService = i => setServices(services.filter((_, idx) => idx !== i))

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Step 1: Register business
    let business = null
    try {
      const res = await axios.post(`${API}/businesses/register`, {
        owner_name: form.owner_name,
        owner_email: form.owner_email,
        owner_password: form.owner_password,
        name: form.name,
        category: form.category,
        description: form.description || "",
        address: form.address,
        phone: form.phone,
        city: form.city,
        media: []
      })
      business = res.data
      setCreatedBusiness(business)
    } catch (err) {
      if (err.response?.status === 409) {
        setError("That email is already registered.")
      } else {
        const detail = err.response?.data?.detail
        if (Array.isArray(detail)) {
          setError("Error: " + detail.map(d => d.msg + " (" + (d.loc || []).join(".") + ")").join(", "))
        } else {
          setError("Registration failed: " + (typeof detail === "string" ? detail : err.message))
        }
      }
      setLoading(false)
      return
    }

    // Step 2: Add services (failures are silent)
    for (const svc of services) {
      if (!svc.name || !svc.name.trim()) continue
      try {
        await axios.post(`${API}/services`, {
          business_id: business.id,
          name: svc.name.trim(),
          duration_minutes: svc.duration_minutes ? parseInt(svc.duration_minutes) : 60,
          price: svc.price ? parseFloat(svc.price) : null,
        })
      } catch (e) {
        console.error("Service error:", e)
      }
    }

    setLoading(false)
    setDone(true)
  }

  const currency = form.currency || "D"

  if (done) {
    return (
      <div className="card confirmation">
        <div className="checkmark">✓</div>
        <h2>You're listed!</h2>
        <p className="muted">Welcome to BookEase, {form.name}!</p>
        <div className="booking-details">
          <div className="detail-row"><span className="label">Business</span><span>{form.name}</span></div>
          <div className="detail-row"><span className="label">Category</span><span>{form.category}</span></div>
          <div className="detail-row"><span className="label">City</span><span>{form.city}</span></div>
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
      <button className="back-btn" onClick={() => navigate("home")}>Back</button>
      <div className="card">
        <h2>List your business</h2>
        <p className="muted" style={{marginBottom:"1rem"}}>Join BookEase and let customers book your services online.</p>

        <div className="steps">
          <div className={`step ${step >= 1 ? "active" : ""}`}>1. Your details</div>
          <div className="step-divider">-</div>
          <div className={`step ${step >= 2 ? "active" : ""}`}>2. Business info</div>
          <div className="step-divider">-</div>
          <div className={`step ${step >= 3 ? "active" : ""}`}>3. Services</div>
          <div className="step-divider">-</div>
          <div className={`step ${step >= 4 ? "active" : ""}`}>4. Photos</div>
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
              {error && <p className="error">{error}</p>}
              <button type="button" className="btn-primary" onClick={() => {
                if (!form.owner_name || !form.owner_email || !form.owner_password) { setError("Please fill in all fields"); return }
                goToStep(2)
              }}>Next</button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="form-row">
                <label>Business name</label>
                <input name="name" placeholder="e.g. Fatou Hair Salon" value={form.name} onChange={handleChange} required />
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
              {CITY_CONFIG[form.city]?.currency === "" && (
                <div className="form-row">
                  <label>Currency symbol</label>
                  <input name="currency" placeholder="e.g. $, €, £" value={form.currency} onChange={handleChange} maxLength={5} />
                </div>
              )}
              <div className="currency-note">
                Currency: <strong>{CITY_CONFIG[form.city]?.label || "Enter above"}</strong>
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
              {error && <p className="error">{error}</p>}
              <div style={{display:"flex", gap:"0.5rem"}}>
                <button type="button" className="btn-secondary" onClick={() => goToStep(1)}>Back</button>
                <button type="button" className="btn-primary" onClick={() => {
                  if (!form.name || !form.category || !form.city || !form.address || !form.phone) { setError("Please fill in all required fields"); return }
                  goToStep(3)
                }}>Next</button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <p className="muted" style={{marginBottom:"1rem"}}>
                Add the services you offer. Prices in <strong>{CITY_CONFIG[form.city]?.label || currency}</strong>.
              </p>
              {services.map((svc, i) => (
                <div key={i} className="service-form-item">
                  <div className="form-row">
                    <label>Service name</label>
                    <input placeholder="e.g. Haircut, Braiding..." value={svc.name} onChange={e => handleServiceChange(i, "name", e.target.value)} />
                  </div>
                  <div style={{display:"flex", gap:"0.5rem"}}>
                    <div className="form-row" style={{flex:1}}>
                      <label>Duration (mins) <span style={{color:"#C4A882", fontWeight:"normal"}}>(optional)</span></label>
                      <input type="number" placeholder="e.g. 60" value={svc.duration_minutes} onChange={e => handleServiceChange(i, "duration_minutes", e.target.value)} min={15} step={15} />
                    </div>
                    <div className="form-row" style={{flex:1}}>
                      <label>Price ({currency || "optional"})</label>
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
                <button type="button" className="btn-secondary" onClick={() => goToStep(2)}>Back</button>
                <button type="button" className="btn-primary" onClick={() => goToStep(4)}>Next</button>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <p className="muted" style={{marginBottom:"1rem"}}>
                Add photos or videos of your work. This helps customers choose you!
                <span style={{color:"#C4A882"}}> (optional)</span>
              </p>
              <MediaUpload onUpload={setMedia} existing={media} />
              {error && (
                <div>
                  <p className="error">{error}</p>
                  <p className="muted" style={{fontSize:"0.8rem", marginTop:"0.5rem"}}>You can skip photos and list your business now.</p>
                </div>
              )}
              <div style={{display:"flex", gap:"0.5rem", marginTop:"1rem"}}>
                <button type="button" className="btn-secondary" onClick={() => goToStep(3)}>Back</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? "Creating listing..." : "List my business!"}
                </button>
              </div>
            </>
          )}

        </form>
      </div>
    </div>
  )
}
