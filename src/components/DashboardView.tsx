import React, { useState } from 'react';
import { 
  Car, 
  CheckCircle2, 
  AlertCircle, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Layers,
  ChevronRight
} from 'lucide-react';
import { ParkingSlot, ParkingRecord, VehicleType } from '../types';

interface DashboardViewProps {
  slots: ParkingSlot[];
  records: ParkingRecord[];
  onNavigateTab: (tab: any) => void;
  onSelectExit: (regNumber: string) => void;
  onViewReceipt: (record: ParkingRecord) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  slots,
  records,
  onNavigateTab,
  onSelectExit,
  onViewReceipt,
}) => {
  const [dismissedAlert, setDismissedAlert] = useState(false);

  // Real database calculation logic
  const totalSlots = slots.length;
  const availableSlots = slots.filter(s => s.status === 'Available').length;
  const occupiedSlots = slots.filter(s => s.status === 'Occupied').length;
  const maintenanceSlots = slots.filter(s => s.status === 'Maintenance').length;
  const occupancyPercentage = totalSlots > 0 ? (occupiedSlots / totalSlots) * 100 : 0;
  const occupancyRate = Math.round(occupancyPercentage);
  const isHighOccupancy = occupancyPercentage >= 90;

  const activeVehicles = records.filter(r => r.status === 'Active');
  const totalParked = activeVehicles.length;

  // Today calculations
  const todayStr = new Date().toISOString().substring(0, 10);
  const enteredToday = records.filter(r => r.entry_time.startsWith(todayStr)).length;
  const exitedToday = records.filter(r => r.status === 'Completed' && r.exit_time?.startsWith(todayStr)).length;

  const totalRevenue = records
    .filter(r => r.status === 'Completed' && r.fee)
    .reduce((acc, curr) => acc + (curr.fee || 0), 0);

  // Category breakdown
  const categories: VehicleType[] = ['Bike', 'Car', 'Van', 'Truck'];
  const categoryStats = categories.map(cat => {
    const catSlots = slots.filter(s => s.slot_type === cat);
    const catOccupied = catSlots.filter(s => s.status === 'Occupied').length;
    const catTotal = catSlots.length;
    const catPct = catTotal > 0 ? Math.round((catOccupied / catTotal) * 100) : 0;
    return {
      type: cat,
      total: catTotal,
      occupied: catOccupied,
      pct: catPct,
    };
  });

  const recentRecords = [...records]
    .sort((a, b) => new Date(b.entry_time).getTime() - new Date(a.entry_time).getTime())
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Auto-Alert Notification Banner when Occupancy >= 90% */}
      {isHighOccupancy && !dismissedAlert && (
        <div className="border-2 border-red-500 bg-red-950/40 p-4 sm:p-5 text-red-200 transition-all duration-200 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 bg-red-600 text-white flex items-center justify-center shrink-0 font-mono font-bold text-lg">
                !
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-red-600 text-white font-mono text-[10px] uppercase font-bold tracking-widest px-2 py-0.5">
                    CRITICAL AUTO-ALERT
                  </span>
                  <span className="text-xs font-mono font-bold text-red-400">
                    THRESHOLD: &gt;90% CAPACITY
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold font-mono text-red-100 mt-1">
                  High Occupancy Warning: Lot is at {occupancyRate}% Capacity ({occupiedSlots} / {totalSlots} Bays Filled)
                </h3>
                <p className="text-xs text-red-300 mt-0.5 font-mono">
                  Only <strong className="text-white">{availableSlots} parking bay(s)</strong> remain available. 
                  Incoming vehicles should be advised or redirected to overflow parking.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                onClick={() => onNavigateTab('slots')}
                className="bg-red-600 hover:bg-red-700 text-white font-mono text-xs font-bold px-3.5 py-2 transition-colors uppercase tracking-wider"
              >
                Inspect Bays
              </button>
              <button
                onClick={() => setDismissedAlert(true)}
                className="bg-transparent hover:bg-red-900/50 text-red-300 border border-red-500 font-mono text-xs px-3 py-2 transition-colors uppercase tracking-wider"
                title="Dismiss warning"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Variation 2: Metrics Grid with 1px border gap */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-[1px] bg-white/10 border border-white/10">
        <div className="bg-[#0c0c0e] p-5">
          <div className="label-mono">Total Slots</div>
          <div className="font-mono text-2xl font-bold mt-1 text-[#e4e4e7]">{totalSlots}</div>
        </div>

        <div className="bg-[#0c0c0e] p-5">
          <div className="label-mono">Available</div>
          <div className="font-mono text-2xl font-bold mt-1 text-[#10b981]">{availableSlots}</div>
        </div>

        <div className="bg-[#0c0c0e] p-5">
          <div className="label-mono">Occupied</div>
          <div className="font-mono text-2xl font-bold mt-1 text-zinc-100">
            {occupiedSlots.toString().padStart(2, '0')}
          </div>
        </div>

        <div className="bg-[#0c0c0e] p-5">
          <div className="label-mono">Today In</div>
          <div className="font-mono text-2xl font-bold mt-1 text-zinc-100">
            {enteredToday.toString().padStart(2, '0')}
          </div>
        </div>

        <div className="bg-[#0c0c0e] p-5">
          <div className="label-mono">Today Out</div>
          <div className="font-mono text-2xl font-bold mt-1 text-zinc-100">
            {exitedToday.toString().padStart(2, '0')}
          </div>
        </div>

        <div className="bg-[#0c0c0e] p-5">
          <div className="label-mono">Revenue</div>
          <div className="font-mono text-2xl font-bold mt-1 text-[#10b981]">
            ${totalRevenue.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Variation 2: Content Shell (Table + Control Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Terminal Data Table (2 cols) */}
        <div className="lg:col-span-2 border border-white/10 bg-[#0c0c0e] flex flex-col justify-between">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div>
              <div className="label-mono">Recent Stream</div>
              <h2 className="text-sm font-bold font-mono text-zinc-100 uppercase tracking-wider mt-0.5">
                Active Parking Records
              </h2>
            </div>
            <button
              onClick={() => onNavigateTab('history')}
              className="text-xs font-mono text-[#10b981] hover:underline"
            >
              ALL RECORDS ({records.length}) →
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-white/5 text-zinc-400 font-semibold border-b border-white/10 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">PLATE NO.</th>
                  <th className="px-4 py-3">TYPE</th>
                  <th className="px-4 py-3">OWNER</th>
                  <th className="px-4 py-3">SLOT</th>
                  <th className="px-4 py-3">ENTRY</th>
                  <th className="px-4 py-3">STATUS</th>
                  <th className="px-4 py-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-bold text-white tracking-wide">
                      {r.reg_number}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 uppercase text-[11px]">
                      {r.vehicle_type}
                    </td>
                    <td className="px-4 py-3 text-zinc-300 truncate max-w-[120px]">
                      {r.owner_name}
                    </td>
                    <td className="px-4 py-3 font-bold text-[#10b981]">
                      {r.slot_number}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-[11px]">
                      {r.entry_time.substring(11, 16)}
                    </td>
                    <td className="px-4 py-3">
                      {r.status === 'Active' ? (
                        <span className="font-mono text-[10px] px-2 py-0.5 border border-[#10b981] text-[#10b981] font-bold tracking-widest inline-block">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] px-2 py-0.5 border border-white/20 text-zinc-400 font-medium tracking-widest inline-block">
                          EXITED
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.status === 'Active' ? (
                        <button
                          onClick={() => onSelectExit(r.reg_number)}
                          className="text-[11px] font-mono bg-white text-[#0c0c0e] font-bold px-2 py-1 hover:bg-[#10b981] transition-colors"
                        >
                          EXIT
                        </button>
                      ) : (
                        <button
                          onClick={() => onViewReceipt(r)}
                          className="text-[11px] font-mono border border-white/20 text-zinc-300 px-2 py-1 hover:bg-white/10 transition-colors"
                        >
                          TICKET
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-zinc-500">
            <span>TERMINAL QUERY: OK</span>
            <span>TOTAL SESSIONS LOGGED: {records.length}</span>
          </div>
        </div>

        {/* Right: Variation 2 Control Panel */}
        <div className="flex flex-col gap-5">
          {/* Box 1: Live Occupancy Metric */}
          <div className="panel-brutalist p-5">
            <div className="label-mono">Live Occupancy</div>
            <div className="text-4xl font-extrabold font-mono text-white my-2 tracking-tight">
              {occupancyRate}%
            </div>
            
            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-white/10 my-3 overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  occupancyRate >= 90 ? 'bg-red-500' : 'bg-[#10b981]'
                }`}
                style={{ width: `${occupancyRate}%` }}
              />
            </div>

            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-zinc-400">
              <span>{occupiedSlots} / {totalSlots} Bays Filled</span>
              <span className={occupancyRate >= 90 ? 'text-red-400 font-bold' : 'text-[#10b981]'}>
                {occupancyRate >= 90 ? 'CAPACITY CRITICAL' : 'UTILIZATION OPTIMAL'}
              </span>
            </div>
          </div>

          {/* Box 2: Brutalist Gate Action Panel */}
          <div className="panel-brutalist p-5 bg-[#10b981] text-[#0c0c0e] border-none shadow-md">
            <div className="flex items-center justify-between">
              <div className="label-mono text-[#0c0c0e] opacity-80 font-bold">Gate Action</div>
              <span className="text-[9px] font-mono font-extrabold bg-[#0c0c0e] text-[#10b981] px-1.5 py-0.5">
                ANPR ACTIVE
              </span>
            </div>
            
            <button
              onClick={() => onNavigateTab('entry')}
              className="w-full bg-[#0c0c0e] hover:bg-black text-[#10b981] font-mono text-xs font-bold py-3 mt-3 transition-colors tracking-wider uppercase flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>⚡ AUTO SCAN & ENTRY</span>
            </button>

            <button
              onClick={() => onNavigateTab('exit')}
              className="w-full bg-transparent hover:bg-[#0c0c0e] text-[#0c0c0e] hover:text-[#10b981] border-2 border-[#0c0c0e] font-mono text-xs font-bold py-2 mt-2 transition-colors tracking-wider uppercase block text-center"
            >
              SETTLE BILL (EXIT)
            </button>
          </div>

          {/* Box 3: Category Distribution Bars */}
          <div className="panel-brutalist p-5">
            <div className="label-mono mb-3">Category Distribution</div>
            <div className="space-y-3">
              {categoryStats.map(item => (
                <div key={item.type} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-300 font-semibold">{item.type}</span>
                    <span className="text-zinc-400 text-[11px]">{item.occupied}/{item.total}</span>
                  </div>
                  <div className="h-1 bg-white/10 overflow-hidden">
                    <div 
                      className="h-full bg-[#10b981]" 
                      style={{ width: `${item.pct}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
