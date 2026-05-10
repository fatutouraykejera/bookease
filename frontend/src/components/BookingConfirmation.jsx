export default function BookingConfirmation({ booking, onBookAgain }) {
  return (
    <div className="card confirmation">
      <div className="checkmark">✓</div>
      <h2>You're booked!</h2>
      <p className="muted">Booking #{booking.id}</p>

      <div className="booking-details">
        <div className="detail-row">
          <span className="label">Name</span>
          <span>{booking.customer_name}</span>
        </div>
        <div className="detail-row">
          <span className="label">Email</span>
          <span>{booking.customer_email}</span>
        </div>
        <div className="detail-row">
          <span className="label">Date</span>
          <span>{booking.appointment_date}</span>
        </div>
        <div className="detail-row">
          <span className="label">Time</span>
          <span>{booking.appointment_time}</span>
        </div>
        <div className="detail-row">
          <span className="label">Status</span>
          <span className="status-confirmed">{booking.status}</span>
        </div>
      </div>

      <button onClick={onBookAgain} className="btn-secondary">
        Book another appointment
      </button>
    </div>
  )
}
