"""
Tests for the BookEase Booking Service.
Run with: pytest tests/ -v
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import date, timedelta

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from main import app
from database import get_db
from models import Base

# Use an in-memory SQLite DB for tests (no Postgres needed)
TEST_DB_URL = "sqlite:///./test.db"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


client = TestClient(app)

TOMORROW = str(date.today() + timedelta(days=1))

SAMPLE_BOOKING = {
    "service_id": 1,
    "business_id": 1,
    "customer_name": "Jane Smith",
    "customer_email": "jane@example.com",
    "appointment_date": TOMORROW,
    "appointment_time": "10:00",
    "notes": "First visit",
}


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_create_booking():
    response = client.post("/bookings", json=SAMPLE_BOOKING)
    assert response.status_code == 201
    data = response.json()
    assert data["customer_email"] == "jane@example.com"
    assert data["status"] == "confirmed"


def test_get_booking():
    create_res = client.post("/bookings", json=SAMPLE_BOOKING)
    booking_id = create_res.json()["id"]

    response = client.get(f"/bookings/{booking_id}")
    assert response.status_code == 200
    assert response.json()["id"] == booking_id


def test_booking_conflict():
    client.post("/bookings", json=SAMPLE_BOOKING)
    response = client.post("/bookings", json=SAMPLE_BOOKING)
    assert response.status_code == 409
    assert "already booked" in response.json()["detail"]


def test_cancel_booking():
    create_res = client.post("/bookings", json=SAMPLE_BOOKING)
    booking_id = create_res.json()["id"]

    response = client.patch(f"/bookings/{booking_id}/cancel")
    assert response.status_code == 200
    assert response.json()["status"] == "cancelled"


def test_cancel_same_slot_after_cancellation():
    """Cancelled slot should be available for re-booking."""
    create_res = client.post("/bookings", json=SAMPLE_BOOKING)
    booking_id = create_res.json()["id"]
    client.patch(f"/bookings/{booking_id}/cancel")

    response = client.post("/bookings", json=SAMPLE_BOOKING)
    assert response.status_code == 201


def test_availability():
    client.post("/bookings", json=SAMPLE_BOOKING)
    response = client.get(f"/availability?business_id=1&date={TOMORROW}")
    assert response.status_code == 200
    assert "10:00" in response.json()["booked_slots"]
