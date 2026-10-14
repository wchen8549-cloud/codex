import { useId } from 'react';
import { chartGeometry, type ChartPoint } from '../lib/chart';

export function TrendChart({ title, points, unit, domain, note }: {
  title: string; points: ChartPoint[]; unit: string; domain?: [number, number]; note: string;
}) {
  const id = useId();
  const geometry = chartGeometry(points, domain);
  const labelIndices = [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])];
  return <section className="card mt-4 !p-4">
    <h2 className="text-sm font-semibold">{title}<span className="ml-2 text-xs font-normal text-slate-400">{unit}</span></h2>
    {geometry.hasData ? <svg viewBox="0 0 350 180" className="mt-4 block w-full" role="img" aria-labelledby={id}>
      <title id={id}>{title}，从 {points[0]?.date} 至 {points[points.length - 1]?.date}。精确数据见下方明细。</title>
      {[0, 0.5, 1].map(fraction => <g key={fraction}><line x1="42" x2="332" y1={18 + fraction * 130} y2={18 + fraction * 130} stroke="#e8edf5" /><text x="35" y={22 + fraction * 130} fontSize="10" textAnchor="end" fill="#64748b">{(geometry.high - fraction * (geometry.high - geometry.low)).toFixed(1)}</text></g>)}
      {geometry.paths.map((path, index) => <path key={index} d={path} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinejoin="round" />)}
      {geometry.coordinates.filter(point => point.y !== null).map(point => <circle key={point.date} cx={point.x} cy={point.y!} r="3" fill="#2563eb"><title>{point.date}：{point.value?.toFixed(2)} {unit}</title></circle>)}
      {labelIndices.map(index => points[index] && <text key={index} x={geometry.coordinates[index].x} y="171" textAnchor="middle" fontSize="10" fill="#64748b">{points[index].date.slice(5)}</text>)}
    </svg> : <p className="py-8 text-center text-sm text-slate-400">当前范围暂无记录</p>}
    <p className="mt-2 text-[11px] leading-6 text-slate-500">{note}</p>
    <details className="mt-3 text-xs"><summary className="cursor-pointer py-2 text-blue-600">查看每日数据</summary><div className="max-h-64 overflow-auto"><table className="w-full text-left"><caption className="sr-only">{title}每日数据</caption><thead><tr><th className="py-2 font-medium">日期</th><th className="py-2 text-right font-medium">{unit}</th></tr></thead><tbody>{points.map(point => <tr key={point.date} className="border-t border-slate-100"><td className="py-2">{point.date}</td><td className="py-2 text-right tabular-nums">{point.value === null ? '—' : point.value.toFixed(2)}</td></tr>)}</tbody></table></div></details>
  </section>;
}
