import React, { useState } from 'react';
import { StockTransaction } from '../api/client';
import { History, Search, ArrowUpRight, FileText, User } from 'lucide-react';

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <History className="w-6 h-6 text-amber-400" />
          <span>Stock Transaction Audit Trail</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Immutable ledger of every inventory receipt, delta quantity, reference document, and operator.
        </p>
      </div>

      <div className="flex items-center justify-between bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by SKU, product, doc #, or operator..."
            className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/50 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Product SKU & Name</th>
                <th className="px-6 py-4 text-center">Quantity Delta</th>
                <th className="px-6 py-4">Reference Document</th>
                <th className="px-6 py-4">Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Loading transaction history...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No transactions recorded yet.
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4 text-xs text-slate-400 font-mono">
                      {new Date(tx.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>{tx.transactionType}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs font-semibold text-blue-400">{tx.sku}</div>
                      <div className="text-white font-medium text-xs">{tx.productName}</div>
                    </td>
                    <td className="px-6 py-4 text-center font-mono font-bold text-emerald-400 text-sm">
                      +{tx.quantity}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-300">
                      {tx.documentNumber ? (
                        <span className="inline-flex items-center gap-1 text-blue-400 font-semibold">
                          <FileText className="w-3.5 h-3.5" />
                          <span>{tx.documentNumber}</span>
                        </span>
                      ) : (
                        <span className="text-slate-500">Manual / N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span>{tx.operatorName}</span>
                      </div>
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
