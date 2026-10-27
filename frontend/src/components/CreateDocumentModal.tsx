import React, { useState } from 'react';
import { Product } from '../api/client';
import { Plus, Trash2, X, AlertCircle } from 'lucide-react';

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

export const CreateDocumentModal: React.FC<CreateDocumentModalProps> = ({
  products,
  onClose,
  onSubmit,
}) => {
  const [supplierName, setSupplierName] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<Array<{ productId: string; expectedQuantity: number }>>([
    { productId: products[0]?.id || '', expectedQuantity: 10 },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addItemRow = () => {
    setItems((prev) => [...prev, { productId: products[0]?.id || '', expectedQuantity: 10 }]);
  };

  const removeItemRow = (index: number) => {
    if (items.length > 1) {
      setItems((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: 'productId' | 'expectedQuantity', value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) {
      setError('Supplier name is required.');
      return;
    }

    if (items.some((it) => !it.productId || it.expectedQuantity <= 0)) {
      setError('All items must have a selected product and an expected quantity > 0.');
      return;
    }

    // Check for duplicate products in lines
    const productIds = items.map((it) => it.productId);
    if (new Set(productIds).size !== productIds.length) {
      setError('Duplicate products in items list. Please combine them into a single line.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        supplierName,
        expectedDate: expectedDate || undefined,
        notes,
        items,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create receiving document.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div>
            <h3 className="text-lg font-bold text-white">New Inbound Receiving Document</h3>
            <p className="text-xs text-slate-400">Register incoming delivery manifest and expected products</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Supplier / Vendor Name *
              </label>
              <input
                type="text"
                required
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="e.g. Apex Global Logistics"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Expected Arrival Date
              </label>
              <input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Delivery Notes / PO Reference</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. PO-8921, Dock Bay 2, fragile electronics"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Expected Line Items */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Expected Products & Quantities
              </label>
              <button
                type="button"
                onClick={addItemRow}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 bg-slate-800/60 p-3 rounded-xl border border-slate-700/60"
                >
                  <div className="flex-1">
                    <select
                      value={item.productId}
                      onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm focus:border-blue-500 focus:outline-none"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.sku} — {p.name} ({p.uom})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-28">
                    <input
                      type="number"
                      min="1"
                      required
                      value={item.expectedQuantity}
                      onChange={(e) =>
                        handleItemChange(idx, 'expectedQuantity', parseInt(e.target.value, 10) || 1)
                      }
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm text-center font-bold focus:border-blue-500 focus:outline-none"
                      placeholder="Qty"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItemRow(idx)}
                    disabled={items.length <= 1}
                    className="text-slate-500 hover:text-rose-400 disabled:opacity-30 p-2 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition"
            >
              {loading ? 'Creating...' : 'Create Inbound Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
