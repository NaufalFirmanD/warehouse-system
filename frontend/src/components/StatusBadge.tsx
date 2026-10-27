import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'DRAFT':
        return 'bg-slate-700/60 text-slate-300 border-slate-600';
      case 'PENDING':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'RECEIVING':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'COMPLETED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'CANCELED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getBadgeStyle()}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
          status === 'COMPLETED'
            ? 'bg-emerald-400'
            : status === 'RECEIVING'
            ? 'bg-blue-400 animate-pulse'
            : status === 'PENDING'
            ? 'bg-amber-400'
            : status === 'CANCELED'
            ? 'bg-rose-400'
            : 'bg-slate-400'
        }`}
      />
      {status}
    </span>
  );
};
