import React, { useState } from 'react';
import { InventoryItem } from '../api/client';
import { Boxes, Search, Layers, CheckCircle2 } from 'lucide-react';

interface InventoryPageProps {
  inventory: InventoryItem[];
  loading: boolean;
}

export const InventoryPage: React.FC<InventoryPageProps> = ({ inventory, loading }) => {
  const [search, setSearch] = useState('');

  const filtered = inventory.filter(
    (i) =>
      i.sku.toLowerCase().includes(search.toLowerCase()) ||
      i.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalUnits = inventory.reduce((acc, curr) => acc + curr.quantityOnHand, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Boxes className="w-6 h-6 text-emerald-400" />
          <span>Real-Time Warehouse Inventory</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Current on-hand stock balances updated automatically upon inbound receipt.
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs uppercase font-semibold text-slate-400">Total Stocked SKUs</div>
            <div className="text-2xl font-bold text-white">{inventory.length}</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs uppercase font-semibold text-slate-400">Total Units On Hand</div>
            <div className="text-2xl font-bold text-emerald-400">{totalUnits.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by SKU or product name..."
            className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/50 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">SKU Code</th>
                <th className="px-6 py-4">Product Name</th>
                <th className="px-6 py-4 text-center">Unit</th>
                <th className="px-6 py-4 text-center">Quantity On Hand</th>
                <th className="px-6 py-4 text-right">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    Loading inventory balances...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    No inventory records found.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.productId} className="hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4 font-mono font-bold text-blue-400">{item.sku}</td>
                    <td className="px-6 py-4 font-semibold text-white">{item.name}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-slate-800 border border-slate-700 text-slate-300">
                        {item.uom}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`font-bold font-mono text-base ${
                          item.quantityOnHand > 0 ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                      >
                        {item.quantityOnHand.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-xs text-slate-500">
                      {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : 'Never'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
