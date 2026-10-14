import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export function MetricCard({ icon: Icon, label, value, detail }: {
  icon: LucideIcon; label: string; value: ReactNode; detail: string;
}) {
  return <section className="card min-w-0">
    <div className="flex items-center gap-2 text-slate-500"><Icon size={16} className="shrink-0 text-blue-500" aria-hidden="true" /><h3 className="text-xs">{label}</h3></div>
    <p className="mt-4 text-2xl font-bold tracking-tight">{value}</p>
    <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
  </section>;
}
