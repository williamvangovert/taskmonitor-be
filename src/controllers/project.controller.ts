import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { HttpError } from '../middleware/errorHandler';
import { parseId } from '../utils/params';
import { paginate } from '../utils/pagination';
import { withRequirementsCount, withTimelinesCount } from '../utils/serialize';

const priorityEnum = z.enum(['rendah', 'sedang', 'penting', 'mendesak']);
const statusEnum = z.enum(['pending', 'in_progress', 'completed', 'archived']);
const dateStr = z.string().min(1);

export const projectStoreSchema = z
  .object({
    title: z.string().min(1).max(255),
    description: z.string().nullish(),
    start_date: dateStr,
    end_date: dateStr,
    priority: priorityEnum.optional(),
    status: statusEnum.optional(),
    pic: z.string().max(255).nullish(),
  })
  .refine((d) => d.end_date >= d.start_date, {
    path: ['end_date'],
    message: 'The end date must be a date after or equal to start date.',
  });

export const projectUpdateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().nullish(),
  start_date: dateStr.optional(),
  end_date: dateStr.optional(),
  priority: priorityEnum.optional(),
  status: statusEnum.optional(),
  progress_percentage: z.number().int().min(0).max(100).optional(),
  pic: z.string().max(255).nullish(),
});

export async function index(req: Request, res: Response): Promise<void> {
  const status = String(req.query.status ?? 'all');
  // The dashboard requests ?limit=all to show every project (single page).
  const returnAll = String(req.query.limit ?? '') === 'all';
  const page = Math.max(parseInt(String(req.query.page ?? '1'), 10) || 1, 1);
  const perPage = 10;

  const where: Record<string, unknown> = {};
  if (status && status !== 'all') {
    if (status === 'overdue') {
      where.endDate = { lt: new Date() };
      where.status = { not: 'completed' };
    } else {
      where.status = status;
    }
  }

  const total = await prisma.project.count({ where });
  const projects = await prisma.project.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    ...(returnAll ? {} : { skip: (page - 1) * perPage, take: perPage }),
    include: {
      creator: { select: { id: true, name: true, email: true } },
      timelines: { select: { id: true, projectId: true, title: true, status: true, endDate: true } },
      _count: { select: { timelines: true } },
    },
  });

  const data = await Promise.all(
    projects.map(async (p: (typeof projects)[number]) => {
      const requirementsCount = await prisma.timelineRequirement.count({
        where: { timeline: { projectId: p.id } },
      });
      return { ...withTimelinesCount(p), requirements_count: requirementsCount };
    }),
  );

  const meta = returnAll
    ? { page: 1, perPage: Math.max(total, 1), total, path: '/projects' }
    : { page, perPage, total, path: '/projects' };
  res.json(paginate(data, meta));
}

export async function store(req: Request, res: Response): Promise<void> {
  const body = req.body as z.infer<typeof projectStoreSchema>;
  const project = await prisma.project.create({
    data: {
      title: body.title,
      description: body.description ?? null,
      startDate: new Date(body.start_date),
      endDate: new Date(body.end_date),
      priority: body.priority ?? 'sedang',
      status: body.status ?? 'pending',
      pic: body.pic ?? null,
      createdBy: req.user!.id,
    },
  });
  res.status(201).json(project);
}

export async function show(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, name: true, email: true } },
      timelines: {
        where: { enhancementId: null },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        include: { _count: { select: { requirements: true } } },
      },
      enhancements: {
        orderBy: { createdAt: 'asc' },
        include: { _count: { select: { timelines: true } } },
      },
    },
  });
  if (!project) throw new HttpError(404, 'Not Found');

  res.json({
    ...project,
    timelines: project.timelines.map(withRequirementsCount),
    enhancements: project.enhancements.map(withTimelinesCount),
  });
}

export async function update(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, 'Not Found');

  const body = req.body as z.infer<typeof projectUpdateSchema>;
  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.description !== undefined) data.description = body.description;
  if (body.start_date !== undefined) data.startDate = new Date(body.start_date);
  if (body.end_date !== undefined) data.endDate = new Date(body.end_date);
  if (body.priority !== undefined) data.priority = body.priority;
  if (body.status !== undefined) data.status = body.status;
  if (body.progress_percentage !== undefined) data.progressPercentage = body.progress_percentage;
  if (body.pic !== undefined) data.pic = body.pic;

  const project = await prisma.project.update({ where: { id }, data });
  res.json(project);
}

export async function destroy(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, 'Not Found');
  await prisma.project.delete({ where: { id } });
  res.json({ message: 'Project berhasil dihapus.' });
}
