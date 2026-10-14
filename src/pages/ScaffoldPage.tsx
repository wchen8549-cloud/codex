import { ArrowUpRight, Check, Layers3 } from 'lucide-react';
import type { PageId, Profile } from '../types';

const content = {
  home: { title: '让每一天，都有方向。', description: '备考、训练与恢复，从一个清晰的计划开始。', phase: '02', next: '首页 Dashboard', detail: '倒计时、体重目标与今日完成情况' },
  plan: { title: '把目标，拆成今天。', description: '根据日期与星期，安排学习、工作和训练。', phase: '03', next: '每日计划生成', detail: '工作日模板与周末安排' },
  study: { title: '每一段专注，都算数。', description: '记录行测、申论和错题复盘的学习投入。', phase: '04', next: '学习记录与打卡', detail: '分类记录、计时器与累计时长' },
  health: { title: '稳步恢复，持续进步。', description: '在这里记录腰椎训练、运动、饮食与补剂。', phase: '04', next: '健康记录与打卡', detail: '动作完成、疼痛评分与日常记录' },
  stats: { title: '看见积累的力量。', description: '用每周的变化，校准下一步的节奏。', phase: '05', next: '趋势与统计报告', detail: '学习、体重、疼痛与完成率趋势' },
};

export function ScaffoldPage({ page, profile }: { page: PageId; profile: Profile }) {
  const item = content[page];
  return <>
    <section className="hero">
      <span className="eyebrow"><span className="size-1.5 rounded-full bg-blue-500" /> 47 DAYS · ONE GOAL</span>
      <h1 className="mt-5 text-[clamp(1.7rem,6vw,2.5rem)] font-bold leading-tight tracking-tight">{item.title}</h1>
      <p className="mt-3 max-w-sm text-sm leading-7 text-slate-500">{item.description}</p>
      <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1.5 text-xs text-blue-700"><Layers3 size={14} /> 第一步 · 项目结构已就绪</div>
      <span className="hero-number" aria-hidden="true">47</span>
    </section>

    <div className="mb-4 mt-7 flex items-center justify-between"><h2 className="text-base font-semibold">你的冲刺目标</h2><span className="text-xs text-slate-400">个人档案</span></div>
    <section className="grid grid-cols-2 gap-3" aria-label="个人目标">
      <div className="card"><p className="card-label">国考 · 副省级</p><p className="mt-4 text-2xl font-bold tracking-tight">70<span className="text-blue-600">+</span><span className="ml-2 text-xs font-normal text-slate-400">目标分数</span></p><p className="mt-3 text-xs leading-6 text-slate-500">行测 {profile.scores.aptitude} / 申论 {profile.scores.essay}</p></div>
      <div className="card"><p className="card-label">体重管理</p><p className="mt-4 text-2xl font-bold tracking-tight">{profile.targetWeightKg}<span className="ml-1 text-xs font-normal text-slate-400">kg</span></p><p className="mt-3 text-xs leading-6 text-slate-500">起始 {profile.startWeightKg} kg · 目标 83–84 kg</p></div>
    </section>

    <section className="card mt-4 flex items-start gap-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Check size={20} /></span>
      <div><h2 className="text-sm font-semibold">先打好基础，再逐步完善</h2><p className="mt-2 text-xs leading-6 text-slate-500">手机优先布局、五个导航入口、类型定义与本地存储接口已建立。当前页面为项目骨架，暂无学习或健康记录。</p></div>
    </section>

    <section className="mt-7 border-t border-slate-200/80 pt-5">
      <div className="flex items-center gap-3"><span className="text-sm font-semibold text-blue-600">{item.phase}</span><h2 className="flex-1 text-sm font-semibold">下一阶段：{item.next}</h2><ArrowUpRight size={18} className="text-slate-400" /></div>
      <p className="ml-8 mt-2 text-xs text-slate-500">{item.detail}</p>
    </section>
  </>;
}
