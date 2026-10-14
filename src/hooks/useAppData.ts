import { useEffect, useRef, useState } from 'react';
import { loadData, saveDataIfUnchanged } from '../lib/storage';
import type { AppUpdater } from '../types';
import { ensureDailyPlan } from '../lib/plan';
import { useToday } from './useToday';

/** First launch, day changes and explicit edits persist outside rendering. */
export function useAppData() {
  const [loaded] = useState(loadData);
  const [data, setData] = useState(loaded.data);
  const [error, setError] = useState(loaded.error);
  const currentData = useRef(data);
  const expectedRaw = useRef(loaded.raw);
  const today = useToday();
  useEffect(() => {
    // Persist today's generated plan and anchor the first-launch date.
    // The ref preserves explicit settings updates when Shanghai midnight arrives.
    if (loaded.error) return;
    const next = ensureDailyPlan(currentData.current, today);
    const saved = saveDataIfUnchanged(next, expectedRaw.current);
    setError(saved.error);
    if (!saved.error) { expectedRaw.current = saved.raw; currentData.current = next; setData(next); }
  }, [loaded, today]);
  const update: AppUpdater = (next) => {
    if (loaded.error) return false;
    const prepared = ensureDailyPlan(typeof next === 'function' ? next(currentData.current) : next, today);
    const saved = saveDataIfUnchanged(prepared, expectedRaw.current);
    setError(saved.error);
    if (saved.error) return false;
    expectedRaw.current = saved.raw;
    currentData.current = prepared;
    setData(prepared);
    return true;
  };
  return { data, error, update };
}
