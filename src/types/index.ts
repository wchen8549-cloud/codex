export type PageId = 'home' | 'plan' | 'study' | 'health' | 'stats';
export type StudyCategory = '行测' | '申论' | '错题整理' | '资料分析' | '判断推理' | '言语理解' | '数量关系';
export type ExerciseType = '力量训练' | '游泳' | '散步' | '核心训练';
export type TaskKind = 'routine' | 'study' | 'rehab' | 'exercise' | 'work' | 'travel';
export interface PlanTask {
  id: string; start: string; end?: string; title: string; detail: string;
  kind: TaskKind; trackable: boolean;
}
export interface DailyPlan {
  date: string; template: 'weekday' | 'weekend' | 'exam' | 'outside';
  tasks: PlanTask[]; studyMinutes: number;
}
export interface Profile {
  sex: 'male'; age: number; heightCm: number; startWeightKg: number; targetWeightKg: number;
  startDate: string; examDate: string; proteinTargetG: number;
  scores: { aptitude: number; essay: number; target: number };
}
export interface StudyRecord { id: string; date: string; category: StudyCategory; minutes: number; note: string }
export interface DailyRecord {
  date: string; completedTaskIds: string[]; completedRehabIds: string[];
  plannedTaskIds?: string[];
  painScore: number | null; weightKg: number | null; steps: number | null;
  exercises: ExerciseType[];
  meals: { breakfast: string; lunch: string; dinner: string; proteinG: number | null };
  supplements: string[];
}
export interface AppData { version: 1; profile: Profile; days: Record<string, DailyRecord>; studyRecords: StudyRecord[] }
export type AppUpdater = (next: AppData | ((current: AppData) => AppData)) => boolean;
export interface StudyTimerState {
  id: string; date: string; category: StudyCategory; elapsedMs: number; startedAt: number | null;
}
