import { Router } from 'express';
import { login, getCurrentUser } from '../controllers/authController';
import { listProducts, createProduct } from '../controllers/productController';
import {
  listReceivingDocuments,
  getReceivingDocumentById,
  createReceivingDocument,
  recordReceipt,
  updateReceivingDocumentStatus,
} from '../controllers/receivingController';
import { listInventory, listStockTransactions } from '../controllers/inventoryController';
import { authenticate, requireRole } from '../middleware/auth';

export const apiRouter = Router();

// --- Auth Routes ---
apiRouter.post('/auth/login', login);
apiRouter.get('/auth/me', authenticate, getCurrentUser);

// --- Product Routes ---
apiRouter.get('/products', authenticate, listProducts);
apiRouter.post('/products', authenticate, requireRole('SUPERVISOR'), createProduct);

// --- Receiving Document Routes ---
apiRouter.get('/receiving-documents', authenticate, listReceivingDocuments);
apiRouter.post('/receiving-documents', authenticate, requireRole('SUPERVISOR'), createReceivingDocument);
apiRouter.get('/receiving-documents/:id', authenticate, getReceivingDocumentById);
apiRouter.patch('/receiving-documents/:id/status', authenticate, requireRole('SUPERVISOR'), updateReceivingDocumentStatus);
apiRouter.post('/receiving-documents/:id/receive', authenticate, recordReceipt);

// --- Inventory & Audit Trail Routes ---
apiRouter.get('/inventory', authenticate, listInventory);
apiRouter.get('/inventory/transactions', authenticate, listStockTransactions);
