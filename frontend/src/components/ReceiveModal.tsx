import React, { useState } from 'react';
import { ReceivingItem } from '../api/client';
import { X, AlertCircle } from 'lucide-react';

interface ReceiveModalProps {
  item: ReceivingItem;
  onClose: () => void;
  onSubmit: (quantity: number) => Promise<void>;
}

export const ReceiveModal: React.FC<ReceiveModalProps> = ({ item, onClose, onSubmit }) => {
  const [quantity, setQuantity] = useState<number>(item.remainingQuantity);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = quantity > 0 && quantity <= item.remainingQuantity;
  const isOver = quantity > item.remainingQuantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    setError(null);
    try {
      await onSubmit(quantity);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record receipt.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-lg w-full max-w-md shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Record Dock Receipt</h3>
            <p className="text-xs text-slate-500 mt-0.5">Physical count verification at inbound unloading bay</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Item Overview Card */}
        <div className="p-5 space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-md p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded">
                {item.productSku}
              </span>
              <span className="text-xs font-mono font-medium text-slate-500">Unit: {item.uom}</span>
            </div>
            <div className="text-sm font-semibold text-slate-900">{item.productName}</div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/70 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Expected</span>
                <span className="font-mono font-semibold text-slate-800">{item.expectedQuantity}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Received</span>
                <span className="font-mono font-semibold text-blue-700">{item.receivedQuantity}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Remaining</span>
                <span className="font-mono font-semibold text-amber-700">{item.remainingQuantity}</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">Actual Count Received *</label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setQuantity(item.remainingQuantity)}
                    className="text-[11px] font-medium text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Receive Full Balance ({item.remainingQuantity})
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="btn-secondary px-3 py-2 text-sm font-bold rounded"
                >
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  max={item.remainingQuantity}
                  value={quantity || ''}
                  onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)}
                  className={`enterprise-input w-full px-3 py-2 text-center font-mono text-base font-bold text-slate-900 ${
                    isOver ? 'border-red-500 focus:border-red-500' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(item.remainingQuantity, q + 1))}
                  className="btn-secondary px-3 py-2 text-sm font-bold rounded"
                >
                  +
                </button>
              </div>

              {isOver && (
                <div className="mt-2 text-xs text-red-600 font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  Cannot receive more than remaining balance ({item.remainingQuantity} {item.uom})
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="btn-secondary px-3.5 py-1.5 rounded text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !isValid}
                className="btn-primary inline-flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Confirm Receipt'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
