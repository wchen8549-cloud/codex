import type { AppData, DailyPlan, DailyRecord, PlanTask, Profile, TaskKind } from '../types';
import { isDateKey } from './date';

const morningSubjects = ['错题复盘', '资料分析错题', '判断推理', '言语理解', '数量关系', '错题复盘', '行测模考'];
const eveningExercises = ['', '力量训练 A', '核心恢复', '力量训练 B', '核心恢复', '力量训练 C', ''];
const rehabDetail = 'McGill卷腹 · 鸟狗式 · 臀桥 · 死虫式 · 猫牛式';
function task(id: string, start: string, end: string | undefined, title: string, detail: string, kind: TaskKind): PlanTask {
  return { id, start, end, title, detail, kind, trackable: kind !== 'work' && kind !== 'travel' };
}
function duration(task: PlanTask): number {
  if (!task.end) return 0;
  const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
  return minutes(task.end) - minutes(task.start);
}

/** Deterministic date templates; the exam date has no assumed exam times. */
export function generatePlan(date: string, profile: Profile): DailyPlan {
  if (!isDateKey(date)) throw new Error('计划日期无效');
  if (date === profile.examDate) return { date, template: 'exam', tasks: [], studyMinutes: 0 };
  if (date < profile.startDate || date > profile.examDate) return { date, template: 'outside', tasks: [], studyMinutes: 0 };
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  const weekend = weekday === 0 || weekday === 6;
  const strength = weekday === 1 || weekday === 3 || weekday === 5;
  const tasks: PlanTask[] = weekend ? [
    task('wake', '07:30', undefined, '起床', '周末暂定安排', 'routine'),
    task('morning-rehab', '07:30', '07:45', '腰椎恢复训练', rehabDetail, 'rehab'),
    task('weekend-study', '08:00', '10:00', weekday === 6 ? '行测模考' : '行测专项复盘', '周六模考 · 周日整理薄弱项', 'study'),
    task('weekend-review', '10:15', '11:45', '错题整理', '复盘解题过程，记录易错点', 'study'),
    task('weekend-essay', '14:00', '16:00', '申论练习', '阅读材料与作答练习', 'study'),
    task('workout', '17:30', undefined, '散步 / 休息', '周末暂定安排，按当天情况选择', 'exercise'),
    task('evening-study', '19:30', '20:30', '错题复盘', '梳理本周学习与下周重点', 'study'),
    task('sleep', '22:30', undefined, '睡眠提醒', '准备休息', 'routine'),
  ] : [
    task('wake', '06:20', undefined, '起床', '开始今天的冲刺', 'routine'),
    task('morning-rehab', '06:20', '06:35', '腰椎恢复训练', rehabDetail, 'rehab'),
    task('morning-study', '06:35', '07:25', morningSubjects[weekday], '晨间专项学习 · 50 分钟', 'study'),
    task('work-am', '08:30', '11:30', '上午工作', '固定工作时段', 'work'),
    task('work-pm', '13:30', '17:00', '下午工作', '固定工作时段', 'work'),
    ...(strength ? [task('gym-travel', '17:00', '17:15', '前往健身房', '车程约 15 分钟，出发时间可按实际情况安排', 'travel')] : []),
    task('workout', '17:30', undefined, eveningExercises[weekday], strength ? '训练安排占位，具体动作与时长待设置' : '核心恢复安排，具体动作与时长待设置', 'exercise'),
    task('evening-study', '19:30', '21:50', '公务员学习 · 行测 / 申论', '晚间学习 · 140 分钟', 'study'),
    task('sleep', '22:30', undefined, '睡眠提醒', '准备休息', 'routine'),
  ];
  return { date, template: weekend ? 'weekend' : 'weekday', tasks,
    studyMinutes: tasks.filter(item => item.kind === 'study').reduce((sum, item) => sum + duration(item), 0) };
}

export function plannedTaskIds(plan: DailyPlan): string[] {
  return plan.tasks.filter(item => item.trackable).map(item => item.id);
}

export function createDailyRecord(date: string): DailyRecord {
  return { date, completedTaskIds: [], completedRehabIds: [], painScore: null,
    weightKg: null, steps: null, exercises: [],
    meals: { breakfast: '', lunch: '', dinner: '', proteinG: null }, supplements: [] };
}

/** Preserve every recorded value when adding a missing plan snapshot. */
export function ensureDailyPlan(data: AppData, date: string): AppData {
  const plan = generatePlan(date, data.profile);
  if (!plan.tasks.length) return data;
  const existing = data.days[date];
  if (existing?.plannedTaskIds !== undefined) return data;
  return { ...data, days: { ...data.days,
    [date]: { ...(existing ?? createDailyRecord(date)), plannedTaskIds: plannedTaskIds(plan) },
  } };
}

export function getPlanCompletion(plan: DailyPlan, day?: DailyRecord) {
  const ids = new Set(plannedTaskIds(plan));
  const completed = new Set((day?.completedTaskIds ?? []).filter(id => ids.has(id)));
  return { total: ids.size, completed: completed.size,
    percent: ids.size ? Math.round(completed.size / ids.size * 100) : null };
}
