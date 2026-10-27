import React, { useState } from 'react';
import { Product, User } from '../api/client';
import { Plus, Search, Package } from 'lucide-react';
import { CreateProductModal } from '../components/CreateProductModal';

interface ProductsPageProps {
  products: Product[];
  currentUser: User | null;
  onRefresh: () => void;
  onCreateProduct: (data: { sku: string; name: string; description?: string; uom?: string }) => Promise<void>;
  loading: boolean;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({
  products,
  currentUser,
  onCreateProduct,
  loading,
}) => {
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filtered = products.filter(
    (p) =>
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
  );

  const totalStocked = products.filter((p) => (p.quantityOnHand || 0) > 0).length;
  const zeroStock = products.filter((p) => (p.quantityOnHand || 0) === 0).length;
  const totalUnits = products.reduce((s, p) => s + (p.quantityOnHand || 0), 0);

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Product Master Catalog</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Centralized inventory product definitions, SKU numbers, and packaging units
          </p>
        </div>

        {currentUser?.role === 'SUPERVISOR' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Register Product SKU</span>
          </button>
        )}
      </div>

      {/* Metrics Strip */}
      <div className="bg-white border border-slate-200 rounded-lg grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 shadow-sm">
        <div className="p-4">
          <span className="text-xs font-medium text-slate-500 block">Total Catalog SKUs</span>
          <span className="text-2xl font-bold text-slate-900 font-mono mt-1 block">{products.length}</span>
        </div>
        <div className="p-4">
          <span className="text-xs font-medium text-slate-500 block">Total Units On Hand</span>
          <span className="text-2xl font-bold text-slate-900 font-mono mt-1 block">{totalUnits.toLocaleString()}</span>
        </div>
        <div className="p-4">
          <span className="text-xs font-medium text-emerald-700 block">Active Stocked SKUs</span>
          <span className="text-2xl font-bold text-emerald-800 font-mono mt-1 block">{totalStocked}</span>
        </div>
        <div className="p-4">
          <span className="text-xs font-medium text-slate-500 block">Zero Stock SKUs</span>
          <span className="text-2xl font-bold text-slate-700 font-mono mt-1 block">{zeroStock}</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by SKU code or product name..."
            className="enterprise-input w-full pl-8 pr-3 py-1.5 text-xs text-slate-800"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs">Loading product catalog...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">No products found</p>
            <p className="text-xs text-slate-400 mt-1">No items match your search filter.</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-4 py-3">SKU Code</th>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3 hidden md:table-cell">Technical Description</th>
                <th className="px-4 py-3 text-center">Unit</th>
                <th className="px-4 py-3 text-right">Available On Hand</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-xs font-semibold text-slate-900 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                      {p.sku}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-slate-900">
                    {p.name}
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell text-slate-500">
                    {p.description || '—'}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="font-mono text-[11px] text-slate-600 font-medium px-2 py-0.5 rounded bg-slate-50 border border-slate-200">
                      {p.uom}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono font-semibold text-slate-900">
                    {(p.quantityOnHand || 0) > 0 ? (
                      <span className="text-emerald-700">{p.quantityOnHand?.toLocaleString()}</span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                    <span className="text-[11px] text-slate-400 font-normal ml-1">{p.uom}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreateModal && (
        <CreateProductModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={onCreateProduct}
        />
      )}
    </div>
  );
};
