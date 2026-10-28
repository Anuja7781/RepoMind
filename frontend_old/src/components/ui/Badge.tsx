import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full border border-slate-700 bg-slate-900/80 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-300', className)}>
      {children}
    </span>
  );
}
