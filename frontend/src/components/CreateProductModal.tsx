import React, { useState } from 'react';
import { X, AlertCircle, Plus } from 'lucide-react';

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
        description: description.trim(),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div>
            <h3 className="text-lg font-bold text-white">Create New Product SKU</h3>
            <p className="text-xs text-slate-400">Add an inventory item to the master catalog</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">SKU Code *</label>
            <input
              type="text"
              required
              value={sku}
              onChange={(e) => setSku(e.target.value.toUpperCase())}
              placeholder="e.g. SKU-PALLET-09"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Product Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Industrial Barcode Scanner"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Unit of Measure (UOM)</label>
              <select
                value={uom}
                onChange={(e) => setUom(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="PCS">PCS (Pieces)</option>
                <option value="BOX">BOX (Boxes)</option>
                <option value="KG">KG (Kilograms)</option>
                <option value="PALLET">PALLET</option>
                <option value="ROLL">ROLL</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Technical specifications, model number, packaging details..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
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
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>{loading ? 'Creating...' : 'Save Product'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
