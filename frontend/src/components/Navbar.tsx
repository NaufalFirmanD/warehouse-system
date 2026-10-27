import React from 'react';
import { User } from '../api/client';
import { Truck, Package, Archive, History, Shield, UserCheck, Box } from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSwitchRole: (role: 'SUPERVISOR' | 'OPERATOR') => void;
}

const navItems = [
  { id: 'documents', label: 'Inbound Receiving', icon: Truck },
  { id: 'products',  label: 'Product Master',    icon: Package },
  { id: 'inventory', label: 'Inventory Balances',icon: Archive },
  { id: 'history',   label: 'Audit Trail',       icon: History },
];

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onSwitchRole,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">

          {/* Brand & Tabs */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold shadow-sm">
                <Box className="w-4 h-4 text-slate-100" />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-900 tracking-tight block leading-none">WRS</span>
                <span className="text-[10px] text-slate-500 font-medium tracking-normal block mt-0.5 leading-none">Warehouse Operations</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(({ id, label, icon: Icon }) => {
                const isActive = activeTab === id;
                return (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`
                      flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                      ${isActive
                        ? 'bg-slate-100 text-slate-900 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }
                    `}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-900' : 'text-slate-400'}`} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Section: Role Segmented Control & User Badge */}
          <div className="flex items-center gap-4">
            {/* Segmented Role Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
              <button
                onClick={() => onSwitchRole('OPERATOR')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  currentUser?.role === 'OPERATOR'
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                <span>Operator</span>
              </button>
              <button
                onClick={() => onSwitchRole('SUPERVISOR')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  currentUser?.role === 'SUPERVISOR'
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-slate-500" />
                <span>Supervisor</span>
              </button>
            </div>

            {/* User Profile */}
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center">
                {(currentUser?.fullName || 'U').charAt(0)}
              </div>
              <div className="text-left">
                <span className="text-xs font-semibold text-slate-800 block leading-tight">{currentUser?.fullName || '—'}</span>
                <span className="text-[10px] text-slate-500 capitalize block leading-tight">{currentUser?.role?.toLowerCase()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <div className="md:hidden flex items-center gap-1 px-4 py-2 border-t border-slate-100 overflow-x-auto bg-slate-50">
        {navItems.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap ${
                isActive ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600'
              }`}
            >
              <Icon className="w-3.5 h-3.5 text-slate-500" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
