import { BookOpen, BriefcaseBusiness, Car, Circle, CircleCheck, Dumbbell, HeartPulse, Sun } from 'lucide-react';
import type { PlanTask, TaskKind } from '../types';

const icons = { routine: Sun, study: BookOpen, rehab: HeartPulse, exercise: Dumbbell, work: BriefcaseBusiness, travel: Car };
const labels: Record<TaskKind, string> = { routine: '作息', study: '学习', rehab: '恢复', exercise: '运动', work: '工作', travel: '出行' };

export function PlanTaskCard({ task, completed, disabled, onToggle }: { task: PlanTask; completed: boolean; disabled: boolean; onToggle: () => void }) {
  const Icon = icons[task.kind];
  return <li className="card flex gap-3 !p-4">
    <div className="w-12 shrink-0 pt-0.5 text-center"><p className="text-sm font-semibold tabular-nums">{task.start}</p>{task.end && <p className="mt-1 text-[11px] tabular-nums text-slate-400">{task.end}</p>}</div>
    <div className="min-w-0 flex-1 border-l border-slate-100 pl-3">
      <div className="mb-2 flex items-center gap-1.5 text-[10px] text-slate-500"><Icon size={12} aria-hidden="true" />{labels[task.kind]}{!task.trackable && <span className="ml-auto">不计入完成率</span>}</div>
      <h3 className="text-sm font-semibold leading-6">{task.title}</h3><p className="mt-1 text-xs leading-6 text-slate-500">{task.detail}</p>
    </div>
    {task.trackable && <button type="button" disabled={disabled} onClick={onToggle} aria-pressed={completed} className={`flex size-11 shrink-0 items-center justify-center self-center rounded-xl disabled:opacity-40 ${completed ? 'bg-blue-50 text-blue-600' : 'text-slate-400'}`} aria-label={`${completed ? '取消完成' : '完成'}：${task.title}`}>{completed ? <CircleCheck size={20} aria-hidden="true" /> : <Circle size={20} aria-hidden="true" />}</button>}
  </li>;
}
