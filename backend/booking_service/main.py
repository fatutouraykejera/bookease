"""
BookEase Marketplace — Booking Service
"""
from fastapi import FastAPI, HTTPException, Depends, status, Query
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import datetime, date
from typing import Optional, List
import os
import json

from database import get_db, engine
import models

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="BookEase Marketplace API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

Instrumentator().instrument(app).expose(app)

try:
    import redis as redis_lib
    redis_client = redis_lib.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))
except Exception:
    redis_client = None


# ─── Schemas ──────────────────────────────────────────────────

class BusinessCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category: str
    address: str
    phone: str
    city: str = "Banjul"
    owner_name: str
    owner_email: str
    owner_password: str

class BusinessResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    category: Optional[str]
    address: Optional[str]
    phone: Optional[str]
    city: Optional[str]
    is_active: bool
    created_at: datetime
    class Config:
        from_attributes = True

class ServiceCreate(BaseModel):
    business_id: int
    name: str
    description: Optional[str] = None
    duration_minutes: int = 60
    price: Optional[float] = None

class ServiceResponse(BaseModel):
    id: int
    business_id: int
    name: str
    description: Optional[str]
    duration_minutes: int
    price: Optional[float]
    is_active: bool
    class Config:
        from_attributes = True

class BookingCreate(BaseModel):
    service_id: int
    business_id: int
    customer_name: str
    customer_email: str
    customer_phone: Optional[str] = None
    appointment_date: date
    appointment_time: str
    notes: Optional[str] = None

class BookingResponse(BaseModel):
    id: int
    service_id: int
    business_id: int
    customer_name: str
    customer_email: str
    customer_phone: Optional[str]
    appointment_date: date
    appointment_time: str
    status: str
    notes: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True


# ─── Health ───────────────────────────────────────────────────

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "booking", "version": "2.0.0"}


# ─── Businesses ───────────────────────────────────────────────

@app.get("/businesses", response_model=List[BusinessResponse])
def list_businesses(
    category: Optional[str] = None,
    city: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Business).filter(models.Business.is_active == True)
    if category:
        query = query.filter(models.Business.category == category)
    if city:
        query = query.filter(models.Business.city == city)
    if search:
        query = query.filter(
            or_(
                models.Business.name.ilike(f"%{search}%"),
                models.Business.description.ilike(f"%{search}%"),
                models.Business.category.ilike(f"%{search}%"),
            )
        )
    return query.order_by(models.Business.created_at.desc()).all()


@app.get("/businesses/{business_id}", response_model=BusinessResponse)
def get_business(business_id: int, db: Session = Depends(get_db)):
    business = db.query(models.Business).filter(models.Business.id == business_id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    return business


@app.post("/businesses/register", response_model=BusinessResponse, status_code=201)
def register_business(data: BusinessCreate, db: Session = Depends(get_db)):
    # Check if email already exists
    existing = db.query(models.User).filter(models.User.email == data.owner_email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    # Create owner user
    from passlib.context import CryptContext
    pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
    user = models.User(
        name=data.owner_name,
        email=data.owner_email,
        hashed_password=pwd.hash(data.owner_password),
        role="business_owner"
    )
    db.add(user)
    db.flush()

    # Create business
    business = models.Business(
        owner_id=user.id,
        name=data.name,
        description=data.description,
        category=data.category,
        address=data.address,
        phone=data.phone,
        city=data.city,
    )
    db.add(business)
    db.commit()
    db.refresh(business)
    return business


@app.get("/categories")
def list_categories(db: Session = Depends(get_db)):
    businesses = db.query(models.Business.category).filter(
        models.Business.is_active == True,
        models.Business.category != None
    ).distinct().all()
    categories = sorted(set([b.category for b in businesses if b.category]))
    return {"categories": categories}


# ─── Services ─────────────────────────────────────────────────

@app.get("/businesses/{business_id}/services", response_model=List[ServiceResponse])
def list_services(business_id: int, db: Session = Depends(get_db)):
    return db.query(models.Service).filter(
        models.Service.business_id == business_id,
        models.Service.is_active == True
    ).all()


@app.post("/services", response_model=ServiceResponse, status_code=201)
def create_service(data: ServiceCreate, db: Session = Depends(get_db)):
    service = models.Service(**data.model_dump())
    db.add(service)
    db.commit()
    db.refresh(service)
    return service


# ─── Bookings ─────────────────────────────────────────────────

@app.get("/bookings", response_model=List[BookingResponse])
def list_bookings(
    business_id: Optional[int] = None,
    customer_email: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Booking)
    if business_id:
        query = query.filter(models.Booking.business_id == business_id)
    if customer_email:
        query = query.filter(models.Booking.customer_email == customer_email)
    return query.order_by(models.Booking.appointment_date.desc()).all()


@app.get("/bookings/{booking_id}", response_model=BookingResponse)
def get_booking(booking_id: int, db: Session = Depends(get_db)):
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking


@app.post("/bookings", response_model=BookingResponse, status_code=201)
def create_booking(data: BookingCreate, db: Session = Depends(get_db)):
    conflict = db.query(models.Booking).filter(
        models.Booking.business_id == data.business_id,
        models.Booking.appointment_date == data.appointment_date,
        models.Booking.appointment_time == data.appointment_time,
        models.Booking.status != "cancelled",
    ).first()
    if conflict:
        raise HTTPException(status_code=409, detail="This time slot is already booked")

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
        raise HTTPException(status_code=400, detail="Already cancelled")
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
    return {"date": str(date), "booked_slots": [b.appointment_time for b in bookings]}


# ─── Admin endpoints ──────────────────────────────────────────

ADMIN_TOKEN = "MrsAnn0803!"

def verify_admin(token: str = Query(...)):
    if token != ADMIN_TOKEN:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return True

@app.get("/admin/businesses")
def admin_list_businesses(token: str = Query(...), db: Session = Depends(get_db)):
    verify_admin(token)
    businesses = db.query(models.Business).order_by(models.Business.created_at.desc()).all()
    return businesses

@app.patch("/admin/businesses/{business_id}/suspend")
def suspend_business(business_id: int, token: str = Query(...), db: Session = Depends(get_db)):
    verify_admin(token)
    business = db.query(models.Business).filter(models.Business.id == business_id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    business.is_active = False
    db.commit()
    db.refresh(business)
    return {"message": f"{business.name} suspended"}

@app.patch("/admin/businesses/{business_id}/activate")
def activate_business(business_id: int, token: str = Query(...), db: Session = Depends(get_db)):
    verify_admin(token)
    business = db.query(models.Business).filter(models.Business.id == business_id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    business.is_active = True
    db.commit()
    db.refresh(business)
    return {"message": f"{business.name} activated"}

@app.delete("/admin/businesses/{business_id}")
def delete_business(business_id: int, token: str = Query(...), db: Session = Depends(get_db)):
    verify_admin(token)
    business = db.query(models.Business).filter(models.Business.id == business_id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    db.delete(business)
    db.commit()
    return {"message": f"Business deleted"}

@app.get("/admin/stats")
def admin_stats(token: str = Query(...), db: Session = Depends(get_db)):
    verify_admin(token)
    total_businesses = db.query(models.Business).count()
    active_businesses = db.query(models.Business).filter(models.Business.is_active == True).count()
    suspended_businesses = db.query(models.Business).filter(models.Business.is_active == False).count()
    total_bookings = db.query(models.Booking).count()
    confirmed_bookings = db.query(models.Booking).filter(models.Booking.status == "confirmed").count()
    return {
        "total_businesses": total_businesses,
        "active_businesses": active_businesses,
        "suspended_businesses": suspended_businesses,
        "total_bookings": total_bookings,
        "confirmed_bookings": confirmed_bookings,
        "monthly_revenue": active_businesses * 150,
    }
