import { useState, type FormEvent } from 'react';
import { BookOpen, Timer, Trash2 } from 'lucide-react';
import type { AppData, AppUpdater, StudyCategory } from '../types';
import type { StudyTimerController } from '../hooks/useStudyTimer';
import { useToday } from '../hooks/useToday';
import { addStudyRecord, optionalNumber, STUDY_CATEGORIES, studyTotals, timerElapsed } from '../lib/records';
import { RecordDatePicker } from '../components/RecordDatePicker';
import { RecentTrends } from '../components/RecentTrends';
import { createId } from '../lib/id';

export function StudyPage({ data, onUpdate, timer }: { data: AppData; onUpdate: AppUpdater; timer: StudyTimerController }) {
  const today = useToday();
  const [selected, setSelected] = useState<string | null>(null);
  const date = selected ?? today;
  const totals = studyTotals(data, date);
  const [category, setCategory] = useState<StudyCategory>('行测');
  const [minutes, setMinutes] = useState('');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const duration = optionalNumber(minutes, '学习分钟', 1, 1440, true);
      if (duration === null) throw new Error('请输入学习分钟');
      const id = createId();
      if (onUpdate(current => addStudyRecord(current, { id, date, category, minutes: duration, note: note.trim() }))) {
        setMinutes(''); setNote(''); setMessage('学习记录已保存');
      } else setMessage('保存失败，请查看存储提示');
    } catch (error) { setMessage((error as Error).message); }
  }
  function saveTimer() {
    const session = timer.timer;
    if (!session || session.startedAt !== null) return;
    if (timer.alreadySaved) { setMessage(timer.reset() ? '已保存的计时状态已清除，可以开始新计时' : '记录已经保存，清除计时失败，请稍后重试'); return; }
    try {
      const minutes = Math.round(timerElapsed(session, Date.now()) / 60000 * 100) / 100;
      if (minutes <= 0) throw new Error('计时不足1秒，请继续学习后保存');
      if (onUpdate(current => addStudyRecord(current, { id: session.id, date: session.date, category: session.category, minutes, note: '计时器记录' }))) {
        if (timer.reset()) setMessage('计时学习已保存');
        else setMessage('记录已保存，计时清除失败；重试不会重复添加');
      } else setMessage('保存失败，计时记录仍保留');
    } catch (error) { setMessage((error as Error).message); }
  }
  const seconds = Math.floor(timer.elapsedMs / 1000);
  return <>
    <h1 className="mb-5 text-xl font-bold">学习管理</h1>
    <RecordDatePicker date={date} today={today} onChange={value => { setSelected(value === today ? null : value); setMessage(''); setDeleteId(null); }} />
    <section className="grid grid-cols-3 gap-2">{[['当日', totals.daily], ['当周', totals.weekly], ['累计', totals.total]].map(([label, value]) => <div key={label} className="card !p-3"><p className="text-xs text-slate-500">{label}学习</p><p className="mt-3 text-xl font-bold">{(Number(value) / 60).toFixed(1)}<span className="ml-1 text-[10px] font-normal text-slate-400">h</span></p></div>)}</section>
    <section className="card mt-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold"><Timer size={16} className="text-blue-600" />专注计时</h2>
      <p className="my-5 text-center text-4xl font-bold tabular-nums">{String(Math.floor(seconds / 3600)).padStart(2, '0')}:{String(Math.floor(seconds % 3600 / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}</p>
      <label className="block text-xs text-slate-500">计时分类<select className="field mt-2" value={timer.timer?.category ?? category} disabled={!!timer.timer} onChange={event => setCategory(event.target.value as StudyCategory)}>{STUDY_CATEGORIES.map(item => <option key={item}>{item}</option>)}</select></label>
      <div className="mt-4 flex flex-wrap gap-2"><button type="button" className="primary-button" disabled={timer.blocked || timer.alreadySaved} onClick={() => timer.timer?.startedAt != null ? timer.pause() : timer.start(category)}>{timer.timer?.startedAt != null ? '暂停' : timer.timer ? '继续' : '开始'}</button><button type="button" className="secondary-button" disabled={!timer.timer || timer.timer.startedAt !== null} onClick={saveTimer}>{timer.alreadySaved ? '清除已保存计时' : '保存学习'}</button><button type="button" className="secondary-button" onClick={() => { if (window.confirm('清除当前计时？已保存的学习记录会保留。')) timer.reset(); }}>重置</button></div>
      <p className="mt-3 text-xs leading-6 text-slate-500">先暂停再保存。计时在切换页面及刷新后保留；跨日计入开始日期{timer.timer ? ` ${timer.timer.date}` : ''}。</p>{timer.error && <p role="alert" className="mt-2 text-sm text-red-700">{timer.error}</p>}
    </section>
    <section className="card mt-4"><h2 className="flex items-center gap-2 text-sm font-semibold"><BookOpen size={16} className="text-blue-600" />添加学习记录 · {date}</h2><form className="mt-4 space-y-4" onSubmit={add}>
      <label className="block text-sm">分类<select className="field mt-2" value={category} onChange={event => setCategory(event.target.value as StudyCategory)}>{STUDY_CATEGORIES.map(item => <option key={item}>{item}</option>)}</select></label>
      <label className="block text-sm">学习分钟<input required type="number" min="1" max="1440" step="1" inputMode="numeric" className="field mt-2" value={minutes} onChange={event => setMinutes(event.target.value)} /></label>
      <label className="block text-sm">备注<textarea className="field mt-2" maxLength={1000} rows={2} value={note} onChange={event => setNote(event.target.value)} /></label><button className="primary-button" type="submit">保存学习记录</button>
    </form></section>
    {message && <p role="status" className="mt-4 text-sm text-blue-800">{message}</p>}
    <h2 className="mb-3 mt-6 text-sm font-semibold">当日记录</h2><ul className="space-y-3">{data.studyRecords.filter(record => record.date === date).map(record => <li key={record.id} className="card !p-4"><div className="flex items-center justify-between"><span className="text-sm font-semibold">{record.category} · {record.minutes} 分钟</span><button type="button" aria-label={`删除${record.category}记录`} className="secondary-button !p-3" onClick={() => setDeleteId(record.id)}><Trash2 size={15} /></button></div>{record.note && <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-6 text-slate-500">{record.note}</p>}{deleteId === record.id && <div className="mt-3 flex gap-2"><button type="button" className="secondary-button text-red-700" onClick={() => { if (onUpdate(current => ({ ...current, studyRecords: current.studyRecords.filter(item => item.id !== record.id) }))) setDeleteId(null); }}>确认删除</button><button type="button" className="secondary-button" onClick={() => setDeleteId(null)}>取消</button></div>}</li>)}</ul>
    {!data.studyRecords.some(record => record.date === date) && <p className="card text-center text-sm text-slate-400">今天还没有学习记录</p>}
    <RecentTrends data={data} date={date} today={today} kind="study" />
    <p className="mt-5 text-xs leading-6 text-slate-400">学习记录用于实际时长统计；计划里的学习任务请单独打卡。</p>
  </>;
}

