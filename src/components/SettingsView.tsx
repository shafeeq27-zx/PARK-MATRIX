import React, { useState } from 'react';
import { Save, RefreshCw, Trash2, Database, CheckCircle2, Code2, Eye, EyeOff } from 'lucide-react';
import { TariffRate, VehicleType, ActiveTab } from '../types';

interface SettingsViewProps {
  rates: TariffRate[];
  onUpdateRates: (newRates: TariffRate[]) => void;
  onSeedDemoData: () => void;
  onResetDatabase: () => void;
  onSimulateHighOccupancy?: () => void;
  showProjectGuide: boolean;
  onToggleProjectGuide: (show: boolean) => void;
  onNavigateTab: (tab: ActiveTab) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  rates,
  onUpdateRates,
  onSeedDemoData,
  onResetDatabase,
  onSimulateHighOccupancy,
  showProjectGuide,
  onToggleProjectGuide,
  onNavigateTab,
}) => {
  const [currentRates, setCurrentRates] = useState<TariffRate[]>(rates);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleRateChange = (vehicleType: VehicleType, newRate: number) => {
    setCurrentRates(prev =>
      prev.map(r => (r.vehicle_type === vehicleType ? { ...r, hourly_rate: newRate } : r))
    );
  };

  const handleSaveRates = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateRates(currentRates);
    setSuccessMsg('Hourly tariff rates updated successfully!');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-mono">
      {/* Header */}
      <div className="border-b border-white/10 pb-4">
        <div className="label-mono">System Configuration</div>
        <h2 className="text-xl font-bold tracking-tight text-white mt-0.5">
          Tariff Configuration & Database Maintenance
        </h2>
      </div>

      {successMsg && (
        <div className="bg-[#10b981]/15 border border-[#10b981] text-[#10b981] text-xs p-3.5 flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span className="font-bold">{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tariff Rates Card */}
        <div className="border border-white/10 bg-[#0c0c0e] p-6">
          <div className="pb-3 border-b border-white/10 mb-4">
            <div className="label-mono">Tariff Engine</div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mt-0.5">
              Hourly Billing Schedule
            </h3>
          </div>

          <form onSubmit={handleSaveRates} className="space-y-4 text-xs">
            {currentRates.map(r => (
              <div key={r.vehicle_type} className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-zinc-300 uppercase">{r.vehicle_type} TARIFF ($/HR)</label>
                  <span className="text-[10px] text-zinc-500">{r.description}</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-zinc-500">$</span>
                  <input
                    type="number"
                    step="0.50"
                    min="0.50"
                    required
                    value={r.hourly_rate}
                    onChange={(e) => handleRateChange(r.vehicle_type, parseFloat(e.target.value) || 0)}
                    className="w-full pl-7 pr-3 py-2 text-xs font-bold bg-white/5 border border-white/20 text-white focus:outline-none focus:border-[#10b981]"
                  />
                </div>
              </div>
            ))}

            <div className="pt-3 border-t border-white/10">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 bg-[#10b981] hover:bg-[#059669] text-[#0c0c0e] text-xs font-bold py-2.5 uppercase tracking-wider transition-colors shadow-xs"
              >
                <Save size={14} className="stroke-[3]" />
                <span>SAVE TARIFF CONFIG</span>
              </button>
            </div>
          </form>
        </div>

        {/* Database Utilities & Presentation Tools */}
        <div className="space-y-5">
          {/* Sample Demo Data Card */}
          <div className="panel-brutalist p-6 space-y-4">
            <div>
              <div className="label-mono">Presentation Utilities</div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mt-0.5">
                Evaluation Demo Loader
              </h3>
              <p className="text-[11px] text-zinc-400 mt-1">
                Populate realistic parking sessions across the year for viva demonstrations.
              </p>
            </div>

            <button
              onClick={() => {
                onSeedDemoData();
                setSuccessMsg('Sample demonstration records populated successfully!');
                setTimeout(() => setSuccessMsg(null), 4000);
              }}
              className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2.5 transition-colors uppercase tracking-wider border border-white/20"
            >
              <RefreshCw size={14} />
              <span>LOAD DEMO RECORDS</span>
            </button>

            {onSimulateHighOccupancy && (
              <button
                onClick={() => {
                  onSimulateHighOccupancy();
                  setSuccessMsg('Simulated >90% occupancy (37/40 bays occupied). Check the Dashboard to see the Auto-Alert!');
                  setTimeout(() => setSuccessMsg(null), 5000);
                }}
                className="w-full flex items-center justify-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold px-4 py-2.5 transition-colors border border-amber-500/40 uppercase tracking-wider"
              >
                <span>TRIGGER &gt;90% AUTO-ALERT</span>
              </button>
            )}
          </div>

          {/* Project Guide Visibility Card */}
          <div className="border border-white/10 bg-[#0c0c0e] p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="label-mono">Navigation Preferences</div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mt-0.5 flex items-center gap-2">
                  <Code2 size={16} className="text-[#10b981]" />
                  <span>Project Guide in Sidebar</span>
                </h3>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Toggle whether the "Project Guide" tab is displayed in the main sidebar or kept hidden.
                </p>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={() => {
                  const nextState = !showProjectGuide;
                  onToggleProjectGuide(nextState);
                  setSuccessMsg(
                    nextState
                      ? 'Project Guide is now visible in the sidebar.'
                      : 'Project Guide is now hidden from the sidebar.'
                  );
                  setTimeout(() => setSuccessMsg(null), 3500);
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  showProjectGuide ? 'bg-[#10b981]' : 'bg-white/20'
                }`}
                role="switch"
                aria-checked={showProjectGuide}
                title={showProjectGuide ? 'Click to hide Project Guide' : 'Click to show Project Guide'}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    showProjectGuide ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
              <span className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                {showProjectGuide ? (
                  <>
                    <Eye size={13} className="text-[#10b981]" />
                    <strong className="text-[#10b981]">VISIBLE IN SIDEBAR</strong>
                  </>
                ) : (
                  <>
                    <EyeOff size={13} className="text-zinc-500" />
                    <strong className="text-zinc-500">HIDDEN FROM SIDEBAR</strong>
                  </>
                )}
              </span>

              <button
                type="button"
                onClick={() => onNavigateTab('code')}
                className="text-xs text-[#10b981] hover:underline flex items-center gap-1 font-bold uppercase tracking-wider"
              >
                <span>OPEN GUIDE HERE</span>
                <span>→</span>
              </button>
            </div>
          </div>

          {/* Database Reset Card */}
          <div className="border border-red-500/40 bg-red-950/20 p-5 space-y-3">
            <div>
              <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider">
                Database Re-Initialization
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Erases all active and completed records, resets all 40 slots to available.
              </p>
            </div>

            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to re-initialize the database? All records will be erased.')) {
                  onResetDatabase();
                  setSuccessMsg('Database has been completely reset to a clean state.');
                  setTimeout(() => setSuccessMsg(null), 4000);
                }
              }}
              className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 uppercase tracking-wider"
            >
              <Trash2 size={14} />
              <span>RESET DATABASE</span>
            </button>
          </div>

          {/* Database Info Card */}
          <div className="p-4 border border-white/10 bg-white/5 text-xs text-zinc-400 space-y-1">
            <div className="flex items-center gap-2 text-[#10b981] font-bold">
              <Database size={14} />
              <span>LOCAL SQLITE DATABASE</span>
            </div>
            <div className="text-[10px] text-zinc-500 space-y-0.5 mt-1">
              <div>FILE: instance/parking.db</div>
              <div>TRANSACTIONS: ACID COMPLIANT</div>
              <div>TABLES: slots, parking_records, rates</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
