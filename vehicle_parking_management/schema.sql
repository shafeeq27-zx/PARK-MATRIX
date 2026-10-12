-- Vehicle Parking Management System Schema
-- SQLite Database Schema

PRAGMA foreign_keys = ON;

-- 1. Parking Fee Configuration Table
CREATE TABLE IF NOT EXISTS rates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_type TEXT UNIQUE NOT NULL,
    hourly_rate REAL NOT NULL,
    description TEXT
);

-- 2. Parking Slots Table
CREATE TABLE IF NOT EXISTS slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slot_number TEXT UNIQUE NOT NULL,
    slot_type TEXT NOT NULL,          -- 'Bike', 'Car', 'Van', 'Truck'
    status TEXT NOT NULL DEFAULT 'Available', -- 'Available', 'Occupied', 'Maintenance'
    floor TEXT DEFAULT 'Ground Floor'
);

-- 3. Vehicle Parking Sessions Table
CREATE TABLE IF NOT EXISTS parking_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reg_number TEXT NOT NULL,
    vehicle_type TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    contact_number TEXT NOT NULL,
    slot_number TEXT NOT NULL,
    entry_time TIMESTAMP NOT NULL,
    exit_time TIMESTAMP,
    duration_hours INTEGER DEFAULT 0,
    fee REAL DEFAULT 0.0,
    payment_status TEXT DEFAULT 'Pending',   -- 'Pending', 'Paid'
    status TEXT NOT NULL DEFAULT 'Active',   -- 'Active', 'Completed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (slot_number) REFERENCES slots(slot_number)
);

-- Indexes for lightning fast searching and filtering
CREATE INDEX IF NOT EXISTS idx_reg_number ON parking_records(reg_number);
CREATE INDEX IF NOT EXISTS idx_status ON parking_records(status);
CREATE INDEX IF NOT EXISTS idx_slot_status ON slots(status);
CREATE INDEX IF NOT EXISTS idx_entry_time ON parking_records(entry_time);
