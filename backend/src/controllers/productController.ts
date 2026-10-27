import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { pool } from '../config/db';
import { AppError } from '../middleware/errorHandler';

const createProductSchema = z.object({
  sku: z.string().trim().min(2, 'SKU must be at least 2 characters').toUpperCase(),
  name: z.string().trim().min(2, 'Product name is required'),
  description: z.string().optional().default(''),
  uom: z.string().trim().toUpperCase().default('PCS'),
});

export async function listProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const search = req.query.search ? String(req.query.search).trim() : null;

    let query = `
      SELECT 
        p.id,
        p.sku,
        p.name,
        p.description,
        p.uom,
        p.created_at AS "createdAt",
        COALESCE(i.quantity_on_hand, 0) AS "quantityOnHand"
      FROM products p
      LEFT JOIN inventory i ON p.id = i.product_id
    `;
    const params: any[] = [];

    if (search) {
      query += ` WHERE p.sku ILIKE $1 OR p.name ILIKE $1`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY p.created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
}

export async function createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = createProductSchema.parse(req.body);

    // Check if SKU already exists
    const existing = await pool.query(`SELECT id FROM products WHERE sku = $1`, [data.sku]);
    if (existing.rows.length > 0) {
      throw new AppError(`A product with SKU "${data.sku}" already exists.`, 400, 'DUPLICATE_SKU');
    }

    const result = await pool.query(
      `INSERT INTO products (sku, name, description, uom)
       VALUES ($1, $2, $3, $4)
       RETURNING id, sku, name, description, uom, created_at AS "createdAt"`,
      [data.sku, data.name, data.description, data.uom]
    );

    // Initialize inventory record with 0
    await pool.query(
      `INSERT INTO inventory (product_id, quantity_on_hand) VALUES ($1, 0) ON CONFLICT DO NOTHING`,
      [result.rows[0].id]
    );

    res.status(201).json({
      ...result.rows[0],
      quantityOnHand: 0,
    });
  } catch (error) {
    next(error);
  }
}
