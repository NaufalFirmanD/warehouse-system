import React, { useState } from 'react';
import { InventoryItem } from '../api/client';
import { Archive, Search, TrendingUp, Package2, BarChart3 } from 'lucide-react';

interface InventoryPageProps {
  inventory: InventoryItem[];
  loading: boolean;
}

export const InventoryPage: React.FC<InventoryPageProps> = ({ inventory, loading }) => {
  const [search, setSearch] = useState('');

  const filtered = inventory.filter(i =>
    i.sku.toLowerCase().includes(search.toLowerCase()) ||
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalUnits = inventory.reduce((a, c) => a + c.quantityOnHand, 0);
  const inStock = inventory.filter(i => i.quantityOnHand > 0).length;
  const zeroStock = inventory.filter(i => i.quantityOnHand === 0).length;
  const maxStock = Math.max(...inventory.map(i => i.quantityOnHand), 1);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Archive className="w-4 h-4 text-emerald-400" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Available Inventory</h1>
        </div>
        <p className="text-sm text-gray-500 ml-10.5">Real-time on-hand balances across all SKUs</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total SKUs', value: inventory.length, color: 'text-white', bg: 'bg-gray-900/60', border: 'border-gray-800/80', icon: Package2, iconColor: 'text-gray-400', iconBg: 'bg-gray-800' },
          { label: 'Total Units', value: totalUnits.toLocaleString(), color: 'text-emerald-400', bg: 'bg-gray-900/60', border: 'border-emerald-500/15', icon: TrendingUp, iconColor: 'text-emerald-400', iconBg: 'bg-emerald-500/10', glow: 'card-glow-green' },
          { label: 'SKUs In Stock', value: inStock, color: 'text-blue-400', bg: 'bg-gray-900/60', border: 'border-blue-500/15', icon: BarChart3, iconColor: 'text-blue-400', iconBg: 'bg-blue-500/10', glow: 'card-glow-blue' },
          { label: 'Zero Stock', value: zeroStock, color: zeroStock > 0 ? 'text-amber-400' : 'text-gray-600', bg: 'bg-gray-900/60', border: zeroStock > 0 ? 'border-amber-500/15' : 'border-gray-800/80', icon: Archive, iconColor: zeroStock > 0 ? 'text-amber-400' : 'text-gray-600', iconBg: zeroStock > 0 ? 'bg-amber-500/10' : 'bg-gray-800' },
        ].map(({ label, value, color, bg, border, icon: Icon, iconColor, iconBg, glow = '' }) => (
          <div key={label} className={`${bg} border ${border} rounded-2xl p-4 ${glow}`}>
            <div className={`w-8 h-8 rounded-lg ${iconBg} border border-gray-700/30 flex items-center justify-center mb-3`}>
              <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
            </div>
            <div className={`text-2xl font-bold counter-text ${color}`}>{value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Filter inventory by SKU or name..."
          className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-900 border border-gray-800 text-sm text-gray-300 placeholder-gray-600 input-glow"
        />
      </div>

      {/* Inventory Table */}
      <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading inventory...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Archive className="w-8 h-8 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No inventory data found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800/60 text-xs font-medium text-gray-400">
                <th className="text-left px-5 py-3">SKU code</th>
                <th className="text-left px-5 py-3">Product description</th>
                <th className="text-center px-4 py-3">Unit</th>
                <th className="px-5 py-3">Stock level</th>
                <th className="text-right px-5 py-3">Quantity on hand</th>
                <th className="text-right px-5 py-3 hidden md:table-cell">Last updated</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const fillPct = Math.round((item.quantityOnHand / maxStock) * 100);
                return (
                  <tr key={item.productId} className="table-row-hover border-b border-gray-800/30 last:border-0">
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs font-bold text-blue-400">{item.sku}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-medium text-gray-200">{item.name}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="font-mono text-xs font-semibold bg-gray-800 border border-gray-700/60 px-2 py-1 rounded-lg text-gray-400">{item.uom}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3 max-w-[180px]">
                        <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${item.quantityOnHand === 0 ? 'bg-gray-700' : 'bg-gradient-to-r from-emerald-500 to-green-400'}`}
                            style={{ width: `${fillPct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 tabular-nums min-w-[32px]">{fillPct}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className={`text-lg font-bold tabular-nums ${item.quantityOnHand > 0 ? 'text-emerald-400' : 'text-gray-600'}`}>
                        {item.quantityOnHand.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right hidden md:table-cell">
                      <span className="text-xs text-gray-600">
                        {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : '—'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
