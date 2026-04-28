import jwt from 'jsonwebtoken';
import { httpError } from '../lib/errors.js';
import { prisma } from '../lib/prisma.js';

const jwtSecret = () => process.env.JWT_SECRET || 'development-secret-change-before-deployment';

export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, jwtSecret(), { expiresIn: '8h' });
}

export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw httpError(401, 'UNAUTHORIZED', 'A valid bearer token is required');
    }

    const token = header.slice('Bearer '.length);
    let payload;
    try {
      payload = jwt.verify(token, jwtSecret());
    } catch {
      throw httpError(401, 'UNAUTHORIZED', 'Token is missing, invalid, or expired');
    }

    const user = await prisma.user.findUnique({ where: { id: Number(payload.sub) } });
    if (!user) {
      throw httpError(401, 'UNAUTHORIZED', 'Token user no longer exists');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

export function isAdmin(user) {
  return user?.role === 'ADMIN';
}
