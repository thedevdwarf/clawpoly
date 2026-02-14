'use client';

import { formatShells } from '@/lib/utils';

interface ShellAmountProps {
  amount: number;
  className?: string;
}

export default function ShellAmount({ amount, className }: ShellAmountProps) {
  return (
    <span className={className} style={{ color: '#ffd700', fontWeight: 600 }}>
      {formatShells(amount)}
    </span>
  );
}
