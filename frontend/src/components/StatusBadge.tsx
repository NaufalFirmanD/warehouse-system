import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const config: Record<string, { bg: string; text: string; border: string; dot: string; label: string }> = {
    DRAFT:      { bg: 'bg-gray-800/80',    text: 'text-gray-400',    border: 'border-gray-700/60',   dot: 'bg-gray-500',   label: 'Draft' },
    PENDING:    { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/25',  dot: 'bg-amber-400',  label: 'Pending' },
    RECEIVING:  { bg: 'bg-blue-500/10',    text: 'text-blue-400',    border: 'border-blue-500/25',   dot: 'bg-blue-400',   label: 'Receiving' },
    COMPLETED:  { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/25',dot: 'bg-emerald-400',label: 'Completed' },
    CANCELED:   { bg: 'bg-rose-500/10',    text: 'text-rose-400',    border: 'border-rose-500/25',   dot: 'bg-rose-400',   label: 'Canceled' },
  };

  const c = config[status] || config.DRAFT;
  const padClass = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold tracking-wide border ${c.bg} ${c.text} ${c.border} ${padClass}`}>
      <span className={`relative flex h-1.5 w-1.5 rounded-full ${c.dot} ${status === 'RECEIVING' ? 'dot-pulse' : ''}`} />
      {c.label}
    </span>
  );
};
