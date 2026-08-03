import { useEffect, useState } from 'react';

export function useCountdown(hours: number) {
  const [target] = useState(() => Date.now() + hours * 3600 * 1000);
  const [remaining, setRemaining] = useState(target - Date.now());

  useEffect(() => {
    const id = setInterval(() => setRemaining(Math.max(0, target - Date.now())), 1000);
    return () => clearInterval(id);
  }, [target]);

  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  return { h, m, s };
}
