import React, { useState } from 'react';
import { ReceivingDocumentSummary, User } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { Truck, Plus, Search, Calendar, ChevronRight } from 'lucide-react';

interface ReceivingDocumentsPageProps {
  documents: ReceivingDocumentSummary[];
  currentUser: User | null;
  onSelectDocument: (id: string) => void;
  onOpenCreateModal: () => void;
  loading: boolean;
}

export const ReceivingDocumentsPage: React.FC<ReceivingDocumentsPageProps> = ({
  documents,
  currentUser,
  onSelectDocument,
  onOpenCreateModal,
  loading,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  const filteredDocs = documents.filter((doc) => {
    const matchesStatus = filterStatus === 'ALL' || doc.status === filterStatus;
    const matchesSearch =
      doc.documentNumber.toLowerCase().includes(search.toLowerCase()) ||
      doc.supplierName.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Truck className="w-6 h-6 text-blue-400" />
            <span>Inbound Receiving Documents</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track shipment manifests, receive incoming inventory, and manage dock documents.
          </p>
        </div>

        <div>
          {currentUser?.role === 'SUPERVISOR' ? (
            <button
              onClick={onOpenCreateModal}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Inbound Document</span>
            </button>
          ) : (
            <div className="text-xs text-slate-400 bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700/60 text-center">
              Operator Mode: Select a pending document below to receive goods
            </div>
          )}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {['ALL', 'PENDING', 'RECEIVING', 'COMPLETED', 'CANCELED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                filterStatus === st
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search document # or supplier..."
            className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/50 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Document #</th>
                <th className="px-6 py-4">Supplier / Vendor</th>
                <th className="px-6 py-4">Expected Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Items Received</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Loading documents...
                  </td>
                </tr>
              ) : filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No receiving documents found.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => {
                  const itemsRatio =
                    doc.totalItemsCount > 0
                      ? `${doc.fullyReceivedItemsCount} / ${doc.totalItemsCount}`
                      : '0 / 0';
                  const isFinished =
                    doc.totalItemsCount > 0 &&
                    doc.fullyReceivedItemsCount === doc.totalItemsCount;

                  return (
                    <tr
                      key={doc.id}
                      onClick={() => onSelectDocument(doc.id)}
                      className="hover:bg-slate-800/40 cursor-pointer transition"
                    >
                      <td className="px-6 py-4 font-mono font-bold text-blue-400">
                        {doc.documentNumber}
                      </td>
                      <td className="px-6 py-4 font-medium text-white">{doc.supplierName}</td>
                      <td className="px-6 py-4 text-slate-400 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{doc.expectedDate ? doc.expectedDate.slice(0, 10) : 'Not specified'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={doc.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-semibold text-xs ${
                              isFinished ? 'text-emerald-400' : 'text-slate-300'
                            }`}
                          >
                            {itemsRatio} items fully received
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectDocument(doc.id);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-300 transition"
                        >
                          <span>{doc.status === 'COMPLETED' ? 'View Details' : 'Receive / Inspect'}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
