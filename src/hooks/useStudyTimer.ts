import { useEffect, useState } from 'react';
import type { StudyCategory, StudyTimerState } from '../types';
import { dateKey, isDateKey } from '../lib/date';
import { STUDY_CATEGORIES, timerElapsed } from '../lib/records';
import { createId } from '../lib/id';

const KEY = 'sprint47:timer:v1';
function loadTimer(): { timer: StudyTimerState | null; error: string } {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { timer: null, error: '' };
    const timer = JSON.parse(raw) as StudyTimerState;
    if (!timer || typeof timer.id !== 'string' || !isDateKey(timer.date) || !STUDY_CATEGORIES.includes(timer.category) ||
      !Number.isFinite(timer.elapsedMs) || timer.elapsedMs < 0 ||
      (timer.startedAt !== null && (!Number.isFinite(timer.startedAt) || timer.startedAt < 0))) throw new Error('Invalid timer');
    return { timer, error: '' };
  } catch { return { timer: null, error: '计时状态无法读取，可点击重置清除计时状态。' }; }
}
export function useStudyTimer(savedRecordIds: string[] = []) {
  const [initial] = useState(loadTimer);
  const [timer, setTimer] = useState(initial.timer);
  const [error, setError] = useState(initial.error);
  const [blocked, setBlocked] = useState(!!initial.error);
  const [now, setNow] = useState(Date.now);
  const alreadySaved = !!timer && savedRecordIds.includes(timer.id);
  useEffect(() => {
    if (timer?.startedAt == null) return;
    const refresh = () => setNow(Date.now());
    const tick = window.setInterval(refresh, 1000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => { window.clearInterval(tick); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, [timer?.startedAt]);
  function persist(next: StudyTimerState | null): boolean {
    try {
      if (next) localStorage.setItem(KEY, JSON.stringify(next)); else localStorage.removeItem(KEY);
      setTimer(next); setError(''); setBlocked(false); setNow(Date.now()); return true;
    } catch { setError('计时状态保存失败，请检查本地存储。'); return false; }
  }
  function start(category: StudyCategory) {
    if (blocked || timer?.startedAt != null) return;
    if (alreadySaved) { setError('此计时已保存，请先清除计时状态再开始新一段学习。'); return; }
    const timestamp = Date.now();
    persist(timer ? { ...timer, startedAt: timestamp } : {
      id: createId(), date: dateKey(), category, elapsedMs: 0, startedAt: timestamp,
    });
  }
  function pause() {
    if (timer?.startedAt != null) persist({ ...timer, elapsedMs: timerElapsed(timer, Date.now()), startedAt: null });
  }
  return { timer, error, blocked, alreadySaved, elapsedMs: timer ? timerElapsed(timer, now) : 0, start, pause, reset: () => persist(null) };
}
export type StudyTimerController = ReturnType<typeof useStudyTimer>;
