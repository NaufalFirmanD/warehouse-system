import React, { useState, useEffect } from 'react';
import {
  api,
  User,
  Product,
  ReceivingDocumentSummary,
  InventoryItem,
  StockTransaction,
} from './api/client';
import { Navbar } from './components/Navbar';
import { ReceivingDocumentsPage } from './pages/ReceivingDocumentsPage';
import { ReceivingDetailPage } from './pages/ReceivingDetailPage';
import { ProductsPage } from './pages/ProductsPage';
import { InventoryPage } from './pages/InventoryPage';
import { TransactionHistoryPage } from './pages/TransactionHistoryPage';
import { CreateDocumentModal } from './components/CreateDocumentModal';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('documents');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  // Data states
  const [documents, setDocuments] = useState<ReceivingDocumentSummary[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [showCreateDocModal, setShowCreateDocModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Login handler / Role switcher
  const handleSwitchRole = async (targetRole: 'SUPERVISOR' | 'OPERATOR') => {
    const username = targetRole === 'SUPERVISOR' ? 'supervisor' : 'operator';
    try {
      const res = await api.login(username, 'password123');
      setCurrentUser(res.user);
      showToast(`Switched active role to ${res.user.role} (${res.user.fullName})`);
      await loadAllData();
    } catch (err: any) {
      console.error('Failed to switch role:', err);
      showToast(`Error switching role: ${err.message}`);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [docsRes, prodsRes, invRes, txRes] = await Promise.all([
        api.listDocuments(),
        api.listProducts(),
        api.listInventory(),
        api.listTransactions(),
      ]);
      setDocuments(docsRes);
      setProducts(prodsRes);
      setInventory(invRes);
      setTransactions(txRes);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial mount: authenticate default user and load data
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Try getting current user if token exists, or default login as operator
        let user: User;
        if (api.getToken()) {
          try {
            user = await api.getMe();
          } catch {
            const loginRes = await api.login('operator', 'password123');
            user = loginRes.user;
          }
        } else {
          const loginRes = await api.login('operator', 'password123');
          user = loginRes.user;
        }
        setCurrentUser(user);
        await loadAllData();
      } catch (err) {
        console.error('Auth initialization failed:', err);
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const handleCreateDocument = async (data: {
    supplierName: string;
    expectedDate?: string;
    notes?: string;
    items: Array<{ productId: string; expectedQuantity: number }>;
  }) => {
    await api.createDocument(data);
    showToast('Inbound Receiving Document successfully created!');
    await loadAllData();
  };

  const handleCreateProduct = async (data: {
    sku: string;
    name: string;
    description?: string;
    uom?: string;
  }) => {
    await api.createProduct(data);
    showToast(`Product ${data.sku} registered successfully!`);
    await loadAllData();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        activeTab={selectedDocId ? 'documents' : activeTab}
        setActiveTab={(tab) => {
          setSelectedDocId(null);
          setActiveTab(tab);
          loadAllData();
        }}
        onSwitchRole={handleSwitchRole}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl border border-blue-400/30 animate-in slide-in-from-bottom duration-200">
            {toastMessage}
          </div>
        )}

        {selectedDocId ? (
          <ReceivingDetailPage
            documentId={selectedDocId}
            currentUser={currentUser}
            onBack={() => {
              setSelectedDocId(null);
              loadAllData();
            }}
          />
        ) : (
          <>
            {activeTab === 'documents' && (
              <ReceivingDocumentsPage
                documents={documents}
                currentUser={currentUser}
                onSelectDocument={(id) => setSelectedDocId(id)}
                onOpenCreateModal={() => setShowCreateDocModal(true)}
                loading={loading}
              />
            )}

            {activeTab === 'products' && (
              <ProductsPage
                products={products}
                currentUser={currentUser}
                onRefresh={loadAllData}
                onCreateProduct={handleCreateProduct}
                loading={loading}
              />
            )}

            {activeTab === 'inventory' && (
              <InventoryPage inventory={inventory} loading={loading} />
            )}

            {activeTab === 'history' && (
              <TransactionHistoryPage transactions={transactions} loading={loading} />
            )}
          </>
        )}
      </main>

      {/* Create Document Modal */}
      {showCreateDocModal && (
        <CreateDocumentModal
          products={products}
          onClose={() => setShowCreateDocModal(false)}
          onSubmit={handleCreateDocument}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-600">
        Warehouse Receiving System • Built with React, TypeScript, Express, and PostgreSQL
      </footer>
    </div>
  );
};
export default App;
