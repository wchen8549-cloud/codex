import { House, CalendarDays, BookOpen, HeartPulse, ChartNoAxesCombined } from 'lucide-react';
import type { PageId } from '../types';

export const tabs = [
  { id: 'home', label: '首页', icon: House },
  { id: 'plan', label: '计划', icon: CalendarDays },
  { id: 'study', label: '学习', icon: BookOpen },
  { id: 'health', label: '健康', icon: HeartPulse },
  { id: 'stats', label: '统计', icon: ChartNoAxesCombined },
] as const;

export function BottomNav({ active, onChange }: { active: PageId; onChange: (page: PageId) => void }) {
  return <nav aria-label="主导航" className="bottom-nav">
    <div className="mx-auto grid max-w-2xl grid-cols-5 gap-1 px-3">
      {tabs.map(({ id, label, icon: Icon }) => <button key={id} type="button"
        onClick={() => onChange(id)} aria-current={active === id ? 'page' : undefined}
        className={`nav-item ${active === id ? 'nav-active' : ''}`}>
        <Icon size={21} strokeWidth={active === id ? 2.3 : 1.7} aria-hidden="true" /><span>{label}</span>
      </button>)}
    </div>
  </nav>;
}
