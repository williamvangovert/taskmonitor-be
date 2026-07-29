import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { HttpError } from '../middleware/errorHandler';
import { parseId, toBigIntOrNull } from '../utils/params';
import { withRequirementsCount } from '../utils/serialize';
import { diffInDays } from '../utils/dates';
import { recalcEnhancement, recalcProject } from '../services/progress';
import { forget } from '../lib/cache';

const priorityEnum = z.enum(['rendah', 'sedang', 'penting', 'mendesak']);
const statusEnum = z.enum(['pending', 'in_progress', 'completed', 'overdue']);
const dateStr = z.string().min(1);
const idInput = z.union([z.number(), z.string()]).nullish();

export const timelineStoreSchema = z
  .object({
    title: z.string().min(1).max(255),
    description: z.string().nullish(),
    start_date: dateStr,
    end_date: dateStr,
    priority: priorityEnum.optional(),
    pic: z.string().max(255).nullish(),
    enhancement_id: idInput,
  })
  .refine((d) => d.end_date >= d.start_date, {
    path: ['end_date'],
    message: 'The end date must be a date after or equal to start date.',
  });

export const timelineUpdateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().nullish(),
  start_date: dateStr.optional(),
  end_date: dateStr.optional(),
  priority: priorityEnum.optional(),
  status: statusEnum.optional(),
  progress_percentage: z.number().int().min(0).max(100).optional(),
  pic: z.string().max(255).nullish(),
  enhancement_id: idInput,
});

export async function index(req: Request, res: Response): Promise<void> {
  const projectId = parseId(req.params.projectId);
  const timelines = await prisma.projectTimeline.findMany({
    where: { projectId },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    take: 100,
    include: { _count: { select: { requirements: true } } },
  });
  res.json(timelines.map(withRequirementsCount));
}

export async function store(req: Request, res: Response): Promise<void> {
  const projectId = parseId(req.params.projectId);
  const body = req.body as z.infer<typeof timelineStoreSchema>;
  const timeline = await prisma.projectTimeline.create({
    data: {
      projectId,
      enhancementId: toBigIntOrNull(body.enhancement_id),
      title: body.title,
      description: body.description ?? null,
      startDate: new Date(body.start_date),
      endDate: new Date(body.end_date),
      durationDays: diffInDays(body.start_date, body.end_date),
      priority: body.priority ?? 'sedang',
      pic: body.pic ?? null,
      createdBy: req.user!.id,
    },
  });
  forget('dashboard_stats');
  res.status(201).json(timeline);
}

export async function show(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.timelineId);
  const timeline = await prisma.projectTimeline.findUnique({
    where: { id },
    include: {
      requirements: {
        orderBy: { dueDate: 'asc' },
        include: { assignedUser: { select: { id: true, name: true, email: true } } },
      },
    },
  });
  if (!timeline) throw new HttpError(404, 'Not Found');
  res.json(timeline);
}

export async function update(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.timelineId);
  const existing = await prisma.projectTimeline.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, 'Not Found');

  const body = req.body as z.infer<typeof timelineUpdateSchema>;
  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.description !== undefined) data.description = body.description;
  if (body.start_date !== undefined) data.startDate = new Date(body.start_date);
  if (body.end_date !== undefined) data.endDate = new Date(body.end_date);
  if (body.priority !== undefined) data.priority = body.priority;
  if (body.status !== undefined) data.status = body.status;
  if (body.progress_percentage !== undefined) data.progressPercentage = body.progress_percentage;
  if (body.pic !== undefined) data.pic = body.pic;
  if (body.enhancement_id !== undefined) data.enhancementId = toBigIntOrNull(body.enhancement_id);

  const timeline = await prisma.projectTimeline.update({ where: { id }, data });

  if (timeline.enhancementId) await recalcEnhancement(timeline.enhancementId);
  await recalcProject(timeline.projectId);
  forget('dashboard_stats');
  res.json(timeline);
}

export async function destroy(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.timelineId);
  const timeline = await prisma.projectTimeline.findUnique({
    where: { id },
    select: { id: true, enhancementId: true, projectId: true },
  });
  if (!timeline) throw new HttpError(404, 'Not Found');

  await prisma.projectTimeline.delete({ where: { id } });
  if (timeline.enhancementId) await recalcEnhancement(timeline.enhancementId);
  await recalcProject(timeline.projectId);
  forget('dashboard_stats');
  res.json({ message: 'Timeline berhasil dihapus.' });
}
