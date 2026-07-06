import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { signToken } from '../utils/jwt';
import { hashPassword, verifyPassword } from '../utils/password';

// Columns safe to return to the client (excludes password / remember_token,
// matching Laravel's $hidden attributes on the User model).
const PUBLIC_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  departmentId: true,
  avatar: true,
  emailVerifiedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const registerSchema = z
  .object({
    name: z.string().min(1).max(255),
    email: z.string().email().max(255),
    password: z.string().min(8),
    password_confirmation: z.string(),
    role: z.enum(['super_admin', 'admin', 'manager', 'staff']).optional(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    path: ['password_confirmation'],
    message: 'The password confirmation does not match.',
  });

export async function register(req: Request, res: Response): Promise<void> {
  const body = req.body as z.infer<typeof registerSchema>;

  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing) {
    res.status(422).json({
      message: 'The email has already been taken.',
      errors: { email: ['The email has already been taken.'] },
    });
    return;
  }

  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      password: await hashPassword(body.password),
      role: body.role ?? 'staff',
    },
    select: PUBLIC_USER_SELECT,
  });

  res.status(201).json({ user, token: signToken(user.id) });
}

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as z.infer<typeof loginSchema>;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.password))) {
    // 422 (not 401) mirrors Laravel's ValidationException so the login page can
    // display the message instead of the axios 401 interceptor redirecting.
    res.status(422).json({
      message: 'Email atau password salah.',
      errors: { email: ['Email atau password salah.'] },
    });
    return;
  }

  const { password: _password, rememberToken: _rememberToken, ...safeUser } = user;
  res.json({ user: safeUser, token: signToken(user.id) });
}

export async function me(req: Request, res: Response): Promise<void> {
  const { password: _password, rememberToken: _rememberToken, ...safeUser } = req.user!;
  res.json(safeUser);
}

export async function users(_req: Request, res: Response): Promise<void> {
  const list = await prisma.user.findMany({
    select: { id: true, name: true, email: true },
    orderBy: { name: 'asc' },
  });
  res.json(list);
}

export async function logout(_req: Request, res: Response): Promise<void> {
  // JWT is stateless — the client simply discards the token. Endpoint kept for
  // API parity with the old Sanctum logout.
  res.json({ message: 'Logout berhasil.' });
}
