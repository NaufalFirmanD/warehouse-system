import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/db';

export async function listInventory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await pool.query(
      `SELECT 
        p.id AS "productId",
        p.sku,
        p.name,
        p.uom,
        COALESCE(i.quantity_on_hand, 0) AS "quantityOnHand",
        i.updated_at AS "updatedAt"
      FROM products p
      LEFT JOIN inventory i ON p.id = i.product_id
      ORDER BY p.name ASC`
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
}

export async function listStockTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const productId = req.query.productId ? String(req.query.productId) : null;
    const limit = req.query.limit ? Math.min(parseInt(String(req.query.limit), 10), 100) : 50;

    let query = `
      SELECT 
        st.id,
        st.product_id AS "productId",
        p.sku,
        p.name AS "productName",
        d.document_number AS "documentNumber",
        st.quantity,
        st.transaction_type AS "transactionType",
        st.notes,
        COALESCE(u.full_name, 'System') AS "operatorName",
        st.created_at AS "createdAt"
      FROM stock_transactions st
      JOIN products p ON st.product_id = p.id
      LEFT JOIN receiving_documents d ON st.document_id = d.id
      LEFT JOIN users u ON st.created_by = u.id
    `;
    const params: any[] = [];

    if (productId) {
      query += ` WHERE st.product_id = $1`;
      params.push(productId);
      query += ` ORDER BY st.created_at DESC LIMIT $2`;
      params.push(limit);
    } else {
      query += ` ORDER BY st.created_at DESC LIMIT $1`;
      params.push(limit);
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
}
