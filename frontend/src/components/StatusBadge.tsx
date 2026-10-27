import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const s = status.toUpperCase();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200';
  let label = status;
  let hasPulse = false;

  switch (s) {
    case 'PENDING':
      styles = 'bg-amber-50 text-amber-800 border-amber-200';
      label = 'Pending Dock';
      break;
    case 'RECEIVING':
      styles = 'bg-blue-50 text-blue-800 border-blue-200';
      label = 'Receiving Active';
      hasPulse = true;
      break;
    case 'COMPLETED':
      styles = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      label = 'Completed';
      break;
    case 'CANCELED':
      styles = 'bg-slate-100 text-slate-500 border-slate-200 line-through';
      label = 'Canceled';
      break;
    case 'DRAFT':
      styles = 'bg-slate-100 text-slate-600 border-slate-200';
      label = 'Draft';
      break;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border ${styles}`}>
      {hasPulse && (
        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
      )}
      {label}
    </span>
  );
};
