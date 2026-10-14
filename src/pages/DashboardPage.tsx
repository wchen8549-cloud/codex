import { useState } from 'react';
import { BookOpen, CircleCheck, Dumbbell, HeartPulse, Scale, SlidersHorizontal, Target, ArrowRight } from 'lucide-react';
import type { AppData, PageId } from '../types';
import { getDashboard } from '../lib/dashboard';
import { MetricCard } from '../components/MetricCard';
import { ProfileSettings } from '../components/ProfileSettings';
import { useToday } from '../hooks/useToday';

export function DashboardPage({ data, onUpdate, onNavigate }: {
  data: AppData; onUpdate: (data: AppData) => boolean; onNavigate: (page: PageId) => void;
}) {
  const today = useToday();
  const stats = getDashboard(data, today);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const dateLabel = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai', month: 'long', day: 'numeric', weekday: 'long',
  }).format(new Date(`${today}T12:00:00+08:00`));
  const countdown = stats.remainingDays > 0 ? <>距离国考还有 <strong className="text-blue-600">{stats.remainingDays}</strong> 天</>
    : stats.remainingDays === 0 ? '今天是考试日' : '本次考试日期已结束';
  return <>
    <div className="mb-5 flex items-center justify-between gap-3">
      <div><p className="text-xs text-slate-400">{today.slice(0, 4)} · 上海时间</p><p className="mt-1 text-sm font-medium">{dateLabel}</p></div>
      <button type="button" onClick={() => setSettingsOpen(open => !open)} aria-expanded={settingsOpen} aria-controls="profile-settings" className="secondary-button flex items-center gap-2"><SlidersHorizontal size={16} aria-hidden="true" />设置</button>
    </div>
    {settingsOpen && <div id="profile-settings"><ProfileSettings profile={data.profile} onSave={profile => onUpdate({ ...data, profile })} onClose={() => setSettingsOpen(false)} /></div>}
    <section className="hero">
      <span className="eyebrow"><span className="size-1.5 rounded-full bg-blue-500" /> NATIONAL EXAM · 每日冲刺</span>
      <h1 className="mt-4 text-[clamp(1.5rem,6vw,2.2rem)] font-bold leading-tight tracking-tight">{countdown}</h1>
      <p className="mt-3 text-xs leading-6 text-slate-500">副省级 · 计划考试日期 {data.profile.examDate}</p>
      <div className="mt-5 flex justify-between text-xs text-slate-500"><span>冲刺进度</span><span>{Math.round(stats.sprintProgress)}%</span></div>
      <div role="progressbar" aria-label="冲刺时间进度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(stats.sprintProgress)} className="mt-2 h-1.5 overflow-hidden rounded-full bg-blue-100"><div className="h-full rounded-full bg-blue-500" style={{ width: `${stats.sprintProgress}%` }} /></div>
      <span className="hero-number" aria-hidden="true">{Math.max(0, stats.remainingDays)}</span>
    </section>
    <div className="mb-4 mt-7 flex items-center justify-between"><h2 className="text-base font-semibold">今日概览</h2><span className="text-xs text-slate-400">一步一步，持续积累</span></div>
    <div className="grid grid-cols-2 gap-3">
      <MetricCard icon={Scale} label="当前体重" value={<>{stats.weightKg}<span className="ml-1 text-xs font-normal text-slate-400">kg</span></>} detail={stats.weightDate ? `最近记录 · ${stats.weightDate}` : '起始体重 · 尚无称重记录'} />
      <MetricCard icon={Target} label="目标体重" value={<>{data.profile.targetWeightKg}<span className="ml-1 text-xs font-normal text-slate-400">kg</span></>} detail={stats.weightKg > data.profile.targetWeightKg ? `距目标 ${(stats.weightKg - data.profile.targetWeightKg).toFixed(1)} kg` : '已达到目标体重'} />
      <MetricCard icon={CircleCheck} label="今日完成率" value={stats.completionRate === null ? '—' : `${stats.completionRate}%`} detail={stats.completionRate === null ? '今日计划尚未生成' : `已完成 ${stats.completedTasks} / ${stats.plannedTasks} 项任务`} />
      <MetricCard icon={BookOpen} label="今日学习" value={<>{(stats.studyMinutes / 60).toFixed(1)}<span className="ml-1 text-xs font-normal text-slate-400">小时</span></>} detail={stats.studyMinutes ? `累计 ${stats.studyMinutes} 分钟` : '尚无学习记录'} />
      <MetricCard icon={Dumbbell} label="运动状态" value={<span className="text-xl">{stats.exercises.length ? '已记录' : '待记录'}</span>} detail={stats.exercises.length ? [...new Set(stats.exercises)].join(' · ') : '今日尚无运动记录'} />
      <MetricCard icon={HeartPulse} label="腰椎训练" value={<>{stats.rehabCount}<span className="ml-1 text-xs font-normal text-slate-400">/ 5 动作</span></>} detail={stats.rehabCount === 5 ? '今日动作全部完成' : stats.rehabCount ? '已有训练记录，继续按计划完成' : '今日尚无训练打卡'} />
    </div>
    <section className="card mt-4">
      <h2 className="text-sm font-semibold">备考目标 · 行测 / 申论</h2>
      <div className="mt-4 flex items-center justify-between gap-3"><p className="text-sm text-slate-500">当前 {data.profile.scores.aptitude} / {data.profile.scores.essay}</p><p className="text-lg font-bold text-blue-600">双科 {data.profile.scores.target}+</p></div>
    </section>
    <button type="button" onClick={() => onNavigate('plan')} className="card mt-4 flex w-full items-center justify-between text-left"><div><span className="text-sm font-semibold">查看每日计划</span><p className="mt-1 text-xs text-slate-500">按日期自动安排学习、工作与训练</p></div><ArrowRight size={18} className="text-blue-600" aria-hidden="true" /></button>
    <p className="mt-5 text-center text-[11px] leading-6 text-slate-400">学习与健康记录保存在本机浏览器 · 任务打卡可随时取消</p>
  </>;
}
