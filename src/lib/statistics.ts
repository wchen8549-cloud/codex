import type { AppData } from '../types';
import { addDays, dateKey, isDateKey } from './date';
import { generatePlan, plannedTaskIds } from './plan';

export type ReportPeriod = 'week' | 'month';
export interface DailyStatistics {
  date: string; studyHours: number | null; exerciseCount: number | null;
  weightKg: number | null; painScore: number | null;
  completedTasks: number; plannedTasks: number; completionRate: number | null;
}
export function periodBounds(anchor: string, period: ReportPeriod) {
  if (!isDateKey(anchor)) throw new Error('统计日期无效');
  if (period === 'week') {
    const weekday = new Date(`${anchor}T00:00:00Z`).getUTCDay();
    const start = addDays(anchor, -(weekday === 0 ? 6 : weekday - 1));
    return { start, end: addDays(start, 6) };
  }
  const start = `${anchor.slice(0, 7)}-01`;
  const next = new Date(`${start}T00:00:00Z`);
  next.setUTCMonth(next.getUTCMonth() + 1);
  return { start, end: new Date(next.getTime() - 86_400_000).toISOString().slice(0, 10) };
}
export function dailyStatistics(data: AppData, start: string, end: string, today = dateKey()): DailyStatistics[] {
  if (!isDateKey(start) || !isDateKey(end) || start > end) throw new Error('统计范围无效');
  const result: DailyStatistics[] = [];
  const studyByDate = new Map<string, number>();
  for (const record of data.studyRecords) studyByDate.set(record.date, (studyByDate.get(record.date) ?? 0) + record.minutes);
  for (let date = start; date <= end; date = addDays(date, 1)) {
    const day = data.days[date];
    const future = date > today;
    const plan = generatePlan(date, data.profile);
    const ids = new Set(!future && plan.tasks.length ? day?.plannedTaskIds ?? plannedTaskIds(plan) : []);
    const completed = new Set((day?.completedTaskIds ?? []).filter(id => ids.has(id)));
    result.push({ date, studyHours: future ? null : (studyByDate.get(date) ?? 0) / 60,
      exerciseCount: future ? null : new Set(day?.exercises ?? []).size,
      weightKg: future ? null : day?.weightKg ?? null, painScore: future ? null : day?.painScore ?? null,
      completedTasks: completed.size, plannedTasks: ids.size,
      completionRate: ids.size ? Math.round(completed.size / ids.size * 100) : null });
    if (date === end) break;
  }
  return result;
}
export function getReport(data: AppData, anchor: string, period: ReportPeriod, today = dateKey()) {
  const bounds = periodBounds(anchor, period);
  const days = dailyStatistics(data, bounds.start, bounds.end, today);
  const weights = days.filter(day => day.weightKg !== null).map(day => day.weightKg!);
  const pains = days.filter(day => day.painScore !== null);
  const planned = days.reduce((sum, day) => sum + day.plannedTasks, 0);
  const completed = days.reduce((sum, day) => sum + day.completedTasks, 0);
  return { ...bounds, days,
    through: bounds.end < today ? bounds.end : today,
    studyHours: days.reduce((sum, day) => sum + (day.studyHours ?? 0), 0),
    exerciseCount: days.reduce((sum, day) => sum + (day.exerciseCount ?? 0), 0),
    exerciseDays: days.filter(day => (day.exerciseCount ?? 0) > 0).length,
    averageWeight: weights.length ? weights.reduce((sum, value) => sum + value, 0) / weights.length : null,
    weightSamples: weights.length, painSamples: pains.length,
    painChange: pains.length >= 2 ? pains[pains.length - 1].painScore! - pains[0].painScore! : null,
    completedTasks: completed, plannedTasks: planned,
    completionRate: planned ? Math.round(completed / planned * 100) : null,
  };
}
