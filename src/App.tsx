/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ActiveTab, ParkingSlot, ParkingRecord, TariffRate, VehicleType, SlotStatus } from './types';
import { generateInitialSlots, getInitialRecords, INITIAL_RATES } from './data/initialData';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { VehicleEntryView } from './components/VehicleEntryView';
import { VehicleExitView } from './components/VehicleExitView';
import { ParkingSlotsView } from './components/ParkingSlotsView';
import { VehicleHistoryView } from './components/VehicleHistoryView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { ReceiptModal } from './components/ReceiptModal';
import { ProjectCodeView } from './components/ProjectCodeView';

const STORAGE_KEYS = {
  SLOTS: 'parkmatrix_slots_v1',
  RECORDS: 'parkmatrix_records_v1',
  RATES: 'parkmatrix_rates_v1',
  SHOW_PROJECT_GUIDE: 'parkmatrix_show_project_guide_v1',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedExitReg, setSelectedExitReg] = useState<string>('');
  const [receiptRecord, setReceiptRecord] = useState<ParkingRecord | null>(null);

  // Project Guide visibility state (Default: false / hidden in settings)
  const [showProjectGuide, setShowProjectGuide] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SHOW_PROJECT_GUIDE);
    if (saved !== null) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return false;
  });

  // Persistent Slots State
  const [slots, setSlots] = useState<ParkingSlot[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SLOTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return generateInitialSlots();
  });

  // Persistent Records State
  const [records, setRecords] = useState<ParkingRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.RECORDS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return getInitialRecords();
  });

  // Persistent Rates State
  const [rates, setRates] = useState<TariffRate[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.RATES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return INITIAL_RATES;
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SLOTS, JSON.stringify(slots));
  }, [slots]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RATES, JSON.stringify(rates));
  }, [rates]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SHOW_PROJECT_GUIDE, JSON.stringify(showProjectGuide));
  }, [showProjectGuide]);

  // Handler: Register New Entry
  const handleRegisterEntry = (newEntry: Omit<ParkingRecord, 'id'>) => {
    const newId = records.length > 0 ? Math.max(...records.map(r => r.id)) + 1 : 101;
    const fullRecord: ParkingRecord = {
      id: newId,
      ...newEntry,
    };

    setRecords(prev => [fullRecord, ...prev]);

    // Mark slot as Occupied
    setSlots(prev =>
      prev.map(s =>
        s.slot_number === newEntry.slot_number ? { ...s, status: 'Occupied' } : s
      )
    );
  };

  // Handler: Process Vehicle Exit
  const handleProcessExit = (
    recordId: number,
    fee: number,
    durationHours: number,
    paymentStatus: 'Paid' | 'Pending'
  ) => {
    const exitTime = new Date().toISOString().replace('T', ' ').substring(0, 19);

    let releasedSlot = '';

    setRecords(prev =>
      prev.map(r => {
        if (r.id === recordId) {
          releasedSlot = r.slot_number;
          return {
            ...r,
            exit_time: exitTime,
            fee,
            duration_hours: durationHours,
            payment_status: paymentStatus,
            status: 'Completed',
          };
        }
        return r;
      })
    );

    // Free up the slot to Available
    if (releasedSlot) {
      setSlots(prev =>
        prev.map(s =>
          s.slot_number === releasedSlot ? { ...s, status: 'Available' } : s
        )
      );
    }
  };

  // Handler: Add New Slot
  const handleAddSlot = (slotNumber: string, slotType: VehicleType, floor: string) => {
    const newSlot: ParkingSlot = {
      id: `slot-${slotNumber}`,
      slot_number: slotNumber,
      slot_type: slotType,
      status: 'Available',
      floor: floor || 'Ground Floor',
    };
    setSlots(prev => [...prev, newSlot]);
  };

  // Handler: Update Slot Status (Available / Maintenance)
  const handleUpdateSlotStatus = (slotNumber: string, status: SlotStatus) => {
    setSlots(prev =>
      prev.map(s => (s.slot_number === slotNumber ? { ...s, status } : s))
    );
  };

  // Handler: Update Rates
  const handleUpdateRates = (newRates: TariffRate[]) => {
    setRates(newRates);
  };

  // Handler: Seed Sample Demo Data
  const handleSeedDemoData = () => {
    const initialSlots = generateInitialSlots();
    const initialRecs = getInitialRecords();
    setSlots(initialSlots);
    setRecords(initialRecs);
    setRates(INITIAL_RATES);
  };

  // Handler: Simulate Critical High Occupancy (>90% threshold)
  const handleSimulateHighOccupancy = () => {
    // 37 occupied out of 40 slots = 92.5% occupancy
    setSlots(prev =>
      prev.map((s, index) => ({
        ...s,
        status: (index < 37 ? 'Occupied' : 'Available') as SlotStatus,
      }))
    );
    setActiveTab('dashboard');
  };

  // Handler: Reset Database
  const handleResetDatabase = () => {
    // Reset all slots to Available, erase records
    const cleanSlots = generateInitialSlots().map(s => ({
      ...s,
      status: 'Available' as SlotStatus,
    }));
    setSlots(cleanSlots);
    setRecords([]);
  };

  // Navigation shortcuts
  const handleQuickExit = (regNumber: string) => {
    setSelectedExitReg(regNumber);
    setActiveTab('exit');
  };

  return (
    <div className="min-h-screen bg-[#0c0c0e] text-[#e4e4e7] flex font-sans selection:bg-[#10b981] selection:text-[#0c0c0e]">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        showProjectGuide={showProjectGuide}
      />

      {/* Main Content Area */}
      <div className="flex-1 md:ml-72 flex flex-col min-h-screen p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto gap-6">
        <Header
          activeTab={activeTab}
          onOpenSidebar={() => setSidebarOpen(true)}
          onNewEntry={() => setActiveTab('entry')}
        />

        <main className="flex-1 flex flex-col justify-between">
          <div>
            {activeTab === 'dashboard' && (
              <DashboardView
                slots={slots}
                records={records}
                onNavigateTab={setActiveTab}
                onSelectExit={handleQuickExit}
                onViewReceipt={setReceiptRecord}
              />
            )}

            {activeTab === 'entry' && (
              <VehicleEntryView
                slots={slots}
                records={records}
                rates={rates}
                onRegisterEntry={handleRegisterEntry}
                onNavigateTab={setActiveTab}
              />
            )}

            {activeTab === 'exit' && (
              <VehicleExitView
                records={records}
                rates={rates}
                selectedRegQuery={selectedExitReg}
                onProcessExit={handleProcessExit}
                onViewReceipt={setReceiptRecord}
                onNavigateTab={setActiveTab}
              />
            )}

            {activeTab === 'slots' && (
              <ParkingSlotsView
                slots={slots}
                onAddSlot={handleAddSlot}
                onUpdateSlotStatus={handleUpdateSlotStatus}
                onNavigateTab={setActiveTab}
              />
            )}

            {activeTab === 'history' && (
              <VehicleHistoryView
                records={records}
                onViewReceipt={setReceiptRecord}
                onSelectExit={handleQuickExit}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsView records={records} />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                rates={rates}
                onUpdateRates={handleUpdateRates}
                onSeedDemoData={handleSeedDemoData}
                onResetDatabase={handleResetDatabase}
                onSimulateHighOccupancy={handleSimulateHighOccupancy}
                showProjectGuide={showProjectGuide}
                onToggleProjectGuide={setShowProjectGuide}
                onNavigateTab={setActiveTab}
              />
            )}

            {activeTab === 'code' && (
              <ProjectCodeView
                onBackToSettings={() => setActiveTab('settings')}
              />
            )}
          </div>

          {/* Variation 2 Footer */}
          <footer className="border-t border-white/10 pt-4 mt-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono text-zinc-500">
            <div className="label-mono">Operational Performance Data // Terminal Secure</div>
            <div className="label-mono">System Ready 0x44F2</div>
          </footer>
        </main>
      </div>

      {/* Printable Thermal Receipt Modal */}
      {receiptRecord && (
        <ReceiptModal
          record={receiptRecord}
          onClose={() => setReceiptRecord(null)}
        />
      )}
    </div>
  );
}
