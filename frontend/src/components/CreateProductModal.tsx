import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

interface CreateProductModalProps {
  onClose: () => void;
  onSubmit: (data: { sku: string; name: string; description?: string; uom?: string }) => Promise<void>;
}

export const CreateProductModal: React.FC<CreateProductModalProps> = ({ onClose, onSubmit }) => {
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [uom, setUom] = useState('PCS');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim() || !name.trim()) {
      setError('SKU code and product name are required.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        sku: sku.trim().toUpperCase(),
        name: name.trim(),
        description: description.trim() || undefined,
        uom: uom.trim().toUpperCase(),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create product.');
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
            <h3 className="text-sm font-bold text-slate-900">Register New Product SKU</h3>
            <p className="text-xs text-slate-500 mt-0.5">Add an item to the central master catalog</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              SKU Code *
            </label>
            <input
              type="text"
              required
              value={sku}
              onChange={(e) => setSku(e.target.value.toUpperCase())}
              placeholder="e.g. SKU-BOX-102"
              className="enterprise-input w-full px-3 py-1.5 font-mono text-xs text-slate-900"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Product Description / Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Industrial Packing Tape 48mm"
              className="enterprise-input w-full px-3 py-1.5 text-xs text-slate-900"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Unit of Measure (UOM)
            </label>
            <select
              value={uom}
              onChange={(e) => setUom(e.target.value)}
              className="enterprise-input w-full px-3 py-1.5 text-xs text-slate-900 bg-white"
            >
              <option value="PCS">PCS (Pieces)</option>
              <option value="BOX">BOX (Boxes)</option>
              <option value="KG">KG (Kilograms)</option>
              <option value="PALLET">PALLET</option>
              <option value="ROLL">ROLL</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Technical Specifications / Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Packaging specs, manufacturer, storage conditions..."
              className="enterprise-input w-full px-3 py-1.5 text-xs text-slate-900"
            />
          </div>

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
              {loading ? 'Saving...' : 'Register Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
