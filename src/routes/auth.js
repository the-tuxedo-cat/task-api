import bcrypt from 'bcrypt';
import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { asyncHandler, httpError } from '../lib/errors.js';
import { publicUser } from '../lib/formatters.js';
import { prisma } from '../lib/prisma.js';
import { requiredString, validateEmail, validatePassword } from '../lib/validation.js';
import { signToken } from '../middleware/auth.js';

export const authRouter = Router();

authRouter.post(
  '/signup',
  asyncHandler(async (req, res) => {
    const email = validateEmail(req.body.email);
    const password = validatePassword(req.body.password);
    const displayName = requiredString(req.body.displayName, 'displayName');
    const passwordHash = await bcrypt.hash(password, 12);

    try {
      const user = await prisma.user.create({
        data: { email, passwordHash, displayName, role: 'USER' },
      });

      res.status(201).json({
        message: 'User account created successfully',
        user: publicUser(user),
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw httpError(409, 'CONFLICT', 'An account with this email already exists');
      }
      throw error;
    }
  }),
);

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const email = validateEmail(req.body.email);
    const password = requiredString(req.body.password, 'password');

    const user = await prisma.user.findUnique({ where: { email } });
    const validPassword = user ? await bcrypt.compare(password, user.passwordHash) : false;
    if (!user || !validPassword) {
      throw httpError(401, 'UNAUTHORIZED', 'Email or password is incorrect');
    }

    res.json({
      message: 'Login successful',
      token: signToken(user),
      user: publicUser(user),
    });
  }),
);
