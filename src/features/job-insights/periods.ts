import { z } from 'zod';

export const insightPeriods = ['7d', '30d', 'all'] as const;
export type InsightPeriod = (typeof insightPeriods)[number];
export const insightPeriodSchema = z.enum(insightPeriods);

export function periodStart(period: InsightPeriod, now: Date): Date | null {
  if (period === 'all') return null;
  const start = new Date(now);
  start.setUTCDate(start.getUTCDate() - (period === '7d' ? 7 : 30));
  return start;
}
