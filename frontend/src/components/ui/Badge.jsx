import { cn } from '../../lib/utils';

export default function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
    primary: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    success: 'bg-green-500/15 text-green-300 border-green-500/30',
    warning: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
    danger: 'bg-red-500/15 text-red-300 border-red-500/30',
    purple: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  };

  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border',
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
}
