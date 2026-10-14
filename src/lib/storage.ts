import type { AppData } from '../types';
import { addDays, dateKey, isDateKey } from './date';

export const STORAGE_KEY = 'sprint47:data:v1';
export function createInitialData(): AppData {
  const startDate = dateKey();
  return { version: 1, profile: {
    sex: 'male', age: 25, heightCm: 176, startWeightKg: 89, targetWeightKg: 84,
    startDate, examDate: addDays(startDate, 47), proteinTargetG: 130,
    scores: { aptitude: 60, essay: 65, target: 70 },
  }, days: {}, studyRecords: [] };
}

// Reject malformed/unknown schemas without overwriting the original browser data.
function object(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
function number(value: unknown, min = 0): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min;
}
function strings(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}
function nullableNumber(value: unknown, min = 0): boolean { return value === null || number(value, min); }
function isAppData(value: unknown): value is AppData {
  if (!object(value) || value.version !== 1 || !object(value.profile) || !object(value.days) || !Array.isArray(value.studyRecords)) return false;
  const profile = value.profile;
  if (profile.sex !== 'male' || !number(profile.age, 1) || !number(profile.heightCm, 1) ||
    !number(profile.startWeightKg, 1) || !number(profile.targetWeightKg, 1) ||
    !number(profile.proteinTargetG) || !isDateKey(profile.startDate) || !isDateKey(profile.examDate) ||
    profile.examDate <= profile.startDate || !object(profile.scores) ||
    !['aptitude', 'essay', 'target'].every(key => number((profile.scores as Record<string, unknown>)[key]))) return false;
  const validDays = Object.entries(value.days).every(([key, day]) => object(day) &&
    isDateKey(key) && day.date === key && strings(day.completedTaskIds) && strings(day.completedRehabIds) &&
    (day.plannedTaskIds === undefined || strings(day.plannedTaskIds)) &&
    nullableNumber(day.painScore) && (day.painScore === null || (day.painScore as number) <= 10) &&
    nullableNumber(day.weightKg, 1) && nullableNumber(day.steps) &&
    strings(day.exercises) && day.exercises.every(item => ['力量训练', '游泳', '散步', '核心训练'].includes(item)) &&
    object(day.meals) && ['breakfast', 'lunch', 'dinner'].every(key => typeof (day.meals as Record<string, unknown>)[key] === 'string') &&
    nullableNumber(day.meals.proteinG) && strings(day.supplements));
  const validStudy = value.studyRecords.every(record => object(record) && typeof record.id === 'string' &&
    isDateKey(record.date) && typeof record.category === 'string' &&
    ['行测', '申论', '错题整理', '资料分析', '判断推理', '言语理解', '数量关系'].includes(record.category) &&
    number(record.minutes) && typeof record.note === 'string');
  return validDays && validStudy;
}
export function loadData(): { data: AppData; error: string | null; raw: string | null } {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return { data: createInitialData(), error: null, raw: null };
    const parsed: unknown = JSON.parse(saved);
    if (!isAppData(parsed)) throw new Error('Invalid schema');
    return { data: parsed, error: null, raw: saved };
  } catch {
    return { data: createInitialData(), error: '无法读取本地数据。原记录未被覆盖，请检查浏览器存储设置。', raw: null };
  }
}
/** Detect edits made by another window before overwriting its records. */
export function saveDataIfUnchanged(data: AppData, expectedRaw: string | null): { raw: string | null; error: string | null } {
  try {
    if (localStorage.getItem(STORAGE_KEY) !== expectedRaw) return {
      raw: expectedRaw, error: '数据已在其他窗口更新，本次未保存。请先保留正在编辑的内容，再重新打开页面。',
    };
    const raw = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, raw);
    return { raw, error: null };
  } catch { return { raw: expectedRaw, error: '本地保存失败，请检查浏览器存储权限或剩余空间。' }; }
}
export function saveData(data: AppData): string | null {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); return null; }
  catch { return '本地保存失败，请检查浏览器存储权限或剩余空间。'; }
}
