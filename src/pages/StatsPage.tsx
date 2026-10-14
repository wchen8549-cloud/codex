import { useState } from 'react';
import type { AppData } from '../types';
import { useToday } from '../hooks/useToday';
import { isDateKey } from '../lib/date';
import { getReport, type ReportPeriod } from '../lib/statistics';
import { TrendChart } from '../components/TrendChart';

export function StatsPage({ data }: { data: AppData }) {
  const today = useToday();
  const [period, setPeriod] = useState<ReportPeriod>('week');
  const [selected, setSelected] = useState<string | null>(null);
  const report = getReport(data, selected ?? today, period, today);
  const metrics = [
    { label: '学习时长', value: `${report.studyHours.toFixed(1)} h`, detail: '实际保存的学习记录' },
    { label: '运动次数', value: `${report.exerciseCount} 次`, detail: `${report.exerciseDays} 天运动 · 同日同类计1次` },
    { label: '平均体重', value: report.averageWeight === null ? '—' : `${report.averageWeight.toFixed(1)} kg`, detail: `${report.weightSamples} 天称重 · 未记录不参与平均` },
    { label: '腰痛变化', value: report.painChange === null ? '—' : `${report.painChange > 0 ? '+' : ''}${report.painChange} 分`, detail: report.painChange === null ? '需至少两天评分' : '末次减首次 · 负数表示下降' },
    { label: '任务完成率', value: report.completionRate === null ? '—' : `${report.completionRate}%`, detail: `完成 ${report.completedTasks} / ${report.plannedTasks} 项` },
  ];
  return <>
    <h1 className="mb-5 text-xl font-bold">统计报告</h1>
    <div className="mb-4 flex rounded-xl bg-slate-200/60 p-1" role="group" aria-label="报告周期">{(['week', 'month'] as const).map(item => <button key={item} type="button" aria-pressed={period === item} className={`min-h-11 flex-1 rounded-lg text-sm ${period === item ? 'bg-white font-semibold text-blue-600 shadow-sm' : 'text-slate-500'}`} onClick={() => setPeriod(item)}>{item === 'week' ? '周报告' : '月报告'}</button>)}</div>
    <div className="flex items-center gap-3"><label className="min-w-0 flex-1"><span className="sr-only">选择报告所在日期</span><input className="field" type="date" max={today} value={selected ?? today} onChange={event => { if (isDateKey(event.target.value) && event.target.value <= today) setSelected(event.target.value === today ? null : event.target.value); }} /></label><button type="button" className="secondary-button" onClick={() => setSelected(null)}>本{period === 'week' ? '周' : '月'}</button></div>
    <p className="my-4 text-xs leading-6 text-slate-500">{report.start} — {report.end}<br />统计截至 {report.through} · 周一为一周开始</p>
    <div className="grid grid-cols-2 gap-3">{metrics.map(item => <section key={item.label} className="card !p-4"><h2 className="text-xs text-slate-500">{item.label}</h2><p className="mt-3 text-xl font-bold">{item.value}</p><p className="mt-2 text-[11px] leading-6 text-slate-500">{item.detail}</p></section>)}</div>
    <TrendChart title="学习时间趋势" unit="小时" points={report.days.map(day => ({ date: day.date, value: day.studyHours }))} domain={[0, Math.max(1, ...report.days.map(day => day.studyHours ?? 0))]} note="未保存学习记录的已过日期计0小时；未来日期不参与统计。" />
    <TrendChart title="体重变化" unit="kg" points={report.days.map(day => ({ date: day.date, value: day.weightKg }))} note="只展示当天实际称重，未记录处断开，不使用起始体重填补。" />
    <TrendChart title="腰痛评分趋势" unit="分" domain={[0, 10]} points={report.days.map(day => ({ date: day.date, value: day.painScore }))} note="0为实际无痛评分；未记录处断开。" />
    <TrendChart title="每日任务完成率" unit="%" domain={[0, 100]} points={report.days.map(day => ({ date: day.date, value: day.completionRate }))} note="报告完成率按总完成项÷总计划项计算；只统计截至今天的冲刺日，未打卡任务计未完成。" />
  </>;
}
