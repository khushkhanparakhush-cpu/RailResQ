import React, { useEffect, useRef } from 'react';
import { useMetro } from '../../context/MetroContext';
import { LOGO_IMAGE } from '../../data/initialData';

export const Sidebar: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    mobileNavOpen, 
    setMobileNavOpen, 
    incidents, 
    rankedAssetRisks, 
    nightShiftRoster,
    setIsGenerateRosterModalOpen,
    setIsCommandPaletteOpen 
  } = useMetro();

  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const prevNavOpenRef = useRef<boolean>(mobileNavOpen);

  const openCount = incidents.filter(i => i.status === 'Open' || i.status === 'Acknowledged' || i.status === 'In Progress').length;
  const highRiskCount = rankedAssetRisks.filter(a => a.riskBand === 'High').length;
  const scheduledCount = nightShiftRoster?.scheduledEntries.length || 0;

  const navItems = [
    { id: 'overview', label: 'Overview', icon: 'dashboard' },
    { id: 'asset-risk', label: 'Asset Risk', icon: 'troubleshoot', badge: highRiskCount > 0 ? highRiskCount : undefined },
    { id: 'night-shift-planner', label: 'Night-Shift Planner', icon: 'auto_schedule' },
    { id: 'technician-tasks', label: 'Technician Tasks', icon: 'handyman', badge: scheduledCount > 0 ? scheduledCount : undefined },
    { id: 'stations-and-assets', label: 'Stations & Assets', icon: 'train' },
    { id: 'incidents', label: 'Fault History / Incidents', icon: 'history_edu', badge: openCount > 0 ? openCount : undefined },
    { id: 'analytics', label: 'Analytics', icon: 'insights' },
    { id: 'activity-log', label: 'Activity Log', icon: 'history' },
    { id: 'settings', label: 'Data & Settings', icon: 'settings' },
  ];

  // Handle Escape key & Scroll lock & Resize handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileNavOpen) {
        setMobileNavOpen(false);
      }
    };

    const handleResize = () => {
      if (window.innerWidth >= 768 && mobileNavOpen) {
        setMobileNavOpen(false);
      }
    };

    if (mobileNavOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
      // Focus close button on open
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);
    } else {
      document.body.style.overflow = '';
    }

    window.addEventListener('resize', handleResize);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [mobileNavOpen, setMobileNavOpen]);

  const handleNavClick = (id: string) => {
    if (id === 'night-shift-planner') {
      setIsGenerateRosterModalOpen(true);
      setMobileNavOpen(false);
      return;
    }
    if (id === 'technician-tasks') {
      setActiveTab('maintenance');
      setMobileNavOpen(false);
      return;
    }
    setActiveTab(id);
    setMobileNavOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileNavOpen && (
        <div 
          onClick={() => setMobileNavOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        id="mobile-navigation-drawer"
        role="dialog"
        aria-modal={mobileNavOpen ? 'true' : undefined}
        aria-label="Main Navigation"
        className={`fixed left-0 top-0 h-[100dvh] w-64 max-w-[85vw] bg-white border-r border-slate-200 z-50 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileNavOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Brand Header */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200 shrink-0">
            <button 
              onClick={() => handleNavClick('overview')}
              className="flex items-center gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 rounded-lg p-1 min-h-[44px]"
            >
              <img
                alt="RailResQ Logo"
                className="h-7 w-auto object-contain"
                src={LOGO_IMAGE}
              />
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-slate-900 tracking-tight leading-tight">
                  RailResQ
                </span>
                <span className="text-[10px] text-slate-500 font-medium truncate">
                  Ahmedabad Metro
                </span>
              </div>
            </button>

            <button
              ref={closeButtonRef}
              onClick={() => setMobileNavOpen(false)}
              className="md:hidden text-slate-500 hover:text-slate-800 hover:bg-slate-100 p-2.5 rounded-lg flex items-center justify-center min-w-[44px] min-h-[44px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
              aria-label="Close navigation drawer"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          {/* Navigation Links - Scrollable on short screens */}
          <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto overscroll-contain">
            {navItems.map(item => {
              const isActive = activeTab === item.id || 
                (item.id === 'technician-tasks' && activeTab === 'maintenance');

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-left rounded-lg text-xs font-medium transition-colors min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${
                    isActive
                      ? 'bg-teal-50 text-teal-800 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`material-symbols-outlined text-lg shrink-0 ${
                      isActive ? 'text-teal-700' : 'text-slate-400'
                    }`}>
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums font-semibold shrink-0 ${
                      isActive 
                        ? 'bg-teal-100 text-teal-900' 
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Area with Quick Command & Offline status */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/70 space-y-2 shrink-0 pb-safe">
          <button
            onClick={() => {
              setIsCommandPaletteOpen(true);
              setMobileNavOpen(false);
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 text-xs transition-colors shadow-2xs min-h-[40px] focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base">search</span>
              <span>Quick Jump</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-mono font-medium">⌘K</kbd>
          </button>

          <div className="flex items-center justify-between px-1 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
              <span className="truncate">Saved locally</span>
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
