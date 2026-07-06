import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { parseId } from '../utils/params';
import { paginate } from '../utils/pagination';

export async function index(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const page = Math.max(parseInt(String(req.query.page ?? '1'), 10) || 1, 1);
  const perPage = 20;

  const total = await prisma.notification.count({ where: { userId } });
  const rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * perPage,
    take: perPage,
  });

  res.json(paginate(rows, { page, perPage, total, path: '/notifications' }));
}

export async function markRead(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  await prisma.notification.updateMany({
    where: { id, userId: req.user!.id },
    data: { isRead: true },
  });
  res.json({ message: 'Notifikasi ditandai dibaca.' });
}

export async function markAllRead(req: Request, res: Response): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId: req.user!.id },
    data: { isRead: true },
  });
  res.json({ message: 'Semua notifikasi ditandai dibaca.' });
}
