import React from 'react';
import { X, Printer } from 'lucide-react';
import { ParkingRecord } from '../types';

interface ReceiptModalProps {
  record: ParkingRecord | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ record, onClose }) => {
  if (!record) return null;

  return (
    <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0c0c0e] border border-white/20 max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 my-8">
        {/* Modal Actions Bar (No print) */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4 print:hidden font-mono">
          <span className="text-xs font-bold text-white uppercase tracking-wider">OFFICIAL PARKING TICKET</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1 bg-[#10b981] hover:bg-[#059669] text-[#0c0c0e] text-[11px] font-bold px-2.5 py-1.5 uppercase transition-colors"
            >
              <Printer size={13} />
              <span>PRINT</span>
            </button>
            <button onClick={onClose} className="text-zinc-400 hover:text-white p-1">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Thermal Receipt Ticket */}
        <div className="border border-dashed border-white/20 p-5 bg-white/5 font-mono text-xs text-zinc-200 space-y-3 print:border-none print:p-0 print:bg-white print:text-black">
          <div className="text-center pb-2 border-b border-dashed border-white/20 space-y-0.5">
            <h2 className="text-base font-extrabold tracking-wider text-white print:text-black">PARKMATRIX LOTS</h2>
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest">Smart Campus Parking Facility</p>
            <p className="text-[9px] text-zinc-500">Gate #2 · Ticket #{record.id.toString().padStart(5, '0')}</p>
            <div className="pt-1.5">
              <span className={`inline-block text-[10px] font-bold px-2 py-0.5 border ${
                record.payment_status === 'Paid' 
                  ? 'border-[#10b981] text-[#10b981] bg-[#10b981]/10' 
                  : 'border-amber-400 text-amber-400 bg-amber-400/10'
              }`}>
                {record.payment_status === 'Paid' ? 'PAID IN FULL' : 'PAYMENT PENDING'}
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-zinc-400">PLATE NO:</span>
              <span className="font-bold text-white print:text-black">{record.reg_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">CATEGORY:</span>
              <span>{record.vehicle_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">BAY NUMBER:</span>
              <span className="font-bold text-[#10b981] print:text-black">{record.slot_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">DRIVER:</span>
              <span className="truncate max-w-[140px] text-right">{record.owner_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">CONTACT:</span>
              <span>{record.contact_number}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-white/20 pt-2 space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-zinc-400">GATE IN:</span>
              <span>{record.entry_time.substring(5, 16)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">GATE OUT:</span>
              <span>{record.exit_time ? record.exit_time.substring(5, 16) : 'In Bay'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">BILLED DURATION:</span>
              <span className="font-bold text-white print:text-black">{record.duration_hours || 1} Hour(s)</span>
            </div>
          </div>

          {/* Total Amount */}
          <div className="border-t border-b border-dashed border-white/20 py-2.5 flex items-center justify-between">
            <span className="font-bold text-xs uppercase text-zinc-300">TOTAL CHARGE:</span>
            <span className="text-xl font-extrabold text-[#10b981] print:text-black">
              ${(record.fee || 0).toFixed(2)}
            </span>
          </div>

          {/* Barcode Mock */}
          <div className="text-center pt-1">
            <div className="text-sm font-bold tracking-widest text-zinc-400 print:text-black">
              ||| | ||||| ||| |||| |||||| ||| ||||
            </div>
            <span className="text-[9px] text-zinc-500">*{record.reg_number}-{record.id}*</span>
          </div>

          <div className="text-center text-[10px] text-zinc-500 pt-1">
            <p>Thank you for using ParkMatrix!</p>
            <p className="text-[9px]">Retain ticket for campus gate verification.</p>
          </div>
        </div>

        <div className="mt-4 print:hidden">
          <button
            onClick={onClose}
            className="w-full py-2 bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold transition-colors uppercase tracking-wider"
          >
            DISMISS TICKET
          </button>
        </div>
      </div>
    </div>
  );
};
