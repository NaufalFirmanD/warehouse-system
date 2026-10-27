import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { pool } from '../config/db';
import { AppError, BusinessRuleError, NotFoundError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';

const createDocumentSchema = z.object({
  documentNumber: z.string().trim().optional(),
  supplierName: z.string().trim().min(2, 'Supplier name is required'),
  expectedDate: z.string().optional().nullable(),
  notes: z.string().optional().default(''),
  items: z.array(
    z.object({
      productId: z.string().uuid('Invalid product ID'),
      expectedQuantity: z.number().int().positive('Expected quantity must be at least 1'),
    })
  ).min(1, 'Receiving document must have at least one line item'),
});

const recordReceiptSchema = z.object({
  itemId: z.string().uuid('Invalid item ID'),
  quantity: z.number().int().positive('Receipt quantity must be an integer greater than 0'),
});

const updateStatusSchema = z.object({
  status: z.enum(['DRAFT', 'PENDING', 'RECEIVING', 'COMPLETED', 'CANCELED']),
});

export async function listReceivingDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const statusFilter = req.query.status ? String(req.query.status).toUpperCase() : null;

    let query = `
      SELECT 
        d.id,
        d.document_number AS "documentNumber",
        d.supplier_name AS "supplierName",
        d.status,
        d.expected_date AS "expectedDate",
        d.created_at AS "createdAt",
        COUNT(i.id)::int AS "totalItemsCount",
        COUNT(CASE WHEN i.received_quantity >= i.expected_quantity THEN 1 END)::int AS "fullyReceivedItemsCount"
      FROM receiving_documents d
      LEFT JOIN receiving_document_items i ON d.id = i.document_id
    `;
    const params: any[] = [];

    if (statusFilter) {
      query += ` WHERE d.status = $1`;
      params.push(statusFilter);
    }

    query += ` GROUP BY d.id ORDER BY d.created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
}

export async function getReceivingDocumentById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    const docResult = await pool.query(
      `SELECT 
        d.id,
        d.document_number AS "documentNumber",
        d.supplier_name AS "supplierName",
        d.status,
        d.expected_date AS "expectedDate",
        d.notes,
        d.created_at AS "createdAt",
        u.full_name AS "createdByName"
      FROM receiving_documents d
      LEFT JOIN users u ON d.created_by = u.id
      WHERE d.id = $1`,
      [id]
    );

    if (docResult.rows.length === 0) {
      throw new NotFoundError('Receiving document not found');
    }

    const document = docResult.rows[0];

    const itemsResult = await pool.query(
      `SELECT 
        i.id,
        i.document_id AS "documentId",
        i.product_id AS "productId",
        p.sku AS "productSku",
        p.name AS "productName",
        p.uom,
        i.expected_quantity AS "expectedQuantity",
        i.received_quantity AS "receivedQuantity",
        (i.expected_quantity - i.received_quantity) AS "remainingQuantity"
      FROM receiving_document_items i
      JOIN products p ON i.product_id = p.id
      WHERE i.document_id = $1
      ORDER BY i.created_at ASC`,
      [id]
    );

    res.json({
      ...document,
      items: itemsResult.rows,
    });
  } catch (error) {
    next(error);
  }
}

export async function createReceivingDocument(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const client = await pool.connect();
  try {
    const data = createDocumentSchema.parse(req.body);
    const userId = req.user?.id || null;

    await client.query('BEGIN');

    // Generate document number if not supplied: RCV-YYYYMMDD-XXXX
    const docNumber = data.documentNumber?.trim() || 
      `RCV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Verify document number uniqueness
    const existing = await client.query('SELECT id FROM receiving_documents WHERE document_number = $1', [docNumber]);
    if (existing.rows.length > 0) {
      throw new AppError(`Document number ${docNumber} already exists.`, 400, 'DUPLICATE_DOCUMENT_NUMBER');
    }

    // Insert Document (Initial status PENDING so operators can receive it)
    const docResult = await client.query(
      `INSERT INTO receiving_documents 
        (document_number, supplier_name, status, expected_date, notes, created_by)
       VALUES ($1, $2, 'PENDING', $3, $4, $5)
       RETURNING id, document_number AS "documentNumber", supplier_name AS "supplierName", 
                 status, expected_date AS "expectedDate", notes, created_at AS "createdAt"`,
      [docNumber, data.supplierName, data.expectedDate || null, data.notes, userId]
    );
    const doc = docResult.rows[0];

    // Insert Line Items
    for (const item of data.items) {
      await client.query(
        `INSERT INTO receiving_document_items (document_id, product_id, expected_quantity, received_quantity)
         VALUES ($1, $2, $3, 0)`,
        [doc.id, item.productId, item.expectedQuantity]
      );
    }

    await client.query('COMMIT');

    // Fetch complete document with items
    const itemsResult = await pool.query(
      `SELECT 
        i.id,
        i.product_id AS "productId",
        p.sku AS "productSku",
        p.name AS "productName",
        p.uom,
        i.expected_quantity AS "expectedQuantity",
        i.received_quantity AS "receivedQuantity",
        (i.expected_quantity - i.received_quantity) AS "remainingQuantity"
      FROM receiving_document_items i
      JOIN products p ON i.product_id = p.id
      WHERE i.document_id = $1`,
      [doc.id]
    );

    res.status(201).json({
      ...doc,
      items: itemsResult.rows,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
}

export async function recordReceipt(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const client = await pool.connect();
  try {
    const { id: documentId } = req.params;
    const { itemId, quantity } = recordReceiptSchema.parse(req.body);
    const userId = req.user?.id || null;
    const operatorName = req.user?.fullName || 'Warehouse Operator';

    await client.query('BEGIN');

    // 1. Lock document row for update
    const docRes = await client.query(
      `SELECT id, document_number, status FROM receiving_documents WHERE id = $1 FOR UPDATE`,
      [documentId]
    );
    if (docRes.rows.length === 0) {
      throw new NotFoundError('Receiving document not found');
    }
    const doc = docRes.rows[0];

    // Status check
    if (doc.status === 'COMPLETED') {
      throw new BusinessRuleError('Cannot receive items: this document is already COMPLETED.');
    }
    if (doc.status === 'CANCELED') {
      throw new BusinessRuleError('Cannot receive items: this document has been CANCELED.');
    }

    // 2. Lock item row for update
    const itemRes = await client.query(
      `SELECT 
        i.id, 
        i.product_id, 
        i.expected_quantity, 
        i.received_quantity,
        p.sku,
        p.name AS product_name
       FROM receiving_document_items i
       JOIN products p ON i.product_id = p.id
       WHERE i.id = $1 AND i.document_id = $2 FOR UPDATE`,
      [itemId, documentId]
    );

    if (itemRes.rows.length === 0) {
      throw new NotFoundError('Receiving document item not found');
    }
    const item = itemRes.rows[0];

    // 3. Strict business rule validation: Over-receiving prevention
    const { validateReceivingQuantity } = await import('../services/receivingLogic');
    validateReceivingQuantity(item.expected_quantity, item.received_quantity, quantity);

    // 4. Update item received_quantity
    const updatedItemRes = await client.query(
      `UPDATE receiving_document_items 
       SET received_quantity = received_quantity + $1, updated_at = NOW() 
       WHERE id = $2
       RETURNING id, document_id AS "documentId", product_id AS "productId", 
                 expected_quantity AS "expectedQuantity", received_quantity AS "receivedQuantity"`,
      [quantity, itemId]
    );
    const updatedItem = updatedItemRes.rows[0];

    // 5. Update or insert Inventory atomically
    const invRes = await client.query(
      `INSERT INTO inventory (product_id, quantity_on_hand, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (product_id) 
       DO UPDATE SET quantity_on_hand = inventory.quantity_on_hand + $2, updated_at = NOW()
       RETURNING quantity_on_hand AS "newQuantityOnHand"`,
      [item.product_id, quantity]
    );
    const newQuantityOnHand = invRes.rows[0]?.newQuantityOnHand || 0;

    // 6. Record immutable transaction log in stock_transactions
    await client.query(
      `INSERT INTO stock_transactions 
        (product_id, document_id, line_item_id, quantity, transaction_type, notes, created_by, created_at)
       VALUES ($1, $2, $3, $4, 'INBOUND_RECEIPT', $5, $6, NOW())`,
      [
        item.product_id,
        documentId,
        itemId,
        quantity,
        `Received ${quantity} units for Doc #${doc.document_number} by ${operatorName}`,
        userId,
      ]
    );

    // 7. Check if ALL items in the document are now fully received
    const checkAllRes = await client.query(
      `SELECT bool_and(received_quantity = expected_quantity) AS all_complete
       FROM receiving_document_items 
       WHERE document_id = $1`,
      [documentId]
    );
    const isAllComplete = checkAllRes.rows[0]?.all_complete === true;

    // Transition status: COMPLETED if 100% received, else RECEIVING
    const nextStatus = isAllComplete ? 'COMPLETED' : 'RECEIVING';
    await client.query(
      `UPDATE receiving_documents SET status = $1, updated_at = NOW() WHERE id = $2`,
      [nextStatus, documentId]
    );

    await client.query('COMMIT');

    res.json({
      message: 'Receipt successfully recorded and stock updated.',
      documentStatus: nextStatus,
      newQuantityOnHand,
      item: {
        ...updatedItem,
        productSku: item.sku,
        productName: item.product_name,
        remainingQuantity: updatedItem.expectedQuantity - updatedItem.receivedQuantity,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
}

export async function updateReceivingDocumentStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { status: targetStatus } = updateStatusSchema.parse(req.body);

    await client.query('BEGIN');

    const docRes = await client.query(
      `SELECT id, status FROM receiving_documents WHERE id = $1 FOR UPDATE`,
      [id]
    );
    if (docRes.rows.length === 0) {
      throw new NotFoundError('Receiving document not found');
    }
    const currentDoc = docRes.rows[0];

    // Enforce business rule: A receiving document must not be completed unless all its items have been fully received
    if (targetStatus === 'COMPLETED') {
      const checkAllRes = await client.query(
        `SELECT bool_and(received_quantity = expected_quantity) AS all_complete,
                COUNT(id) AS total_items
         FROM receiving_document_items 
         WHERE document_id = $1`,
        [id]
      );
      const row = checkAllRes.rows[0];
      if (!row || Number(row.total_items) === 0 || row.all_complete !== true) {
        throw new BusinessRuleError(
          'Cannot complete receiving document: not all items have been fully received.'
        );
      }
    }

    // Cancellation rule: cannot cancel if receiving has already started
    if (targetStatus === 'CANCELED') {
      const itemsRes = await client.query(
        `SELECT SUM(received_quantity) AS total_received FROM receiving_document_items WHERE document_id = $1`,
        [id]
      );
      const totalReceived = Number(itemsRes.rows[0]?.total_received || 0);
      if (totalReceived > 0) {
        throw new BusinessRuleError(
          'Cannot cancel receiving document: items have already been received into stock.'
        );
      }
    }

    await client.query(
      `UPDATE receiving_documents SET status = $1, updated_at = NOW() WHERE id = $2`,
      [targetStatus, id]
    );

    await client.query('COMMIT');

    res.json({
      message: `Document status updated to ${targetStatus}`,
      status: targetStatus,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
}
