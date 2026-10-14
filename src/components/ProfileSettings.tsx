import { useState, type FormEvent } from 'react';
import type { Profile } from '../types';
import { isDateKey } from '../lib/date';

export function ProfileSettings({ profile, onSave, onClose }: {
  profile: Profile; onSave: (profile: Profile) => boolean; onClose: () => void;
}) {
  const [examDate, setExamDate] = useState(profile.examDate);
  const [targetWeight, setTargetWeight] = useState(String(profile.targetWeightKg));
  const [error, setError] = useState('');
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const weight = Number(targetWeight);
    if (!isDateKey(examDate) || examDate <= profile.startDate) {
      setError('考试日期需晚于冲刺开始日期。'); return;
    }
    if (!targetWeight.trim() || !Number.isFinite(weight) || weight < 30 || weight >= profile.startWeightKg) {
      setError(`目标体重需在 30 至 ${profile.startWeightKg} kg 之间，且低于起始体重。`); return;
    }
    if (onSave({ ...profile, examDate, targetWeightKg: weight })) onClose();
    else setError('保存失败，请查看页面上方的存储错误提示。');
  }
  return <section className="card mb-5" aria-labelledby="settings-title">
    <h2 id="settings-title" className="font-semibold">冲刺设置</h2>
    <p className="mt-2 text-xs leading-6 text-slate-500">默认日期为首次启动后 47 天，请按实际考试安排修改。冲刺开始于 {profile.startDate}。</p>
    <form onSubmit={submit} className="mt-4 space-y-4">
      <label className="block text-sm">考试日期<input required type="date" value={examDate} onChange={event => setExamDate(event.target.value)} className="field mt-2" /></label>
      <label className="block text-sm">目标体重（kg）<input required type="number" min="30" max={profile.startWeightKg - 0.1} step="0.1" inputMode="decimal" value={targetWeight} onChange={event => setTargetWeight(event.target.value)} className="field mt-2" /></label>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <div className="flex gap-3"><button type="submit" className="primary-button">保存设置</button><button type="button" className="secondary-button" onClick={onClose}>取消</button></div>
    </form>
  </section>;
}
