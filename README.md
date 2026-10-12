# Vehicle Parking Management System (ParkMatrix)

A high-performance digital parking management application featuring automated Automatic Number Plate Recognition (ANPR), interactive slot allocation, real-time analytics, receipt printing, and revenue reporting.

## 🚀 Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React, Recharts
- **Bundler & Tooling**: Vite 8, `@tailwindcss/vite`
- **Optional Backend / Standalone College Project**: Python 3.x, Flask, SQLite 3

---

## 📁 Project Structure

```text
├── .env.example                     # Sample environment variable template
├── .gitignore                       # Git ignore rules for node, dist, ide, and python
├── index.html                       # HTML5 entry point with responsive meta & fonts
├── metadata.json                    # Project metadata & capabilities
├── package.json                     # NPM packages, dependencies, and build scripts
├── tsconfig.json                    # TypeScript compiler options
├── vite.config.ts                   # Vite bundler & Tailwind CSS plugin configuration
│
├── src/                             # Core React Application
│   ├── main.tsx                     # Application DOM mount entry point
│   ├── App.tsx                      # Main app controller with routing & persistent state
│   ├── index.css                    # Tailwind CSS v4 imports & custom theme tokens
│   ├── types.ts                     # Core domain interfaces (Slot, Record, Rates, Tabs)
│   ├── data/
│   │   ├── initialData.ts           # Demo slots, sample records, and tariff rates
│   │   └── sourceCodeFiles.ts       # Source file bundle for in-app project guide
│   └── components/                  # Core Parking Operation Components
│       ├── DashboardView.tsx        # KPI metrics, occupancy progress, auto-alerts & quick actions
│       ├── Header.tsx               # Top app bar with gate status, live digital clock & responsive toggle
│       ├── Sidebar.tsx              # Terminal navigation drawer (Dashboard, Entry, Exit, Slots, etc.)
│       ├── VehicleEntryView.tsx     # Check-in gateway with manual input and ANPR mode
│       ├── PlateScanner.tsx         # Optical ANPR camera scanner & smart license plate simulator
│       ├── VehicleExitView.tsx      # Checkout calculation, duration round-up & payment settlement
│       ├── ParkingSlotsView.tsx     # 2D parking lot layout grid by floor & vehicle category
│       ├── VehicleHistoryView.tsx   # Searchable and filterable log of all parking transactions
│       ├── ReportsView.tsx          # Recharts monthly revenue trends & category breakdowns
│       ├── SettingsView.tsx         # Hourly tariff adjustment & sample database reset
│       ├── ReceiptModal.tsx         # Printable thermal parking slip / ticket dialog
│       └── ProjectCodeView.tsx      # Standalone Flask + SQLite source code inspector & ZIP export
│
└── vehicle_parking_management/      # Standalone Python Flask backend for offline college submissions
    ├── app.py                       # Flask server with routing & ANPR API endpoints
    ├── database.py                  # SQLite database queries & fee calculator
    ├── schema.sql                   # Database table definitions & initial seeds
    ├── requirements.txt             # Python dependencies
    └── templates/                   # Jinja2 templates (dashboard, entry, exit, receipt, slots)
```

---

## 🛠️ Quick Start (React Web Application)

### 1. Prerequisites
- Node.js (v18.0.0 or higher)
- npm, pnpm, or bun

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/your-username/vehicle-parking-management.git
cd vehicle-parking-management

# Install dependencies
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Production Build
```bash
npm run build
npm run preview
```

---

## 🚗 Key Features

1. **Automatic Number Plate Recognition (ANPR)**: Live camera feed with OCR character segmentation or interactive smart license plate simulation with Indian IND plates.
2. **Dynamic Slot Management**: Real-time slot status (`Available`, `Occupied`, `Maintenance`) grouped across floors and vehicle categories (`Bike`, `Car`, `Van`, `Truck`).
3. **Automated Tariff Calculation**: Transparent hourly billing rounded to the next full hour based on category rates.
4. **Thermal Receipt Printing**: Printable parking ticket format with check-in, duration, payment breakdown, and QR code representation.
5. **Auto-Alert System**: Critical visual banner warning when occupancy exceeds 90% capacity.
6. **Revenue & Occupancy Analytics**: Interactive Recharts bar chart showing monthly earnings and vehicle category distributions.

---

## 🌐 Deploying to GitHub Pages (Fixing Blank Screen)

### Why does a Blank White Page happen on GitHub Pages?
By default, Vite builds applications with root-absolute asset paths (`base: '/'`). When deployed to GitHub Pages under a repository subpath (e.g. `https://your-username.github.io/your-repo-name/`), the browser attempts to fetch JavaScript and CSS from `https://your-username.github.io/assets/` instead of `https://your-username.github.io/your-repo-name/assets/`. This leads to HTTP 404 errors for the bundle scripts, leaving the screen blank white.

### The Fix (Already configured)
1. In `vite.config.ts`, `base: './'` is configured to ensure relative asset referencing across any repository name or custom domain.
2. A build plugin generates `dist/404.html` from `dist/index.html` to handle routing gracefully on GitHub Pages.
3. An automated GitHub Actions workflow is provided in `.github/workflows/deploy.yml`.

### How to Enable GitHub Pages in your Repository:
1. Push your code to your GitHub repository:
   ```bash
   git add .
   git commit -m "Configure GitHub Pages deployment"
   git push origin main
   ```
2. In your GitHub repository, navigate to **Settings** → **Pages**.
3. Under **Build and deployment** → **Source**, select **GitHub Actions**.
4. The workflow will automatically trigger, build the application, and deploy it to `https://<your-username>.github.io/<your-repo-name>/`.

