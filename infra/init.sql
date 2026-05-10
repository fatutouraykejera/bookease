-- BookEase initial schema
-- This runs automatically when Postgres starts for the first time

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'customer' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS businesses (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER REFERENCES users(id),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    address VARCHAR(500),
    phone VARCHAR(30),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    business_id INTEGER REFERENCES businesses(id),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    duration_minutes INTEGER DEFAULT 60,
    price NUMERIC(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    service_id INTEGER REFERENCES services(id),
    business_id INTEGER REFERENCES businesses(id),
    customer_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time VARCHAR(5) NOT NULL,
    status VARCHAR(20) DEFAULT 'confirmed' NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- Index for availability checks
CREATE INDEX IF NOT EXISTS idx_bookings_business_date
    ON bookings(business_id, appointment_date);

-- Seed data: a sample business and service
INSERT INTO users (name, email, hashed_password, role)
VALUES ('Demo Business', 'demo@bookease.app', 'placeholder', 'business_owner')
ON CONFLICT (email) DO NOTHING;
