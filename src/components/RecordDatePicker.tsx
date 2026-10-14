import { isDateKey } from '../lib/date';

export function RecordDatePicker({ date, today, onChange }: { date: string; today: string; onChange: (date: string) => void }) {
  return <div className="mb-5 flex items-center gap-3"><label className="min-w-0 flex-1"><span className="sr-only">记录日期</span><input type="date" className="field" value={date} max={today} onChange={event => { if (isDateKey(event.target.value) && event.target.value <= today) onChange(event.target.value); }} /></label><button type="button" className="secondary-button" onClick={() => onChange(today)}>今天</button></div>;
}
