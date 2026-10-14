import type { AppData } from '../types';
import { daysBetween } from './date';
import { generatePlan, plannedTaskIds } from './plan';

export function getDashboard(data: AppData, today: string) {
  const day = data.days[today];
  const weightDay = Object.values(data.days)
    .filter(record => record.date <= today && record.weightKg !== null)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  const weightKg = weightDay?.weightKg ?? data.profile.startWeightKg;
  const plan = generatePlan(today, data.profile);
  const planned = new Set(plan.tasks.length ? day?.plannedTaskIds ?? plannedTaskIds(plan) : []);
  const done = new Set((day?.completedTaskIds ?? []).filter(id => planned.has(id)));
  const studyMinutes = data.studyRecords.filter(record => record.date === today)
    .reduce((sum, record) => sum + record.minutes, 0);
  const rehabCount = new Set((day?.completedRehabIds ?? [])
    .filter(id => ['mcgill', 'bird-dog', 'glute-bridge', 'dead-bug', 'side-plank'].includes(id))).size;
  const totalDays = daysBetween(data.profile.startDate, data.profile.examDate);
  const remainingDays = daysBetween(today, data.profile.examDate);
  return {
    remainingDays, weightKg, weightDate: weightDay?.date ?? null,
    completedTasks: done.size, plannedTasks: planned.size,
    completionRate: planned.size ? Math.round(done.size / planned.size * 100) : null,
    studyMinutes, exercises: day?.exercises ?? [], rehabCount,
    sprintProgress: totalDays > 0 ? Math.min(100, Math.max(0,
      daysBetween(data.profile.startDate, today) / totalDays * 100)) : 100,
  };
}
