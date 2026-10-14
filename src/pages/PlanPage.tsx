import { useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import type { AppData, AppUpdater } from '../types';
import { addDays, daysBetween, isDateKey } from '../lib/date';
import { generatePlan, getPlanCompletion } from '../lib/plan';
import { useToday } from '../hooks/useToday';
import { PlanTaskCard } from '../components/PlanTaskCard';
import { toggleTask } from '../lib/records';

export function PlanPage({ data, onUpdate }: { data: AppData; onUpdate: AppUpdater }) {
  const today = useToday();
  // null follows today's date after midnight; selected historical dates stay selected.
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const date = selected ?? today;
  const plan = generatePlan(date, data.profile);
  const completion = getPlanCompletion(plan, data.days[date]);
  const weekday = new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', weekday: 'long' }).format(new Date(`${date}T12:00:00+08:00`));
  const completedIds = new Set(data.days[date]?.completedTaskIds ?? []);
  return <>
    <div className="mb-5 flex items-center justify-between"><div><h1 className="text-xl font-bold">每日计划</h1><p className="mt-1 text-xs text-slate-500">把冲刺目标落实到每一天</p></div><CalendarDays size={22} className="text-blue-600" aria-hidden="true" /></div>
    <section className="card !p-4">
      <div className="flex items-center gap-2">
        <button type="button" disabled={date <= '0001-01-01'} className="secondary-button !p-3 disabled:opacity-40" aria-label="前一天" onClick={() => setSelected(addDays(date, -1))}><ChevronLeft size={18} /></button>
        <label className="min-w-0 flex-1"><span className="sr-only">选择计划日期</span><input type="date" min="0001-01-01" max="9999-12-31" value={date} onChange={event => { if (isDateKey(event.target.value)) setSelected(event.target.value === today ? null : event.target.value); }} className="field text-center" /></label>
        <button type="button" disabled={date >= '9999-12-31'} className="secondary-button !p-3 disabled:opacity-40" aria-label="后一天" onClick={() => setSelected(addDays(date, 1))}><ChevronRight size={18} /></button>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs"><span className="text-slate-500">{weekday} · {date === today ? '今天' : date < today ? '历史日期' : '未来计划'}</span><button type="button" className="min-h-11 px-2 font-medium text-blue-600" onClick={() => setSelected(null)}>回到今天</button></div>
    </section>
    {plan.tasks.length > 0 ? <>
      <section className="hero mt-4 !p-5">
        <p className="eyebrow">{plan.template === 'weekday' ? '工作日模板' : '周末暂定模板'} · 冲刺第 {daysBetween(data.profile.startDate, date) + 1} 天</p>
        <div className="mt-4 flex items-end justify-between gap-3"><div><p className="text-xs text-slate-500">计划学习</p><p className="mt-1 text-2xl font-bold">{Math.floor(plan.studyMinutes / 60)}<span className="mx-1 text-xs font-normal text-slate-500">小时</span>{plan.studyMinutes % 60}<span className="ml-1 text-xs font-normal text-slate-500">分</span></p></div><p className="text-xs text-slate-500">已完成 {completion.completed} / {completion.total} 项</p></div>
        <div role="progressbar" aria-label="计划任务完成率" aria-valuemin={0} aria-valuemax={100} aria-valuenow={completion.percent ?? 0} className="mt-4 h-1.5 overflow-hidden rounded-full bg-blue-100"><div className="h-full rounded-full bg-blue-500" style={{ width: `${completion.percent ?? 0}%` }} /></div>
      </section>
      {plan.template === 'weekend' && <p className="mt-4 rounded-xl bg-blue-50 p-3 text-xs leading-6 text-blue-800">周末时间未在需求中指定，当前使用暂定模板：行测、申论、错题复盘与散步 / 休息。后续可再调整模板。</p>}
      <div className="mb-3 mt-6 flex justify-between"><h2 className="text-sm font-semibold">今日时间线</h2><span className="text-xs text-slate-400">{plan.tasks.length} 个安排</span></div>
      <ol className="space-y-3">{plan.tasks.map(task => <PlanTaskCard key={task.id} task={task} completed={completedIds.has(task.id)} disabled={date > today} onToggle={() => { try { if (onUpdate(current => toggleTask(current, date, task.id))) setMessage('打卡已保存'); else setMessage('保存失败，请查看存储提示'); } catch (error) { setMessage((error as Error).message); } }} />)}</ol>
      {message && <p role="status" className="mt-4 text-sm text-blue-800">{message}</p>}
      <p className="mt-5 text-center text-[11px] leading-6 text-slate-400">点击圆圈完成或取消打卡 · 未来任务仅可预览<br />任务打卡不自动增加学习时长或运动记录<br />睡眠提醒当前为时间线提示，通知功能尚未接入</p>
    </> : <section className="card mt-4 py-8 text-center"><h2 className="font-semibold">{plan.template === 'exam' ? '考试日' : '不在冲刺日期范围内'}</h2><p className="mt-3 text-sm leading-7 text-slate-500">{plan.template === 'exam' ? '当天不生成冲刺任务，考试时间以准考证为准。' : `冲刺安排：${data.profile.startDate} 至 ${addDays(data.profile.examDate, -1)}`}</p><p className="mt-2 text-xs text-slate-400">可在首页设置中修改考试日期</p></section>}
  </>;
}
