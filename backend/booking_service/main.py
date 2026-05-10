"""
BookEase — Booking Service
Handles appointment creation, availability, and cancellation.
"""
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime, date
from typing import Optional
import redis
import json
import os

from database import get_db, engine
import models

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="BookEase Booking Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

Instrumentator().instrument(app).expose(app)

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
try:
    redis_client = redis.from_url(redis_url)
except Exception:
    redis_client = None


class BookingCreate(BaseModel):
    service_id: int
    business_id: int
    customer_name: str
    customer_email: str
    appointment_date: date
    appointment_time: str
    notes: Optional[str] = None


class BookingResponse(BaseModel):
    id: int
    service_id: int
    business_id: int
    customer_name: str
    customer_email: str
    appointment_date: date
    appointment_time: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "booking"}


@app.get("/bookings", response_model=list[BookingResponse])
def list_bookings(business_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(models.Booking)
    if business_id:
        query = query.filter(models.Booking.business_id == business_id)
    return query.all()


@app.get("/bookings/{booking_id}", response_model=BookingResponse)
def get_booking(booking_id: int, db: Session = Depends(get_db)):
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking


@app.post("/bookings", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(data: BookingCreate, db: Session = Depends(get_db)):
    conflict = db.query(models.Booking).filter(
        models.Booking.business_id == data.business_id,
        models.Booking.appointment_date == data.appointment_date,
        models.Booking.appointment_time == data.appointment_time,
        models.Booking.status != "cancelled",
    ).first()

    if conflict:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This time slot is already booked")

    booking = models.Booking(**data.model_dump())
    db.add(booking)
    db.commit()
    db.refresh(booking)

    if redis_client:
        try:
            event = {
                "type": "booking_confirmed",
                "booking_id": booking.id,
                "customer_email": booking.customer_email,
                "customer_name": booking.customer_name,
                "appointment_date": str(booking.appointment_date),
                "appointment_time": booking.appointment_time,
            }
            redis_client.lpush("notification_queue", json.dumps(event))
        except Exception:
            pass

    return booking


@app.patch("/bookings/{booking_id}/cancel", response_model=BookingResponse)
def cancel_booking(booking_id: int, db: Session = Depends(get_db)):
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.status == "cancelled":
        raise HTTPException(status_code=400, detail="Booking is already cancelled")
    booking.status = "cancelled"
    db.commit()
    db.refresh(booking)
    return booking


@app.get("/availability")
def check_availability(business_id: int, date: date, db: Session = Depends(get_db)):
    bookings = db.query(models.Booking).filter(
        models.Booking.business_id == business_id,
        models.Booking.appointment_date == date,
        models.Booking.status != "cancelled",
    ).all()
    booked_slots = [b.appointment_time for b in bookings]
    return {"date": str(date), "booked_slots": booked_slots}
