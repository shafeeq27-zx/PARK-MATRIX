"""
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
            flash(f'Vehicle {completed_record["reg_number"]} checked out successfully! Total Fee: ${completed_record["fee"]:.2f}', 'success')
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


@app.route('/api/anpr-auto-entry', methods=['POST'])
def api_anpr_auto_entry():
    """
    Automatic ANPR Entry Endpoint.
    Accepts vehicle plate number, assigns best available bay, and opens the boom barrier.
    """
    data = request.get_json(silent=True) or request.form
    reg_number = (data.get('reg_number') or '').strip().upper()
    vehicle_type = (data.get('vehicle_type') or 'Car').strip()
    owner_name = (data.get('owner_name') or f'Driver of {reg_number}').strip()
    contact_number = (data.get('contact_number') or '9800000000').strip()

    if not reg_number:
        return jsonify({'success': False, 'error': 'Registration number is required'}), 400

    # Prevent active duplicates
    existing = database.check_active_vehicle(reg_number)
    if existing:
        return jsonify({
            'success': False,
            'error': f'Duplicate entry blocked: Vehicle {reg_number} is already inside in slot {existing["slot_number"]}.'
        }), 409

    # Find available slot
    avail_slot = database.get_available_slot(vehicle_type)
    if not avail_slot:
        return jsonify({
            'success': False,
            'error': f'Lot is full for vehicle type "{vehicle_type}".'
        }), 409

    assigned_slot = avail_slot['slot_number']
    record_id = database.register_vehicle_entry(
        reg_number=reg_number,
        vehicle_type=vehicle_type,
        owner_name=owner_name,
        contact_number=contact_number,
        slot_number=assigned_slot
    )

    return jsonify({
        'success': True,
        'message': f'Barrier open: Vehicle {reg_number} parked in Slot {assigned_slot}',
        'record_id': record_id,
        'slot_number': assigned_slot,
        'reg_number': reg_number,
        'vehicle_type': vehicle_type
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
