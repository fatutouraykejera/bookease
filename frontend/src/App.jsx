import { useState } from "react"
import BookingForm from "./components/BookingForm"
import BookingConfirmation from "./components/BookingConfirmation"
import "./App.css"

export default function App() {
  const [confirmedBooking, setConfirmedBooking] = useState(null)

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <h1>BookEase</h1>
          <p>Simple, fast appointment booking</p>
        </div>
      </header>

      <main className="main">
        {confirmedBooking ? (
          <BookingConfirmation
            booking={confirmedBooking}
            onBookAgain={() => setConfirmedBooking(null)}
          />
        ) : (
          <BookingForm onSuccess={setConfirmedBooking} />
        )}
      </main>

      <footer className="footer">
        <p>Built with FastAPI · PostgreSQL · Docker · GitHub Actions</p>
      </footer>
    </div>
  )
}
