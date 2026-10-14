import { useEffect, useState } from 'react';
import { dateKey } from '../lib/date';

export function useToday() {
  const [today, setToday] = useState(dateKey);
  useEffect(() => {
    const refresh = () => setToday(dateKey());
    const timer = window.setInterval(refresh, 30_000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);
  return today;
}
