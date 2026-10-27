import React, { useState } from 'react';
import { StockTransaction } from '../api/client';
import { History, Search, ArrowUpRight, FileText } from 'lucide-react';

interface TransactionHistoryPageProps {
  transactions: StockTransaction[];
  loading: boolean;
}

export const TransactionHistoryPage: React.FC<TransactionHistoryPageProps> = ({ transactions, loading }) => {
  const [search, setSearch] = useState('');

  const filtered = transactions.filter(tx =>
    tx.sku.toLowerCase().includes(search.toLowerCase()) ||
    tx.productName.toLowerCase().includes(search.toLowerCase()) ||
    (tx.documentNumber || '').toLowerCase().includes(search.toLowerCase()) ||
    tx.operatorName.toLowerCase().includes(search.toLowerCase())
  );

  const totalMoved = transactions.reduce((a, t) => a + t.quantity, 0);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return { date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <History className="w-4 h-4 text-amber-400" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Transaction History</h1>
        </div>
        <p className="text-sm text-gray-500 ml-10.5">Immutable audit trail of all stock movements</p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-4 col-span-2 sm:col-span-1">
          <div className="text-2xl font-bold text-white counter-text">{transactions.length}</div>
          <div className="text-xs text-gray-500 mt-0.5">Total Transactions</div>
        </div>
        <div className="bg-gray-900/60 border border-emerald-500/15 rounded-2xl p-4 card-glow-green">
          <div className="text-2xl font-bold text-emerald-400 counter-text">+{totalMoved.toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-0.5">Total Units Received</div>
        </div>
        <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-4">
          <div className="text-2xl font-bold text-blue-400 counter-text">
            {new Set(transactions.map(t => t.documentNumber)).size}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">Documents Referenced</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by SKU, product, doc # or operator..."
          className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-900 border border-gray-800 text-sm text-gray-300 placeholder-gray-600 input-glow"
        />
      </div>

      {/* Ledger */}
      <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading ledger...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <History className="w-8 h-8 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No transactions recorded yet</p>
            <p className="text-xs text-gray-700 mt-1">Transactions appear when goods are received at the dock</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800/60">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-widest">Timestamp</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-widest">Product</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-widest">Delta</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-widest hidden md:table-cell">Reference Doc</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-widest hidden lg:table-cell">Operator</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-widest">Type</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx) => {
                const { date, time } = formatDate(tx.createdAt);
                return (
                  <tr key={tx.id} className="table-row-hover border-b border-gray-800/30 last:border-0">
                    <td className="px-5 py-4">
                      <div className="text-xs font-medium text-gray-300">{date}</div>
                      <div className="text-[11px] text-gray-600 mt-0.5 font-mono">{time}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-mono text-xs font-bold text-blue-400">{tx.sku}</div>
                      <div className="text-gray-300 text-xs mt-0.5 font-medium">{tx.productName}</div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-bold font-mono text-base">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        +{tx.quantity}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      {tx.documentNumber ? (
                        <div className="inline-flex items-center gap-1.5 font-mono text-xs text-blue-400 font-semibold bg-blue-500/5 border border-blue-500/10 px-2 py-1 rounded-lg">
                          <FileText className="w-3 h-3 text-blue-500/50" />
                          {tx.documentNumber}
                        </div>
                      ) : (
                        <span className="text-gray-700 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <div className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-300">
                          {tx.operatorName.charAt(0)}
                        </div>
                        {tx.operatorName}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 tracking-wide uppercase">
                        {tx.transactionType.replace('_', ' ')}
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
