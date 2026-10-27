import React, { useState, useEffect } from 'react';
import { api, ReceivingDocumentDetail, ReceivingItem, User } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { ReceiveModal } from '../components/ReceiveModal';
import {
  ArrowLeft, CheckCircle2, AlertTriangle, Lock,
  Truck, Calendar, User as UserIcon, Check, ChevronRight
} from 'lucide-react';

interface ReceivingDetailPageProps {
  documentId: string;
  currentUser: User | null;
  onBack: () => void;
}

export const ReceivingDetailPage: React.FC<ReceivingDetailPageProps> = ({
  documentId,
  currentUser,
  onBack,
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

  useEffect(() => {
    fetchDoc();
  }, [documentId]);

  const handleRecordReceipt = async (quantity: number) => {
    if (!selectedItemForReceive || !doc) return;
    await api.recordReceipt(doc.id, selectedItemForReceive.id, quantity);
    await fetchDoc();
    showToast(`Received ${quantity} ${selectedItemForReceive.uom} of ${selectedItemForReceive.productName}`);
  };

  const handleCompleteDocument = async () => {
    if (!doc) return;
    setActionLoading(true);
    try {
      await api.updateDocumentStatus(doc.id, 'COMPLETED');
      await fetchDoc();
      showToast('Document marked as COMPLETED.');
    } catch (err: any) {
      alert(`Error completing document: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-slate-400">
        Loading document details...
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-8 text-center max-w-md mx-auto my-12 shadow-sm">
        <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-slate-900 mb-1">{error || 'Document not found'}</h3>
        <button
          onClick={onBack}
          className="btn-secondary mt-4 px-3 py-1.5 rounded-md text-xs"
        >
          Return to manifest list
        </button>
      </div>
    );
  }

  const totalExpected = doc.items.reduce((s, i) => s + i.expectedQuantity, 0);
  const totalReceived = doc.items.reduce((s, i) => s + i.receivedQuantity, 0);
  const overallPct = totalExpected > 0 ? Math.round((totalReceived / totalExpected) * 100) : 0;
  const allItemsReceived = doc.items.length > 0 && doc.items.every((i) => i.receivedQuantity >= i.expectedQuantity);
  const isLocked = doc.status === 'COMPLETED' || doc.status === 'CANCELED';
  const isSupervisor = currentUser?.role === 'SUPERVISOR';

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-lg shadow-xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          {toast}
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <button
          onClick={onBack}
          className="hover:text-slate-900 flex items-center gap-1 font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Inbound Receiving</span>
        </button>
        <ChevronRight className="w-3 h-3 text-slate-300" />
        <span className="font-mono text-slate-800 font-semibold">{doc.documentNumber}</span>
      </div>

      {/* Manifest Overview Header Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Manifest Meta */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xl font-bold text-slate-900 tracking-tight">
                {doc.documentNumber}
              </span>
              <StatusBadge status={doc.status} />
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-500">Vendor:</span>
                <span className="font-medium text-slate-900">{doc.supplierName}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-500">Expected:</span>
                <span className="font-medium text-slate-900">
                  {doc.expectedDate ? doc.expectedDate.slice(0, 10) : '—'}
                </span>
              </div>
              {doc.createdByName && (
                <div className="flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-500">Created by:</span>
                  <span className="font-medium text-slate-900">{doc.createdByName}</span>
                </div>
              )}
            </div>

            {doc.notes && (
              <p className="text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded border border-slate-200/80 max-w-2xl">
                {doc.notes}
              </p>
            )}
          </div>

          {/* Manifest Progress & Supervisor Finalization */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 min-w-[260px] space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Manifest Intake</span>
              <span className="font-mono font-bold text-slate-900">{overallPct}%</span>
            </div>

            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  overallPct === 100 ? 'bg-emerald-600' : 'bg-blue-600'
                }`}
                style={{ width: `${overallPct}%` }}
              />
            </div>

            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>{totalReceived} received</span>
              <span>{totalExpected} expected</span>
            </div>

            {!isLocked && (
              <button
                onClick={handleCompleteDocument}
                disabled={actionLoading || !allItemsReceived || !isSupervisor}
                className={`w-full py-2 rounded-md text-xs font-medium transition-all ${
                  allItemsReceived && isSupervisor
                    ? 'btn-primary'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
                title={
                  !isSupervisor
                    ? 'Only Supervisors can finalize delivery documents'
                    : !allItemsReceived
                    ? 'All items must be 100% received first'
                    : undefined
                }
              >
                {actionLoading ? 'Finalizing...' : 'Finalize & Complete Document'}
              </button>
            )}

            {isLocked && (
              <div className="flex items-center justify-center gap-1 text-xs text-slate-500 pt-1">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>Document Closed ({doc.status})</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manifest Line Items Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-900">
            Delivery Line Items ({doc.items.length})
          </span>
          {!isLocked && (
            <span className="text-[11px] text-slate-500">
              Click <strong className="text-slate-700">Receive</strong> to record actual quantity at dock
            </span>
          )}
        </div>

        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <th className="px-4 py-3">Product SKU & Name</th>
              <th className="px-4 py-3 text-center">Expected</th>
              <th className="px-4 py-3 text-center">Received</th>
              <th className="px-4 py-3 text-center">Remaining Balance</th>
              <th className="px-4 py-3">Fulfillment</th>
              <th className="px-4 py-3 text-right">Dock Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {doc.items.map((item) => {
              const pct = Math.min(100, Math.round((item.receivedQuantity / item.expectedQuantity) * 100));
              const isDone = item.receivedQuantity >= item.expectedQuantity;

              return (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-xs font-semibold text-slate-900 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded mr-2">
                      {item.productSku}
                    </span>
                    <span className="font-medium text-slate-900">{item.productName}</span>
                    <span className="text-[11px] text-slate-400 ml-2">({item.uom})</span>
                  </td>
                  <td className="px-4 py-3.5 text-center font-mono font-medium text-slate-700">
                    {item.expectedQuantity}
                  </td>
                  <td className="px-4 py-3.5 text-center font-mono font-semibold">
                    <span className={isDone ? 'text-emerald-700' : 'text-blue-700'}>
                      {item.receivedQuantity}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center font-mono font-semibold">
                    <span className={item.remainingQuantity > 0 ? 'text-amber-700' : 'text-slate-400'}>
                      {item.remainingQuantity}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2 max-w-[130px]">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <div
                          className={`h-full rounded-full ${isDone ? 'bg-emerald-600' : 'bg-blue-600'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px] text-slate-500 min-w-[28px]">{pct}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {isDone ? (
                      <span className="inline-flex items-center gap-1 font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded text-[11px]">
                        <Check className="w-3.5 h-3.5" />
                        Completed
                      </span>
                    ) : isLocked ? (
                      <span className="text-slate-400 text-xs">Locked</span>
                    ) : (
                      <button
                        id={`receive-btn-${item.id}`}
                        onClick={() => setSelectedItemForReceive(item)}
                        className="btn-primary px-3 py-1 rounded text-xs"
                      >
                        Receive
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
