import React, { useState } from 'react';
import { Download, Search, RotateCcw } from 'lucide-react';
import { ParkingRecord } from '../types';

interface VehicleHistoryViewProps {
  records: ParkingRecord[];
  onViewReceipt: (record: ParkingRecord) => void;
  onSelectExit: (regNumber: string) => void;
}

export const VehicleHistoryView: React.FC<VehicleHistoryViewProps> = ({
  records,
  onViewReceipt,
  onSelectExit,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Completed'>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filteredRecords = records.filter(r => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchPlate = r.reg_number.toLowerCase().includes(q);
      const matchOwner = r.owner_name.toLowerCase().includes(q);
      const matchSlot = r.slot_number.toLowerCase().includes(q);
      if (!matchPlate && !matchOwner && !matchSlot) return false;
    }

    if (statusFilter !== 'All' && r.status !== statusFilter) {
      return false;
    }

    if (categoryFilter !== 'All' && r.vehicle_type !== categoryFilter) {
      return false;
    }

    if (dateFrom) {
      const entryDate = r.entry_time.substring(0, 10);
      if (entryDate < dateFrom) return false;
    }

    if (dateTo) {
      const entryDate = r.entry_time.substring(0, 10);
      if (entryDate > dateTo) return false;
    }

    return true;
  });

  const exportToCSV = () => {
    const headers = [
      'Record ID',
      'Registration No',
      'Vehicle Type',
      'Owner Name',
      'Contact Number',
      'Slot Number',
      'Entry Time',
      'Exit Time',
      'Duration (Hours)',
      'Fee ($)',
      'Payment Status',
      'Status',
    ];

    const rows = filteredRecords.map(r => [
      r.id,
      r.reg_number,
      r.vehicle_type,
      `"${r.owner_name.replace(/"/g, '""')}"`,
      r.contact_number,
      r.slot_number,
      r.entry_time,
      r.exit_time || 'In Parking',
      r.duration_hours || 0,
      r.fee !== undefined ? r.fee.toFixed(2) : '0.00',
      r.payment_status,
      r.status,
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `parking_records_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setCategoryFilter('All');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="label-mono">Database Audit Logs</div>
          <h2 className="text-xl font-bold font-mono tracking-tight text-white mt-0.5">
            Vehicle Parking History & Ledger
          </h2>
        </div>
        <div>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 bg-[#10b981] hover:bg-[#059669] text-[#0c0c0e] font-mono text-xs font-bold px-3.5 py-2 uppercase tracking-wider transition-colors shadow-xs"
          >
            <Download size={14} className="stroke-[3]" />
            <span>EXPORT CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="border border-white/10 bg-[#0c0c0e] p-4 font-mono text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
          {/* Keyword Search */}
          <div className="sm:col-span-2 md:col-span-1">
            <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">SEARCH KEYWORD</label>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-2.5 text-zinc-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Plate / Driver..."
                className="w-full pl-8 pr-3 py-1.5 uppercase bg-white/5 border border-white/20 text-white focus:outline-none focus:border-[#10b981]"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">SESSION STATUS</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-[#0c0c0e] border border-white/20 text-white focus:outline-none focus:border-[#10b981]"
            >
              <option value="All">ALL STATUSES</option>
              <option value="Active">ACTIVE (IN LOT)</option>
              <option value="Completed">COMPLETED (EXITED)</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">CATEGORY</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#0c0c0e] border border-white/20 text-white focus:outline-none focus:border-[#10b981]"
            >
              <option value="All">ALL CATEGORIES</option>
              <option value="Bike">BIKE</option>
              <option value="Car">CAR</option>
              <option value="Van">VAN</option>
              <option value="Truck">TRUCK</option>
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">DATE FROM</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white/5 border border-white/20 text-white focus:outline-none focus:border-[#10b981]"
            />
          </div>

          {/* Reset / Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleResetFilters}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 border border-white/20 text-zinc-300 hover:text-white hover:bg-white/5 font-bold uppercase tracking-wider"
            >
              <RotateCcw size={13} />
              <span>RESET</span>
            </button>
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="border border-white/10 bg-[#0c0c0e] overflow-hidden">
        <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between font-mono text-xs">
          <span className="text-zinc-300">
            MATCHING LOG ENTRIES: <strong className="text-[#10b981]">{filteredRecords.length}</strong>
          </span>
          <span className="text-[11px] text-zinc-500 uppercase">CHRONOLOGICAL AUDIT</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-white/5 text-zinc-400 font-bold border-b border-white/10 text-[10px] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">PLATE NO.</th>
                <th className="px-4 py-3">TYPE</th>
                <th className="px-4 py-3">DRIVER / CONTACT</th>
                <th className="px-4 py-3">BAY</th>
                <th className="px-4 py-3">ENTRY</th>
                <th className="px-4 py-3">EXIT</th>
                <th className="px-4 py-3">DURATION</th>
                <th className="px-4 py-3">FEE</th>
                <th className="px-4 py-3">STATUS</th>
                <th className="px-4 py-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredRecords.length > 0 ? (
                filteredRecords.map(r => (
                  <tr key={r.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-zinc-500 text-[11px]">#{r.id}</td>
                    <td className="px-4 py-3 font-bold text-white tracking-wide">{r.reg_number}</td>
                    <td className="px-4 py-3 uppercase text-zinc-400 text-[11px]">
                      {r.vehicle_type}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-zinc-200 font-bold">{r.owner_name}</div>
                      <div className="text-[11px] text-zinc-500">{r.contact_number}</div>
                    </td>
                    <td className="px-4 py-3 font-bold text-[#10b981]">
                      {r.slot_number}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-[11px]">{r.entry_time}</td>
                    <td className="px-4 py-3 text-zinc-400 text-[11px]">
                      {r.exit_time || <span className="text-zinc-500 italic">IN BAY</span>}
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      {r.duration_hours ? `${r.duration_hours} hr` : '—'}
                    </td>
                    <td className="px-4 py-3 font-bold text-[#10b981]">
                      {r.fee !== undefined ? `$${r.fee.toFixed(2)}` : '$0.00'}
                    </td>
                    <td className="px-4 py-3">
                      {r.status === 'Active' ? (
                        <span className="text-[10px] font-bold border border-[#10b981] text-[#10b981] px-2 py-0.5 inline-block">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium border border-zinc-600 text-zinc-400 px-2 py-0.5 inline-block">
                          EXITED
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.status === 'Completed' ? (
                        <button
                          onClick={() => onViewReceipt(r)}
                          className="text-[11px] border border-white/20 text-zinc-300 hover:text-white px-2.5 py-1 transition-colors uppercase"
                        >
                          TICKET
                        </button>
                      ) : (
                        <button
                          onClick={() => onSelectExit(r.reg_number)}
                          className="text-[11px] bg-white text-[#0c0c0e] font-bold px-2.5 py-1 hover:bg-[#10b981] transition-colors uppercase"
                        >
                          EXIT
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="px-4 py-10 text-center text-zinc-500 text-xs">
                    No matching logs found in database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
