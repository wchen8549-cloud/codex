export interface ChartPoint { date: string; value: number | null }
/** Null values break the line; missing weight/pain is never interpolated. */
export function chartGeometry(points: ChartPoint[], domain?: [number, number]) {
  const values = points.flatMap(point => point.value === null ? [] : [point.value]);
  const low = domain?.[0] ?? (values.length ? Math.min(...values) - 1 : 0);
  const high = domain?.[1] ?? (values.length ? Math.max(...values) + 1 : 1);
  const span = high - low || 1;
  const coordinates = points.map((point, index) => ({ ...point,
    x: 42 + (points.length > 1 ? index / (points.length - 1) : 0.5) * 290,
    y: point.value === null ? null : 18 + (high - point.value) / span * 130,
  }));
  const paths: string[] = [];
  let current = '';
  for (const point of coordinates) {
    if (point.y === null) { if (current) paths.push(current); current = ''; }
    else current += `${current ? ' L' : 'M'}${point.x.toFixed(2)},${point.y.toFixed(2)}`;
  }
  if (current) paths.push(current);
  return { low, high, coordinates, paths, hasData: values.length > 0 };
}
