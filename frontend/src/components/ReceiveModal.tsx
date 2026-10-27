import React, { useState } from 'react';
import { ReceivingItem } from '../api/client';
import { AlertCircle, CheckCircle2, X, Minus, Plus } from 'lucide-react';

interface ReceiveModalProps {
  item: ReceivingItem | null;
  onClose: () => void;
  onSubmit: (quantity: number) => Promise<void>;
}

export const ReceiveModal: React.FC<ReceiveModalProps> = ({ item, onClose, onSubmit }) => {
  if (!item) return null;

  const [quantity, setQuantity] = useState<number>(Math.min(10, item.remainingQuantity));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOverReceiving = quantity > item.remainingQuantity;
  const isValid = quantity > 0 && quantity <= item.remainingQuantity;
  const fillPct = item.expectedQuantity > 0
    ? Math.round(((item.receivedQuantity + (isValid ? quantity : 0)) / item.expectedQuantity) * 100)
    : 0;

  const adjust = (delta: number) => {
    setQuantity(q => Math.max(1, Math.min(item.remainingQuantity, q + delta)));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) { setError('Quantity must be at least 1.'); return; }
    setLoading(true); setError(null);
    try {
      await onSubmit(quantity);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Receipt failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-gray-900 border border-gray-700/80 rounded-2xl w-full max-w-md shadow-2xl shadow-black/60 animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-800/60">
          <div>
            <h3 className="text-base font-bold text-white">Record Receipt</h3>
            <p className="text-xs text-gray-500 mt-0.5">Log physical dock arrival for this line item</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-gray-300 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Product Info */}
          <div className="bg-gray-800/50 border border-gray-700/40 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-lg border border-blue-500/15">{item.productSku}</span>
              <span className="text-xs text-gray-500">{item.uom}</span>
            </div>
            <div className="text-sm font-semibold text-gray-200">{item.productName}</div>

            {/* Mini stats */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Expected', value: item.expectedQuantity, color: 'text-gray-300' },
                { label: 'Received', value: item.receivedQuantity, color: 'text-emerald-400' },
                { label: 'Remaining', value: item.remainingQuantity, color: 'text-amber-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-gray-900/60 rounded-lg p-2 text-center">
                  <div className={`text-lg font-bold tabular-nums ${color}`}>{value}</div>
                  <div className="text-[10px] text-gray-600 mt-0.5 uppercase font-medium">{label}</div>
                </div>
              ))}
            </div>

            {/* Projected progress bar */}
            <div>
              <div className="flex items-center justify-between text-[10px] text-gray-600 mb-1">
                <span>Projected after this receipt</span>
                <span className={`font-semibold ${fillPct >= 100 ? 'text-emerald-400' : 'text-blue-400'}`}>{Math.min(100, fillPct)}%</span>
              </div>
              <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    fillPct >= 100 ? 'bg-emerald-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(100, fillPct)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quantity Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-400">Quantity to Receive</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => adjust(-1)}
                className="w-10 h-10 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition shrink-0"
              >
                <Minus className="w-4 h-4" />
              </button>

              <input
                type="number"
                min="1"
                max={item.remainingQuantity}
                value={quantity || ''}
                onChange={(e) => { setQuantity(parseInt(e.target.value, 10) || 0); setError(null); }}
                className={`flex-1 text-center py-2.5 text-xl font-bold rounded-xl bg-gray-800 border transition text-white input-glow ${
                  isOverReceiving ? 'border-rose-500/60' : 'border-gray-700'
                }`}
                autoFocus
              />

              <button
                type="button"
                onClick={() => adjust(1)}
                className="w-10 h-10 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition shrink-0"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-600 shrink-0">Quick set:</span>
              {[item.remainingQuantity].concat([10, 25, 50].filter(v => v < item.remainingQuantity)).sort((a, b) => a - b).slice(0, 4).map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => { setQuantity(v); setError(null); }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                    quantity === v ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
                  }`}
                >
                  {v === item.remainingQuantity ? `Max (${v})` : v}
                </button>
              ))}
            </div>
          </div>

          {/* Error / Warning */}
          {isOverReceiving && (
            <div className="flex items-start gap-2.5 text-xs bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Over-receiving blocked</span>
                <span className="text-rose-400/80"> — maximum allowed is <strong>{item.remainingQuantity} {item.uom}</strong>.</span>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2.5 text-xs bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !isValid}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                isValid
                  ? 'btn-primary text-white'
                  : 'bg-gray-800 text-gray-600 border border-gray-700 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Recording...</>
              ) : (
                <><CheckCircle2 className="w-4 h-4" /> Confirm Receipt</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
