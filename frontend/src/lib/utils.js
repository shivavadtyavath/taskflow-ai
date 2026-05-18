import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isPast, isToday, isTomorrow } from 'date-fns';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(date) {
  if (!date) return null;
  return format(new Date(date), 'MMM d, yyyy');
}

export function formatRelative(date) {
  if (!date) return null;
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function getDueDateLabel(date) {
  if (!date) return null;
  const d = new Date(date);
  if (isPast(d) && !isToday(d)) return { label: 'Overdue', color: 'text-red-400', bg: 'bg-red-500/10' };
  if (isToday(d)) return { label: 'Due today', color: 'text-orange-400', bg: 'bg-orange-500/10' };
  if (isTomorrow(d)) return { label: 'Due tomorrow', color: 'text-yellow-400', bg: 'bg-yellow-500/10' };
  return { label: formatDate(d), color: 'text-slate-400', bg: 'bg-slate-500/10' };
}

export const PRIORITY_CONFIG = {
  critical: { label: 'Critical', color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/30', dot: 'bg-red-400' },
  high: { label: 'High', color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/30', dot: 'bg-orange-400' },
  medium: { label: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-500/15', border: 'border-yellow-500/30', dot: 'bg-yellow-400' },
  low: { label: 'Low', color: 'text-green-400', bg: 'bg-green-500/15', border: 'border-green-500/30', dot: 'bg-green-400' },
};

export const STATUS_CONFIG = {
  'todo': { label: 'To Do', color: 'text-slate-400', bg: 'bg-slate-500/15', border: 'border-slate-500/30' },
  'in-progress': { label: 'In Progress', color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/30' },
  'in-review': { label: 'In Review', color: 'text-purple-400', bg: 'bg-purple-500/15', border: 'border-purple-500/30' },
  'done': { label: 'Done', color: 'text-green-400', bg: 'bg-green-500/15', border: 'border-green-500/30' },
};

export function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function getAvatarColor(name) {
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6'];
  if (!name) return colors[0];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}
