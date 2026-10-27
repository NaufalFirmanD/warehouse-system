import React, { useState } from 'react';
import { Product } from '../api/client';
import { X, Plus, Trash2, AlertCircle } from 'lucide-react';

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

  const handleAddItem = () => {
    setItems([...items, { productId: products[0]?.id || '', expectedQuantity: 10 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, idx) => idx !== index));
    }
  };

  const handleItemChange = (index: number, field: 'productId' | 'expectedQuantity', value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) {
      setError('Supplier / Vendor name is required.');
      return;
    }

    if (items.some((i) => !i.productId || i.expectedQuantity <= 0)) {
      setError('All delivery items must have a valid product selected and quantity > 0.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        supplierName: supplierName.trim(),
        expectedDate: expectedDate || undefined,
        notes: notes.trim() || undefined,
        items,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create document.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-lg w-full max-w-xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Create Inbound Delivery Manifest</h3>
            <p className="text-xs text-slate-500 mt-0.5">Register expected inbound shipment from vendor</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Vendor / Supplier Name *
              </label>
              <input
                type="text"
                required
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="e.g. Acme Logistics Corp"
                className="enterprise-input w-full px-3 py-1.5 text-xs text-slate-900"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Expected Arrival Date
              </label>
              <input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                className="enterprise-input w-full px-3 py-1.5 text-xs text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Internal Manifest Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Priority shipment for Bay #3, PO-99214"
              className="enterprise-input w-full px-3 py-1.5 text-xs text-slate-900"
            />
          </div>

          {/* Line items section */}
          <div className="pt-3 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800">
                Manifest Expected Items ({items.length})
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs font-medium text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item Row</span>
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded border border-slate-200">
                  <select
                    value={item.productId}
                    onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                    className="enterprise-input flex-1 px-2.5 py-1.5 text-xs bg-white"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.sku} - {p.name} ({p.uom})
                      </option>
                    ))}
                  </select>

                  <div className="w-24">
                    <input
                      type="number"
                      min={1}
                      value={item.expectedQuantity}
                      onChange={(e) =>
                        handleItemChange(idx, 'expectedQuantity', parseInt(e.target.value, 10) || 1)
                      }
                      className="enterprise-input w-full px-2 py-1.5 text-xs text-center font-mono font-semibold"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    disabled={items.length <= 1}
                    className="p-1.5 text-slate-400 hover:text-red-600 disabled:opacity-30 disabled:hover:text-slate-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
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
              disabled={loading}
              className="btn-primary inline-flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-medium"
            >
              {loading ? 'Creating...' : 'Save Manifest'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
