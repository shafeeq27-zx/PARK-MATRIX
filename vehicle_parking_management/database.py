"""
Database module for Vehicle Parking Management System.
Handles SQLite connection, schema initialization, CRUD operations, transactions, and analytics.
"""

import sqlite3
import os
import math
from datetime import datetime, date, timedelta

# Database path inside the 'instance' folder
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
INSTANCE_DIR = os.path.join(BASE_DIR, 'instance')
DATABASE_PATH = os.path.join(INSTANCE_DIR, 'parking.db')
SCHEMA_PATH = os.path.join(BASE_DIR, 'schema.sql')


def get_db():
    """Establish connection to SQLite database with Row factory."""
    if not os.path.exists(INSTANCE_DIR):
        os.makedirs(INSTANCE_DIR, exist_ok=True)
        
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def init_db():
    """Initializes the database schema if tables do not exist."""
    if not os.path.exists(INSTANCE_DIR):
        os.makedirs(INSTANCE_DIR, exist_ok=True)

    with get_db() as conn:
        with open(SCHEMA_PATH, 'r', encoding='utf-8') as f:
            conn.executescript(f.read())
        
        # Check if rates exist, if not seed default rates
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM rates")
        if cur.fetchone()[0] == 0:
            seed_default_rates(conn)
            
        # Check if slots exist, if not seed initial parking slots
        cur.execute("SELECT COUNT(*) FROM slots")
        if cur.fetchone()[0] == 0:
            seed_default_slots(conn)
            
        conn.commit()


def seed_default_rates(conn):
    """Seed standard hourly parking rates."""
    default_rates = [
        ('Bike', 2.00, 'Motorcycles & Scooters'),
        ('Car', 5.00, 'Sedans, Hatchbacks & SUVs'),
        ('Van', 8.00, 'Commercial Vans & Minivans'),
        ('Truck', 12.00, 'Heavy Trucks & Buses')
    ]
    conn.executemany(
        "INSERT INTO rates (vehicle_type, hourly_rate, description) VALUES (?, ?, ?)",
        default_rates
    )


def seed_default_slots(conn):
    """Seed initial parking slots."""
    slots = []
    # 10 Bike slots (B-101 to B-110)
    for i in range(1, 11):
        slots.append((f"B-{i:02d}", 'Bike', 'Available', 'Zone A - Ground Floor'))
    # 20 Car slots (C-201 to C-220)
    for i in range(1, 21):
        slots.append((f"C-{i:02d}", 'Car', 'Available', 'Zone B - Ground Floor'))
    # 6 Van slots (V-301 to V-306)
    for i in range(1, 7):
        slots.append((f"V-{i:02d}", 'Van', 'Available', 'Zone C - Open Lot'))
    # 4 Truck slots (T-401 to T-404)
    for i in range(1, 5):
        slots.append((f"T-{i:02d}", 'Truck', 'Available', 'Zone D - Heavy Bay'))

    conn.executemany(
        "INSERT INTO slots (slot_number, slot_type, status, floor) VALUES (?, ?, ?, ?)",
        slots
    )


# -------------------------------------------------------------
# Slot Operations
# -------------------------------------------------------------

def get_all_slots():
    """Retrieve all slots."""
    with get_db() as conn:
        return conn.execute("SELECT * FROM slots ORDER BY slot_type ASC, slot_number ASC").fetchall()


def get_available_slot(vehicle_type):
    """Find the first available slot for the given vehicle type."""
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "SELECT * FROM slots WHERE slot_type = ? AND status = 'Available' ORDER BY slot_number ASC LIMIT 1",
            (vehicle_type,)
        )
        return cur.fetchone()


def get_available_slots_by_type(vehicle_type):
    """Find all available slots for manual selection."""
    with get_db() as conn:
        return conn.execute(
            "SELECT * FROM slots WHERE slot_type = ? AND status = 'Available' ORDER BY slot_number ASC",
            (vehicle_type,)
        ).fetchall()


def add_slot(slot_number, slot_type, floor='Ground Floor'):
    """Add a new parking slot."""
    with get_db() as conn:
        conn.execute(
            "INSERT INTO slots (slot_number, slot_type, status, floor) VALUES (?, ?, 'Available', ?)",
            (slot_number.strip().upper(), slot_type, floor)
        )
        conn.commit()


def update_slot_status(slot_number, status):
    """Manually update slot status (e.g. Maintenance or Available)."""
    with get_db() as conn:
        conn.execute(
            "UPDATE slots SET status = ? WHERE slot_number = ?",
            (status, slot_number)
        )
        conn.commit()


# -------------------------------------------------------------
# Rates Operations
# -------------------------------------------------------------

def get_rates():
    """Retrieve all hourly rates."""
    with get_db() as conn:
        return conn.execute("SELECT * FROM rates ORDER BY hourly_rate ASC").fetchall()


def get_rate_for_type(vehicle_type):
    """Retrieve hourly rate for a specific vehicle type."""
    with get_db() as conn:
        row = conn.execute("SELECT hourly_rate FROM rates WHERE vehicle_type = ?", (vehicle_type,)).fetchone()
        return row['hourly_rate'] if row else 5.00


def update_rates(rates_dict):
    """Update hourly rates."""
    with get_db() as conn:
        for v_type, rate in rates_dict.items():
            conn.execute(
                "UPDATE rates SET hourly_rate = ? WHERE vehicle_type = ?",
                (float(rate), v_type)
            )
        conn.commit()


# -------------------------------------------------------------
# Vehicle Entry & Exit Operations
# -------------------------------------------------------------

def check_active_vehicle(reg_number):
    """Check if vehicle is already parked inside."""
    with get_db() as conn:
        return conn.execute(
            "SELECT * FROM parking_records WHERE UPPER(reg_number) = UPPER(?) AND status = 'Active'",
            (reg_number.strip(),)
        ).fetchone()


def register_vehicle_entry(reg_number, vehicle_type, owner_name, contact_number, slot_number, entry_time=None):
    """
    Registers a new vehicle entry using a safe database transaction:
    1. Verifies vehicle is not already parked.
    2. Verifies slot is available.
    3. Creates active record.
    4. Marks slot as Occupied.
    """
    reg_clean = reg_number.strip().upper()
    owner_clean = owner_name.strip()
    contact_clean = contact_number.strip()
    now_str = entry_time if entry_time else datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    with get_db() as conn:
        cur = conn.cursor()

        # 1. Duplicate check
        cur.execute(
            "SELECT id FROM parking_records WHERE UPPER(reg_number) = ? AND status = 'Active'",
            (reg_clean,)
        )
        if cur.fetchone():
            raise ValueError(f"Vehicle with registration '{reg_clean}' is already parked inside.")

        # 2. Slot occupancy check
        cur.execute(
            "SELECT status FROM slots WHERE slot_number = ?",
            (slot_number,)
        )
        slot = cur.fetchone()
        if not slot:
            raise ValueError(f"Slot '{slot_number}' does not exist.")
        if slot['status'] != 'Available':
            raise ValueError(f"Slot '{slot_number}' is already occupied or under maintenance.")

        # 3. Insert record & 4. Update slot
        cur.execute(
            """
            INSERT INTO parking_records 
            (reg_number, vehicle_type, owner_name, contact_number, slot_number, entry_time, status)
            VALUES (?, ?, ?, ?, ?, ?, 'Active')
            """,
            (reg_clean, vehicle_type, owner_clean, contact_clean, slot_number, now_str)
        )
        record_id = cur.lastrowid

        cur.execute(
            "UPDATE slots SET status = 'Occupied' WHERE slot_number = ?",
            (slot_number,)
        )

        conn.commit()
        return record_id


def calculate_parking_fee(entry_time_str, exit_time_str, vehicle_type):
    """
    Calculates duration and fee:
    - Parses entry and exit times.
    - Duration in hours rounded up to next billable hour. Minimum 1 hour.
    - Fee = billable_hours * hourly_rate.
    """
    try:
        entry_dt = datetime.strptime(entry_time_str[:19], '%Y-%m-%d %H:%M:%S')
    except ValueError:
        entry_dt = datetime.fromisoformat(entry_time_str)

    try:
        exit_dt = datetime.strptime(exit_time_str[:19], '%Y-%m-%d %H:%M:%S')
    except ValueError:
        exit_dt = datetime.fromisoformat(exit_time_str)

    delta = exit_dt - entry_dt
    total_seconds = max(0, delta.total_seconds())
    total_minutes = math.ceil(total_seconds / 60)
    
    # Round up partial hours (e.g. 1 hr 5 mins = 2 hours)
    billable_hours = math.ceil(total_minutes / 60)
    if billable_hours == 0:
        billable_hours = 1  # Minimum 1 hour billing

    hourly_rate = get_rate_for_type(vehicle_type)
    total_fee = round(billable_hours * hourly_rate, 2)

    hours_disp = total_minutes // 60
    mins_disp = total_minutes % 60
    duration_text = f"{hours_disp} hr {mins_disp} min" if hours_disp > 0 else f"{mins_disp} min"

    return {
        'total_minutes': total_minutes,
        'billable_hours': billable_hours,
        'hourly_rate': hourly_rate,
        'total_fee': total_fee,
        'duration_text': duration_text,
        'entry_dt': entry_dt.strftime('%Y-%m-%d %H:%M:%S'),
        'exit_dt': exit_dt.strftime('%Y-%m-%d %H:%M:%S')
    }


def process_vehicle_exit(record_id, payment_status='Paid'):
    """
    Finalizes vehicle exit inside a transaction:
    1. Fetches active record.
    2. Calculates duration and fee.
    3. Updates record to Completed.
    4. Marks slot as Available.
    """
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM parking_records WHERE id = ? AND status = 'Active'", (record_id,))
        record = cur.fetchone()
        if not record:
            raise ValueError("No active parking record found for this vehicle.")

        exit_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        calc = calculate_parking_fee(record['entry_time'], exit_time, record['vehicle_type'])

        cur.execute(
            """
            UPDATE parking_records 
            SET exit_time = ?, duration_hours = ?, fee = ?, payment_status = ?, status = 'Completed'
            WHERE id = ?
            """,
            (exit_time, calc['billable_hours'], calc['total_fee'], payment_status, record_id)
        )

        cur.execute(
            "UPDATE slots SET status = 'Available' WHERE slot_number = ?",
            (record['slot_number'],)
        )

        conn.commit()

        # Return completed receipt details
        return get_record_by_id(record_id)


def get_record_by_id(record_id):
    """Retrieve full details of a specific parking session."""
    with get_db() as conn:
        return conn.execute("SELECT * FROM parking_records WHERE id = ?", (record_id,)).fetchone()


def get_records(search=None, status=None, vehicle_type=None, date_from=None, date_to=None):
    """Retrieve filtered vehicle parking records."""
    query = "SELECT * FROM parking_records WHERE 1=1"
    params = []

    if search:
        search_term = f"%{search.strip().upper()}%"
        query += " AND (UPPER(reg_number) LIKE ? OR UPPER(owner_name) LIKE ? OR UPPER(slot_number) LIKE ?)"
        params.extend([search_term, search_term, search_term])

    if status and status != 'All':
        query += " AND status = ?"
        params.append(status)

    if vehicle_type and vehicle_type != 'All':
        query += " AND vehicle_type = ?"
        params.append(vehicle_type)

    if date_from:
        query += " AND DATE(entry_time) >= DATE(?)"
        params.append(date_from)

    if date_to:
        query += " AND DATE(entry_time) <= DATE(?)"
        params.append(date_to)

    query += " ORDER BY entry_time DESC"

    with get_db() as conn:
        return conn.execute(query, params).fetchall()


# -------------------------------------------------------------
# Dashboard & Reports
# -------------------------------------------------------------

def get_dashboard_metrics():
    """Calculates all key metrics for the dashboard from actual database records."""
    today_str = date.today().isoformat()

    with get_db() as conn:
        cur = conn.cursor()

        # Slots
        cur.execute("SELECT COUNT(*) FROM slots")
        total_slots = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM slots WHERE status = 'Available'")
        available_slots = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM slots WHERE status = 'Occupied'")
        occupied_slots = cur.fetchone()[0]

        # Active vehicles
        cur.execute("SELECT COUNT(*) FROM parking_records WHERE status = 'Active'")
        total_parked = cur.fetchone()[0]

        # Entered today
        cur.execute("SELECT COUNT(*) FROM parking_records WHERE DATE(entry_time) = DATE(?)", (today_str,))
        entered_today = cur.fetchone()[0]

        # Exited today
        cur.execute("SELECT COUNT(*) FROM parking_records WHERE status = 'Completed' AND DATE(exit_time) = DATE(?)", (today_str,))
        exited_today = cur.fetchone()[0]

        # Total revenue
        cur.execute("SELECT COALESCE(SUM(fee), 0) FROM parking_records WHERE status = 'Completed'")
        total_revenue = round(cur.fetchone()[0], 2)

        # Revenue today
        cur.execute("SELECT COALESCE(SUM(fee), 0) FROM parking_records WHERE status = 'Completed' AND DATE(exit_time) = DATE(?)", (today_str,))
        revenue_today = round(cur.fetchone()[0], 2)

        # Occupancy by vehicle type
        cur.execute("""
            SELECT slot_type, 
                   COUNT(*) as total,
                   SUM(CASE WHEN status = 'Occupied' THEN 1 ELSE 0 END) as occupied,
                   SUM(CASE WHEN status = 'Available' THEN 1 ELSE 0 END) as available
            FROM slots
            GROUP BY slot_type
        """)
        type_breakdown = [dict(row) for row in cur.fetchall()]

        # Recent 5 activities
        cur.execute("""
            SELECT * FROM parking_records 
            ORDER BY COALESCE(exit_time, entry_time) DESC 
            LIMIT 5
        """)
        recent_activity = cur.fetchall()

        occupancy_rate = round((occupied_slots / total_slots * 100), 1) if total_slots > 0 else 0

        return {
            'total_slots': total_slots,
            'available_slots': available_slots,
            'occupied_slots': occupied_slots,
            'occupancy_rate': occupancy_rate,
            'total_parked': total_parked,
            'entered_today': entered_today,
            'exited_today': exited_today,
            'total_revenue': total_revenue,
            'revenue_today': revenue_today,
            'type_breakdown': type_breakdown,
            'recent_activity': recent_activity
        }


def get_revenue_report_data():
    """Generates daily and monthly revenue breakdowns for reporting."""
    with get_db() as conn:
        cur = conn.cursor()

        # Last 7 days revenue
        cur.execute("""
            SELECT DATE(exit_time) as day_date, 
                   COUNT(*) as vehicle_count, 
                   COALESCE(SUM(fee), 0) as daily_revenue
            FROM parking_records
            WHERE status = 'Completed' AND exit_time IS NOT NULL
            GROUP BY DATE(exit_time)
            ORDER BY DATE(exit_time) DESC
            LIMIT 7
        """)
        daily_records = cur.fetchall()

        # Revenue by vehicle type
        cur.execute("""
            SELECT vehicle_type, 
                   COUNT(*) as total_vehicles, 
                   COALESCE(SUM(fee), 0) as total_revenue
            FROM parking_records
            WHERE status = 'Completed'
            GROUP BY vehicle_type
            ORDER BY total_revenue DESC
        """)
        vehicle_type_revenue = cur.fetchall()

        # Monthly revenue
        cur.execute("""
            SELECT strftime('%Y-%m', exit_time) as month_str,
                   COUNT(*) as total_vehicles,
                   COALESCE(SUM(fee), 0) as monthly_revenue
            FROM parking_records
            WHERE status = 'Completed' AND exit_time IS NOT NULL
            GROUP BY strftime('%Y-%m', exit_time)
            ORDER BY month_str DESC
            LIMIT 6
        """)
        monthly_records = cur.fetchall()

        return {
            'daily': daily_records,
            'by_type': vehicle_type_revenue,
            'monthly': monthly_records
        }


def seed_demo_data():
    """Inserts realistic sample records for college demo / presentation."""
    now = datetime.now()
    demo_sessions = [
        # Active sessions
        ('KA-01-AB-1234', 'Car', 'Rahul Sharma', '9876543210', 'C-01', (now - timedelta(hours=3, minutes=15)).strftime('%Y-%m-%d %H:%M:%S'), 'Active', None, 0, 0.0, 'Pending'),
        ('MH-12-CD-5678', 'Bike', 'Priya Patel', '9123456780', 'B-01', (now - timedelta(hours=1, minutes=45)).strftime('%Y-%m-%d %H:%M:%S'), 'Active', None, 0, 0.0, 'Pending'),
        ('DL-04-EF-9012', 'Car', 'Amit Verma', '9988776655', 'C-02', (now - timedelta(hours=5, minutes=10)).strftime('%Y-%m-%d %H:%M:%S'), 'Active', None, 0, 0.0, 'Pending'),
        ('TN-09-GH-3456', 'Van', 'City Logistics Ltd', '9871122334', 'V-01', (now - timedelta(hours=2, minutes=20)).strftime('%Y-%m-%d %H:%M:%S'), 'Active', None, 0, 0.0, 'Pending'),
        ('KA-05-JK-7890', 'Bike', 'Sneha Kulkarni', '9765432109', 'B-02', (now - timedelta(minutes=40)).strftime('%Y-%m-%d %H:%M:%S'), 'Active', None, 0, 0.0, 'Pending'),
        
        # Completed sessions from today and yesterday
        ('KA-03-LM-4321', 'Car', 'Vikram Rao', '9845123456', 'C-05', 
         (now - timedelta(hours=6)).strftime('%Y-%m-%d %H:%M:%S'), 'Completed',
         (now - timedelta(hours=2)).strftime('%Y-%m-%d %H:%M:%S'), 4, 20.0, 'Paid'),
        ('MH-02-PQ-8765', 'Bike', 'Karan Mehta', '9819876543', 'B-04',
         (now - timedelta(hours=4, minutes=30)).strftime('%Y-%m-%d %H:%M:%S'), 'Completed',
         (now - timedelta(hours=1)).strftime('%Y-%m-%d %H:%M:%S'), 4, 8.0, 'Paid'),
        ('DL-01-RS-2109', 'Truck', 'North Cargo Movers', '9910022334', 'T-01',
         (now - timedelta(hours=8)).strftime('%Y-%m-%d %H:%M:%S'), 'Completed',
         (now - timedelta(hours=3)).strftime('%Y-%m-%d %H:%M:%S'), 5, 60.0, 'Paid'),
        ('HR-26-TU-6543', 'Car', 'Ananya Roy', '9811224466', 'C-08',
         (now - timedelta(days=1, hours=5)).strftime('%Y-%m-%d %H:%M:%S'), 'Completed',
         (now - timedelta(days=1, hours=2)).strftime('%Y-%m-%d %H:%M:%S'), 3, 15.0, 'Paid'),
        ('KA-04-VW-0987', 'Van', 'Express Delivery Services', '9844332211', 'V-03',
         (now - timedelta(days=1, hours=7)).strftime('%Y-%m-%d %H:%M:%S'), 'Completed',
         (now - timedelta(days=1, hours=3)).strftime('%Y-%m-%d %H:%M:%S'), 4, 32.0, 'Paid'),
    ]

    with get_db() as conn:
        cur = conn.cursor()
        for session in demo_sessions:
            cur.execute("""
                INSERT INTO parking_records 
                (reg_number, vehicle_type, owner_name, contact_number, slot_number, entry_time, status, exit_time, duration_hours, fee, payment_status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, session)
            
            # If active, mark corresponding slot occupied
            if session[6] == 'Active':
                cur.execute("UPDATE slots SET status = 'Occupied' WHERE slot_number = ?", (session[4],))

        conn.commit()


def reset_database(seed_demo=False):
    """Safely resets the database and re-initializes clean schema."""
    if os.path.exists(DATABASE_PATH):
        try:
            os.remove(DATABASE_PATH)
        except OSError:
            pass
    init_db()
    if seed_demo:
        seed_demo_data()
