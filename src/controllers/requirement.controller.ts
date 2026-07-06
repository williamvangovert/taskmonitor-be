import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { forget } from '../lib/cache';
import { HttpError } from '../middleware/errorHandler';
import { parseId, toBigIntOrNull } from '../utils/params';
import { diffInDays } from '../utils/dates';
import { recalcTimeline } from '../services/progress';

const priorityEnum = z.enum(['rendah', 'sedang', 'penting', 'mendesak']);
const statusEnum = z.enum(['pending', 'in_progress', 'completed', 'overdue']);
const dateStr = z.string().min(1);
const idInput = z.union([z.number(), z.string()]).nullish();

// Dashboard cache keys invalidated whenever requirements change
// (mirrors the Laravel TimelineRequirementObserver's Cache::forget).
const DASHBOARD_CACHE_KEYS = [
  'dashboard_stats',
  'dashboard_overdue',
  'dashboard_upcoming',
  'dashboard_critical',
  'dashboard_pic_performance',
];

function invalidateDashboard(): void {
  for (const key of DASHBOARD_CACHE_KEYS) forget(key);
}

export const requirementStoreSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().nullish(),
  assigned_to: idInput,
  start_date: dateStr.nullish(),
  end_date: dateStr.nullish(),
  due_date: dateStr,
  priority: priorityEnum.optional(),
  pic: z.string().max(255).nullish(),
});

export const requirementUpdateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().nullish(),
  assigned_to: idInput,
  start_date: dateStr.nullish(),
  end_date: dateStr.nullish(),
  due_date: dateStr.optional(),
  priority: priorityEnum.optional(),
  status: statusEnum.optional(),
  progress_percentage: z.number().int().min(0).max(100).optional(),
  is_completed: z.boolean().optional(),
  pic: z.string().max(255).nullish(),
});

export async function index(req: Request, res: Response): Promise<void> {
  const timelineId = parseId(req.params.timelineId);
  const requirements = await prisma.timelineRequirement.findMany({
    where: { timelineId },
    orderBy: { dueDate: 'asc' },
    take: 100,
    include: { assignedUser: { select: { id: true, name: true, email: true } } },
  });
  res.json(requirements);
}

export async function store(req: Request, res: Response): Promise<void> {
  const timelineId = parseId(req.params.timelineId);
  const body = req.body as z.infer<typeof requirementStoreSchema>;

  const durationDays =
    body.start_date && body.end_date ? diffInDays(body.start_date, body.end_date) : 0;

  const requirement = await prisma.timelineRequirement.create({
    data: {
      timelineId,
      title: body.title,
      description: body.description ?? null,
      assignedTo: toBigIntOrNull(body.assigned_to),
      startDate: body.start_date ? new Date(body.start_date) : null,
      endDate: body.end_date ? new Date(body.end_date) : null,
      dueDate: new Date(body.due_date),
      durationDays,
      priority: body.priority ?? 'sedang',
      pic: body.pic ?? null,
      createdBy: req.user!.id,
    },
  });

  await recalcTimeline(timelineId);
  invalidateDashboard();
  res.status(201).json(requirement);
}

export async function show(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.requirementId);
  const requirement = await prisma.timelineRequirement.findUnique({
    where: { id },
    include: { assignedUser: { select: { id: true, name: true, email: true } } },
  });
  if (!requirement) throw new HttpError(404, 'Not Found');
  res.json(requirement);
}

export async function update(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.requirementId);
  const timelineId = parseId(req.params.timelineId);
  const existing = await prisma.timelineRequirement.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, 'Not Found');

  const body = req.body as z.infer<typeof requirementUpdateSchema>;
  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.description !== undefined) data.description = body.description;
  if (body.assigned_to !== undefined) data.assignedTo = toBigIntOrNull(body.assigned_to);
  if (body.start_date !== undefined) data.startDate = body.start_date ? new Date(body.start_date) : null;
  if (body.end_date !== undefined) data.endDate = body.end_date ? new Date(body.end_date) : null;
  if (body.due_date !== undefined) data.dueDate = new Date(body.due_date);
  if (body.priority !== undefined) data.priority = body.priority;
  if (body.status !== undefined) data.status = body.status;
  if (body.progress_percentage !== undefined) data.progressPercentage = body.progress_percentage;
  if (body.pic !== undefined) data.pic = body.pic;
  if (body.is_completed !== undefined) data.isCompleted = body.is_completed;

  // Mirror Laravel: marking complete also stamps completed_at / status / progress.
  if (body.is_completed) {
    data.completedAt = new Date();
    data.status = 'completed';
    data.progressPercentage = 100;
  }

  const requirement = await prisma.timelineRequirement.update({ where: { id }, data });

  await recalcTimeline(timelineId);
  invalidateDashboard();
  res.json(requirement);
}

export async function destroy(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.requirementId);
  const timelineId = parseId(req.params.timelineId);
  const existing = await prisma.timelineRequirement.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, 'Not Found');

  await prisma.timelineRequirement.delete({ where: { id } });
  await recalcTimeline(timelineId);
  invalidateDashboard();
  res.json({ message: 'Requirement berhasil dihapus.' });
}
