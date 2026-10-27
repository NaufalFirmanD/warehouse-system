import React, { useState, useEffect } from 'react';
import { api, ReceivingDocumentDetail, ReceivingItem, User } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { ReceiveModal } from '../components/ReceiveModal';
import {
  ArrowLeft, CheckCircle2, AlertTriangle, PackageCheck, Lock,
  Truck, Calendar, User as UserIcon, ClipboardCheck, Info, ChevronRight
} from 'lucide-react';

interface ReceivingDetailPageProps {
  documentId: string;
  currentUser: User | null;
  onBack: () => void;
}

export const ReceivingDetailPage: React.FC<ReceivingDetailPageProps> = ({
  documentId, currentUser, onBack,
}) => {
  const [doc, setDoc] = useState<ReceivingDocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItemForReceive, setSelectedItemForReceive] = useState<ReceivingItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchDoc = async () => {
    try {
      setLoading(true);
      const data = await api.getDocument(documentId);
      setDoc(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load document details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDoc(); }, [documentId]);

  const handleRecordReceipt = async (quantity: number) => {
    if (!selectedItemForReceive || !doc) return;
    await api.recordReceipt(doc.id, selectedItemForReceive.id, quantity);
    await fetchDoc();
    showToast(`✓ Received ${quantity} ${selectedItemForReceive.uom} of ${selectedItemForReceive.productName}`);
  };

  const handleCompleteDocument = async () => {
    if (!doc) return;
    setActionLoading(true);
    try {
      await api.updateDocumentStatus(doc.id, 'COMPLETED');
      await fetchDoc();
      showToast('Document marked as COMPLETED');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center animate-fade-in-up">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-500">Loading receiving document...</p>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="py-16 text-center animate-fade-in-up">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7 text-rose-400" />
        </div>
        <h3 className="text-base font-semibold text-gray-200 mb-1">{error || 'Document not found'}</h3>
        <button onClick={onBack} className="mt-4 px-4 py-2 rounded-xl bg-gray-800 text-sm font-medium text-gray-300 hover:bg-gray-700 transition">
          Go back
        </button>
      </div>
    );
  }

  const totalExpected = doc.items.reduce((s, i) => s + i.expectedQuantity, 0);
  const totalReceived = doc.items.reduce((s, i) => s + i.receivedQuantity, 0);
  const overallPct = totalExpected > 0 ? Math.round((totalReceived / totalExpected) * 100) : 0;
  const allItemsReceived = doc.items.length > 0 && doc.items.every(i => i.receivedQuantity >= i.expectedQuantity);
  const isLocked = doc.status === 'COMPLETED' || doc.status === 'CANCELED';

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-gray-800 border border-emerald-500/30 text-emerald-400 text-sm font-medium px-4 py-3 rounded-xl shadow-2xl animate-slide-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {toast}
        </div>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-300 flex items-center gap-1 transition font-medium">
          <ArrowLeft className="w-3.5 h-3.5" />
          Receiving
        </button>
        <ChevronRight className="w-3 h-3 text-gray-700" />
        <span className="font-mono text-blue-400 font-semibold text-xs">{doc.documentNumber}</span>
      </div>

      {/* Header Card */}
      <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          {/* Left */}
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-xl font-bold text-white">{doc.documentNumber}</span>
              <StatusBadge status={doc.status} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <Truck className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                <span className="font-medium text-gray-200">{doc.supplierName}</span>
              </div>
              {doc.expectedDate && (
                <div className="flex items-center gap-2 text-gray-400">
                  <Calendar className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                  <span>{doc.expectedDate.slice(0, 10)}</span>
                </div>
              )}
              {doc.createdByName && (
                <div className="flex items-center gap-2 text-gray-400">
                  <UserIcon className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                  <span>{doc.createdByName}</span>
                </div>
              )}
            </div>

            {doc.notes && (
              <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-800/40 rounded-xl px-3 py-2 border border-gray-700/40">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-gray-600" />
                {doc.notes}
              </div>
            )}
          </div>

          {/* Overall Progress */}
          <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-4 min-w-[180px] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 font-medium">Overall Progress</span>
              <span className={`font-bold tabular-nums ${overallPct === 100 ? 'text-emerald-400' : 'text-blue-400'}`}>{overallPct}%</span>
            </div>
            <div className="h-2.5 bg-gray-900 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${overallPct === 100 ? 'bg-gradient-to-r from-emerald-500 to-green-400' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`}
                style={{ width: `${overallPct}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{totalReceived} received</span>
              <span>{totalExpected} expected</span>
            </div>

            {/* Complete button */}
            {!isLocked && (
              <button
                onClick={handleCompleteDocument}
                disabled={actionLoading || !allItemsReceived}
                className={`w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  allItemsReceived
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-700/40'
                }`}
                title={!allItemsReceived ? 'All items must be fully received first' : undefined}
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                {actionLoading ? 'Processing...' : 'Mark Completed'}
              </button>
            )}

            {isLocked && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Lock className="w-3 h-3" />
                <span>Document locked ({doc.status})</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-800/60">
          <div className="flex items-center gap-2.5">
            <PackageCheck className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-semibold text-gray-200">Line Items</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-500 font-medium">{doc.items.length}</span>
          </div>
          {!isLocked && (
            <p className="text-xs text-gray-600">Click <span className="text-blue-400">"Receive Goods"</span> to log receipt at dock</p>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-600 uppercase tracking-widest font-semibold border-b border-gray-800/40">
                <th className="text-left px-5 py-3">Product</th>
                <th className="text-center px-4 py-3">Expected</th>
                <th className="text-center px-4 py-3">Received</th>
                <th className="text-center px-4 py-3">Remaining</th>
                <th className="px-5 py-3">Progress</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {doc.items.map((item) => {
                const pct = Math.min(100, Math.round((item.receivedQuantity / item.expectedQuantity) * 100));
                const isDone = item.receivedQuantity >= item.expectedQuantity;

                return (
                  <tr key={item.id} className="table-row-hover border-b border-gray-800/30 last:border-0">
                    <td className="px-5 py-4">
                      <div className="font-mono text-xs font-bold text-blue-400 mb-0.5">{item.productSku}</div>
                      <div className="font-medium text-gray-200 text-sm">{item.productName}</div>
                      <div className="text-xs text-gray-600 mt-0.5">{item.uom}</div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="text-base font-bold text-gray-300 tabular-nums">{item.expectedQuantity}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`text-base font-bold tabular-nums ${isDone ? 'text-emerald-400' : 'text-blue-400'}`}>{item.receivedQuantity}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`text-base font-bold tabular-nums ${item.remainingQuantity > 0 ? 'text-amber-400' : 'text-gray-600'}`}>
                        {item.remainingQuantity}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="w-36 space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-gray-600">
                          <span>{pct}%</span>
                          {isDone && <span className="text-emerald-500 font-semibold">✓ Done</span>}
                        </div>
                        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isDone ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                                     : pct > 0 ? 'bg-gradient-to-r from-blue-500 to-indigo-400'
                                     : 'bg-transparent'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {isDone ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Complete
                        </span>
                      ) : isLocked ? (
                        <span className="text-xs text-gray-700 flex items-center gap-1 justify-end">
                          <Lock className="w-3 h-3" /> Locked
                        </span>
                      ) : (
                        <button
                          id={`receive-btn-${item.id}`}
                          onClick={() => setSelectedItemForReceive(item)}
                          className="btn-primary px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white"
                        >
                          Receive Goods
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedItemForReceive && (
        <ReceiveModal
          item={selectedItemForReceive}
          onClose={() => setSelectedItemForReceive(null)}
          onSubmit={handleRecordReceipt}
        />
      )}
    </div>
  );
};
