import React, { useState } from 'react';
import { useMetro } from '../../context/MetroContext';
import { LOGO_IMAGE } from '../../data/initialData';

export const Header: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    mobileNavOpen,
    setMobileNavOpen, 
    globalSearch, 
    setGlobalSearch,
    setIsCommandPaletteOpen 
  } = useMetro();

  const [mobileSearchExpanded, setMobileSearchExpanded] = useState<boolean>(false);

  const getBreadcrumbTitle = () => {
    switch (activeTab) {
      case 'overview': return 'Overview';
      case 'asset-risk': return 'Asset Failure Risk';
      case 'incidents': return 'Fault History & Incidents';
      case 'report-incident': return 'Report Incident';
      case 'maintenance': return 'Technician Tasks & Roster';
      case 'stations-and-assets': return 'Stations & Assets';
      case 'analytics': return 'Analytics';
      case 'activity-log': return 'Activity Log';
      case 'settings': return 'Data & Settings';
      default: return 'Overview';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200">
      <div className="h-14 px-3 sm:px-4 md:px-6 flex items-center justify-between gap-2">
        {/* Left: Mobile Menu Button & Brand/Breadcrumbs */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="md:hidden flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 -ml-1"
            aria-label="Open Navigation Drawer"
            aria-expanded={mobileNavOpen}
            aria-controls="mobile-navigation-drawer"
          >
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>

          {/* Compact Logo & Title for Mobile + Full Breadcrumbs for Tablet/Desktop */}
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-slate-500 min-w-0">
            <button 
              onClick={() => setActiveTab('overview')}
              className="flex items-center gap-1.5 text-left text-slate-900 hover:text-teal-700 transition-colors font-bold shrink-0 min-h-[44px] sm:min-h-auto focus:outline-none"
            >
              <img
                alt="RailResQ"
                className="h-5 w-auto object-contain md:hidden"
                src={LOGO_IMAGE}
              />
              <span className="font-semibold text-slate-900 text-xs sm:text-sm">
                RailResQ
              </span>
            </button>
            <span className="text-slate-300 shrink-0">/</span>
            <span className="font-semibold text-slate-800 text-xs sm:text-sm truncate">
              {getBreadcrumbTitle()}
            </span>
          </div>
        </div>

        {/* Right: Search, Quick Actions & Operator Badge */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Desktop Search Input */}
          <div className="relative hidden md:flex items-center">
            <span className="material-symbols-outlined absolute left-2.5 text-slate-400 text-sm pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => {
                setGlobalSearch(e.target.value);
                if (activeTab !== 'incidents' && e.target.value.trim().length > 0) {
                  setActiveTab('incidents');
                }
              }}
              placeholder="Search incidents, stations, assets..."
              className="w-44 lg:w-56 pl-7 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 text-xs focus:outline-none focus:bg-white focus:border-teal-600 focus:ring-1 focus:ring-teal-600/20 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Mobile Search Toggle Button */}
          <button
            onClick={() => setMobileSearchExpanded(!mobileSearchExpanded)}
            className="md:hidden flex items-center justify-center min-w-[40px] min-h-[40px] rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Toggle Search"
            title="Search"
          >
            <span className="material-symbols-outlined text-xl">
              {mobileSearchExpanded ? 'close' : 'search'}
            </span>
          </button>

          {/* Cmd+K Quick Jump trigger */}
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors hidden sm:flex items-center min-h-[40px] min-w-[40px] justify-center"
            title="Search anything (⌘K)"
          >
            <span className="material-symbols-outlined text-lg">travel_explore</span>
          </button>

          {/* Primary Action Button */}
          {activeTab !== 'report-incident' && (
            <button
              onClick={() => setActiveTab('report-incident')}
              className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-2 rounded-lg bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800 active:bg-teal-900 shadow-2xs transition-colors shrink-0 min-h-[38px]"
            >
              <span className="material-symbols-outlined text-base">add</span>
              <span className="hidden xs:inline sm:inline">Report</span>
              <span className="hidden sm:inline">Incident</span>
            </button>
          )}

          {/* Operator Badge */}
          <div className="flex items-center gap-1.5 sm:gap-2 pl-1 sm:pl-2 border-l border-slate-200 text-xs">
            <div 
              className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px] border border-slate-200 shrink-0"
              title="Shift Supervisor: R. Mehta"
            >
              RM
            </div>
            <span className="font-medium text-slate-700 text-xs hidden xl:inline truncate max-w-[150px]">
              R. Mehta (Supervisor)
            </span>
          </div>
        </div>
      </div>

      {/* Expandable Mobile Search Row */}
      {mobileSearchExpanded && (
        <div className="md:hidden px-3 py-2.5 bg-slate-50 border-t border-slate-200 animate-fade-in">
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3 text-slate-400 text-base pointer-events-none">
              search
            </span>
            <input
              autoFocus
              type="text"
              value={globalSearch}
              onChange={(e) => {
                setGlobalSearch(e.target.value);
                if (activeTab !== 'incidents' && e.target.value.trim().length > 0) {
                  setActiveTab('incidents');
                }
              }}
              placeholder="Search incidents, stations, assets..."
              className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
            />
            {globalSearch && (
              <button
                onClick={() => setGlobalSearch('')}
                className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined text-sm">cancel</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
