import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { ParkingSlot, VehicleType, SlotStatus } from '../types';

interface ParkingSlotsViewProps {
  slots: ParkingSlot[];
  onAddSlot: (slotNumber: string, slotType: VehicleType, floor: string) => void;
  onUpdateSlotStatus: (slotNumber: string, status: SlotStatus) => void;
  onNavigateTab: (tab: any) => void;
}

export const ParkingSlotsView: React.FC<ParkingSlotsViewProps> = ({
  slots,
  onAddSlot,
  onUpdateSlotStatus,
  onNavigateTab,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSlotNumber, setNewSlotNumber] = useState('');
  const [newSlotType, setNewSlotType] = useState<VehicleType>('Car');
  const [newSlotFloor, setNewSlotFloor] = useState('Ground Floor');
  const [modalError, setModalError] = useState<string | null>(null);

  const filteredSlots = slots.filter(s => {
    if (filterCategory === 'all') return true;
    return s.slot_type === filterCategory;
  });

  const availableCount = slots.filter(s => s.status === 'Available').length;
  const occupiedCount = slots.filter(s => s.status === 'Occupied').length;
  const maintenanceCount = slots.filter(s => s.status === 'Maintenance').length;

  const handleCreateSlot = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    const clean = newSlotNumber.trim().toUpperCase();
    if (!clean) {
      setModalError('Slot number is required.');
      return;
    }
    if (slots.some(s => s.slot_number === clean)) {
      setModalError(`Slot code ${clean} already exists.`);
      return;
    }

    onAddSlot(clean, newSlotType, newSlotFloor);
    setNewSlotNumber('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="label-mono">Bay Layout Matrix</div>
          <h2 className="text-xl font-bold font-mono tracking-tight text-white mt-0.5">
            Real-Time Slot Grid ({slots.length} Bays)
          </h2>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 bg-[#10b981] hover:bg-[#059669] text-[#0c0c0e] font-mono text-xs font-bold px-3.5 py-2 rounded-sm transition-colors shadow-xs"
        >
          <Plus size={15} className="stroke-[3]" />
          <span>ADD NEW BAY</span>
        </button>
      </div>

      {/* Filter Tabs & Status Legend */}
      <div className="bg-[#0c0c0e] border border-white/10 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto font-mono text-xs">
          {[
            { id: 'all', label: 'ALL BAYS' },
            { id: 'Bike', label: 'BIKES' },
            { id: 'Car', label: 'CARS' },
            { id: 'Van', label: 'VANS' },
            { id: 'Truck', label: 'TRUCKS' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterCategory(tab.id)}
              className={`px-3 py-1.5 transition-colors ${
                filterCategory === tab.id
                  ? 'bg-white text-[#0c0c0e] font-bold'
                  : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-[#10b981]"></span>
            <span>AVAILABLE ({availableCount})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-zinc-500"></span>
            <span>OCCUPIED ({occupiedCount})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-amber-500"></span>
            <span>MAINTENANCE ({maintenanceCount})</span>
          </div>
        </div>
      </div>

      {/* Visual Interactive Terminal Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
        {filteredSlots.map(slot => {
          const isAvail = slot.status === 'Available';
          const isOcc = slot.status === 'Occupied';
          const isMaint = slot.status === 'Maintenance';

          return (
            <div
              key={slot.id}
              className={`p-3.5 border transition-all duration-150 flex flex-col justify-between font-mono ${
                isAvail
                  ? 'border-[#10b981]/50 bg-[#10b981]/5 text-emerald-400 hover:border-[#10b981]'
                  : isOcc
                  ? 'border-white/10 bg-white/5 text-zinc-400'
                  : 'border-amber-500/50 bg-amber-500/5 text-amber-400'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] mb-2 font-bold tracking-widest uppercase">
                <span>{slot.slot_type}</span>
                <span className={`px-1 py-0.2 border ${
                  isAvail ? 'border-[#10b981] text-[#10b981]' : isOcc ? 'border-zinc-500 text-zinc-400' : 'border-amber-500 text-amber-400'
                }`}>
                  {slot.status}
                </span>
              </div>

              <div className="my-2 text-center">
                <div className="text-xl font-extrabold tracking-tight text-white">{slot.slot_number}</div>
                <div className="text-[10px] text-zinc-500 truncate mt-0.5">{slot.floor}</div>
              </div>

              {/* Action Buttons */}
              <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between gap-1 text-[11px]">
                {isAvail && (
                  <>
                    <button
                      onClick={() => onUpdateSlotStatus(slot.slot_number, 'Maintenance')}
                      className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-zinc-300 font-medium text-[10px]"
                      title="Mark as Maintenance"
                    >
                      HOLD
                    </button>
                    <button
                      onClick={() => onNavigateTab('entry')}
                      className="px-2 py-0.5 bg-[#10b981] hover:bg-[#059669] text-[#0c0c0e] font-bold text-[10px]"
                    >
                      PARK
                    </button>
                  </>
                )}
                {isMaint && (
                  <button
                    onClick={() => onUpdateSlotStatus(slot.slot_number, 'Available')}
                    className="w-full py-0.5 bg-amber-500 hover:bg-amber-600 text-[#0c0c0e] font-bold text-center text-[10px]"
                  >
                    RELEASE
                  </button>
                )}
                {isOcc && (
                  <span className="w-full text-center text-[10px] text-zinc-500 font-bold py-0.5">
                    IN USE
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Slot Modal Dialog */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0c0c0e] border border-white/20 max-w-sm w-full p-5 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">ADD PARKING BAY</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div className="mt-3 p-2.5 bg-red-950/60 border border-red-500 text-red-300 font-mono text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateSlot} className="space-y-3.5 mt-3 font-mono text-xs">
              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                  SLOT CODE *
                </label>
                <input
                  type="text"
                  required
                  value={newSlotNumber}
                  onChange={(e) => setNewSlotNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. C-21 or B-11"
                  className="w-full px-3 py-2 uppercase bg-white/5 border border-white/20 text-white focus:outline-none focus:border-[#10b981]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                  CATEGORY
                </label>
                <select
                  value={newSlotType}
                  onChange={(e) => setNewSlotType(e.target.value as VehicleType)}
                  className="w-full px-3 py-2 bg-[#0c0c0e] border border-white/20 text-white focus:outline-none focus:border-[#10b981]"
                >
                  <option value="Bike">Bike / Two-Wheeler</option>
                  <option value="Car">Car / Sedan / SUV</option>
                  <option value="Van">Van / Commercial</option>
                  <option value="Truck">Truck / Heavy Bay</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                  ZONE / FLOOR
                </label>
                <input
                  type="text"
                  value={newSlotFloor}
                  onChange={(e) => setNewSlotFloor(e.target.value)}
                  placeholder="e.g. Zone B - Ground Floor"
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 text-white focus:outline-none focus:border-[#10b981]"
                />
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-2 text-zinc-400 hover:text-white font-medium"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold bg-[#10b981] hover:bg-[#059669] text-[#0c0c0e]"
                >
                  CREATE BAY
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
