import React, { useState } from 'react';
import { Product } from '../api/client';
import { Plus, Trash2, X, AlertCircle, Package, Tag } from 'lucide-react';

interface CreateDocumentModalProps {
  products: Product[];
  onClose: () => void;
  onSubmit: (data: {
    supplierName: string;
    expectedDate?: string;
    notes?: string;
    items: Array<{ productId: string; expectedQuantity: number }>;
  }) => Promise<void>;
}

export const CreateDocumentModal: React.FC<CreateDocumentModalProps> = ({ products, onClose, onSubmit }) => {
  const [supplierName, setSupplierName] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<Array<{ productId: string; expectedQuantity: number }>>([
    { productId: products[0]?.id || '', expectedQuantity: 10 },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addItemRow = () => setItems(p => [...p, { productId: products[0]?.id || '', expectedQuantity: 10 }]);
  const removeItemRow = (i: number) => { if (items.length > 1) setItems(p => p.filter((_, j) => j !== i)); };
  const updateItem = (i: number, field: string, value: any) => {
    setItems(p => p.map((it, j) => j === i ? { ...it, [field]: value } : it));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) { setError('Supplier name is required.'); return; }
    if (items.some(it => !it.productId || it.expectedQuantity <= 0)) {
      setError('All items need a product and quantity > 0.'); return;
    }
    const ids = items.map(it => it.productId);
    if (new Set(ids).size !== ids.length) { setError('Duplicate products detected in item list.'); return; }
    setLoading(true); setError(null);
    try { await onSubmit({ supplierName, expectedDate: expectedDate || undefined, notes, items }); onClose(); }
    catch (err: any) { setError(err.message || 'Failed to create receiving document.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700/80 rounded-2xl w-full max-w-2xl shadow-2xl shadow-black/60 animate-fade-in-up flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-800/60 shrink-0">
          <div>
            <h3 className="text-base font-bold text-white">New Inbound Document</h3>
            <p className="text-xs text-gray-500 mt-0.5">Register an incoming delivery manifest</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-gray-300 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {error && (
            <div className="flex items-center gap-2.5 text-xs bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Shipment details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Shipment Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1.5">Supplier / Vendor <span className="text-rose-400">*</span></label>
                <input
                  type="text"
                  required
                  value={supplierName}
                  onChange={e => setSupplierName(e.target.value)}
                  placeholder="e.g. Apex Global Logistics"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-sm text-white placeholder-gray-600 input-glow"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1.5">Expected Arrival Date</label>
                <input
                  type="date"
                  value={expectedDate}
                  onChange={e => setExpectedDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-sm text-gray-300 input-glow"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-400 block mb-1.5">Delivery Notes / PO Reference</label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. PO-8921, Dock Bay 2, fragile cargo"
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-sm text-white placeholder-gray-600 input-glow"
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Expected Products</h4>
              <button type="button" onClick={addItemRow} className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition">
                <Plus className="w-3.5 h-3.5" /> Add Line
              </button>
            </div>

            <div className="space-y-2">
              {/* Header row */}
              <div className="grid grid-cols-[1fr,100px,36px] gap-2 px-3 text-[10px] text-gray-600 font-semibold uppercase tracking-wider">
                <span>Product</span>
                <span className="text-center">Qty</span>
                <span></span>
              </div>

              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-[1fr,100px,36px] gap-2 items-center bg-gray-800/40 border border-gray-700/40 rounded-xl p-2.5">
                  <div className="relative">
                    <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-600" />
                    <select
                      value={item.productId}
                      onChange={e => updateItem(idx, 'productId', e.target.value)}
                      className="w-full pl-7 pr-3 py-2 rounded-lg bg-gray-900 border border-gray-700/60 text-sm text-gray-200 input-glow appearance-none"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.sku} — {p.name} ({p.uom})</option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="number"
                    min="1"
                    required
                    value={item.expectedQuantity}
                    onChange={e => updateItem(idx, 'expectedQuantity', parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700/60 text-sm text-white text-center font-bold input-glow"
                  />
                  <button
                    type="button"
                    onClick={() => removeItemRow(idx)}
                    disabled={items.length <= 1}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-600 hover:text-rose-400 hover:bg-rose-500/10 transition disabled:opacity-30"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2.5 px-5 py-4 border-t border-gray-800/60 shrink-0">
          <button type="button" onClick={onClose} disabled={loading}
            className="flex-none px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 btn-primary py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Creating...</>
            ) : (
              <><Package className="w-4 h-4" /> Create Receiving Document</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
