import React, { useState, useEffect } from 'react';
import { api, ReceivingDocumentDetail, ReceivingItem, User } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { ReceiveModal } from '../components/ReceiveModal';
import {
  ArrowLeft,
  Truck,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  User as UserIcon,
  PackageCheck,
  Lock,
} from 'lucide-react';

interface ReceivingDetailPageProps {
  documentId: string;
  currentUser: User | null;
  onBack: () => void;
}

export const ReceivingDetailPage: React.FC<ReceivingDetailPageProps> = ({
  documentId,
  onBack,
}) => {
  const [doc, setDoc] = useState<ReceivingDocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItemForReceive, setSelectedItemForReceive] = useState<ReceivingItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

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

  useEffect(() => {
    fetchDoc();
  }, [documentId]);

  const handleRecordReceipt = async (quantity: number) => {
    if (!selectedItemForReceive || !doc) return;
    await api.recordReceipt(doc.id, selectedItemForReceive.id, quantity);
    // Refresh document state
    await fetchDoc();
  };

  const handleCompleteDocument = async () => {
    if (!doc) return;
    setActionLoading(true);
    try {
      await api.updateDocumentStatus(doc.id, 'COMPLETED');
      await fetchDoc();
    } catch (err: any) {
      alert(`Error completing document: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm">Loading document details & items...</p>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/30 p-6 rounded-2xl text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
        <div className="text-rose-400 font-semibold">{error || 'Document not found'}</div>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-slate-800 text-sm font-semibold text-white hover:bg-slate-700"
        >
          Back to Documents
        </button>
      </div>
    );
  }

  const allItemsReceived =
    doc.items.length > 0 && doc.items.every((it) => it.receivedQuantity === it.expectedQuantity);
  const isLocked = doc.status === 'COMPLETED' || doc.status === 'CANCELED';

  return (
    <div className="space-y-6">
      {/* Back Button & Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Document List</span>
        </button>

        {/* Manual completion button if supervisor wants to trigger and conditions met */}
        {doc.status !== 'COMPLETED' && doc.status !== 'CANCELED' && (
          <button
            onClick={handleCompleteDocument}
            disabled={actionLoading || !allItemsReceived}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              allItemsReceived
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
            }`}
            title={
              allItemsReceived
                ? 'Mark this receiving document as completed'
                : 'Cannot complete until all items have been 100% received'
            }
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Mark as Completed</span>
          </button>
        )}
      </div>

      {/* Document Overview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-mono font-bold text-blue-400">{doc.documentNumber}</h1>
              <StatusBadge status={doc.status} />
            </div>
            <p className="text-sm font-medium text-slate-300 mt-1 flex items-center gap-2">
              <Truck className="w-4 h-4 text-slate-500" />
              <span>Supplier: <strong>{doc.supplierName}</strong></span>
            </p>
          </div>

          <div className="text-right sm:border-l sm:border-slate-800 sm:pl-6">
            <div className="text-xs text-slate-400 flex items-center gap-1.5 justify-end">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Expected: {doc.expectedDate ? doc.expectedDate.slice(0, 10) : 'Immediate'}</span>
            </div>
            {doc.createdByName && (
              <div className="text-xs text-slate-400 flex items-center gap-1.5 justify-end mt-1">
                <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                <span>Created by: {doc.createdByName}</span>
              </div>
            )}
          </div>
        </div>

        {doc.notes && (
          <div className="text-xs text-slate-400 bg-slate-800/40 p-3 rounded-xl border border-slate-800">
            <strong className="text-slate-300">Delivery Notes:</strong> {doc.notes}
          </div>
        )}

        {isLocked && (
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300 flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              This receiving document is <strong>{doc.status}</strong>. Line items are locked and no
              further receipts can be logged.
            </span>
          </div>
        )}
      </div>

      {/* Line Items Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-800/30 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-indigo-400" />
            <span>Inbound Line Items ({doc.items.length})</span>
          </h2>
          <span className="text-xs text-slate-400">
            Click "Receive" to record physical quantities received at the dock
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/50 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Product SKU & Name</th>
                <th className="px-6 py-4 text-center">Expected</th>
                <th className="px-6 py-4 text-center">Received</th>
                <th className="px-6 py-4 text-center">Remaining</th>
                <th className="px-6 py-4">Receipt Progress</th>
                <th className="px-6 py-4 text-right">Dock Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {doc.items.map((item) => {
                const percent = Math.min(
                  100,
                  Math.round((item.receivedQuantity / item.expectedQuantity) * 100)
                );
                const isItemComplete = item.receivedQuantity >= item.expectedQuantity;

                return (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs font-semibold text-blue-400">
                        {item.productSku}
                      </div>
                      <div className="font-medium text-white text-sm">{item.productName}</div>
                      <div className="text-[11px] text-slate-400">Unit: {item.uom}</div>
                    </td>

                    <td className="px-6 py-4 text-center font-bold text-white">
                      {item.expectedQuantity}
                    </td>

                    <td className="px-6 py-4 text-center font-bold text-emerald-400">
                      {item.receivedQuantity}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span
                        className={`font-bold ${
                          item.remainingQuantity > 0 ? 'text-amber-400' : 'text-slate-500'
                        }`}
                      >
                        {item.remainingQuantity}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="w-full max-w-xs space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className={isItemComplete ? 'text-emerald-400' : 'text-slate-400'}>
                            {percent}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 rounded-full ${
                              isItemComplete
                                ? 'bg-emerald-500'
                                : percent > 0
                                ? 'bg-blue-500'
                                : 'bg-transparent'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      {isItemComplete ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Fully Received</span>
                        </span>
                      ) : isLocked ? (
                        <span className="text-xs text-slate-500">Locked</span>
                      ) : (
                        <button
                          onClick={() => setSelectedItemForReceive(item)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition"
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

      {/* Modal for recording quantity */}
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
