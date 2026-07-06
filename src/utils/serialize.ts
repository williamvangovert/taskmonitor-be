/**
 * Flatten Prisma's `_count.requirements` into `requirements_count`, matching
 * Laravel's withCount('requirements').
 */
export function withRequirementsCount<T extends { _count?: { requirements?: number } }>(
  row: T,
): Omit<T, '_count'> & { requirements_count: number } {
  const { _count, ...rest } = row as T & { _count?: { requirements?: number } };
  return { ...rest, requirements_count: _count?.requirements ?? 0 };
}

/**
 * Flatten Prisma's `_count.timelines` into `timelines_count`, matching
 * Laravel's withCount('timelines').
 */
export function withTimelinesCount<T extends { _count?: { timelines?: number } }>(
  row: T,
): Omit<T, '_count'> & { timelines_count: number } {
  const { _count, ...rest } = row as T & { _count?: { timelines?: number } };
  return { ...rest, timelines_count: _count?.timelines ?? 0 };
}
