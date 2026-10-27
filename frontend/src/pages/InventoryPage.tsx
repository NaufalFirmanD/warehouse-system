import React, { useState } from 'react';
import { InventoryItem } from '../api/client';
import { Search, Archive } from 'lucide-react';

interface InventoryPageProps {
  inventory: InventoryItem[];
  loading: boolean;
}

export const InventoryPage: React.FC<InventoryPageProps> = ({ inventory, loading }) => {
  const [search, setSearch] = useState('');

  const filtered = inventory.filter(
    (item) =>
      item.sku.toLowerCase().includes(search.toLowerCase()) ||
      item.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalStock = inventory.reduce((s, i) => s + i.quantityOnHand, 0);
  const inStockCount = inventory.filter((i) => i.quantityOnHand > 0).length;
  const zeroStockCount = inventory.filter((i) => i.quantityOnHand === 0).length;
  const maxStock = Math.max(...inventory.map((i) => i.quantityOnHand), 1);

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Inventory Balances</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time physical stock on hand across all warehouse storage bins
          </p>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="bg-white border border-slate-200 rounded-lg grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 shadow-sm">
        <div className="p-4">
          <span className="text-xs font-medium text-slate-500 block">Total Units In Stock</span>
          <span className="text-2xl font-bold text-slate-900 font-mono mt-1 block">{totalStock.toLocaleString()}</span>
        </div>
        <div className="p-4">
          <span className="text-xs font-medium text-emerald-700 block">SKUs with Available Stock</span>
          <span className="text-2xl font-bold text-emerald-800 font-mono mt-1 block">{inStockCount}</span>
        </div>
        <div className="p-4">
          <span className="text-xs font-medium text-amber-700 block">Stockout / Zero Stock SKUs</span>
          <span className="text-2xl font-bold text-amber-800 font-mono mt-1 block">{zeroStockCount}</span>
        </div>
        <div className="p-4">
          <span className="text-xs font-medium text-slate-500 block">Active Item Count</span>
          <span className="text-2xl font-bold text-slate-900 font-mono mt-1 block">{inventory.length}</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by SKU code or product description..."
            className="enterprise-input w-full pl-8 pr-3 py-1.5 text-xs text-slate-800"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs">Loading inventory balances...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Archive className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">No inventory records</p>
            <p className="text-xs text-slate-400 mt-1">Stock records will appear here as incoming shipments are received.</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-4 py-3">SKU Code</th>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3 text-center">Unit</th>
                <th className="px-4 py-3">Stock Ratio</th>
                <th className="px-4 py-3 text-right">Physical On Hand</th>
                <th className="px-4 py-3 text-right hidden md:table-cell">Last Audited</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => {
                const fillPct = Math.round((item.quantityOnHand / maxStock) * 100);
                return (
                  <tr key={item.productId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs font-semibold text-slate-900 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                        {item.sku}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-900">
                      {item.name}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="font-mono text-[11px] text-slate-600 font-medium px-2 py-0.5 rounded bg-slate-50 border border-slate-200">
                        {item.uom}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2 max-w-[140px]">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                          <div
                            className={`h-full rounded-full ${item.quantityOnHand === 0 ? 'bg-slate-300' : 'bg-emerald-600'}`}
                            style={{ width: `${fillPct}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] text-slate-500 min-w-[28px]">{fillPct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-semibold text-slate-900">
                      <span className={item.quantityOnHand > 0 ? 'text-emerald-700' : 'text-slate-400'}>
                        {item.quantityOnHand.toLocaleString()}
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal ml-1">{item.uom}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right hidden md:table-cell text-slate-400 font-mono text-[11px]">
                      {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : '—'}
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
