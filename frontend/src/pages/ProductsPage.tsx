import React, { useState } from 'react';
import { Product, User } from '../api/client';
import { Package, Plus, Search, Tag, Layers, TrendingUp } from 'lucide-react';
import { CreateProductModal } from '../components/CreateProductModal';

interface ProductsPageProps {
  products: Product[];
  currentUser: User | null;
  onRefresh: () => void;
  onCreateProduct: (data: { sku: string; name: string; description?: string; uom?: string }) => Promise<void>;
  loading: boolean;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({
  products, currentUser, onCreateProduct, loading,
}) => {
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filtered = products.filter(p =>
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalStock = products.reduce((a, p) => a + (p.quantityOnHand || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Package className="w-4 h-4 text-indigo-400" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Product Catalog</h1>
          </div>
          <p className="text-sm text-gray-500 ml-10.5">{products.length} SKUs registered</p>
        </div>

        {currentUser?.role === 'SUPERVISOR' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Product SKU
          </button>
        )}
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-4 card-glow-blue">
          <div className="flex items-start justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white counter-text">{products.length}</div>
          <div className="text-xs text-gray-500 mt-0.5">Total SKUs</div>
        </div>

        <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-4 card-glow-green">
          <div className="flex items-start justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400 counter-text">{totalStock.toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-0.5">Total Units On Hand</div>
        </div>

        <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-4 col-span-2 sm:col-span-1">
          <div className="flex items-start justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Package className="w-3.5 h-3.5 text-amber-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-400 counter-text">
            {products.filter(p => (p.quantityOnHand || 0) === 0).length}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">Zero Stock Items</div>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by SKU or product name..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-900 border border-gray-800 text-sm text-gray-300 placeholder-gray-600 input-glow"
          />
        </div>
        {search && (
          <span className="text-xs text-gray-500">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {/* Table */}
      <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading catalog...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-800/60 border border-gray-700/60 flex items-center justify-center mx-auto mb-4">
              <Package className="w-6 h-6 text-gray-600" />
            </div>
            <p className="text-sm text-gray-400">No products found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800/60">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-widest">SKU</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-widest">Product Name</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-widest hidden lg:table-cell">Description</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-widest">UOM</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-widest">On Hand</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, idx) => (
                <tr key={p.id} className="table-row-hover border-b border-gray-800/30 last:border-0" style={{ animationDelay: `${idx * 20}ms` }}>
                  <td className="px-5 py-4">
                    <div className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-blue-400 bg-blue-500/5 border border-blue-500/10 px-2 py-1 rounded-lg">
                      <Tag className="w-3 h-3 text-blue-500/50" />
                      {p.sku}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-semibold text-gray-200">{p.name}</span>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <span className="text-gray-500 text-xs max-w-xs truncate block">{p.description || <span className="text-gray-700">—</span>}</span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="font-mono text-xs font-semibold bg-gray-800 border border-gray-700/60 px-2 py-1 rounded-lg text-gray-400">{p.uom}</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className={`text-base font-bold tabular-nums ${(p.quantityOnHand || 0) > 0 ? 'text-emerald-400' : 'text-gray-600'}`}>
                      {(p.quantityOnHand || 0).toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-600 ml-1">{p.uom}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreateModal && <CreateProductModal onClose={() => setShowCreateModal(false)} onSubmit={onCreateProduct} />}
    </div>
  );
};
