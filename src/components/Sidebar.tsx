import React from 'react';
import { 
  LayoutDashboard, 
  LogIn, 
  LogOut, 
  Grid3X3, 
  History, 
  BarChart3, 
  Settings, 
  Code2, 
  X 
} from 'lucide-react';
import { ActiveTab } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isOpen: boolean;
  onClose: () => void;
  showProjectGuide?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  onClose,
  showProjectGuide = false,
}) => {
  const allNavItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
    { id: 'entry', label: 'Entry', icon: <LogIn size={16} /> },
    { id: 'exit', label: 'Exit & Fee', icon: <LogOut size={16} /> },
    { id: 'slots', label: 'Slots', icon: <Grid3X3 size={16} /> },
    { id: 'history', label: 'History', icon: <History size={16} /> },
    { id: 'reports', label: 'Revenue', icon: <BarChart3 size={16} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
    { id: 'code', label: 'Project Guide', icon: <Code2 size={16} /> },
  ];

  const navItems = showProjectGuide
    ? allNavItems
    : allNavItems.filter((item) => item.id !== 'code');

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-xs z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 w-72 bg-[#0c0c0e] text-[#e4e4e7] z-50 flex flex-col justify-between p-6 sm:p-7
        border-r border-white/10 terminal-dots transition-transform duration-200 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Top Section */}
        <div>
          {/* Brand */}
          <div className="flex items-start justify-between">
            <div className="brand">
              <h2 className="font-display font-extrabold text-2xl tracking-tighter text-[#e4e4e7] leading-none">
                PARK<br />MATRIX
              </h2>
              <div className="label-mono mt-2">[System v4.0]</div>
            </div>
            <button 
              className="md:hidden text-zinc-400 hover:text-white p-1"
              onClick={onClose}
              aria-label="Close Sidebar"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="mt-8 space-y-1.5">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    onClose();
                  }}
                  className={`
                    w-full flex items-center gap-3 px-3.5 py-2.5 rounded-sm font-mono text-xs transition-all duration-150
                    ${isActive 
                      ? 'bg-[#10b981] text-[#0c0c0e] font-bold shadow-xs' 
                      : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-100 font-medium'
                    }
                  `}
                >
                  <span className={isActive ? 'text-[#0c0c0e] opacity-100' : 'opacity-70'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {item.id === 'code' && (
                    <span className={`ml-auto text-[9px] font-mono px-1 py-0.2 rounded ${
                      isActive ? 'bg-[#0c0c0e]/20 text-[#0c0c0e]' : 'bg-white/10 text-[#10b981]'
                    }`}>
                      PY
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
};
