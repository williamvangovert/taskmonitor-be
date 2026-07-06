import { prisma } from '../lib/prisma';

interface ChildRow {
  progressPercentage: number;
  status: string;
}

/**
 * Given a set of children (requirements for a timeline, or timelines for an
 * enhancement/project) and the parent's current status, compute the parent's
 * new progress_percentage and (optionally) status. This mirrors the shared
 * logic in the Laravel models' recalculateProgress().
 */
function computeUpdate(
  rows: ChildRow[],
  currentStatus: string,
): { progressPercentage: number; status?: string } {
  const total = rows.length;
  const avg = total ? rows.reduce((sum, r) => sum + r.progressPercentage, 0) / total : 0;
  const completed = rows.filter((r) => r.status === 'completed').length;
  const notPending = rows.filter((r) => r.status !== 'pending').length;

  const update: { progressPercentage: number; status?: string } = {
    progressPercentage: total > 0 ? Math.round(avg) : 0,
  };

  if (total > 0) {
    if (completed === total) {
      update.status = 'completed';
    } else if (notPending > 0 && (currentStatus === 'pending' || currentStatus === 'completed')) {
      update.status = 'in_progress';
    }
  }

  return update;
}

/** Recalculate a timeline's progress from its requirements, then cascade up. */
export async function recalcTimeline(timelineId: bigint): Promise<void> {
  const timeline = await prisma.projectTimeline.findUnique({
    where: { id: timelineId },
    select: { id: true, status: true, enhancementId: true, projectId: true },
  });
  if (!timeline) return;

  const rows = await prisma.timelineRequirement.findMany({
    where: { timelineId },
    select: { progressPercentage: true, status: true },
  });

  await prisma.projectTimeline.update({
    where: { id: timelineId },
    data: computeUpdate(rows, timeline.status),
  });

  if (timeline.enhancementId) await recalcEnhancement(timeline.enhancementId);
  await recalcProject(timeline.projectId);
}

/** Recalculate an enhancement's progress from its timelines. */
export async function recalcEnhancement(enhancementId: bigint): Promise<void> {
  const enhancement = await prisma.projectEnhancement.findUnique({
    where: { id: enhancementId },
    select: { id: true, status: true },
  });
  if (!enhancement) return;

  const rows = await prisma.projectTimeline.findMany({
    where: { enhancementId },
    select: { progressPercentage: true, status: true },
  });

  await prisma.projectEnhancement.update({
    where: { id: enhancementId },
    data: computeUpdate(rows, enhancement.status),
  });
}

/** Recalculate a project's progress from all its timelines. */
export async function recalcProject(projectId: bigint): Promise<void> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, status: true },
  });
  if (!project) return;

  const rows = await prisma.projectTimeline.findMany({
    where: { projectId },
    select: { progressPercentage: true, status: true },
  });

  await prisma.project.update({
    where: { id: projectId },
    data: computeUpdate(rows, project.status),
  });
}
