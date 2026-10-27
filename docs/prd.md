# Product Requirements Document (PRD)
## Warehouse Receiving System (WRS)

- **Document Version:** 1.0.0
- **Status:** Approved / Specification Baseline
- **Target Audience:** Warehouse Operations, Engineering Team, Quality Assurance
- **System Scope:** Inbound Warehouse Receiving & Stock Tracking

---

## 1. Executive Summary & Problem Statement

### 1.1 Problem Statement
Currently, warehouse inventory receiving is tracked manually using fragmented spreadsheets. This approach causes:
1. **Discrepancies in Stock Count:** Inaccurate manual logging leads to ghost inventory or undetected missing shipments.
2. **Over-receiving & Under-receiving Confusion:** Lack of system-enforced quantity validation allows operators to receive more items than ordered or prematurely close deliveries.
3. **Absence of Audit Trail:** Inability to pinpoint who received which batch, at what exact time, and against which purchase order / receiving document.
4. **Zero Real-time Visibility:** Warehouse supervisors lack immediate updates on delivery progression and current on-hand stock levels.

### 1.2 Business Objectives
- Establish an automated, centralized web application to register inbound delivery documents, log actual received quantities in real time, and accurately maintain available warehouse inventory.
- Eliminate over-receiving through strict backend validation rules.
- Guarantee inventory data integrity by tying every stock increment to an immutable ledger transaction log.
- Provide warehouse operators and supervisors with clear role-tailored interfaces and workflows.

---

## 2. User Roles & Personas

The system supports two primary roles with Role-Based Access Control (RBAC):

| Role | Responsibilities | Key Permissions |
| :--- | :--- | :--- |
| **Warehouse Supervisor** | Oversees inbound planning, product catalog, and overall inventory health. | • Create and manage Products (SKUs)<br>• Create Inbound Receiving Documents<br>• Add expected products and quantities to documents<br>• Approve or cancel receiving documents<br>• View all reports, inventory levels, and full audit logs |
| **Warehouse Operator** | Physical dock handler who unloads shipments and inspects packages. | • View pending / active receiving documents<br>• Record actual received items (partial or full)<br>• Mark document as Completed when all items are fully received<br>• View current stock counts |

---

## 3. Scope of Application

### 3.1 In-Scope (Phase 1 MVP)
- **Product Management:** Create and list products with unique SKU, name, description, unit of measure (UOM), and active status.
- **Inbound Receiving Document (PO / ASN):** Create receiving documents with document number, vendor name, expected arrival date, notes, and status lifecycle.
- **Receiving Document Items:** Define expected lines (product, expected quantity).
- **Receiving Execution:** Log incoming quantities against specific line items with support for single or multiple partial receipts.
- **Inventory Ledger:** Maintain on-hand stock balances per product and generate an immutable transaction history (audit trail) on every receipt.
- **Strict Business Validations:** Enforce maximum receivable constraints and completion criteria.
- **Role-Based Authentication:** Basic authenticated sessions / documented role switching mechanism for Operators and Supervisors.

### 3.2 Out-of-Scope (Future Enhancements)
- Multi-warehouse location / bin / aisle tracking (all items stored in a single unified primary warehouse location for MVP).
- Hardware barcode / RFID scanner integration (can be simulated via standard text search / camera input in future phases).
- Outbound fulfillment, picking, packing, and shipping workflows.
- Supplier portal / Electronic Data Interchange (EDI) ingestion.
- Purchase order budgeting, billing, invoicing, and accounts payable.

---

## 4. Documented Assumptions & Design Decisions

Per project instructions regarding unclear business requirements, the following explicit assumptions and decisions have been established:

| # | Ambiguity / Question | Documented Assumption | Design Decision & Rationale |
| :--- | :--- | :--- | :--- |
| **A1** | *Can an item be received in multiple separate shipments?* | Yes. Deliveries frequently arrive in split partial batches from freight carriers. | The system supports **Partial Receiving**. Each receipt creates a receipt transaction record and increments `received_quantity` until `received_quantity == expected_quantity`. |
| **A2** | *What happens if a damaged or excess item arrives?* | The prompt explicitly mandates: *"The application must prevent users from receiving more than the remaining expected quantity."* | Strict rejection: any receipt quantity where `actual_received > (expected_quantity - received_quantity)` returns `422 Unprocessable Entity`. Excess items must be handled out-of-band or via a new receiving document. |
| **A3** | *When can a receiving document be marked COMPLETED?* | The prompt states: *"A receiving document must not be completed unless all its items have been fully received."* | The system will automatically or manually allow transition to `COMPLETED` **only if** `received_quantity == expected_quantity` across **100%** of associated line items. |
| **A4** | *Can receiving documents be canceled?* | Yes, if a shipment is canceled before receiving starts. | A document can be `CANCELED` by a Supervisor only if status is `DRAFT` or `PENDING` (zero items received so far). If items were already received, stock reversal or credit note would be needed (restricted in MVP). |
| **A5** | *How is inventory recorded?* | Double-entry / ledger transaction pattern. | To guarantee auditable stock balance, we maintain both `inventory` (current snapshot: `quantity_on_hand`) and `stock_transactions` (immutable log of every receipt delta, reference doc, timestamp, and user). |
| **A6** | *Single warehouse vs multi-location?* | Single warehouse location. | Simplifies inventory tracking to `product_id -> quantity_on_hand` while retaining clean extensibility for `warehouse_id` in future schemas. |

---

## 5. Functional Requirements (FR)

### Module 1: Product Catalog Management
- **FR-1.1:** System shall allow Supervisors to create new products with unique SKU, Name, Description, and Unit of Measure (e.g., `PCS`, `BOX`, `KG`).
- **FR-1.2:** SKU must be alphanumeric, uppercase, and globally unique.
- **FR-1.3:** System shall list all products with current on-hand inventory summary and search capability.

### Module 2: Inbound Receiving Documents
- **FR-2.1:** System shall allow Supervisors to create a Receiving Document specifying:
  - Document Number (auto-generated or custom e.g., `RCV-20261028-001`),
  - Supplier / Vendor Name,
  - Expected Delivery Date,
  - Notes / PO reference.
- **FR-2.2:** System shall allow adding one or more product line items with `expected_quantity > 0`.
- **FR-2.3:** Document Lifecycle Statuses:
  - `DRAFT`: Initial draft, lines can be edited/added.
  - `PENDING`: Finalized by Supervisor, ready for dock receiving.
  - `RECEIVING`: At least one item has been partially or fully received.
  - `COMPLETED`: All items have `received_quantity == expected_quantity`.
  - `CANCELED`: Voided document (only allowed if 0 items have been received).

### Module 3: Receiving Execution & Validation
- **FR-3.1:** Operators shall view all documents in `PENDING` or `RECEIVING` status.
- **FR-3.2:** When receiving an item, the operator specifies `quantity_to_receive` (must be integer > 0).
- **FR-3.3:** **Over-receiving Guard (Backend Enforced):**
  - Remaining expected = `expected_quantity - received_quantity`.
  - If `quantity_to_receive > remaining_expected`, backend MUST reject the transaction with an explicit error message: `"Cannot receive quantity greater than remaining expected quantity."`
- **FR-3.4:** Upon successful receipt:
  - Update line item `received_quantity += quantity_to_receive`.
  - Atomically update or insert `inventory` on-hand stock (`quantity_on_hand += quantity_to_receive`).
  - Create an immutable record in `stock_transactions` with `transaction_type = 'INBOUND_RECEIPT'`, `document_id`, `line_item_id`, `quantity`, `created_by`, and `timestamp`.
  - Update document status to `RECEIVING` if it was `PENDING`.
  - If all line items now have `received_quantity == expected_quantity`, auto-transition or enable the transition of document status to `COMPLETED`.

### Module 4: Inventory & Transaction Audit Trail
- **FR-4.1:** System shall display real-time inventory balances per product (`SKU`, `Name`, `Quantity on Hand`, `Last Updated`).
- **FR-4.2:** System shall display a chronological transaction log showing:
  - Timestamp,
  - Product SKU and Name,
  - Quantity changed (+N),
  - Reference Document Number,
  - Action / Transaction Type,
  - User / Operator name.

---

## 6. Non-Functional Requirements (NFR)

- **NFR-1 (Data Consistency & Concurrency):** Database operations for receiving stock must execute inside an ACID transaction (`BEGIN ... COMMIT`) with row-level locking (`SELECT ... FOR UPDATE`) to prevent race conditions or duplicate increments under concurrent requests.
- **NFR-2 (Performance):** API responses for receiving operations and list queries must respond in `< 200ms` under normal load.
- **NFR-3 (Validation Separation):** All business rules must be validated independently on the backend API layer regardless of whether the frontend UI validated them.
- **NFR-4 (Usability):** High-clarity warehouse UI with high contrast, clear status badges, error alerts, and one-click receipt actions suitable for desktop and warehouse rugged tablets.
- **NFR-5 (Containerization):** Entire stack must be launchable with a single `docker compose up --build` command without requiring manual prerequisite installations.

---

## 7. User Stories & Acceptance Criteria

### Story 1: Creating a Receiving Document
> **As a** Warehouse Supervisor,  
> **I want to** create an inbound receiving document and specify expected products and quantities,  
> **So that** warehouse operators know what shipments to expect at the unloading dock.

**Acceptance Criteria:**
- Given a valid SKU and positive expected quantity, the system saves the document in `DRAFT` or `PENDING` status.
- Cannot create a document item with `expected_quantity <= 0`.
- Document number must be unique.

### Story 2: Receiving Items Against a Document
> **As a** Warehouse Operator,  
> **I want to** input the actual quantity of items received for each line item,  
> **So that** inventory is updated accurately as goods are unloaded.

**Acceptance Criteria:**
- Given an item with expected = 10 and received = 0, inputting 4 succeeds; new received = 4, remaining = 6; document status moves to `RECEIVING`.
- Given an item with remaining = 6, inputting 7 fails with HTTP 422: `"Cannot receive more than remaining expected quantity (6)"`.
- Stock balance for the product increases by the exact received quantity immediately.
- A stock transaction ledger record is generated.

### Story 3: Completing a Receiving Document
> **As a** Warehouse Operator / Supervisor,  
> **I want to** mark a receiving document as Completed,  
> **So that** the procurement/receiving process is officially closed.

**Acceptance Criteria:**
- Attempting to mark `COMPLETED` when any item has `received_quantity < expected_quantity` is blocked with HTTP 422: `"Cannot complete receiving document: not all items have been fully received."`
- When all items reach `received_quantity == expected_quantity`, the document status transitions to `COMPLETED`.
- Completed documents are locked and cannot accept additional receipts.
