import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckSquare, Filter, AlertTriangle, Clock } from 'lucide-react';
import api from '../lib/api';
import useAuthStore from '../store/authStore';
import TaskCard from '../components/tasks/TaskCard';
import { Select } from '../components/ui/Input';
import toast from 'react-hot-toast';

export default function MyTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', priority: '' });
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyTasks();
  }, []);

  const fetchMyTasks = async () => {
    try {
      // Get all projects, then get tasks assigned to me
      const { data: projectsData } = await api.get('/projects');
      const allTasks = [];

      await Promise.all(
        projectsData.projects.map(async (project) => {
          try {
            const { data } = await api.get(`/tasks?projectId=${project._id}&assignedTo=me`);
            data.tasks.forEach(t => {
              allTasks.push({ ...t, projectName: project.name, projectColor: project.color });
            });
          } catch {}
        })
      );

      allTasks.sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
      });

      setTasks(allTasks);
    } catch (err) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const filtered = tasks.filter(t => {
    if (filter.status && t.status !== filter.status) return false;
    if (filter.priority && t.priority !== filter.priority) return false;
    return true;
  });

  const overdue = tasks.filter(t => t.dueDate && t.status !== 'done' && new Date(t.dueDate) < new Date());
  const inProgress = tasks.filter(t => t.status === 'in-progress');
  const done = tasks.filter(t => t.status === 'done');

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">My Tasks</h1>
        <p className="text-slate-400 mt-1">Tasks assigned to you across all projects</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'In Progress', value: inProgress.length, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Overdue', value: overdue.length, color: 'text-red-400', bg: 'bg-red-500/10' },
          { label: 'Completed', value: done.length, color: 'text-green-400', bg: 'bg-green-500/10' },
        ].map(stat => (
          <div key={stat.label} className={`${stat.bg} border border-white/5 rounded-xl p-4 text-center`}>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <Select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })} className="w-40">
          <option value="">All Status</option>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="in-review">In Review</option>
          <option value="done">Done</option>
        </Select>
        <Select value={filter.priority} onChange={(e) => setFilter({ ...filter, priority: e.target.value })} className="w-40">
          <option value="">All Priority</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-[#1a1a2e] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <CheckSquare className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-300 mb-2">No tasks found</h3>
          <p className="text-slate-500">
            {tasks.length === 0 ? 'No tasks assigned to you yet' : 'Try adjusting your filters'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(task => (
            <div key={task._id}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: task.projectColor || '#6366f1' }} />
                <span className="text-xs text-slate-500">{task.projectName}</span>
              </div>
              <TaskCard task={task} listView onClick={() => {}} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
