const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];

/** 1234 -> "1.23K". Falls back to scientific notation past the suffix table. */
export function formatNum(n: number): string {
  if (!Number.isFinite(n)) return '0';
  if (n < 0) return '-' + formatNum(-n);
  if (n < 1000) return n < 10 ? n.toFixed(2).replace(/\.?0+$/, '') || '0' : Math.floor(n).toString();
  let i = 0;
  let v = n;
  while (v >= 1000 && i < SUFFIXES.length - 1) {
    v /= 1000;
    i++;
  }
  if (v >= 1000) return n.toExponential(2).replace('+', '');
  return (v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2)) + SUFFIXES[i];
}

export function formatDuration(seconds: number): string {
  const s = Math.floor(seconds);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}
