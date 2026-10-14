import { useState, type FormEvent } from 'react';
import type { AppData, AppUpdater, DailyRecord } from '../types';
import { useToday } from '../hooks/useToday';
import { createDailyRecord } from '../lib/plan';
import { EXERCISE_TYPES, healthSummary, optionalNumber, patchDay, REHAB_MOVES, SUPPLEMENTS, toggled } from '../lib/records';
import { RecordDatePicker } from '../components/RecordDatePicker';
import { RecentTrends } from '../components/RecentTrends';

function HealthRecordForm({ data, date, onUpdate }: { data: AppData; date: string; onUpdate: AppUpdater }) {
  const day = data.days[date] ?? createDailyRecord(date);
  const [weight, setWeight] = useState(day.weightKg?.toString() ?? '');
  const [steps, setSteps] = useState(day.steps?.toString() ?? '');
  const [pain, setPain] = useState(day.painScore?.toString() ?? '');
  const [meals, setMeals] = useState({ ...day.meals, proteinG: day.meals.proteinG?.toString() ?? '' });
  const [message, setMessage] = useState('');
  function commit(patch: Partial<Omit<DailyRecord, 'date'>>) {
    try {
      if (onUpdate(current => patchDay(current, date, patch))) setMessage('记录已保存');
      else setMessage('保存失败，请查看页面上方提示');
    } catch (error) { setMessage((error as Error).message); }
  }
  function toggle(field: 'completedRehabIds' | 'supplements', id: string) {
    try {
      if (onUpdate(current => patchDay(current, date, { [field]: toggled(current.days[date]?.[field] ?? [], id) }))) setMessage('打卡已保存');
      else setMessage('打卡保存失败');
    } catch (error) { setMessage((error as Error).message); }
  }
  function saveBody(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try { commit({ weightKg: optionalNumber(weight, '体重', 30, 300), steps: optionalNumber(steps, '步数', 0, 100000, true), painScore: optionalNumber(pain, '腰痛评分', 0, 10, true) }); }
    catch (error) { setMessage((error as Error).message); }
  }
  function saveMeals(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try { commit({ meals: { breakfast: meals.breakfast.trim(), lunch: meals.lunch.trim(), dinner: meals.dinner.trim(), proteinG: optionalNumber(meals.proteinG, '蛋白质', 0, 1000) } }); }
    catch (error) { setMessage((error as Error).message); }
  }
  const { weightDate, currentWeight, bmi, progress, protein, proteinPercent, rehabCount } = healthSummary(data, date);
  return <>
    <section className="hero !p-5"><div className="flex justify-between"><div><p className="text-xs text-slate-500">{weightDate ? `最近体重 · ${weightDate}` : '起始体重'}</p><p className="mt-2 text-2xl font-bold">{currentWeight} <span className="text-xs font-normal text-slate-500">kg</span></p></div><div className="text-right"><p className="text-xs text-slate-500">BMI</p><p className="mt-2 text-2xl font-bold">{bmi.toFixed(1)}</p></div></div><div className="mt-4 flex justify-between text-xs text-slate-500"><span>减脂目标 {data.profile.startWeightKg} → {data.profile.targetWeightKg} kg</span><span>{Math.round(progress)}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-blue-100" role="progressbar" aria-label="减脂进度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}><div className="h-full bg-blue-500" style={{ width: `${progress}%` }} /></div></section>
    <section className="card mt-4"><h2 className="text-sm font-semibold">腰椎恢复 · {rehabCount} / 5 动作</h2><p className="mt-2 text-xs leading-6 text-slate-500">按你提供的动作与次数建立记录模板。健康打卡包含侧桥；计划页晨练列表保留猫牛式，晨练任务需单独打卡。</p><div className="mt-3 divide-y divide-slate-100">{REHAB_MOVES.map(move => <label key={move.id} className="flex min-h-14 cursor-pointer items-center gap-3 py-3"><input className="size-5 shrink-0 accent-blue-600" type="checkbox" checked={day.completedRehabIds.includes(move.id)} onChange={() => toggle('completedRehabIds', move.id)} /><span className="flex-1 text-sm">{move.name}</span><span className="text-xs text-slate-500">{move.dose}</span></label>)}</div><p className="mt-2 text-[11px] text-slate-400">训练边界：不安排大重量深蹲、硬拉、仰卧起坐。</p></section>
    <section className="card mt-4"><h2 className="text-sm font-semibold">身体记录 · {date}</h2><form className="mt-4 space-y-4" onSubmit={saveBody}>
      <label className="block text-sm">体重（kg）<input type="number" inputMode="decimal" min="30" max="300" step="0.1" className="field mt-2" value={weight} onChange={event => setWeight(event.target.value)} /></label>
      <label className="block text-sm">步数<input type="number" inputMode="numeric" min="0" max="100000" step="1" className="field mt-2" value={steps} onChange={event => setSteps(event.target.value)} /></label>
      <label className="block text-sm">腰痛评分（0–10）<input type="number" inputMode="numeric" min="0" max="10" step="1" className="field mt-2" value={pain} onChange={event => setPain(event.target.value)} /><span className="mt-1 block text-xs text-slate-400">0 为无痛；留空代表未记录</span></label><button type="submit" className="primary-button">保存身体记录</button>
    </form></section>
    <section className="card mt-4"><h2 className="text-sm font-semibold">今日运动</h2><p className="mt-2 text-xs text-slate-500">可选择多种类型，计划里的训练任务单独打卡。</p><div className="mt-3 grid grid-cols-2 gap-2">{EXERCISE_TYPES.map(type => <label key={type} className="flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border border-slate-100 p-3 text-sm"><input type="checkbox" className="size-4 accent-blue-600" checked={day.exercises.includes(type)} onChange={() => { try { if (onUpdate(current => patchDay(current, date, { exercises: EXERCISE_TYPES.filter(item => toggled(current.days[date]?.exercises ?? [], type).includes(item)) }))) setMessage('运动记录已保存'); else setMessage('保存失败'); } catch (error) { setMessage((error as Error).message); } }} />{type}</label>)}</div></section>
    <section className="card mt-4"><h2 className="text-sm font-semibold">饮食与蛋白质</h2><div className="mt-3 flex justify-between text-xs text-slate-500"><span>已记录 {protein} / {data.profile.proteinTargetG} g</span><span>{Math.round(proteinPercent)}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-blue-100" role="progressbar" aria-label="蛋白质完成度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(proteinPercent)}><div className="h-full bg-blue-500" style={{ width: `${proteinPercent}%` }} /></div><form className="mt-4 space-y-4" onSubmit={saveMeals}>
      {(['breakfast', 'lunch', 'dinner'] as const).map((key, index) => <label key={key} className="block text-sm">{['早餐', '午餐', '晚餐'][index]}<textarea className="field mt-2" rows={2} maxLength={1000} value={meals[key]} onChange={event => setMeals(current => ({ ...current, [key]: event.target.value }))} /></label>)}
      <label className="block text-sm">全天蛋白质（g）<input className="field mt-2" type="number" inputMode="decimal" min="0" max="1000" step="0.1" value={meals.proteinG} onChange={event => setMeals(current => ({ ...current, proteinG: event.target.value }))} /><span className="mt-1 block text-xs text-slate-400">手动填写，不根据餐食文字估算</span></label><button type="submit" className="primary-button">保存饮食记录</button>
    </form></section>
    <section className="card mt-4"><h2 className="text-sm font-semibold">补剂与咖啡打卡</h2><div className="mt-3 divide-y divide-slate-100">{SUPPLEMENTS.map(item => <label key={item.id} className="flex min-h-14 cursor-pointer items-center gap-3 py-3"><input type="checkbox" className="size-5 shrink-0 accent-blue-600" checked={day.supplements.includes(item.id)} onChange={() => toggle('supplements', item.id)} /><span className="flex-1 text-sm">{item.name}</span><span className="text-xs text-slate-500">{item.time}</span></label>)}</div><p className="mt-2 text-xs leading-6 text-slate-400">按你提供的时间与用量展示。当前为页面内提示；系统通知尚未接入。</p></section>
    {message && <p role="status" className="sticky bottom-24 mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">{message}</p>}
  </>;
}

export function HealthPage({ data, onUpdate }: { data: AppData; onUpdate: AppUpdater }) {
  const today = useToday();
  const [selected, setSelected] = useState<string | null>(null);
  const date = selected ?? today;
  return <><h1 className="mb-5 text-xl font-bold">健康记录</h1><RecordDatePicker date={date} today={today} onChange={value => setSelected(value === today ? null : value)} /><HealthRecordForm key={date} date={date} data={data} onUpdate={onUpdate} /><RecentTrends data={data} date={date} today={today} kind="health" /></>;
}
