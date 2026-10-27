import React, { useState } from 'react';
import { ReceivingDocumentSummary, User } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import {
  Plus, Search, ClipboardList, ArrowRight
} from 'lucide-react';

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

  const counts = {
    ALL:       documents.length,
    PENDING:   documents.filter(d => d.status === 'PENDING').length,
    RECEIVING: documents.filter(d => d.status === 'RECEIVING').length,
    COMPLETED: documents.filter(d => d.status === 'COMPLETED').length,
    CANCELED:  documents.filter(d => d.status === 'CANCELED').length,
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Inbound Receiving</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage delivery manifests, dock inspection workflows, and inventory intake
          </p>
        </div>

        {currentUser?.role === 'SUPERVISOR' && (
          <button
            id="create-document-btn"
            onClick={onOpenCreateModal}
            className="btn-primary inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Inbound Manifest</span>
          </button>
        )}
      </div>

      {/* Metrics Strip (Shopify/Stripe style) */}
      <div className="bg-white border border-slate-200 rounded-lg grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 shadow-sm">
        <div className="p-4">
          <span className="text-xs font-medium text-slate-500 block">Total Inbound Manifests</span>
          <span className="text-2xl font-bold text-slate-900 font-mono mt-1 block">{counts.ALL}</span>
        </div>
        <div className="p-4">
          <span className="text-xs font-medium text-amber-700 block">Pending Dock Arrival</span>
          <span className="text-2xl font-bold text-amber-800 font-mono mt-1 block">{counts.PENDING}</span>
        </div>
        <div className="p-4">
          <span className="text-xs font-medium text-blue-700 block">Active Receiving</span>
          <span className="text-2xl font-bold text-blue-800 font-mono mt-1 block">{counts.RECEIVING}</span>
        </div>
        <div className="p-4">
          <span className="text-xs font-medium text-emerald-700 block">Fully Completed</span>
          <span className="text-2xl font-bold text-emerald-800 font-mono mt-1 block">{counts.COMPLETED}</span>
        </div>
      </div>

      {/* Table Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md border border-slate-200 text-xs">
          {[
            { key: 'ALL', label: 'All' },
            { key: 'PENDING', label: 'Pending' },
            { key: 'RECEIVING', label: 'Receiving' },
            { key: 'COMPLETED', label: 'Completed' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                filterStatus === key
                  ? 'bg-white text-slate-900 font-semibold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {label}
              <span className="ml-1.5 text-[10px] text-slate-400 font-mono">
                {counts[key as keyof typeof counts]}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search document # or vendor..."
            className="enterprise-input w-full pl-8 pr-3 py-1.5 text-xs text-slate-800"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            Loading manifests...
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="py-16 text-center">
            <ClipboardList className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">No documents found</p>
            <p className="text-xs text-slate-400 mt-1">
              {currentUser?.role === 'SUPERVISOR'
                ? 'Create a new inbound receiving document to begin receiving shipments.'
                : 'No delivery documents match the current filter.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-4 py-3">Document Number</th>
                <th className="px-4 py-3">Supplier / Vendor</th>
                <th className="px-4 py-3 hidden lg:table-cell">Expected Arrival</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 hidden md:table-cell">Received Progress</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.map((doc) => {
                const pct = doc.totalItemsCount > 0
                  ? Math.round((doc.fullyReceivedItemsCount / doc.totalItemsCount) * 100)
                  : 0;
                const isComplete = pct === 100;

                return (
                  <tr
                    key={doc.id}
                    onClick={() => onSelectDocument(doc.id)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {doc.documentNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-800">
                      {doc.supplierName}
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell text-slate-500">
                      {doc.expectedDate ? doc.expectedDate.slice(0, 10) : '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <div className="flex items-center gap-2 max-w-[140px]">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                          <div
                            className={`h-full rounded-full ${isComplete ? 'bg-emerald-600' : 'bg-blue-600'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] text-slate-600 font-medium min-w-[28px]">
                          {pct}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); onSelectDocument(doc.id); }}
                        className="btn-secondary inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs"
                      >
                        <span>{doc.status === 'COMPLETED' ? 'View' : 'Open'}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                      </button>
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
