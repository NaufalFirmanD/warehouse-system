# Warehouse Receiving System (WRS)

> An AI-assisted, specification-driven warehouse receiving and inventory tracking application built with **React**, **Node.js (Express & TypeScript)**, and **PostgreSQL**.

---

## 📋 Table of Contents
1. [Overview & Key Features](#overview--key-features)
2. [Deliverables Mapping](#deliverables-mapping)
3. [System Architecture & Stack](#system-architecture--stack)
4. [Quick Start with Docker Compose](#quick-start-with-docker-compose-recommended)
5. [Local Development Setup](#local-development-setup)
6. [Automated Testing & QA](#automated-testing--qa)
7. [Default Demo Credentials](#default-demo-credentials)
8. [API Health Check](#api-health-check)

---

## 1. Overview & Key Features

The Warehouse Receiving System replaces manual spreadsheet logging with a centralized, strictly validated inbound delivery platform:
- **Product Master Catalog:** Manage products and unique SKU codes with units of measure (`PCS`, `BOX`, `KG`, etc.).
- **Inbound Receiving Documents:** Create delivery manifests with vendor details, expected arrival dates, and expected product line items.
- **Dock Receiving with Partial/Full Receipts:** Operators record actual quantities received in real-time as shipments are unloaded.
- **Strict Over-Receiving Prevention:** Backend independently rejects any receiving operation where `received_quantity > remaining_expected` with HTTP 422.
- **Document Completion Safeguard:** A receiving document cannot be marked `COMPLETED` unless 100% of its items have been fully received.
- **Atomic Concurrency Control:** Row-level locks (`SELECT ... FOR UPDATE`) inside ACID transactions prevent race conditions during concurrent receiving operations.
- **Real-Time Inventory & Ledger:** On-hand stock balances update automatically, and an immutable audit trail records every receipt delta, reference document, timestamp, and operator.
- **Role-Based Access Control (RBAC):** Distinct workflows for **Warehouse Supervisors** (catalog & document creation) and **Warehouse Operators** (dock receiving & inspection).

---

## 2. Deliverables Mapping

All required documentation and artifacts are organized as follows:

| Assessment Requirement | Deliverable File | Description |
| :--- | :--- | :--- |
| **A. PRD** | [`docs/prd.md`](file:///c:/FlutterApp/Technical_assesment/docs/prd.md) | Business scenario, assumptions, user stories, acceptance criteria, and scope |
| **B. Technical Spec** | [`docs/technical-spec.md`](file:///c:/FlutterApp/Technical_assesment/docs/technical-spec.md) | Architecture, DDL, concurrency algorithms, and RBAC matrix |
| **B. ERD Artifact** | [`docs/erd.mmd`](file:///c:/FlutterApp/Technical_assesment/docs/erd.mmd) | Entity-relationship diagram in Mermaid format |
| **B. API Contract** | [`docs/openapi.yaml`](file:///c:/FlutterApp/Technical_assesment/docs/openapi.yaml) | OpenAPI 3.0 REST specification |
| **B. Data Flow** | [`docs/data-flow.mmd`](file:///c:/FlutterApp/Technical_assesment/docs/data-flow.mmd) | State transitions & sequence diagram of receiving transactions |
| **C. Source Code** | `backend/` & `frontend/` | Complete production-ready source code |
| **D. AI Workflow** | [`docs/ai-workflow.md`](file:///c:/FlutterApp/Technical_assesment/docs/ai-workflow.md) | Prompts, agent task instructions, and review evaluation |
| **E. Testing & QA** | [`docs/testing.md`](file:///c:/FlutterApp/Technical_assesment/docs/testing.md) | Test results, evidence of inventory consistency, and edge cases |
| **F. Deployment** | `docker-compose.yml`, `Dockerfile` | Reproducible multi-container deployment |

---

## 3. System Architecture & Stack

```
   [Frontend SPA (React 18 + Vite + Tailwind)] : Port 3000
                         │
                         ▼ (REST API)
   [Backend API (Node.js 22 + Express + TS)]   : Port 5000
                         │
                         ▼ (ACID Connection Pool)
   [Database (PostgreSQL 16 Relational DB)]     : Port 5432
```

---

## 4. Quick Start with Docker Compose (Recommended)

To run the complete system from a clean environment without installing Node or PostgreSQL locally:

```bash
docker compose up --build
```

Once started:
- **Frontend Web UI:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:5000](http://localhost:5000)
- **Health Check Endpoint:** [http://localhost:5000/health](http://localhost:5000/health)

To shut down and wipe volumes:
```bash
docker compose down -v
```

---

## 5. Local Development Setup

If you wish to run without Docker, you will need **Node.js (v18+)** and a running **PostgreSQL** instance.

### Step 1: Clone & Configure Backend
```bash
cd backend
npm install
```

Configure `backend/.env` (or use defaults):
```env
PORT=5000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/warehouse_db
JWT_SECRET=super-secret-warehouse-key-2026
```

Run migrations & seeds:
```bash
npm run migrate
```

Start backend development server:
```bash
npm run dev
```

### Step 2: Configure & Start Frontend
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 6. Automated Testing & QA

Run the business rule test suite in the backend directory:
```bash
cd backend
npm test
```

### Test Suite Summary:
```text
✓ tests/receiving.test.ts (14 tests)
  - Remaining quantity calculations
  - Over-receiving rejection on initial and split receipts
  - Negative and decimal quantity rejection
  - Document completion blocked if items are pending
  - Document status immutability once completed
  - Multi-step split shipment simulation preserving inventory consistency
```
See [`docs/testing.md`](file:///c:/FlutterApp/Technical_assesment/docs/testing.md) for full test logs and analysis.

---

## 7. Default Demo Credentials

The database migration automatically seeds two demo user accounts:

| Role | Username | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Warehouse Supervisor** | `supervisor` | `password123` | Full access: create products, create documents, approve statuses, view all ledgers |
| **Warehouse Operator** | `operator` | `password123` | Dock receiving: view active documents, record partial/full item receipts, view stock |

> **Tip:** You can switch between roles directly in the top-right corner of the web interface using the role switcher toggle.

---

## 8. API Health Check

The backend includes a health and readiness check:
```http
GET /health
```
Response:
```json
{
  "status": "ok",
  "service": "warehouse-receiving-api",
  "timestamp": "2026-10-28T01:30:00.000Z",
  "database": "connected"
}
```
