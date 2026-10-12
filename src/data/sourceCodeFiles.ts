export interface ProjectFile {
  name: string;
  path: string;
  language: string;
  description: string;
  content: string;
}

export const PROJECT_FILES: ProjectFile[] = [
  {
    name: 'app.py',
    path: 'vehicle_parking_management/app.py',
    language: 'python',
    description: 'Main Flask Web Application with routing, entry/exit controllers, CSV generation, and receipt endpoints.',
    content: `"""
Vehicle Parking Management System - Flask Application
A professional college project for managing parking slots, vehicle entry, exit, fees, receipts, and reporting.
"""

import os
import csv
import io
from datetime import datetime
from flask import (
    Flask, render_template, request, redirect, url_for, flash, jsonify, Response, send_file
)
import database

# Initialize Flask application
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'college_parking_project_secret_key_2026')

# Initialize database schema on startup
with app.app_context():
    database.init_db()


# -----------------------------------------------------------------------------
# 1. Dashboard
# -----------------------------------------------------------------------------
@app.route('/')
def dashboard():
    """Renders the main dashboard with live calculated metrics and occupancy."""
    stats = database.get_dashboard_metrics()
    return render_template('dashboard.html', stats=stats)


# -----------------------------------------------------------------------------
# 2. Vehicle Entry
# -----------------------------------------------------------------------------
@app.route('/entry', methods=['GET', 'POST'])
def vehicle_entry():
    """Handles vehicle entry registration with validation and automated slot allocation."""
    if request.method == 'POST':
        reg_number = request.form.get('reg_number', '').strip().upper()
        vehicle_type = request.form.get('vehicle_type', '').strip()
        owner_name = request.form.get('owner_name', '').strip()
        contact_number = request.form.get('contact_number', '').strip()
        slot_number = request.form.get('slot_number', '').strip().upper()

        # Validation
        if not reg_number or not vehicle_type or not owner_name or not contact_number:
            flash('All fields are required. Please fill in the entire form.', 'danger')
            return redirect(url_for('vehicle_entry'))

        # Check duplicate active registration
        existing = database.check_active_vehicle(reg_number)
        if existing:
            flash(f'Vehicle {reg_number} is already marked active in slot {existing["slot_number"]}. Cannot register duplicate entry.', 'danger')
            return redirect(url_for('vehicle_entry'))

        # If no slot specified, automatically assign one
        if not slot_number:
            avail_slot = database.get_available_slot(vehicle_type)
            if not avail_slot:
                flash(f'No available parking slots found for vehicle type "{vehicle_type}". Parking is currently full for this category.', 'warning')
                return redirect(url_for('vehicle_entry'))
            slot_number = avail_slot['slot_number']

        try:
            record_id = database.register_vehicle_entry(
                reg_number=reg_number,
                vehicle_type=vehicle_type,
                owner_name=owner_name,
                contact_number=contact_number,
                slot_number=slot_number
            )
            flash(f'Vehicle {reg_number} successfully registered and assigned to Slot {slot_number}!', 'success')
            return redirect(url_for('dashboard'))
        except ValueError as e:
            flash(str(e), 'danger')
            return redirect(url_for('vehicle_entry'))

    # GET Request: Fetch default rates and available slots for preview
    rates = database.get_rates()
    slots = database.get_all_slots()
    return render_template('vehicle_entry.html', rates=rates, slots=slots)


# -----------------------------------------------------------------------------
# 3. Vehicle Exit & Billing
# -----------------------------------------------------------------------------
@app.route('/exit', methods=['GET', 'POST'])
def vehicle_exit():
    """Handles vehicle checkout, hourly fee calculation, and receipt generation."""
    active_record = None
    fee_breakdown = None

    search_query = request.args.get('search', '').strip().upper()
    if search_query:
        active_record = database.check_active_vehicle(search_query)
        if active_record:
            now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            fee_breakdown = database.calculate_parking_fee(
                active_record['entry_time'],
                now_str,
                active_record['vehicle_type']
            )
        else:
            flash(f'No currently parked vehicle found with registration number "{search_query}".', 'warning')

    if request.method == 'POST':
        record_id = request.form.get('record_id')
        payment_status = request.form.get('payment_status', 'Paid')

        if not record_id:
            flash('Invalid record selected for checkout.', 'danger')
            return redirect(url_for('vehicle_exit'))

        try:
            completed_record = database.process_vehicle_exit(int(record_id), payment_status)
            flash(f'Vehicle {completed_record["reg_number"]} checked out successfully! Total Fee: \${completed_record["fee"]:.2f}', 'success')
            return redirect(url_for('receipt', record_id=completed_record['id']))
        except ValueError as e:
            flash(str(e), 'danger')
            return redirect(url_for('vehicle_exit'))

    # Get list of all currently active parked vehicles for quick selection
    active_vehicles = database.get_records(status='Active')
    return render_template(
        'vehicle_exit.html',
        active_record=active_record,
        fee_breakdown=fee_breakdown,
        active_vehicles=active_vehicles,
        search_query=search_query
    )


# -----------------------------------------------------------------------------
# 4. Parking Receipt (Printable)
# -----------------------------------------------------------------------------
@app.route('/receipt/<int:record_id>')
def receipt(record_id):
    """Displays a clean, printable parking invoice/receipt."""
    record = database.get_record_by_id(record_id)
    if not record:
        flash('Receipt not found for this transaction.', 'danger')
        return redirect(url_for('dashboard'))
    return render_template('receipt.html', record=record)


# -----------------------------------------------------------------------------
# 5. Parking Slot Management
# -----------------------------------------------------------------------------
@app.route('/slots', methods=['GET', 'POST'])
def parking_slots():
    """Displays the interactive parking layout and allows adding or updating slots."""
    if request.method == 'POST':
        action = request.form.get('action')

        if action == 'add_slot':
            slot_number = request.form.get('slot_number', '').strip().upper()
            slot_type = request.form.get('slot_type', '').strip()
            floor = request.form.get('floor', 'Ground Floor').strip()

            if not slot_number or not slot_type:
                flash('Slot number and type are required.', 'danger')
            else:
                try:
                    database.add_slot(slot_number, slot_type, floor)
                    flash(f'Slot {slot_number} successfully added to {slot_type} category.', 'success')
                except Exception as e:
                    flash(f'Error adding slot: {str(e)}', 'danger')

        elif action == 'toggle_status':
            slot_number = request.form.get('slot_number')
            new_status = request.form.get('status')
            if slot_number and new_status:
                database.update_slot_status(slot_number, new_status)
                flash(f'Slot {slot_number} status updated to {new_status}.', 'info')

        return redirect(url_for('parking_slots'))

    slots = database.get_all_slots()
    return render_template('parking_slots.html', slots=slots)


# -------------------------------------------------------------
# 6. Vehicle History & Records
# -------------------------------------------------------------
@app.route('/history')
def vehicle_history():
    """Displays searchable and filterable vehicle parking logs."""
    search = request.args.get('search', '')
    status = request.args.get('status', 'All')
    vehicle_type = request.args.get('vehicle_type', 'All')
    date_from = request.args.get('date_from', '')
    date_to = request.args.get('date_to', '')

    records = database.get_records(
        search=search,
        status=status,
        vehicle_type=vehicle_type,
        date_from=date_from,
        date_to=date_to
    )

    return render_template(
        'vehicle_history.html',
        records=records,
        search=search,
        status=status,
        vehicle_type=vehicle_type,
        date_from=date_from,
        date_to=date_to
    )


# -------------------------------------------------------------
# 7. Reports & Analytics
# -------------------------------------------------------------
@app.route('/reports')
def reports():
    """Generates financial summary reports and parking volume metrics."""
    stats = database.get_dashboard_metrics()
    report_data = database.get_revenue_report_data()
    return render_template('reports.html', stats=stats, report_data=report_data)


# -------------------------------------------------------------
# 8. Settings & Rates Configuration
# -------------------------------------------------------------
@app.route('/settings', methods=['GET', 'POST'])
def settings():
    """Configures hourly rates and database utilities."""
    if request.method == 'POST':
        action = request.form.get('action')

        if action == 'update_rates':
            rates_dict = {
                'Bike': request.form.get('rate_bike', 2.0),
                'Car': request.form.get('rate_car', 5.0),
                'Van': request.form.get('rate_van', 8.0),
                'Truck': request.form.get('rate_truck', 12.0),
            }
            database.update_rates(rates_dict)
            flash('Hourly parking rates updated successfully!', 'success')
            return redirect(url_for('settings'))

        elif action == 'seed_demo':
            database.seed_demo_data()
            flash('Realistic demonstration sample data populated successfully!', 'success')
            return redirect(url_for('dashboard'))

        elif action == 'reset_db':
            database.reset_database(seed_demo=False)
            flash('Database has been completely cleared and re-initialized with fresh slots.', 'warning')
            return redirect(url_for('dashboard'))

    rates = database.get_rates()
    return render_template('settings.html', rates=rates)


# -------------------------------------------------------------
# 9. CSV Export
# -------------------------------------------------------------
@app.route('/export-csv')
def export_csv():
    """Exports filtered or complete vehicle history as a CSV spreadsheet."""
    records = database.get_records()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        'Record ID', 'Registration No', 'Vehicle Type', 'Owner Name',
        'Contact Number', 'Slot Number', 'Entry Time', 'Exit Time',
        'Duration (Hours)', 'Fee ($)', 'Payment Status', 'Session Status'
    ])

    for r in records:
        writer.writerow([
            r['id'],
            r['reg_number'],
            r['vehicle_type'],
            r['owner_name'],
            r['contact_number'],
            r['slot_number'],
            r['entry_time'],
            r['exit_time'] or 'In Parking',
            r['duration_hours'] or 0,
            f"{r['fee']:.2f}" if r['fee'] is not None else "0.00",
            r['payment_status'],
            r['status']
        ])

    output.seek(0)
    filename = f"parking_records_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-disposition": f"attachment; filename={filename}"}
    )


# -------------------------------------------------------------
# 10. AJAX APIs for Dynamic Frontend Interactivity
# -------------------------------------------------------------
@app.route('/api/available-slots/<vehicle_type>')
def api_available_slots(vehicle_type):
    """Returns available slots for a vehicle type in JSON format."""
    slots = database.get_available_slots_by_type(vehicle_type)
    return jsonify([dict(s) for s in slots])


@app.route('/api/calculate-exit')
def api_calculate_exit():
    """Calculates fee preview for real-time exit modal."""
    reg = request.args.get('reg', '').strip().upper()
    record = database.check_active_vehicle(reg)
    if not record:
        return jsonify({'error': 'Vehicle not found or not active'}), 404

    now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    calc = database.calculate_parking_fee(record['entry_time'], now_str, record['vehicle_type'])
    return jsonify({
        'record': dict(record),
        'calculation': calc
    })


# -----------------------------------------------------------------------------
# Application Runner
# -----------------------------------------------------------------------------
if __name__ == '__main__':
    # Runs locally on Windows / development host at port 5000
    print("=" * 60)
    print("Vehicle Parking Management System")
    print("Starting Flask application on http://127.0.0.1:5000")
    print("=" * 60)
    app.run(host='127.0.0.1', port=5000, debug=True)
`
  },
  {
    name: 'database.py',
    path: 'vehicle_parking_management/database.py',
    language: 'python',
    description: 'SQLite database module with parameterized queries, ACID transactions, and hourly billing engine.',
    content: `"""
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
        
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM rates")
        if cur.fetchone()[0] == 0:
            seed_default_rates(conn)
            
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
    # 10 Bike slots (B-01 to B-10)
    for i in range(1, 11):
        slots.append((f"B-{i:02d}", 'Bike', 'Available', 'Zone A - Ground Floor'))
    # 20 Car slots (C-01 to C-20)
    for i in range(1, 21):
        slots.append((f"C-{i:02d}", 'Car', 'Available', 'Zone B - Ground Floor'))
    # 6 Van slots (V-01 to V-06)
    for i in range(1, 7):
        slots.append((f"V-{i:02d}", 'Van', 'Available', 'Zone C - Open Lot'))
    # 4 Truck slots (T-01 to T-04)
    for i in range(1, 5):
        slots.append((f"T-{i:02d}", 'Truck', 'Available', 'Zone D - Heavy Bay'))

    conn.executemany(
        "INSERT INTO slots (slot_number, slot_type, status, floor) VALUES (?, ?, ?, ?)",
        slots
    )


def get_all_slots():
    with get_db() as conn:
        return conn.execute("SELECT * FROM slots ORDER BY slot_type ASC, slot_number ASC").fetchall()


def get_available_slot(vehicle_type):
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "SELECT * FROM slots WHERE slot_type = ? AND status = 'Available' ORDER BY slot_number ASC LIMIT 1",
            (vehicle_type,)
        )
        return cur.fetchone()


def get_available_slots_by_type(vehicle_type):
    with get_db() as conn:
        return conn.execute(
            "SELECT * FROM slots WHERE slot_type = ? AND status = 'Available' ORDER BY slot_number ASC",
            (vehicle_type,)
        ).fetchall()


def add_slot(slot_number, slot_type, floor='Ground Floor'):
    with get_db() as conn:
        conn.execute(
            "INSERT INTO slots (slot_number, slot_type, status, floor) VALUES (?, ?, 'Available', ?)",
            (slot_number.strip().upper(), slot_type, floor)
        )
        conn.commit()


def update_slot_status(slot_number, status):
    with get_db() as conn:
        conn.execute(
            "UPDATE slots SET status = ? WHERE slot_number = ?",
            (status, slot_number)
        )
        conn.commit()


def get_rates():
    with get_db() as conn:
        return conn.execute("SELECT * FROM rates ORDER BY hourly_rate ASC").fetchall()


def get_rate_for_type(vehicle_type):
    with get_db() as conn:
        row = conn.execute("SELECT hourly_rate FROM rates WHERE vehicle_type = ?", (vehicle_type,)).fetchone()
        return row['hourly_rate'] if row else 5.00


def update_rates(rates_dict):
    with get_db() as conn:
        for v_type, rate in rates_dict.items():
            conn.execute(
                "UPDATE rates SET hourly_rate = ? WHERE vehicle_type = ?",
                (float(rate), v_type)
            )
        conn.commit()


def check_active_vehicle(reg_number):
    with get_db() as conn:
        return conn.execute(
            "SELECT * FROM parking_records WHERE UPPER(reg_number) = UPPER(?) AND status = 'Active'",
            (reg_number.strip(),)
        ).fetchone()


def register_vehicle_entry(reg_number, vehicle_type, owner_name, contact_number, slot_number, entry_time=None):
    reg_clean = reg_number.strip().upper()
    owner_clean = owner_name.strip()
    contact_clean = contact_number.strip()
    now_str = entry_time if entry_time else datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    with get_db() as conn:
        cur = conn.cursor()

        # 1. Duplicate check
        cur.execute("SELECT id FROM parking_records WHERE UPPER(reg_number) = ? AND status = 'Active'", (reg_clean,))
        if cur.fetchone():
            raise ValueError(f"Vehicle with registration '{reg_clean}' is already parked inside.")

        # 2. Slot occupancy check
        cur.execute("SELECT status FROM slots WHERE slot_number = ?", (slot_number,))
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

        cur.execute("UPDATE slots SET status = 'Occupied' WHERE slot_number = ?", (slot_number,))
        conn.commit()
        return record_id


def calculate_parking_fee(entry_time_str, exit_time_str, vehicle_type):
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
    
    # Round up partial hours
    billable_hours = math.ceil(total_minutes / 60)
    if billable_hours == 0:
        billable_hours = 1

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

        cur.execute("UPDATE slots SET status = 'Available' WHERE slot_number = ?", (record['slot_number'],))
        conn.commit()
        return get_record_by_id(record_id)


def get_record_by_id(record_id):
    with get_db() as conn:
        return conn.execute("SELECT * FROM parking_records WHERE id = ?", (record_id,)).fetchone()


def get_records(search=None, status=None, vehicle_type=None, date_from=None, date_to=None):
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


def get_dashboard_metrics():
    today_str = date.today().isoformat()
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM slots")
        total_slots = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM slots WHERE status = 'Available'")
        available_slots = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM slots WHERE status = 'Occupied'")
        occupied_slots = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM parking_records WHERE status = 'Active'")
        total_parked = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM parking_records WHERE DATE(entry_time) = DATE(?)", (today_str,))
        entered_today = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM parking_records WHERE status = 'Completed' AND DATE(exit_time) = DATE(?)", (today_str,))
        exited_today = cur.fetchone()[0]

        cur.execute("SELECT COALESCE(SUM(fee), 0) FROM parking_records WHERE status = 'Completed'")
        total_revenue = round(cur.fetchone()[0], 2)

        cur.execute("SELECT COALESCE(SUM(fee), 0) FROM parking_records WHERE status = 'Completed' AND DATE(exit_time) = DATE(?)", (today_str,))
        revenue_today = round(cur.fetchone()[0], 2)

        cur.execute("""
            SELECT slot_type, 
                   COUNT(*) as total,
                   SUM(CASE WHEN status = 'Occupied' THEN 1 ELSE 0 END) as occupied,
                   SUM(CASE WHEN status = 'Available' THEN 1 ELSE 0 END) as available
            FROM slots
            GROUP BY slot_type
        """)
        type_breakdown = [dict(row) for row in cur.fetchall()]

        cur.execute("SELECT * FROM parking_records ORDER BY COALESCE(exit_time, entry_time) DESC LIMIT 5")
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
    with get_db() as conn:
        cur = conn.cursor()
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
`
  },
  {
    name: 'schema.sql',
    path: 'vehicle_parking_management/schema.sql',
    language: 'sql',
    description: 'Relational SQLite tables for rates, slots, and parking session records with constraints and indexes.',
    content: `-- Vehicle Parking Management System Schema
-- SQLite Database Schema

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS rates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_type TEXT UNIQUE NOT NULL,
    hourly_rate REAL NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slot_number TEXT UNIQUE NOT NULL,
    slot_type TEXT NOT NULL,          -- 'Bike', 'Car', 'Van', 'Truck'
    status TEXT NOT NULL DEFAULT 'Available', -- 'Available', 'Occupied', 'Maintenance'
    floor TEXT DEFAULT 'Ground Floor'
);

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

CREATE INDEX IF NOT EXISTS idx_reg_number ON parking_records(reg_number);
CREATE INDEX IF NOT EXISTS idx_status ON parking_records(status);
CREATE INDEX IF NOT EXISTS idx_slot_status ON slots(status);
CREATE INDEX IF NOT EXISTS idx_entry_time ON parking_records(entry_time);
`
  },
  {
    name: 'requirements.txt',
    path: 'vehicle_parking_management/requirements.txt',
    language: 'plaintext',
    description: 'Python package manifest for pip install on Windows.',
    content: `Flask==3.0.3
python-dotenv==1.0.1
`
  },
  {
    name: 'README.md',
    path: 'vehicle_parking_management/README.md',
    language: 'markdown',
    description: 'Complete documentation, testing guide, and step-by-step Windows setup guide.',
    content: `# Vehicle Parking Management System (College Final Project)

A complete, production-grade, full-stack college project developed using **Python, Flask, SQLite, HTML5, CSS3, JavaScript, and Chart.js**. Designed to digitally automate vehicle gate entry, parking bay assignment, real-time slot occupancy tracking, automated hourly tariff calculation, printable thermal receipts, and financial audit reports.

---

## 1. Quick Windows Setup Instructions

1. Install Python 3.10+ from python.org (Check "Add Python to PATH").
2. Open this folder in VS Code.
3. Open terminal (cmd.exe) and run:
   python -m venv venv
   venv\\Scripts\\activate
4. Install requirements:
   pip install -r requirements.txt
5. Initialize the SQLite database:
   python -c "import database; database.init_db(); print('DB Ready!')"
6. Start the Flask application:
   python app.py
7. Open in browser: http://127.0.0.1:5000
`
  }
];
