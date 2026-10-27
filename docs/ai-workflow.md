# AI Agent Collaboration & Workflow Documentation
## Warehouse Receiving System (WRS)

- **Date:** 2026-10-28
- **Workflow Methodology:** Specification-Driven Development (SDD)
- **AI Coding Agent:** Antigravity / Gemini 3.8 Flash

---

## 1. Specification-Driven Development Methodology

Instead of relying on a single, opaque natural-language prompt to generate the entire repository at once, we utilized a disciplined multi-stage, specification-driven approach:

```
[Business Problem & Ambiguities]
               │
               ▼
   [Stage 1: PRD Definition] ──────────────► Clarified assumptions, roles, FRs, and NFRs
               │
               ▼
[Stage 2: Technical Specification] ────────► Defined ERD, PostgreSQL DDL, OpenAPI, and state diagrams
               │
               ▼
  [Stage 3: Agent Implementation] ─────────► Directed agent using spec contracts as primary inputs
               │
               ▼
  [Stage 4: Automated Verification] ───────► Executed 14 Vitest business rule tests & build checks
               │
               ▼
  [Stage 5: Containerization & Docs] ──────► Multi-stage Dockerfile, compose, and health checks
```

---

## 2. Meaningful Prompts & Agent Task Instructions

### Task Instruction 1: Formalizing PRD & Addressing Business Ambiguities
* **Context/Input Given to Agent:** Assessment requirements noting that *"The business requirements are unclear, document your assumptions and explain your decisions."*
* **Agent Directive:**
  > *"Analyze the business scenario and establish an approved Product Requirements Document (PRD). Document clear assumptions for partial receipts, over-receiving edge cases, document completion conditions, and inventory ledger design. Enforce strict boundaries for MVP scope."*
* **Output & Rationale:**
  - Produced `docs/prd.md`.
  - Formalized Assumption A1 (partial receiving allowed), Assumption A2 (over-receiving strictly rejected), and Assumption A3 (100% completion requirement).
  - Designed the double-entry transaction ledger pattern (`inventory` + `stock_transactions`).

### Task Instruction 2: Architecting Database Schema & Concurrency Algorithm
* **Context/Input Given to Agent:** `docs/prd.md` and relational database requirement (PostgreSQL).
* **Agent Directive:**
  > *"Derive technical specification, ERD, and OpenAPI 3.0 schema from the PRD. Write explicit PostgreSQL DDL with check constraints (`chk_no_over_receiving`) to guarantee database-level integrity. Implement a robust receiving algorithm with row-level locks (`SELECT ... FOR UPDATE`) inside an ACID transaction to prevent race conditions during concurrent receiving operations."*
* **Output & Rationale:**
  - Produced `docs/technical-spec.md`, `docs/erd.mmd`, `docs/openapi.yaml`, and `docs/data-flow.mmd`.
  - Added row locking algorithm in `src/controllers/receivingController.ts` and encapsulated pure calculation logic in `src/services/receivingLogic.ts`.

### Task Instruction 3: Automated Business Rule Testing & Edge-Case Verification
* **Context/Input Given to Agent:** Requirement E (*"Provide automated tests for critical business rules, evidence that inventory quantities remain correct, and evidence that duplicate/invalid receiving does not corrupt stock"*).
* **Agent Directive:**
  > *"Create an automated test suite with Vitest to verify all boundary conditions: 1) Initial partial receipt; 2) Exact full receipt; 3) Over-receiving rejection on fresh item; 4) Over-receiving rejection on split item; 5) Incomplete document completion rejection; 6) Multi-step split shipment simulation preserving inventory integrity. Document all test results."*
* **Output & Rationale:**
  - Produced `backend/tests/receiving.test.ts`.
  - All 14 test scenarios executed and passed in 981ms.
  - Generated `docs/testing.md` with execution evidence.

---

## 3. Evaluation and Human Review of AI-Generated Output

Throughout the process, all AI-generated code and specs were reviewed:
1. **Schema Check Constraints:** Verified that `received_quantity <= expected_quantity` constraint in SQL prevents invalid data writes even if an application bug bypassed software checks.
2. **Transaction Isolation:** Confirmed that `client.query('BEGIN')` and `client.query('ROLLBACK')` are properly scoped in `try...catch...finally` blocks with `client.release()` to avoid pool connection leaks.
3. **Frontend Separation:** Verified that the UI provides immediate user-friendly feedback (visual warnings and disabled inputs), while the backend API independently validates and enforces every business rule.
4. **Reproducibility:** Tested builds of both backend (`tsc`) and frontend (`vite build`) to guarantee 0 compiler warnings or broken imports.
