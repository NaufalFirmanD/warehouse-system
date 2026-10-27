import React, { useState, useEffect } from 'react';
import { ReceivingDocumentSummary, ReceivingDocumentDetail, api, User } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import {
  Truck, Plus, Search, Calendar, ChevronRight, ClipboardList,
  CheckCircle2, AlertCircle, Clock, XCircle, ArrowRight, Package
} from 'lucide-react';

interface ReceivingDocumentsPageProps {
  documents: ReceivingDocumentSummary[];
  currentUser: User | null;
  onSelectDocument: (id: string) => void;
  onOpenCreateModal: () => void;
  loading: boolean;
}

const statusConfig = {
  ALL:       { label: 'All',       color: 'text-gray-400', count_color: 'bg-gray-800 text-gray-300' },
  PENDING:   { label: 'Pending',   color: 'text-amber-400', count_color: 'bg-amber-500/10 text-amber-400' },
  RECEIVING: { label: 'Receiving', color: 'text-blue-400', count_color: 'bg-blue-500/10 text-blue-400' },
  COMPLETED: { label: 'Completed', color: 'text-emerald-400', count_color: 'bg-emerald-500/10 text-emerald-400' },
  CANCELED:  { label: 'Canceled',  color: 'text-gray-500', count_color: 'bg-gray-800 text-gray-500' },
};

export const ReceivingDocumentsPage: React.FC<ReceivingDocumentsPageProps> = ({
  documents, currentUser, onSelectDocument, onOpenCreateModal, loading,
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
    <div className="space-y-6 animate-fade-in-up">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Truck className="w-4 h-4 text-blue-400" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Inbound Receiving</h1>
          </div>
          <p className="text-sm text-gray-500 ml-10.5">
            {documents.length} document{documents.length !== 1 ? 's' : ''} total
            {counts.RECEIVING > 0 && <> · <span className="text-blue-400 font-medium">{counts.RECEIVING} active</span></>}
          </p>
        </div>

        {currentUser?.role === 'SUPERVISOR' && (
          <button
            id="create-document-btn"
            onClick={onOpenCreateModal}
            className="btn-primary flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Inbound Document</span>
          </button>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { status: 'PENDING',   label: 'Pending Docs',     icon: Clock,        gradient: 'from-amber-500/10 to-orange-500/5',   border: 'border-amber-500/15',  text: 'text-amber-400'  },
          { status: 'RECEIVING', label: 'Active Receiving',  icon: Truck,        gradient: 'from-blue-500/10 to-indigo-500/5',    border: 'border-blue-500/15',   text: 'text-blue-400'   },
          { status: 'COMPLETED', label: 'Completed',         icon: CheckCircle2, gradient: 'from-emerald-500/10 to-green-500/5',  border: 'border-emerald-500/15',text: 'text-emerald-400'},
          { status: 'CANCELED',  label: 'Canceled',          icon: XCircle,      gradient: 'from-gray-800/60 to-gray-800/30',     border: 'border-gray-700/50',   text: 'text-gray-500'   },
        ].map(({ status, label, icon: Icon, gradient, border, text }) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`
              relative bg-gradient-to-br ${gradient} border ${border}
              rounded-2xl p-4 text-left transition-all duration-200 group
              ${filterStatus === status ? 'ring-1 ring-inset ring-blue-500/30 scale-[0.99]' : 'hover:scale-[1.01]'}
            `}
          >
            <div className={`text-2xl font-bold counter-text ${text} mb-1`}>
              {counts[status as keyof typeof counts]}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">{label}</span>
              <Icon className={`w-4 h-4 ${text} opacity-60 group-hover:opacity-100 transition-opacity`} />
            </div>
          </button>
        ))}
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-1 bg-gray-900/80 rounded-xl p-1 border border-gray-800">
          {Object.entries(statusConfig).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                filterStatus === key
                  ? 'bg-gray-700 text-white shadow-sm'
                  : `${cfg.color} hover:bg-gray-800`
              }`}
            >
              {cfg.label}
              {key !== 'ALL' && counts[key as keyof typeof counts] > 0 && (
                <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${cfg.count_color}`}>
                  {counts[key as keyof typeof counts]}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by document # or supplier..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-900 border border-gray-800 text-sm text-gray-300 placeholder-gray-600 input-glow"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading documents...</p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-800/60 border border-gray-700/60 flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-6 h-6 text-gray-600" />
            </div>
            <p className="text-sm font-medium text-gray-400">No documents found</p>
            <p className="text-xs text-gray-600 mt-1">
              {currentUser?.role === 'SUPERVISOR' ? 'Create a new inbound receiving document to get started.' : 'No receiving documents match your current filter.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800/60">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-widest">Document #</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-widest">Supplier / Vendor</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-widest hidden lg:table-cell">Expected Date</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-widest">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-widest hidden md:table-cell">Completion</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.map((doc, idx) => {
                const pct = doc.totalItemsCount > 0
                  ? Math.round((doc.fullyReceivedItemsCount / doc.totalItemsCount) * 100)
                  : 0;
                const isComplete = pct === 100;

                return (
                  <tr
                    key={doc.id}
                    onClick={() => onSelectDocument(doc.id)}
                    className="table-row-hover border-b border-gray-800/40 last:border-0 cursor-pointer group"
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    <td className="px-5 py-4">
                      <span className="font-mono text-sm font-semibold text-blue-400 group-hover:text-blue-300 transition-colors">
                        {doc.documentNumber}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-medium text-gray-200">{doc.supplierName}</span>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <span className="flex items-center gap-1.5 text-gray-400 text-sm">
                        <Calendar className="w-3.5 h-3.5 text-gray-600" />
                        {doc.expectedDate ? doc.expectedDate.slice(0, 10) : <span className="text-gray-600">—</span>}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <div className="flex items-center gap-3 max-w-[160px]">
                        <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isComplete ? 'bg-emerald-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className={`text-xs font-semibold tabular-nums min-w-[28px] ${isComplete ? 'text-emerald-400' : 'text-gray-400'}`}>
                          {pct}%
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); onSelectDocument(doc.id); }}
                        className={`
                          inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150
                          ${doc.status === 'COMPLETED' || doc.status === 'CANCELED'
                            ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                            : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white border border-blue-500/20'
                          }
                        `}
                      >
                        {doc.status === 'COMPLETED' ? 'View' : doc.status === 'CANCELED' ? 'Details' : 'Receive'}
                        <ArrowRight className="w-3 h-3" />
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
