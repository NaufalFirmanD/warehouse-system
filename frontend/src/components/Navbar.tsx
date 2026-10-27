import React from 'react';
import { User } from '../api/client';
import { Truck, Package, Archive, History, Shield, UserCheck, Layers } from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSwitchRole: (role: 'SUPERVISOR' | 'OPERATOR') => void;
}

const navItems = [
  { id: 'documents', label: 'Receiving',     icon: Truck   },
  { id: 'products',  label: 'Products',      icon: Package },
  { id: 'inventory', label: 'Inventory',     icon: Archive },
  { id: 'history',   label: 'Transactions',  icon: History },
];

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onSwitchRole,
}) => {
  return (
    <header className="bg-gray-950 border-b border-gray-800/80 sticky top-0 z-30">
      {/* Top accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex items-center h-[60px] gap-6">

          {/* Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Layers className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-gray-950" />
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-bold text-white leading-none tracking-tight">WRS</div>
              <div className="text-[10px] font-medium text-gray-500 leading-none mt-0.5 tracking-wide">Warehouse System</div>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px h-5 bg-gray-800" />

          {/* Nav Items */}
          <nav className="hidden md:flex items-center gap-1 flex-1">
            {navItems.map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`
                    flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150
                    ${isActive
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60 border border-transparent'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" strokeWidth={isActive ? 2.5 : 2} />
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-3 ml-auto">
            {/* Role Toggle */}
            <div className="flex items-center bg-gray-900 rounded-xl p-1 border border-gray-800 gap-0.5">
              <button
                onClick={() => onSwitchRole('OPERATOR')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  currentUser?.role === 'OPERATOR'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Operator</span>
              </button>
              <button
                onClick={() => onSwitchRole('SUPERVISOR')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  currentUser?.role === 'SUPERVISOR'
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-500/25'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Supervisor</span>
              </button>
            </div>

            {/* User Avatar */}
            <div className="flex items-center gap-2.5 pl-3 border-l border-gray-800">
              <div className={`
                w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shadow-md
                ${currentUser?.role === 'SUPERVISOR'
                  ? 'bg-gradient-to-br from-violet-500 to-purple-700 shadow-violet-500/20 text-white'
                  : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/20 text-white'
                }
              `}>
                {(currentUser?.fullName || 'U').charAt(0)}
              </div>
              <div className="hidden lg:block">
                <div className="text-xs font-semibold text-gray-200 leading-tight">{currentUser?.fullName || '—'}</div>
                <div className="text-[10px] text-gray-500 leading-tight mt-0.5 capitalize">{currentUser?.role?.toLowerCase()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <div className="md:hidden flex items-center gap-1 px-4 pb-2 overflow-x-auto">
        {navItems.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                isActive ? 'bg-blue-500/10 text-blue-400' : 'text-gray-400'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
