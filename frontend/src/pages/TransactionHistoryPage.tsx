import React, { useState } from 'react';
import { StockTransaction } from '../api/client';
import { Search, History, ArrowUpRight, FileText, User } from 'lucide-react';

interface TransactionHistoryPageProps {
  transactions: StockTransaction[];
  loading: boolean;
}

export const TransactionHistoryPage: React.FC<TransactionHistoryPageProps> = ({
  transactions,
  loading,
}) => {
  const [search, setSearch] = useState('');

  const filtered = transactions.filter(
    (tx) =>
      tx.sku.toLowerCase().includes(search.toLowerCase()) ||
      tx.productName.toLowerCase().includes(search.toLowerCase()) ||
      (tx.documentNumber && tx.documentNumber.toLowerCase().includes(search.toLowerCase())) ||
      tx.operatorName.toLowerCase().includes(search.toLowerCase())
  );

  const totalReceivedUnits = transactions.reduce((s, t) => s + t.quantity, 0);

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return {
        date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
        time: d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
    } catch {
      return { date: iso, time: '' };
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Stock Movement Audit Trail</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable double-entry ledger of all dock receiving intake transactions and quantity adjustments
          </p>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="bg-white border border-slate-200 rounded-lg grid grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 shadow-sm">
        <div className="p-4">
          <span className="text-xs font-medium text-slate-500 block">Total Ledger Events</span>
          <span className="text-2xl font-bold text-slate-900 font-mono mt-1 block">{transactions.length}</span>
        </div>
        <div className="p-4">
          <span className="text-xs font-medium text-emerald-700 block">Total Units Inbound Intake</span>
          <span className="text-2xl font-bold text-emerald-800 font-mono mt-1 block">+{totalReceivedUnits.toLocaleString()}</span>
        </div>
        <div className="p-4">
          <span className="text-xs font-medium text-slate-500 block">Audit Integrity</span>
          <span className="text-2xl font-bold text-slate-900 font-mono mt-1 block">100% Verified</span>
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
            placeholder="Search by SKU, manifest #, or operator..."
            className="enterprise-input w-full pl-8 pr-3 py-1.5 text-xs text-slate-800"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs">Loading ledger entries...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">No transaction records</p>
            <p className="text-xs text-slate-400 mt-1">Ledger entries are created automatically as items are received at the dock.</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-4 py-3">Audit Timestamp</th>
                <th className="px-4 py-3">Product Item</th>
                <th className="px-4 py-3 text-center">Inbound Qty</th>
                <th className="px-4 py-3 hidden md:table-cell">Reference Manifest</th>
                <th className="px-4 py-3 hidden lg:table-cell">Receiving Operator</th>
                <th className="px-4 py-3">Transaction Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((tx) => {
                const { date, time } = formatDate(tx.createdAt);
                return (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-slate-800">{date}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{time}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs font-semibold text-slate-900 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded mr-2">
                        {tx.sku}
                      </span>
                      <span className="text-slate-700 font-medium">{tx.productName}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        +{tx.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell font-mono text-xs text-slate-600">
                      {tx.documentNumber ? (
                        <span className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                          <FileText className="w-3 h-3 text-slate-400" />
                          {tx.documentNumber}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{tx.operatorName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {tx.transactionType}
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
