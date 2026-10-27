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
import { LoginPage } from './pages/LoginPage';
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

  // Login handler
  const handleLogin = async (username: string, password = 'password123') => {
    setLoading(true);
    try {
      const res = await api.login(username, password);
      setCurrentUser(res.user);
      showToast(`Welcome, ${res.user.fullName} (${res.user.role})`);
      await loadAllData();
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const handleLogout = () => {
    api.setToken(null);
    setCurrentUser(null);
    setSelectedDocId(null);
    showToast('Signed out of terminal.');
  };

  // Quick switch role handler
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

  // Check existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (api.getToken()) {
          const user = await api.getMe();
          setCurrentUser(user);
          await loadAllData();
        } else {
          // If no token stored, don't auto-login so user sees the login page
          setLoading(false);
        }
      } catch {
        api.setToken(null);
        setCurrentUser(null);
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

  // If not logged in, display the dedicated Login Screen
  if (!currentUser) {
    return (
      <LoginPage
        onLogin={handleLogin}
        loading={loading}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
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
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-slate-900 text-white text-sm font-medium px-4 py-3 rounded-lg shadow-xl animate-slide-in">
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
      <footer className="border-t border-slate-200 py-4 text-center">
        <span className="text-xs text-slate-500 font-medium">Warehouse Receiving System</span>
      </footer>
    </div>
  );
};

export default App;
