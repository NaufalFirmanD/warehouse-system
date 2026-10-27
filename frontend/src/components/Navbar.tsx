import React from 'react';
import { User } from '../api/client';
import { Package, Truck, Boxes, History, UserCheck, Shield } from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSwitchRole: (role: 'SUPERVISOR' | 'OPERATOR') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onSwitchRole,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-lg text-white flex items-center gap-2">
                <span>Warehouse Receiving</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  WRS v1.0
                </span>
              </div>
              <p className="text-xs text-slate-400">Inbound Operations & Stock Ledger</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex space-x-1">
            <button
              onClick={() => setActiveTab('documents')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'documents'
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Receiving Documents</span>
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'products'
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Product Catalog</span>
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'inventory'
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Boxes className="w-4 h-4" />
              <span>Available Inventory</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'history'
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Transaction History</span>
            </button>
          </nav>

          {/* Role Switcher & User Profile */}
          <div className="flex items-center space-x-3">
            <div className="bg-slate-800 p-1 rounded-lg border border-slate-700/60 flex items-center">
              <button
                onClick={() => onSwitchRole('OPERATOR')}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-medium transition ${
                  currentUser?.role === 'OPERATOR'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Switch to Warehouse Operator view"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Operator</span>
              </button>
              <button
                onClick={() => onSwitchRole('SUPERVISOR')}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-medium transition ${
                  currentUser?.role === 'SUPERVISOR'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Switch to Warehouse Supervisor view"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Supervisor</span>
              </button>
            </div>

            <div className="hidden sm:block text-right">
              <div className="text-xs font-semibold text-slate-200">{currentUser?.fullName}</div>
              <div className="text-[11px] text-slate-400">@{currentUser?.username}</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
