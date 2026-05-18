import { useState } from "react"
import Home from "./pages/Home"
import BusinessProfile from "./pages/BusinessProfile"
import BookingPage from "./pages/BookingPage"
import BusinessSignup from "./pages/BusinessSignup"
import MyBookings from "./pages/MyBookings"
import Admin from "./pages/Admin"
import "./App.css"

export default function App() {
  const [page, setPage] = useState("home")
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [selectedService, setSelectedService] = useState(null)
  const [confirmedBooking, setConfirmedBooking] = useState(null)

  const navigate = (p, data = {}) => {
    setPage(p)
    if (data.business) setSelectedBusiness(data.business)
    if (data.service) setSelectedService(data.service)
    if (data.booking) setConfirmedBooking(data.booking)
    window.scrollTo(0, 0)
  }

  // Secret admin access — add ?admin to URL
  const isAdmin = window.location.search.includes("admin")
  if (isAdmin && page !== "admin") setPage("admin")

  return (
    <div className="app">
      {page !== "admin" && (
        <header className="header">
          <div className="header-inner">
            <h1 onClick={() => navigate("home")} style={{cursor:"pointer"}}>BookEase</h1>
            <p>The Gambia's booking platform</p>
            <nav className="nav">
              <button className="nav-btn" onClick={() => navigate("home")}>Browse</button>
              <button className="nav-btn" onClick={() => navigate("my-bookings")}>My Bookings</button>
              <button className="nav-btn nav-btn-accent" onClick={() => navigate("business-signup")}>List your business</button>
            </nav>
          </div>
        </header>
      )}

      <main className="main">
        {page === "home" && <Home navigate={navigate} />}
        {page === "business" && <BusinessProfile business={selectedBusiness} navigate={navigate} />}
        {page === "book" && <BookingPage business={selectedBusiness} service={selectedService} navigate={navigate} />}
        {page === "confirmed" && <BookingConfirmed booking={confirmedBooking} navigate={navigate} />}
        {page === "business-signup" && <BusinessSignup navigate={navigate} />}
        {page === "my-bookings" && <MyBookings navigate={navigate} />}
        {page === "admin" && <Admin navigate={navigate} />}
      </main>

      {page !== "admin" && (
        <footer className="footer">
          <p>BookEase — Connecting The Gambia one booking at a time</p>
          <p style={{marginTop:"0.25rem"}}>Built with FastAPI · PostgreSQL · Docker · GitHub Actions</p>
        </footer>
      )}
    </div>
  )
}

function BookingConfirmed({ booking, navigate }) {
  return (
    <div className="card confirmation">
      <div className="checkmark">✓</div>
      <h2>You're booked!</h2>
      <p className="muted">Booking #{booking.id}</p>
      <div className="booking-details">
        <div className="detail-row"><span className="label">Name</span><span>{booking.customer_name}</span></div>
        <div className="detail-row"><span className="label">Date</span><span>{booking.appointment_date}</span></div>
        <div className="detail-row"><span className="label">Time</span><span>{booking.appointment_time}</span></div>
        <div className="detail-row"><span className="label">Status</span><span className="status-confirmed">{booking.status}</span></div>
      </div>
      <p className="muted" style={{marginTop:"1rem", fontSize:"0.85rem"}}>💵 Payment is cash — please arrive on time.</p>
      <button onClick={() => navigate("home")} className="btn-secondary">Back to home</button>
      <button onClick={() => navigate("my-bookings")} className="btn-primary" style={{marginTop:"0.5rem"}}>View my bookings</button>
    </div>
  )
}
