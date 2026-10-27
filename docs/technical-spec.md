# Technical Specification Document
## Warehouse Receiving System (WRS)

- **Version:** 1.0.0
- **Status:** Approved
- **Author:** AI-Assisted Fullstack Engineer
- **Base Document:** [docs/prd.md](file:///c:/FlutterApp/Technical_assesment/docs/prd.md)

---

## 1. System Architecture

The Warehouse Receiving System follows a modular 3-tier client-server architecture designed for reliability, strict data consistency, and high maintainability.

```
┌────────────────────────────────────────────────────────┐
│               Frontend Layer (React / Vite)            │
│  - Operator Receiving Screen (Scan/Input/Status)       │
│  - Supervisor Catalog & Document Management            │
│  - Real-Time Inventory & Ledger Transaction View       │
└───────────────────────────┬────────────────────────────┘
                            │ REST / JSON (HTTP)
                            ▼
┌────────────────────────────────────────────────────────┐
│             Backend API Layer (Node.js / Express)      │
│  - Auth & RBAC Middleware                              │
│  - Domain Controllers (Products, Documents, Inventory) │
│  - Receiving Service (Atomic Transactions & Locks)     │
│  - Validation Layer (Zod / Joi Schema Validation)      │
└───────────────────────────┬────────────────────────────┘
                            │ SQL / Pool Connection
                            ▼
┌────────────────────────────────────────────────────────┐
│           Data Layer (PostgreSQL 16 Relational DB)     │
│  - Tables: users, products, receiving_docs, items      │
│  - Ledger: inventory, stock_transactions               │
│  - Row Locking: SELECT ... FOR UPDATE                  │
│  - Constraints: UNIQUE, FOREIGN KEY, CHECK (qty >= 0)  │
└────────────────────────────────────────────────────────┘
```

### Component Responsibilities
1. **Frontend (SPA):** Single Page Application providing interactive forms, instant client-side feedback, role switching, and reactive receipt counters.
2. **Backend API (Node.js + Express + TypeScript/ESM):** Stateless REST service responsible for security, authentication, parameter sanitization, and strict enforcement of all business rules.
3. **Database (PostgreSQL):** Stores persistent state. Uses ACID transactions to prevent double-counting or partial updates during concurrent receiving events.

---

## 2. Database Design & Relational Schema

### 2.1 Table Definitions & DDL

```sql
-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table (RBAC)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('SUPERVISOR', 'OPERATOR')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Products Table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    uom VARCHAR(20) NOT NULL DEFAULT 'PCS',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_sku ON products(sku);

-- 3. Inbound Receiving Documents Table
CREATE TABLE receiving_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_name VARCHAR(150) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' 
        CHECK (status IN ('DRAFT', 'PENDING', 'RECEIVING', 'COMPLETED', 'CANCELED')),
    expected_date DATE,
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_receiving_docs_status ON receiving_documents(status);
CREATE INDEX idx_receiving_docs_doc_num ON receiving_documents(document_number);

-- 4. Receiving Document Items Table
CREATE TABLE receiving_document_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES receiving_documents(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    expected_quantity INTEGER NOT NULL CHECK (expected_quantity > 0),
    received_quantity INTEGER NOT NULL DEFAULT 0 CHECK (received_quantity >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_no_over_receiving CHECK (received_quantity <= expected_quantity),
    CONSTRAINT uq_doc_product UNIQUE (document_id, product_id)
);

CREATE INDEX idx_receiving_items_doc ON receiving_document_items(document_id);

-- 5. Inventory Table (Current Stock Snapshot)
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID UNIQUE NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity_on_hand INTEGER NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inventory_product ON inventory(product_id);

-- 6. Stock Transactions Table (Immutable Audit Ledger)
CREATE TABLE stock_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    document_id UUID REFERENCES receiving_documents(id) ON DELETE SET NULL,
    line_item_id UUID REFERENCES receiving_document_items(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    transaction_type VARCHAR(30) NOT NULL DEFAULT 'INBOUND_RECEIPT',
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stock_tx_product ON stock_transactions(product_id);
CREATE INDEX idx_stock_tx_document ON stock_transactions(document_id);
CREATE INDEX idx_stock_tx_created_at ON stock_transactions(created_at DESC);
```

### 2.2 Database Integrity Constraints
1. **CHECK `chk_no_over_receiving`:** `received_quantity <= expected_quantity`. Database level guarantee that prevents corrupt states even if application logic were bypassed.
2. **CHECK `quantity_on_hand >= 0`:** Prevents negative inventory stock.
3. **UNIQUE `(document_id, product_id)`:** Prevents duplicate line items of the same product inside a single receiving document.

---

## 3. Concurrency Control & Atomic Receiving Algorithm

When an operator posts a receipt:
```typescript
async function recordReceipt(documentId: string, itemId: string, receivedQty: number, userId: string) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Lock document row for update
    const docRes = await client.query(
      `SELECT id, status FROM receiving_documents WHERE id = $1 FOR UPDATE`,
      [documentId]
    );
    if (!docRes.rows[0]) throw new NotFoundError('Receiving document not found');
    const doc = docRes.rows[0];
    if (doc.status !== 'PENDING' && doc.status !== 'RECEIVING') {
      throw new BusinessRuleError('Document is not in an active receiving state');
    }

    // 2. Lock item row for update
    const itemRes = await client.query(
      `SELECT id, product_id, expected_quantity, received_quantity 
       FROM receiving_document_items 
       WHERE id = $1 AND document_id = $2 FOR UPDATE`,
      [itemId, documentId]
    );
    if (!itemRes.rows[0]) throw new NotFoundError('Item not found in document');
    const item = itemRes.rows[0];

    // 3. Strict business rule validation
    const remaining = item.expected_quantity - item.received_quantity;
    if (receivedQty <= 0) {
      throw new BusinessRuleError('Received quantity must be greater than zero');
    }
    if (receivedQty > remaining) {
      throw new BusinessRuleError(
        `Cannot receive ${receivedQty}. Exceeds remaining expected quantity of ${remaining}.`
      );
    }

    // 4. Update item received_quantity
    await client.query(
      `UPDATE receiving_document_items 
       SET received_quantity = received_quantity + $1, updated_at = NOW() 
       WHERE id = $2`,
      [receivedQty, itemId]
    );

    // 5. Update or insert Inventory atomically
    await client.query(
      `INSERT INTO inventory (product_id, quantity_on_hand, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (product_id) 
       DO UPDATE SET quantity_on_hand = inventory.quantity_on_hand + $2, updated_at = NOW()`,
      [item.product_id, receivedQty]
    );

    // 6. Append Immutable Stock Transaction Ledger
    await client.query(
      `INSERT INTO stock_transactions 
       (product_id, document_id, line_item_id, quantity, transaction_type, created_by, created_at)
       VALUES ($1, $2, $3, $4, 'INBOUND_RECEIPT', $5, NOW())`,
      [item.product_id, documentId, itemId, receivedQty, userId]
    );

    // 7. Check if all items in document are now fully received
    const allItemsRes = await client.query(
      `SELECT bool_and(received_quantity = expected_quantity) AS all_complete
       FROM receiving_document_items 
       WHERE document_id = $1`,
      [documentId]
    );
    const isAllComplete = allItemsRes.rows[0]?.all_complete === true;

    const nextStatus = isAllComplete ? 'COMPLETED' : 'RECEIVING';
    await client.query(
      `UPDATE receiving_documents SET status = $1, updated_at = NOW() WHERE id = $2`,
      [nextStatus, documentId]
    );

    await client.query('COMMIT');
    return { success: true, nextStatus };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
```

---

## 4. Role-Based Access Control (RBAC) Matrix

| Endpoint | Method | Operator | Supervisor | Public |
| :--- | :---: | :---: | :---: | :---: |
| `/api/auth/login` | POST | Allowed | Allowed | Allowed |
| `/api/auth/me` | GET | Allowed | Allowed | - |
| `/api/products` (List) | GET | Allowed | Allowed | - |
| `/api/products` (Create) | POST | **Forbidden** | Allowed | - |
| `/api/receiving-documents` (List) | GET | Allowed | Allowed | - |
| `/api/receiving-documents` (Create) | POST | **Forbidden** | Allowed | - |
| `/api/receiving-documents/:id` | GET | Allowed | Allowed | - |
| `/api/receiving-documents/:id/status` | PATCH | **Forbidden** | Allowed | - |
| `/api/receiving-documents/:id/receive` | POST | Allowed | Allowed | - |
| `/api/inventory` | GET | Allowed | Allowed | - |
| `/api/inventory/transactions` | GET | Allowed | Allowed | - |

---

## 5. Testing & Quality Assurance Strategy

1. **Automated Unit Tests:**
   - Over-receiving calculation helper: test partial receipt, exact receipt, over-receipt.
   - Status transition validator: verifying rules for `DRAFT`, `PENDING`, `RECEIVING`, `COMPLETED`.
2. **Automated Integration Tests (with live/test database):**
   - **Test 1:** Normal full receipt: expected 10, receive 10 -> status `COMPLETED`, inventory +10.
   - **Test 2:** Partial receipt sequence: expected 10, receive 4 -> status `RECEIVING`, remaining 6. Receive 6 -> status `COMPLETED`.
   - **Test 3:** Over-receiving block: expected 10, receive 11 -> returns `422`, inventory remains 0.
   - **Test 4:** Incomplete document completion block: document with remaining items cannot be forced to `COMPLETED`.
   - **Test 5:** Concurrency & idempotency: concurrent requests cannot push received quantity beyond expected quantity.
