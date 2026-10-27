import React, { useState } from 'react';
import { ReceivingItem } from '../api/client';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

interface ReceiveModalProps {
  item: ReceivingItem | null;
  onClose: () => void;
  onSubmit: (quantity: number) => Promise<void>;
}

export const ReceiveModal: React.FC<ReceiveModalProps> = ({ item, onClose, onSubmit }) => {
  if (!item) return null;

  const [quantity, setQuantity] = useState<number>(item.remainingQuantity > 0 ? 1 : 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOverReceiving = quantity > item.remainingQuantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) {
      setError('Received quantity must be at least 1.');
      return;
    }

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div>
            <h3 className="text-lg font-bold text-white">Record Item Receipt</h3>
            <p className="text-xs text-slate-400">Dock receipt against inbound document</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Item Summary Card */}
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                {item.productSku}
              </span>
              <span className="text-xs text-slate-400">Unit: {item.uom}</span>
            </div>
            <div className="text-sm font-semibold text-white">{item.productName}</div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-700/50 text-center">
              <div className="bg-slate-900/60 p-2 rounded-lg">
                <div className="text-[10px] text-slate-400 uppercase">Expected</div>
                <div className="text-sm font-bold text-white">{item.expectedQuantity}</div>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-lg">
                <div className="text-[10px] text-slate-400 uppercase">Received</div>
                <div className="text-sm font-bold text-emerald-400">{item.receivedQuantity}</div>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-lg">
                <div className="text-[10px] text-slate-400 uppercase">Remaining</div>
                <div className="text-sm font-bold text-amber-400">{item.remainingQuantity}</div>
              </div>
            </div>
          </div>

          {/* Quantity Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Actual Received Quantity This Batch:
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                value={quantity || ''}
                onChange={(e) => {
                  setQuantity(parseInt(e.target.value, 10) || 0);
                  setError(null);
                }}
                className={`w-full px-4 py-3 rounded-xl bg-slate-800 border text-white text-lg font-bold focus:outline-none transition ${
                  isOverReceiving
                    ? 'border-rose-500/80 focus:ring-2 focus:ring-rose-500/30'
                    : 'border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                }`}
                placeholder="Enter quantity..."
                autoFocus
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">
                {item.uom}
              </span>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setQuantity(item.remainingQuantity)}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                All Remaining ({item.remainingQuantity})
              </button>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q + 1))}
                className="px-2 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                +1
              </button>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q + 5))}
                className="px-2 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                +5
              </button>
            </div>
          </div>

          {/* Over-receiving Warning */}
          {isOverReceiving && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <span className="font-semibold">Over-receiving Prohibited:</span> You cannot
                receive {quantity} units. Maximum remaining allowable is{' '}
                <strong>{item.remainingQuantity}</strong>. Backend will reject this transaction.
              </div>
            </div>
          )}

          {/* Server Error Alert */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || quantity <= 0}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg transition ${
                isOverReceiving
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
              }`}
            >
              {loading ? (
                <span>Recording...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Receipt</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
