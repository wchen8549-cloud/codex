import { useEffect, useRef, useState } from 'react';
import { Target } from 'lucide-react';
import { BottomNav, tabs } from '../components/BottomNav';
import { StatsPage } from '../pages/StatsPage';
import { DashboardPage } from '../pages/DashboardPage';
import { PlanPage } from '../pages/PlanPage';
import { StudyPage } from '../pages/StudyPage';
import { HealthPage } from '../pages/HealthPage';
import { useStudyTimer } from '../hooks/useStudyTimer';
import { useAppData } from '../hooks/useAppData';
import type { PageId } from '../types';
import { PwaStatus } from '../components/PwaStatus';
import { useKeyboardOpen } from '../hooks/useKeyboardOpen';

export function App() {
  const [page, setPage] = useState<PageId>('home');
  const { data, error, update } = useAppData();
  const timer = useStudyTimer(data.studyRecords.map(record => record.id));
  const keyboardOpen = useKeyboardOpen();
  const main = useRef<HTMLElement>(null);
  const firstPage = useRef(true);
  useEffect(() => {
    if (firstPage.current) { firstPage.current = false; return; }
    window.scrollTo({ top: 0, behavior: 'instant' });
    main.current?.focus({ preventScroll: true });
  }, [page]);
  return <div className="min-h-dvh" data-keyboard-open={keyboardOpen}>
    <a className="skip-link" href="#main-content">跳到主要内容</a>
    <header className="app-header border-b border-slate-200/70 bg-white/90">
      <div className="mx-auto flex max-w-2xl items-center gap-3 px-5 py-5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white"><Target size={22} /></span>
        <div className="min-w-0 flex-1"><p className="text-sm font-bold tracking-tight">47天国考冲刺管理系统</p><p className="mt-0.5 text-[11px] text-slate-400">学习有节奏 · 健康有记录</p></div>
        <span className="ml-auto rounded-md bg-slate-100 px-2 py-1 text-[10px] text-slate-500">v0.1</span>
      </div>
    </header>
    <main ref={main} tabIndex={-1} id="main-content" className="app-content mx-auto max-w-2xl px-5 pt-6" aria-label={tabs.find(tab => tab.id === page)?.label}>
      {import.meta.env.MODE !== 'android' && <PwaStatus />}
      {error && <p role="alert" className="mb-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">{error}</p>}
      {page === 'home' ? <DashboardPage data={data} onUpdate={update} onNavigate={setPage} /> : page === 'plan' ? <PlanPage data={data} onUpdate={update} /> : page === 'study' ? <StudyPage data={data} onUpdate={update} timer={timer} /> : page === 'health' ? <HealthPage data={data} onUpdate={update} /> : <StatsPage data={data} />}
    </main>
    <BottomNav active={page} onChange={setPage} />
  </div>;
}
