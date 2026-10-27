import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { pool } from '../config/db';
import { ENV } from '../config/env';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { username, password } = loginSchema.parse(req.body);

    const result = await pool.query(
      `SELECT id, username, password_hash, full_name, role FROM users WHERE username = $1`,
      [username.toLowerCase().trim()]
    );

    const user = result.rows[0];
    if (!user) {
      throw new AppError('Invalid username or password', 401, 'INVALID_CREDENTIALS');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new AppError('Invalid username or password', 401, 'INVALID_CREDENTIALS');
    }

    const tokenPayload = {
      id: user.id,
      username: user.username,
      role: user.role,
      fullName: user.full_name,
    };

    const token = jwt.sign(tokenPayload, ENV.JWT_SECRET, {
      expiresIn: '24h',
    });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getCurrentUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
    }

    const result = await pool.query(
      `SELECT id, username, full_name, role, created_at FROM users WHERE id = $1`,
      [req.user.id]
    );

    const user = result.rows[0];
    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    res.json({
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      role: user.role,
      createdAt: user.created_at,
    });
  } catch (error) {
    next(error);
  }
}
