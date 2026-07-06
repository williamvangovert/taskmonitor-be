import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { HttpError } from '../middleware/errorHandler';
import { parseId } from '../utils/params';
import { withRequirementsCount, withTimelinesCount } from '../utils/serialize';
import { recalcProject } from '../services/progress';

const statusEnum = z.enum(['pending', 'in_progress', 'completed', 'overdue']);

export const enhancementStoreSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().nullish(),
  status: statusEnum.optional(),
  pic: z.string().max(255).nullish(),
});

export const enhancementUpdateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().nullish(),
  status: statusEnum.optional(),
  progress_percentage: z.number().int().min(0).max(100).optional(),
  pic: z.string().max(255).nullish(),
});

export async function index(req: Request, res: Response): Promise<void> {
  const projectId = parseId(req.params.projectId);
  const list = await prisma.projectEnhancement.findMany({
    where: { projectId },
    orderBy: { createdAt: 'asc' },
    include: { _count: { select: { timelines: true } } },
  });
  res.json(list.map(withTimelinesCount));
}

export async function store(req: Request, res: Response): Promise<void> {
  const projectId = parseId(req.params.projectId);
  const body = req.body as z.infer<typeof enhancementStoreSchema>;
  const enhancement = await prisma.projectEnhancement.create({
    data: {
      projectId,
      title: body.title,
      description: body.description ?? null,
      status: body.status ?? 'pending',
      pic: body.pic ?? null,
      createdBy: req.user!.id,
    },
  });
  res.status(201).json(enhancement);
}

export async function show(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.enhancementId);
  const enhancement = await prisma.projectEnhancement.findUnique({
    where: { id },
    include: {
      timelines: {
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        include: { _count: { select: { requirements: true } } },
      },
    },
  });
  if (!enhancement) throw new HttpError(404, 'Not Found');

  res.json({
    ...enhancement,
    timelines: enhancement.timelines.map(withRequirementsCount),
  });
}

export async function update(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.enhancementId);
  const projectId = parseId(req.params.projectId);
  const existing = await prisma.projectEnhancement.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, 'Not Found');

  const body = req.body as z.infer<typeof enhancementUpdateSchema>;
  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.description !== undefined) data.description = body.description;
  if (body.status !== undefined) data.status = body.status;
  if (body.progress_percentage !== undefined) data.progressPercentage = body.progress_percentage;
  if (body.pic !== undefined) data.pic = body.pic;

  const enhancement = await prisma.projectEnhancement.update({ where: { id }, data });
  await recalcProject(projectId);
  res.json(enhancement);
}

export async function destroy(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.enhancementId);
  const projectId = parseId(req.params.projectId);
  const existing = await prisma.projectEnhancement.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, 'Not Found');
  await prisma.projectEnhancement.delete({ where: { id } });
  await recalcProject(projectId);
  res.json({ message: 'Enhancement berhasil dihapus.' });
}
