import React, { useState, useEffect } from 'react';
import { Menu, Plus } from 'lucide-react';
import { ActiveTab } from '../types';

interface HeaderProps {
  activeTab: ActiveTab;
  onOpenSidebar: () => void;
  onNewEntry: () => void;
}

const TAB_TITLES: Record<ActiveTab, string> = {
  dashboard: 'OVERVIEW',
  entry: 'VEHICLE ENTRY',
  exit: 'EXIT & BILLING',
  slots: 'BAY MATRIX',
  history: 'AUDIT LOGS',
  reports: 'REVENUE METRICS',
  settings: 'SYSTEM CONFIG',
  code: 'PROJECT SOURCE',
};

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onOpenSidebar,
  onNewEntry,
}) => {
  const [time, setTime] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour12: false }));
      setDateStr(now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase());
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="border-b border-white/10 pb-5 pt-2 flex items-end justify-between gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="p-1.5 -ml-1 text-zinc-400 hover:text-white md:hidden rounded border border-white/10 hover:bg-white/5"
          aria-label="Open sidebar"
        >
          <Menu size={18} />
        </button>

        <div>
          <div className="label-mono">Terminal Operations</div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#e4e4e7] tracking-tighter leading-none mt-1">
            {TAB_TITLES[activeTab]}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Timestamp & Gateway telemetry */}
        <div className="text-right">
          <div className="label-mono text-zinc-400">
            {time || '00:00:00'} // {dateStr || 'OCT 12, 2026'}
          </div>
          <div className="text-xs font-mono font-bold text-[#10b981] mt-1 flex items-center justify-end gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] inline-block animate-pulse"></span>
            <span>GATE CONNECTED</span>
          </div>
        </div>

        {/* Action Button */}
        {activeTab !== 'entry' && (
          <button
            onClick={onNewEntry}
            className="hidden sm:flex items-center gap-1.5 bg-[#10b981] hover:bg-[#059669] text-[#0c0c0e] font-mono text-xs font-bold px-3 py-2 rounded-sm transition-colors shadow-xs"
          >
            <Plus size={14} className="stroke-[3]" />
            <span>NEW ENTRY</span>
          </button>
        )}
      </div>
    </header>
  );
};
