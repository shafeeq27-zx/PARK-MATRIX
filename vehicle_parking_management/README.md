# Vehicle Parking Management System (College Final Project)

A complete, production-grade, full-stack college project developed using **Python, Flask, SQLite, HTML5, CSS3, JavaScript, and Chart.js**. Designed to digitally automate vehicle gate entry, parking bay assignment, real-time slot occupancy tracking, automated hourly tariff calculation, printable thermal receipts, and financial audit reports.

---

## 1. System Architecture & Tech Stack

```
                     ┌─────────────────────────────────────────┐
                     │           Modern Web Browser            │
                     │  HTML5 + CSS3 + Vanilla JS + Chart.js   │
                     └────────────────────┬────────────────────┘
                                          │ HTTP / REST
                                          ▼
                     ┌─────────────────────────────────────────┐
                     │          Python Flask Backend           │
                     │  • Routing & Controllers (app.py)       │
                     │  • Business Rules & Hourly Fee Engine   │
                     │  • Transaction Management               │
                     └────────────────────┬────────────────────┘
                                          │ Parameterized SQL
                                          ▼
                     ┌─────────────────────────────────────────┐
                     │             SQLite Database             │
                     │         (instance/parking.db)           │
                     │  • slots | parking_records | rates      │
                     └─────────────────────────────────────────┘
```

- **Frontend:** HTML5, Modern CSS3 (Dark Navy & Emerald Green Theme), JavaScript, Chart.js.
- **Backend:** Python 3.10+ with Flask 3.x.
- **Database:** SQLite 3 with ACID transactions, Foreign Key constraints, and indexes.
- **Operating System Target:** Windows 10 / Windows 11 (also runs on macOS and Linux).

---

## 2. Directory Structure

```text
vehicle_parking_management/
│
├── app.py                   # Main Flask controller & web endpoints
├── database.py              # SQLite CRUD operations, calculations & transactions
├── schema.sql               # Relational SQLite database schema DDL
├── requirements.txt         # Python dependencies (Flask, python-dotenv)
├── README.md                # Comprehensive documentation & Windows guide
│
├── instance/
│   └── parking.db           # Persistent SQLite database file
│
├── templates/               # Jinja2 HTML templates
│   ├── base.html            # Main navigation sidebar, header & layout
│   ├── dashboard.html       # Overview KPI cards, occupancy chart & activity
│   ├── vehicle_entry.html   # Vehicle check-in & auto-slot allocation form
│   ├── vehicle_exit.html    # Vehicle checkout & fee calculation breakdown
│   ├── parking_slots.html   # Visual interactive slot grid & maintenance
│   ├── vehicle_history.html # Historical records with filters & CSV export
│   ├── reports.html         # Daily & monthly revenue analytics & Chart.js
│   ├── settings.html        # Configurable hourly rates & database tools
│   └── receipt.html         # Printable thermal receipt / tax invoice
│
└── static/
    ├── css/
    │   └── style.css        # Responsive dark navy & emerald green stylesheet
    └── js/
        └── script.js        # Clock, mobile navigation, and UI interactivity
```

---

## 3. Step-by-Step Windows Setup Instructions

Follow these exact steps to run the application on any Windows computer:

### Step 1: Install Python on Windows
1. Download Python 3.10 or newer from [https://www.python.org/downloads/](https://www.python.org/downloads/).
2. Run the installer executable (`python-3.x.x-amd64.exe`).
3. **CRITICAL:** Check the checkbox **"Add python.exe to PATH"** before clicking **Install Now**.
4. Complete the installation.

### Step 2: Open Project in Visual Studio Code
1. Open Visual Studio Code.
2. Click **File** -> **Open Folder...**
3. Select the `vehicle_parking_management` directory.
4. Open the integrated terminal by pressing `Ctrl + ` ` ` (backtick) or going to **Terminal** -> **New Terminal**.

### Step 3: Create and Activate a Virtual Environment
In the VS Code terminal (or Windows Command Prompt `cmd.exe`), run:
```cmd
python -m venv venv
```
Activate the virtual environment:
- **On Command Prompt (cmd.exe):**
  ```cmd
  venv\Scripts\activate
  ```
- **On PowerShell:**
  ```powershell
  .\venv\Scripts\Activate.ps1
  ```
*(Note: If PowerShell displays a script execution policy error, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` and retry, or use Command Prompt).*

### Step 4: Install Dependencies
With `(venv)` active in your terminal, run:
```cmd
pip install -r requirements.txt
```

### Step 5: Initialize the SQLite Database
Run the database initializer script to automatically create the database schema, default parking slots, and rates:
```cmd
python -c "import database; database.init_db(); print('Database initialized successfully!')"
```
*(Optionally, you can also load demonstration sample data by running:)*
```cmd
python -c "import database; database.seed_demo_data(); print('Sample records loaded!')"
```

### Step 6: Start the Flask Application
Run the application runner:
```cmd
python app.py
```
You will see output in your terminal:
```text
============================================================
Vehicle Parking Management System
Starting Flask application on http://127.0.0.1:5000
============================================================
 * Serving Flask app 'app'
 * Debug mode: on
 * Running on http://127.0.0.1:5000
```

### Step 7: Open the Application in Browser
Open your browser (Google Chrome, Microsoft Edge, or Mozilla Firefox) and navigate to:
```
http://127.0.0.1:5000
```

---

## 4. Key Business Logic & Calculations

### Hourly Tariff System
- **Bike / Motorcycle:** $2.00 / hour
- **Car / Sedan / SUV:** $5.00 / hour
- **Van / Minivan:** $8.00 / hour
- **Truck / Heavy Vehicle:** $12.00 / hour
*(All rates can be edited dynamically in Settings without modifying code).*

### Fee Calculation Engine
- Duration is calculated between `entry_time` and `exit_time`.
- Elapsed minutes are converted into hours.
- Partial hours are **rounded up** to the next full billable hour (e.g., 1 hour 10 minutes is charged as 2 hours).
- Minimum billing period is 1 hour.
- Formula: $\text{Total Fee} = \lceil \frac{\text{Duration in Minutes}}{60} \rceil \times \text{Hourly Rate}$.

### Capacity Auto-Alert Notification (>90% Occupancy)
- Real-time calculation: $\text{Occupancy Rate} = \frac{\text{Occupied Slots}}{\text{Total Slots}} \times 100\%$.
- When occupancy rate $\ge 90\%$, an automatic critical alert banner renders on the Dashboard stating the exact occupancy percentage, occupied bay count, remaining available bays, and guidance to prevent gate congestion or redirect traffic to overflow bays.
- Includes quick-action buttons to directly inspect bay status or dismiss the alert.

---

## 5. College Presentation & Testing Checklist

Use this checklist during project evaluation:
- [x] **Dashboard Metrics:** Real-time counters calculate accurate slots, occupancy rate, today's entry/exit volume, and gross revenue.
- [x] **Vehicle Entry:** Register Bike, Car, Van, Truck with license plate formatting. Auto-assigns slot and updates slot grid.
- [x] **Duplicate Plate Test:** Try entering the same registration twice while still parked; system blocks it.
- [x] **Slot Capacity Handling:** Test lot full notification when all slots in a category are occupied.
- [x] **Vehicle Exit:** Search vehicle plate, observe real-time duration and rounded fee calculation breakdown.
- [x] **Printable Receipt:** View generated receipt and click "Print Receipt" (opens printer dialog with formatted thermal ticket).
- [x] **Visual Slots Page:** Filter by vehicle category, toggle slot maintenance status.
- [x] **History & CSV Export:** Search by owner or plate, filter by date, click "Export CSV" and open in Microsoft Excel.
- [x] **Data Persistence:** Stop the Flask server (`Ctrl+C`), restart it, and confirm all records remain intact in `instance/parking.db`.

---

## 6. Troubleshooting Common Windows Errors

1. **`'python' is not recognized as an internal or external command`**
   - **Fix:** Re-run the Python installer, select "Modify", and ensure "Add Python to environment variables (PATH)" is checked.
2. **`Script execution is disabled on this system` (PowerShell)**
   - **Fix:** In PowerShell run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`, or switch your VS Code terminal to Command Prompt (`cmd.exe`).
3. **`Address already in use: Port 5000`**
   - **Fix:** Another process is using port 5000. Either change the port in `app.py` (`app.run(port=5001)`) or run in cmd:
     `netstat -ano | findstr :5000` then `taskkill /PID <PID> /F`.
4. **Database locked error**
   - **Fix:** Make sure you do not have the SQLite file opened in an external locking GUI tool during write operations.
