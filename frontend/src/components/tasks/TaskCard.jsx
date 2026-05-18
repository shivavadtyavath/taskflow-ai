import { motion } from 'framer-motion';
import { Calendar, MessageSquare, Sparkles } from 'lucide-react';
import Avatar from '../ui/Avatar';
import { PRIORITY_CONFIG, STATUS_CONFIG, getDueDateLabel, cn } from '../../lib/utils';

export default function TaskCard({ task, onClick, listView = false }) {
  const priority = PRIORITY_CONFIG[task.priority];
  const status = STATUS_CONFIG[task.status];
  const dueInfo = getDueDateLabel(task.dueDate);

  if (listView) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={onClick}
        className="flex items-center gap-4 p-4 bg-[#1a1a2e] border border-white/10 rounded-xl cursor-pointer hover:border-white/20 transition-all group"
      >
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${priority?.dot}`} />
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium truncate', task.status === 'done' ? 'line-through text-slate-500' : 'text-slate-200')}>
            {task.title}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {dueInfo && (
            <span className={`text-xs ${dueInfo.color} hidden sm:block`}>{dueInfo.label}</span>
          )}
          <span className={`text-xs px-2 py-0.5 rounded-md border ${status?.bg} ${status?.color} ${status?.border}`}>
            {status?.label}
          </span>
          {task.assignedTo && <Avatar user={task.assignedTo} size="xs" />}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={onClick}
      className="bg-[#1a1a2e] border border-white/10 rounded-xl p-3.5 cursor-pointer hover:border-white/20 hover:shadow-lg hover:shadow-black/20 transition-all group"
    >
      {/* Priority indicator */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={`text-xs px-1.5 py-0.5 rounded-md border ${priority?.bg} ${priority?.color} ${priority?.border}`}>
          {priority?.label}
        </span>
        {task.aiGenerated && (
          <Sparkles className="w-3 h-3 text-purple-400 flex-shrink-0" title="AI Generated" />
        )}
      </div>

      <p className={cn(
        'text-sm font-medium leading-snug mb-2',
        task.status === 'done' ? 'line-through text-slate-500' : 'text-slate-200 group-hover:text-white'
      )}>
        {task.title}
      </p>

      {task.description && (
        <p className="text-xs text-slate-500 line-clamp-2 mb-3">{task.description}</p>
      )}

      {/* Tags */}
      {task.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-xs px-1.5 py-0.5 rounded-md bg-white/5 text-slate-500">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {task.assignedTo ? (
            <Avatar user={task.assignedTo} size="xs" />
          ) : (
            <div className="w-6 h-6 rounded-full border border-dashed border-white/20 flex items-center justify-center">
              <span className="text-xs text-slate-600">?</span>
            </div>
          )}
          {task.comments?.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <MessageSquare className="w-3 h-3" />
              {task.comments.length}
            </span>
          )}
        </div>
        {dueInfo && (
          <span className={`text-xs ${dueInfo.color} flex items-center gap-1`}>
            <Calendar className="w-3 h-3" />
            {dueInfo.label}
          </span>
        )}
      </div>
    </motion.div>
  );
}
