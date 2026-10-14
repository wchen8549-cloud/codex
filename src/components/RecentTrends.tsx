import type { AppData } from '../types';
import { addDays } from '../lib/date';
import { dailyStatistics } from '../lib/statistics';
import { TrendChart } from './TrendChart';

export function RecentTrends({ data, date, today, kind }: { data: AppData; date: string; today: string; kind: 'study' | 'health' }) {
  const days = dailyStatistics(data, addDays(date, -6), date, today);
  if (kind === 'study') return <TrendChart title="近7日学习趋势" unit="小时" domain={[0, Math.max(1, ...days.map(day => day.studyHours ?? 0))]} points={days.map(day => ({ date: day.date, value: day.studyHours }))} note="截至所选日期的7天；无学习记录计0小时。" />;
  return <><TrendChart title="近7日体重趋势" unit="kg" points={days.map(day => ({ date: day.date, value: day.weightKg }))} note="只展示实际称重，缺失日期断开。" /><TrendChart title="近7日腰痛趋势" unit="分" domain={[0, 10]} points={days.map(day => ({ date: day.date, value: day.painScore }))} note="0为实际无痛评分；缺失日期断开。" /></>;
}
