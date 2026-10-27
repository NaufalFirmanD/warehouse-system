import React, { useState } from 'react';
import { Product, User } from '../api/client';
import { Package, Plus, Search, Tag, Layers } from 'lucide-react';
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

  const filteredProducts = products.filter(
    (p) =>
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Package className="w-6 h-6 text-indigo-400" />
            <span>Product Master Catalog</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage SKU codes, product definitions, and warehouse units of measure.
          </p>
        </div>

        {currentUser?.role === 'SUPERVISOR' ? (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product SKU</span>
          </button>
        ) : (
          <div className="text-xs text-slate-400 bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700/60">
            Supervisor permissions required to register new SKUs
          </div>
        )}
      </div>

      {/* Search & Stats */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-4 text-xs text-slate-400 px-2">
          <span className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Total Registered SKUs: <strong>{products.length}</strong></span>
          </span>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search SKU or product name..."
            className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/50 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">SKU Code</th>
                <th className="px-6 py-4">Product Name</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4 text-center">UOM</th>
                <th className="px-6 py-4 text-center">Current Stock</th>
                <th className="px-6 py-4 text-right">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Loading products...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No products found matching your search.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4 font-mono font-bold text-blue-400 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-blue-500/70" />
                      <span>{p.sku}</span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-white">{p.name}</td>
                    <td className="px-6 py-4 text-slate-400 text-xs max-w-xs truncate">
                      {p.description || '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-slate-800 border border-slate-700 text-slate-300">
                        {p.uom}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-emerald-400">
                      {p.quantityOnHand ?? 0} {p.uom}
                    </td>
                    <td className="px-6 py-4 text-right text-xs text-slate-500">
                      {p.createdAt ? p.createdAt.slice(0, 10) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
