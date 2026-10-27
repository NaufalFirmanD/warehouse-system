export interface User {
  id: string;
  username: string;
  fullName: string;
  role: 'SUPERVISOR' | 'OPERATOR';
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  uom: string;
  quantityOnHand?: number;
  createdAt: string;
}

export interface ReceivingItem {
  id: string;
  documentId: string;
  productId: string;
  productSku: string;
  productName: string;
  uom: string;
  expectedQuantity: number;
  receivedQuantity: number;
  remainingQuantity: number;
}

export interface ReceivingDocumentSummary {
  id: string;
  documentNumber: string;
  supplierName: string;
  status: 'DRAFT' | 'PENDING' | 'RECEIVING' | 'COMPLETED' | 'CANCELED';
  expectedDate?: string;
  totalItemsCount: number;
  fullyReceivedItemsCount: number;
  createdAt: string;
}

export interface ReceivingDocumentDetail extends ReceivingDocumentSummary {
  notes?: string;
  createdByName?: string;
  items: ReceivingItem[];
}

export interface InventoryItem {
  productId: string;
  sku: string;
  name: string;
  uom: string;
  quantityOnHand: number;
  updatedAt: string;
}

export interface StockTransaction {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  documentNumber?: string;
  quantity: number;
  transactionType: string;
  notes: string;
  operatorName: string;
  createdAt: string;
}

const API_BASE = '/api';

class ApiClient {
  private token: string | null = localStorage.getItem('wrs_token');

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('wrs_token', token);
    } else {
      localStorage.removeItem('wrs_token');
    }
  }

  getToken() {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const err = new Error(data.message || `Request failed with status ${res.status}`);
      (err as any).code = data.code;
      (err as any).details = data.details;
      (err as any).status = res.status;
      throw err;
    }

    return data as T;
  }

  // Auth
  async login(username: string, password = 'password123') {
    const res = await this.request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    this.setToken(res.token);
    return res;
  }

  async getMe() {
    return this.request<User>('/auth/me');
  }

  // Products
  async listProducts(search?: string) {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.request<Product[]>(`/products${query}`);
  }

  async createProduct(data: { sku: string; name: string; description?: string; uom?: string }) {
    return this.request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Documents
  async listDocuments(status?: string) {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return this.request<ReceivingDocumentSummary[]>(`/receiving-documents${query}`);
  }

  async getDocument(id: string) {
    return this.request<ReceivingDocumentDetail>(`/receiving-documents/${id}`);
  }

  async createDocument(data: {
    documentNumber?: string;
    supplierName: string;
    expectedDate?: string;
    notes?: string;
    items: Array<{ productId: string; expectedQuantity: number }>;
  }) {
    return this.request<ReceivingDocumentDetail>('/receiving-documents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async recordReceipt(documentId: string, itemId: string, quantity: number) {
    return this.request<{
      message: string;
      documentStatus: string;
      newQuantityOnHand: number;
      item: ReceivingItem;
    }>(`/receiving-documents/${documentId}/receive`, {
      method: 'POST',
      body: JSON.stringify({ itemId, quantity }),
    });
  }

  async updateDocumentStatus(documentId: string, status: string) {
    return this.request<{ message: string; status: string }>(`/receiving-documents/${documentId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Inventory & Audit
  async listInventory() {
    return this.request<InventoryItem[]>('/inventory');
  }

  async listTransactions(productId?: string, limit = 50) {
    const query = productId ? `?productId=${productId}&limit=${limit}` : `?limit=${limit}`;
    return this.request<StockTransaction[]>(`/inventory/transactions${query}`);
  }
}

export const api = new ApiClient();
