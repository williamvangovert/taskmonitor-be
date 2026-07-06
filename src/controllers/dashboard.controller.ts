import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { remember } from '../lib/cache';

const DAY_MS = 86_400_000;

/** Absolute whole-day distance between today and a due date (both by date). */
function daysFromToday(due: Date): number {
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const dueDay = Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate());
  return Math.abs(Math.floor((today - dueDay) / DAY_MS));
}

// Shared include for the deadline lists (overdue / upcoming / critical).
const DEADLINE_INCLUDE = {
  timeline: {
    select: {
      id: true,
      projectId: true,
      title: true,
      project: { select: { id: true, title: true } },
    },
  },
  assignedUser: { select: { id: true, name: true, email: true } },
} as const;

export async function stats(_req: Request, res: Response): Promise<void> {
  const data = await remember('dashboard_stats', 60, async () => {
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * DAY_MS);
    const in2 = new Date(now.getTime() + 2 * DAY_MS);
    const weekAgo = new Date(now.getTime() - 7 * DAY_MS);

    const [statusGroups, priorityGroups, total, completed, upcoming, critical, overdueCount, totalProjects, activeTimelines, activeUsers] =
      await Promise.all([
        prisma.timelineRequirement.groupBy({ by: ['status'], _count: { _all: true } }),
        prisma.timelineRequirement.groupBy({ by: ['priority'], _count: { _all: true } }),
        prisma.timelineRequirement.count(),
        prisma.timelineRequirement.count({ where: { isCompleted: true } }),
        prisma.timelineRequirement.count({ where: { isCompleted: false, dueDate: { gte: now, lte: in30 } } }),
        prisma.timelineRequirement.count({ where: { isCompleted: false, dueDate: { gte: now, lte: in2 } } }),
        prisma.timelineRequirement.count({
          where: { OR: [{ status: 'overdue' }, { isCompleted: false, dueDate: { lt: now } }] },
        }),
        prisma.project.count(),
        prisma.projectTimeline.count({ where: { status: { in: ['pending', 'in_progress'] } } }),
        prisma.user.count({ where: { updatedAt: { gte: weekAgo } } }),
      ]);

    const statusCounts: Record<string, number> = {};
    for (const g of statusGroups) statusCounts[g.status] = g._count._all;
    const priorityCounts: Record<string, number> = {};
    for (const g of priorityGroups) priorityCounts[g.priority] = g._count._all;

    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total_projects: totalProjects,
      active_timelines: activeTimelines,
      total_requirements: total,
      overdue_count: overdueCount,
      upcoming_deadlines: upcoming,
      critical_deadlines: critical,
      completion_rate: rate,
      active_users: activeUsers,
      status_distribution: {
        pending: statusCounts.pending ?? 0,
        in_progress: statusCounts.in_progress ?? 0,
        completed: statusCounts.completed ?? 0,
        overdue: statusCounts.overdue ?? 0,
      },
      priority_distribution: {
        rendah: priorityCounts.rendah ?? 0,
        sedang: priorityCounts.sedang ?? 0,
        penting: priorityCounts.penting ?? 0,
        mendesak: priorityCounts.mendesak ?? 0,
      },
    };
  });

  res.json(data);
}

export async function overdue(_req: Request, res: Response): Promise<void> {
  const data = await remember('dashboard_overdue', 60, async () => {
    const now = new Date();
    const rows = await prisma.timelineRequirement.findMany({
      where: { OR: [{ status: 'overdue' }, { isCompleted: false, dueDate: { lt: now } }] },
      include: DEADLINE_INCLUDE,
      orderBy: { dueDate: 'asc' },
      take: 50,
    });
    return rows.map((r) => ({ ...r, days_late: daysFromToday(r.dueDate) }));
  });

  res.json(data);
}

export async function upcoming(_req: Request, res: Response): Promise<void> {
  const data = await remember('dashboard_upcoming', 60, async () => {
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * DAY_MS);
    const rows = await prisma.timelineRequirement.findMany({
      where: { isCompleted: false, dueDate: { gte: now, lte: in30 } },
      include: DEADLINE_INCLUDE,
      orderBy: { dueDate: 'asc' },
      take: 50,
    });
    return rows.map((r) => ({ ...r, days_until: daysFromToday(r.dueDate) }));
  });

  res.json(data);
}

export async function critical(_req: Request, res: Response): Promise<void> {
  const data = await remember('dashboard_critical', 60, async () => {
    const now = new Date();
    const in2 = new Date(now.getTime() + 2 * DAY_MS);
    const rows = await prisma.timelineRequirement.findMany({
      where: { isCompleted: false, dueDate: { gte: now, lte: in2 } },
      include: DEADLINE_INCLUDE,
      orderBy: { dueDate: 'asc' },
      take: 20,
    });
    return rows.map((r) => ({ ...r, days_until: daysFromToday(r.dueDate) }));
  });

  res.json(data);
}

interface PicEntry {
  name: string;
  total: number;
  completed: number;
  not_completed: number;
  tasks_completed: unknown[];
  tasks_not_completed: unknown[];
}

/** ucwords(strtolower(pic)) equivalent. */
function titleCase(value: string): string {
  return value.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function picPerformance(_req: Request, res: Response): Promise<void> {
  const data = await remember('dashboard_pic_performance', 60, async () => {
    const rows = await prisma.timelineRequirement.findMany({
      where: { AND: [{ pic: { not: null } }, { pic: { not: '' } }] },
      select: {
        id: true,
        pic: true,
        title: true,
        status: true,
        dueDate: true,
        timelineId: true,
        timeline: {
          select: { title: true, project: { select: { id: true, title: true } } },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    const pics: Record<string, PicEntry> = {};
    for (const row of rows) {
      const picName = titleCase((row.pic ?? '').trim());
      if (!picName) continue;

      if (!pics[picName]) {
        pics[picName] = {
          name: picName,
          total: 0,
          completed: 0,
          not_completed: 0,
          tasks_completed: [],
          tasks_not_completed: [],
        };
      }

      const taskEntry = {
        id: row.id,
        title: row.title,
        status: row.status,
        due_date: row.dueDate,
        timeline_id: row.timelineId,
        timeline_title: row.timeline?.title ?? null,
        project_id: row.timeline?.project?.id ?? null,
        project_title: row.timeline?.project?.title ?? null,
      };

      pics[picName].total += 1;
      if (row.status === 'completed') {
        pics[picName].completed += 1;
        pics[picName].tasks_completed.push(taskEntry);
      } else {
        pics[picName].not_completed += 1;
        pics[picName].tasks_not_completed.push(taskEntry);
      }
    }

    return Object.values(pics).sort((a, b) => b.total - a.total);
  });

  res.json(data);
}
