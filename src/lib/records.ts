import type { AppData, DailyRecord, ExerciseType, StudyCategory, StudyRecord, StudyTimerState } from '../types';
import { addDays, dateKey, isDateKey } from './date';
import { createDailyRecord, ensureDailyPlan, generatePlan, plannedTaskIds } from './plan';

export const STUDY_CATEGORIES: StudyCategory[] = ['行测', '申论', '错题整理', '资料分析', '判断推理', '言语理解', '数量关系'];
export const EXERCISE_TYPES: ExerciseType[] = ['力量训练', '游泳', '散步', '核心训练'];
export const REHAB_MOVES = [
  { id: 'mcgill', name: 'McGill卷腹', dose: '3组 × 8次' },
  { id: 'bird-dog', name: '鸟狗式', dose: '左右10次' },
  { id: 'glute-bridge', name: '臀桥', dose: '15次 × 2组' },
  { id: 'dead-bug', name: '死虫式', dose: '左右10次' },
  { id: 'side-plank', name: '侧桥', dose: '左右20秒' },
];
export const SUPPLEMENTS = [
  { id: 'multivitamin', name: '善存', time: '早餐' },
  { id: 'fish-oil', name: '鱼油1粒', time: '午餐' },
  { id: 'creatine', name: '肌酸3–5g', time: '训练后' },
  { id: 'coffee', name: '咖啡', time: '上午' },
];
export function editableDate(date: string, today = dateKey()): boolean { return isDateKey(date) && date <= today; }
export function patchDay(data: AppData, date: string, patch: Partial<Omit<DailyRecord, 'date'>>, today = dateKey()): AppData {
  if (!editableDate(date, today)) throw new Error('只能记录今天或过去日期');
  const valid = (value: number | null | undefined, min: number, max: number, integer = false) =>
    value === undefined || value === null || (Number.isFinite(value) && value >= min && value <= max && (!integer || Number.isInteger(value)));
  if (!valid(patch.weightKg, 30, 300) || !valid(patch.steps, 0, 100000, true) ||
    !valid(patch.painScore, 0, 10, true) || !valid(patch.meals?.proteinG, 0, 1000)) throw new Error('身体或饮食数值无效');
  if (patch.completedRehabIds?.some(id => !REHAB_MOVES.some(move => move.id === id)) ||
    patch.supplements?.some(id => !SUPPLEMENTS.some(item => item.id === id)) ||
    patch.exercises?.some(item => !EXERCISE_TYPES.includes(item))) throw new Error('打卡类型无效');
  const day = { ...(data.days[date] ?? createDailyRecord(date)), ...patch, date };
  return ensureDailyPlan({ ...data, days: { ...data.days, [date]: day } }, date);
}
export function toggled(values: string[], id: string): string[] {
  return values.includes(id) ? values.filter(value => value !== id) : [...new Set([...values, id])];
}
export function toggleTask(data: AppData, date: string, id: string, today = dateKey()): AppData {
  if (!plannedTaskIds(generatePlan(date, data.profile)).includes(id)) throw new Error('此安排不可打卡');
  return patchDay(data, date, { completedTaskIds: toggled(data.days[date]?.completedTaskIds ?? [], id) }, today);
}
export function addStudyRecord(data: AppData, record: StudyRecord, today = dateKey()): AppData {
  if (!editableDate(record.date, today) || !STUDY_CATEGORIES.includes(record.category) ||
    !Number.isFinite(record.minutes) || record.minutes <= 0 || record.minutes > 1440 || !record.id) throw new Error('学习记录无效');
  if (data.studyRecords.some(item => item.id === record.id)) return data;
  const total = data.studyRecords.filter(item => item.date === record.date).reduce((sum, item) => sum + item.minutes, 0);
  if (total + record.minutes > 1440) throw new Error('当天累计学习不能超过24小时');
  return { ...data, studyRecords: [...data.studyRecords, record] };
}
export function studyTotals(data: AppData, date: string) {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  const weekStart = addDays(date, -(weekday === 0 ? 6 : weekday - 1));
  const weekEnd = addDays(weekStart, 6);
  return {
    daily: data.studyRecords.filter(record => record.date === date).reduce((sum, record) => sum + record.minutes, 0),
    weekly: data.studyRecords.filter(record => record.date >= weekStart && record.date <= weekEnd).reduce((sum, record) => sum + record.minutes, 0),
    total: data.studyRecords.reduce((sum, record) => sum + record.minutes, 0),
  };
}
export function timerElapsed(timer: StudyTimerState, now: number): number {
  return timer.elapsedMs + (timer.startedAt === null ? 0 : Math.max(0, now - timer.startedAt));
}
export function healthSummary(data: AppData, date: string) {
  const day = data.days[date] ?? createDailyRecord(date);
  const latest = Object.values(data.days).filter(item => item.date <= date && item.weightKg !== null)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  const currentWeight = latest?.weightKg ?? data.profile.startWeightKg;
  const lossTarget = data.profile.startWeightKg - data.profile.targetWeightKg;
  const protein = day.meals.proteinG ?? 0;
  return {
    weightDate: latest?.date ?? null, currentWeight,
    bmi: currentWeight / (data.profile.heightCm / 100) ** 2,
    progress: lossTarget > 0 ? Math.max(0, Math.min(100, (data.profile.startWeightKg - currentWeight) / lossTarget * 100)) : 100,
    protein, proteinPercent: data.profile.proteinTargetG > 0 ? Math.min(100, protein / data.profile.proteinTargetG * 100) : 0,
    rehabCount: REHAB_MOVES.filter(move => day.completedRehabIds.includes(move.id)).length,
  };
}
export function optionalNumber(value: string, label: string, min: number, max: number, integer = false): number | null {
  if (!value.trim()) return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max || (integer && !Number.isInteger(number))) throw new Error(`${label}需为${min}–${max}${integer ? '的整数' : '之间的数值'}`);
  return number;
}
