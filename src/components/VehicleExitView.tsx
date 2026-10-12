import React, { useState } from 'react';
import { Search, CheckCircle2, AlertCircle } from 'lucide-react';
import { ParkingRecord, TariffRate } from '../types';

interface VehicleExitViewProps {
  records: ParkingRecord[];
  rates: TariffRate[];
  selectedRegQuery?: string;
  onProcessExit: (recordId: number, fee: number, durationHours: number, paymentStatus: 'Paid' | 'Pending') => void;
  onViewReceipt: (record: ParkingRecord) => void;
  onNavigateTab: (tab: any) => void;
}

export const VehicleExitView: React.FC<VehicleExitViewProps> = ({
  records,
  rates,
  selectedRegQuery = '',
  onProcessExit,
  onViewReceipt,
  onNavigateTab,
}) => {
  const [searchQuery, setSearchQuery] = useState(selectedRegQuery);
  const [selectedRecord, setSelectedRecord] = useState<ParkingRecord | null>(() => {
    if (selectedRegQuery) {
      return records.find(r => r.reg_number.toUpperCase() === selectedRegQuery.toUpperCase() && r.status === 'Active') || null;
    }
    return null;
  });
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Pending'>('Paid');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeVehicles = records.filter(r => r.status === 'Active');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const clean = searchQuery.trim().toUpperCase();
    if (!clean) return;

    const found = activeVehicles.find(r => r.reg_number.toUpperCase() === clean);
    if (found) {
      setSelectedRecord(found);
    } else {
      setSelectedRecord(null);
      setErrorMsg(`No active parked vehicle found with plate "${clean}".`);
    }
  };

  const calculateFeeBreakdown = (record: ParkingRecord) => {
    const entryDate = new Date(record.entry_time);
    const exitDate = new Date();

    const diffMs = Math.max(0, exitDate.getTime() - entryDate.getTime());
    const totalMinutes = Math.ceil(diffMs / (1000 * 60));
    const billableHours = Math.max(1, Math.ceil(totalMinutes / 60));
    const rate = rates.find(r => r.vehicle_type === record.vehicle_type)?.hourly_rate || 5.0;
    const totalFee = billableHours * rate;

    const hoursDisp = Math.floor(totalMinutes / 60);
    const minsDisp = totalMinutes % 60;
    const durationText = hoursDisp > 0 ? `${hoursDisp} hr ${minsDisp} min` : `${minsDisp} min`;

    return {
      entryFormatted: record.entry_time,
      exitFormatted: exitDate.toISOString().replace('T', ' ').substring(0, 19),
      totalMinutes,
      billableHours,
      rate,
      totalFee,
      durationText,
    };
  };

  const calculation = selectedRecord ? calculateFeeBreakdown(selectedRecord) : null;

  const handleConfirmExit = () => {
    if (!selectedRecord || !calculation) return;

    onProcessExit(
      selectedRecord.id,
      calculation.totalFee,
      calculation.billableHours,
      paymentStatus
    );

    const completedRecord: ParkingRecord = {
      ...selectedRecord,
      exit_time: calculation.exitFormatted,
      duration_hours: calculation.billableHours,
      fee: calculation.totalFee,
      payment_status: paymentStatus,
      status: 'Completed',
    };

    onViewReceipt(completedRecord);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <div className="label-mono">Billing & Release Terminal</div>
          <h2 className="text-xl font-bold font-mono tracking-tight text-white mt-0.5">
            Vehicle Checkout & Fee Settlement
          </h2>
        </div>
        <button
          onClick={() => onNavigateTab('dashboard')}
          className="text-xs font-mono text-zinc-400 hover:text-white border border-white/10 px-3 py-1.5 hover:bg-white/5"
        >
          ← DASHBOARD
        </button>
      </div>

      {/* Plate Search Box */}
      <div className="border border-white/10 bg-[#0c0c0e] p-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-zinc-500" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
              placeholder="SEARCH PLATE NUMBER (e.g. KA-01-AB-1234)..."
              className="w-full pl-9 pr-3 py-2 text-xs font-mono uppercase bg-white/5 border border-white/20 text-white focus:outline-none focus:border-[#10b981]"
            />
          </div>
          <button
            type="submit"
            className="flex items-center justify-center gap-2 bg-[#10b981] hover:bg-[#059669] text-[#0c0c0e] font-mono text-xs font-bold px-4 py-2 uppercase tracking-wider transition-colors shadow-xs"
          >
            <span>SEARCH TICKET</span>
          </button>
        </form>
      </div>

      {errorMsg && (
        <div className="bg-red-950/40 border border-red-500 text-red-200 text-xs p-3.5 flex items-center justify-between font-mono">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-red-400" />
            <span className="font-bold">{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-white">×</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Billing Breakdown or Awaiting Selection */}
        <div className="lg:col-span-2 space-y-4">
          {selectedRecord && calculation ? (
            <div className="border border-white/10 bg-[#0c0c0e] p-6 space-y-5 font-mono text-xs">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div>
                  <div className="label-mono">Active Ticket</div>
                  <h2 className="text-2xl font-extrabold text-white tracking-wide mt-0.5">{selectedRecord.reg_number}</h2>
                </div>
                <div className="text-right">
                  <span className="border border-[#10b981] text-[#10b981] text-[10px] font-bold px-2 py-0.5 tracking-wider">
                    SESSION #{selectedRecord.id}
                  </span>
                </div>
              </div>

              {/* Vehicle & Slot Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/5 p-3.5 border border-white/10">
                <div>
                  <span className="label-mono block">CATEGORY</span>
                  <span className="font-bold text-white text-xs">{selectedRecord.vehicle_type}</span>
                </div>
                <div>
                  <span className="label-mono block">PARKING BAY</span>
                  <span className="font-bold text-[#10b981] text-xs">{selectedRecord.slot_number}</span>
                </div>
                <div>
                  <span className="label-mono block">DRIVER</span>
                  <span className="font-bold text-zinc-300 truncate block text-xs">{selectedRecord.owner_name}</span>
                </div>
                <div>
                  <span className="label-mono block">CONTACT</span>
                  <span className="text-zinc-400 text-xs">{selectedRecord.contact_number}</span>
                </div>
              </div>

              {/* Timestamp and Calculation Breakdown */}
              <div className="border border-white/10 p-4 space-y-2.5 bg-white/5">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Gate Entry Timestamp:</span>
                  <span className="text-white font-medium">{calculation.entryFormatted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Checkout Timestamp:</span>
                  <span className="text-white font-medium">{calculation.exitFormatted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Elapsed Parking Time:</span>
                  <span className="text-white font-bold">
                    {calculation.durationText} ({calculation.totalMinutes} mins)
                  </span>
                </div>
                <div className="flex justify-between bg-[#10b981]/15 -mx-4 px-4 py-2 border-y border-[#10b981]/30 text-[#10b981]">
                  <span className="font-bold uppercase tracking-wider">Billable Duration (Rounded Up):</span>
                  <span className="font-extrabold text-white">{calculation.billableHours} Hour(s)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Tariff Rate:</span>
                  <span className="text-white">${calculation.rate.toFixed(2)} / hr</span>
                </div>
              </div>

              {/* Fee Banner */}
              <div className="panel-brutalist p-5 flex items-center justify-between">
                <div>
                  <div className="label-mono">Total Charge</div>
                  <span className="text-xs font-mono text-zinc-400 mt-1 block">
                    {calculation.billableHours} hr × ${calculation.rate.toFixed(2)}/hr
                  </span>
                </div>
                <div className="text-3xl font-extrabold font-mono text-[#10b981]">
                  ${calculation.totalFee.toFixed(2)}
                </div>
              </div>

              {/* Payment selector */}
              <div className="space-y-2 pt-1">
                <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                  Payment Status
                </label>
                <div className="flex gap-4 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                    <input
                      type="radio"
                      name="payment_status"
                      checked={paymentStatus === 'Paid'}
                      onChange={() => setPaymentStatus('Paid')}
                      className="accent-[#10b981]"
                    />
                    <span>Paid in Full (Cash / Card / Digital)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                    <input
                      type="radio"
                      name="payment_status"
                      checked={paymentStatus === 'Pending'}
                      onChange={() => setPaymentStatus('Pending')}
                      className="accent-[#10b981]"
                    />
                    <span>Pending / Campus Pass</span>
                  </label>
                </div>
              </div>

              {/* Checkout actions */}
              <div className="pt-3 border-t border-white/10 flex items-center gap-3">
                <button
                  onClick={handleConfirmExit}
                  className="flex items-center gap-2 bg-[#10b981] hover:bg-[#059669] text-[#0c0c0e] font-mono text-xs font-bold px-4 py-2.5 uppercase tracking-wider transition-colors shadow-xs"
                >
                  <CheckCircle2 size={16} />
                  <span>SETTLE & PRINT RECEIPT</span>
                </button>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="text-xs text-zinc-400 hover:text-white font-medium px-3 py-2 uppercase tracking-wider"
                >
                  CANCEL
                </button>
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-white/20 p-12 text-center font-mono">
              <div className="w-12 h-12 bg-white/5 border border-white/10 text-zinc-400 flex items-center justify-center mx-auto mb-3">
                <Search size={20} />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Awaiting Ticket Selection</h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
                Search a license plate number above, or click on any vehicle from the active terminal list on the right.
              </p>
            </div>
          )}
        </div>

        {/* Right: Parked Vehicles List */}
        <div className="border border-white/10 bg-[#0c0c0e] p-5 flex flex-col h-[520px]">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
            <div>
              <div className="label-mono">Live Stream</div>
              <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-white mt-0.5">
                Active In Lot ({activeVehicles.length})
              </h2>
            </div>
            <span className="text-[10px] text-[#10b981] font-mono">1-CLICK PICK</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono">
            {activeVehicles.length > 0 ? (
              activeVehicles.map((v) => {
                const isSelected = selectedRecord?.id === v.id;
                return (
                  <div
                    key={v.id}
                    onClick={() => {
                      setSelectedRecord(v);
                      setSearchQuery(v.reg_number);
                      setErrorMsg(null);
                    }}
                    className={`p-3 border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#10b981] bg-[#10b981]/15 text-white shadow-xs'
                        : 'border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>{v.reg_number}</span>
                      <span className={`text-[11px] px-1.5 py-0.2 border ${
                        isSelected ? 'border-[#10b981] text-[#10b981]' : 'border-zinc-500 text-zinc-400'
                      }`}>
                        {v.slot_number}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[11px] text-zinc-400">
                      <span>{v.owner_name} · {v.vehicle_type}</span>
                      <span>{v.entry_time.substring(11, 16)}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-zinc-500 text-xs">
                No vehicles currently parked.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
