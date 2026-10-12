import React, { useState, useEffect } from 'react';
import { LogIn, AlertCircle, CheckCircle2, Car, Scan, Zap, SlidersHorizontal } from 'lucide-react';
import { ParkingSlot, ParkingRecord, TariffRate, VehicleType } from '../types';
import { PlateScanner } from './PlateScanner';

interface VehicleEntryViewProps {
  slots: ParkingSlot[];
  records: ParkingRecord[];
  rates: TariffRate[];
  onRegisterEntry: (newRecord: Omit<ParkingRecord, 'id'>) => void;
  onNavigateTab: (tab: any) => void;
  initialScanMode?: boolean;
}

export const VehicleEntryView: React.FC<VehicleEntryViewProps> = ({
  slots,
  records,
  rates,
  onRegisterEntry,
  onNavigateTab,
  initialScanMode = true,
}) => {
  const [entryMode, setEntryMode] = useState<'scanner' | 'manual'>(
    initialScanMode ? 'scanner' : 'manual'
  );
  const [regNumber, setRegNumber] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('Car');
  const [ownerName, setOwnerName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [entryTime, setEntryTime] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setEntryTime(now.toISOString().replace('T', ' ').substring(0, 19));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const availableSlotsForType = slots.filter(
    s => s.slot_type === vehicleType && s.status === 'Available'
  );

  useEffect(() => {
    if (availableSlotsForType.length > 0) {
      setSelectedSlot(availableSlotsForType[0].slot_number);
    } else {
      setSelectedSlot('');
    }
  }, [vehicleType, slots]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanReg = regNumber.trim().toUpperCase();
    const cleanOwner = ownerName.trim();
    const cleanContact = contactNumber.trim();

    if (!cleanReg || !cleanOwner || !cleanContact || !selectedSlot) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    const activeDuplicate = records.find(
      r => r.reg_number.toUpperCase() === cleanReg && r.status === 'Active'
    );
    if (activeDuplicate) {
      setErrorMsg(
        `Validation Error: Vehicle ${cleanReg} is already parked inside in slot ${activeDuplicate.slot_number}. Duplicate entry is blocked.`
      );
      return;
    }

    const slotObj = slots.find(s => s.slot_number === selectedSlot);
    if (!slotObj) {
      setErrorMsg(`Slot ${selectedSlot} does not exist.`);
      return;
    }
    if (slotObj.status !== 'Available') {
      setErrorMsg(`Slot ${selectedSlot} is ${slotObj.status}. Please choose an available slot.`);
      return;
    }

    onRegisterEntry({
      reg_number: cleanReg,
      vehicle_type: vehicleType,
      owner_name: cleanOwner,
      contact_number: cleanContact,
      slot_number: selectedSlot,
      entry_time: entryTime,
      payment_status: 'Pending',
      status: 'Active',
    });

    setSuccessMsg(
      `Vehicle ${cleanReg} successfully parked in Slot ${selectedSlot}!`
    );

    setRegNumber('');
    setOwnerName('');
    setContactNumber('');
  };

  const currentRate = rates.find(r => r.vehicle_type === vehicleType)?.hourly_rate || 5.0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header with Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="label-mono">Check-In Gateway</div>
          <h2 className="text-xl font-bold font-mono tracking-tight text-white mt-0.5 flex items-center gap-2">
            Register Vehicle Entry
            {entryMode === 'scanner' && (
              <span className="text-[10px] bg-[#10b981] text-[#0c0c0e] px-2 py-0.5 font-bold uppercase tracking-wider">
                AUTO ANPR
              </span>
            )}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Mode Switcher */}
          <div className="flex items-center bg-white/5 border border-white/10 p-1 font-mono text-xs">
            <button
              type="button"
              onClick={() => setEntryMode('scanner')}
              className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors uppercase font-bold tracking-wider ${
                entryMode === 'scanner'
                  ? 'bg-[#10b981] text-[#0c0c0e]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Zap size={13} className={entryMode === 'scanner' ? 'fill-[#0c0c0e]' : ''} />
              <span>Auto Plate Scan</span>
            </button>
            <button
              type="button"
              onClick={() => setEntryMode('manual')}
              className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors uppercase font-bold tracking-wider ${
                entryMode === 'manual'
                  ? 'bg-[#10b981] text-[#0c0c0e]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <SlidersHorizontal size={13} />
              <span>Manual Form</span>
            </button>
          </div>

          <button
            onClick={() => onNavigateTab('dashboard')}
            className="text-xs font-mono text-zinc-400 hover:text-white border border-white/10 px-3 py-1.5 hover:bg-white/5"
          >
            ← DASHBOARD
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="bg-red-950/40 border border-red-500 text-red-200 text-xs p-3.5 flex items-start gap-2.5 font-mono">
          <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1 font-bold">{errorMsg}</div>
          <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-white">×</button>
        </div>
      )}

      {successMsg && (
        <div className="bg-[#10b981]/10 border border-[#10b981] text-[#10b981] text-xs p-3.5 flex items-start gap-2.5 font-mono">
          <CheckCircle2 size={16} className="text-[#10b981] shrink-0 mt-0.5" />
          <div className="flex-1 font-bold">{successMsg}</div>
          <button 
            onClick={() => onNavigateTab('dashboard')} 
            className="text-xs font-bold underline text-white"
          >
            VIEW DASHBOARD
          </button>
        </div>
      )}

      {/* Mode 1: Automatic Number Plate Scanner */}
      {entryMode === 'scanner' && (
        <PlateScanner
          slots={slots}
          records={records}
          rates={rates}
          onAutoPark={(newEntry) => {
            onRegisterEntry(newEntry);
            setSuccessMsg(
              `AUTOMATIC ENTRY SUCCESS: Vehicle ${newEntry.reg_number} (${newEntry.vehicle_type}) assigned to Slot ${newEntry.slot_number}!`
            );
          }}
          onNavigateTab={onNavigateTab}
        />
      )}

      {/* Mode 2: Manual Form Entry */}
      {entryMode === 'manual' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Entry Form Card */}
          <div className="lg:col-span-2 border border-white/10 bg-[#0c0c0e] p-6">
            <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1.5 uppercase tracking-wider">
                    REGISTRATION NO. *
                  </label>
                <input
                  type="text"
                  required
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. KA-01-AB-1234"
                  className="w-full px-3 py-2 text-xs font-mono uppercase bg-white/5 border border-white/20 text-white focus:outline-none focus:border-[#10b981]"
                />
                <p className="text-[10px] text-zinc-500 mt-1">Automatic uppercase license format</p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1.5 uppercase tracking-wider">
                  VEHICLE CATEGORY *
                </label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                  className="w-full px-3 py-2 text-xs bg-[#0c0c0e] border border-white/20 text-white focus:outline-none focus:border-[#10b981]"
                >
                  <option value="Bike">Bike / Two-Wheeler (${rates.find(r => r.vehicle_type === 'Bike')?.hourly_rate}/hr)</option>
                  <option value="Car">Car / Sedan / SUV (${rates.find(r => r.vehicle_type === 'Car')?.hourly_rate}/hr)</option>
                  <option value="Van">Van / Minivan (${rates.find(r => r.vehicle_type === 'Van')?.hourly_rate}/hr)</option>
                  <option value="Truck">Truck / Heavy (${rates.find(r => r.vehicle_type === 'Truck')?.hourly_rate}/hr)</option>
                </select>
                <p className="text-[10px] text-zinc-500 mt-1">Tariff & bay assignment depends on category</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1.5 uppercase tracking-wider">
                  OWNER / DRIVER NAME *
                </label>
                <input
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 text-xs bg-white/5 border border-white/20 text-white focus:outline-none focus:border-[#10b981]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1.5 uppercase tracking-wider">
                  CONTACT NUMBER *
                </label>
                <input
                  type="tel"
                  required
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3 py-2 text-xs font-mono bg-white/5 border border-white/20 text-white focus:outline-none focus:border-[#10b981]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1.5 uppercase tracking-wider">
                  TIMESTAMP (SERVER AUTO)
                </label>
                <input
                  type="text"
                  readOnly
                  value={entryTime}
                  className="w-full px-3 py-2 text-xs font-mono bg-white/5 text-zinc-400 border border-white/10 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1.5 uppercase tracking-wider">
                  ASSIGNED PARKING BAY *
                </label>
                {availableSlotsForType.length > 0 ? (
                  <select
                    value={selectedSlot}
                    onChange={(e) => setSelectedSlot(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-[#0c0c0e] border border-white/20 text-[#10b981] focus:outline-none focus:border-[#10b981]"
                  >
                    {availableSlotsForType.map((s, idx) => (
                      <option key={s.id} value={s.slot_number}>
                        {s.slot_number} ({s.floor}) {idx === 0 ? '— [RECOMMENDED]' : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="px-3 py-2 text-xs text-red-400 bg-red-950/40 border border-red-500 font-bold">
                    LOT FULL FOR {vehicleType.toUpperCase()}!
                  </div>
                )}
                <p className="text-[10px] text-zinc-500 mt-1">
                  {availableSlotsForType.length} bay(s) available in this category
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center gap-3">
              <button
                type="submit"
                disabled={availableSlotsForType.length === 0}
                className="flex items-center gap-2 bg-[#10b981] hover:bg-[#059669] disabled:opacity-40 text-[#0c0c0e] text-xs font-bold px-4 py-2.5 uppercase tracking-wider transition-colors shadow-xs"
              >
                <LogIn size={15} />
                <span>CONFIRM & PARK VEHICLE</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setRegNumber('');
                  setOwnerName('');
                  setContactNumber('');
                }}
                className="text-xs text-zinc-400 hover:text-white font-medium px-3 py-2 uppercase tracking-wider"
              >
                CLEAR
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar Guidance & Tariff Breakdown */}
        <div className="space-y-4">
          <div className="panel-brutalist p-5">
            <div className="label-mono mb-3">Tariff Schedule</div>
            <div className="space-y-2">
              {rates.map(r => (
                <div 
                  key={r.vehicle_type} 
                  className={`flex items-center justify-between p-2.5 border text-xs font-mono transition-colors ${
                    vehicleType === r.vehicle_type 
                      ? 'border-[#10b981] bg-[#10b981]/10 text-white font-bold' 
                      : 'border-white/10 bg-white/5 text-zinc-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Car size={13} className={vehicleType === r.vehicle_type ? 'text-[#10b981]' : 'text-zinc-500'} />
                    <span>{r.vehicle_type}</span>
                  </div>
                  <span className="font-bold text-[#10b981]">${r.hourly_rate.toFixed(2)}/hr</span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 text-[11px] font-mono text-zinc-400 space-y-1">
              <p>• Billing begins on check-in timestamp.</p>
              <p>• Fractional hours round up to next full hour.</p>
              <p>• Current tariff: <strong className="text-white">${currentRate.toFixed(2)} / hour</strong>.</p>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
