import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  CheckSquare, Clock, AlertTriangle, TrendingUp,
  FolderKanban, Zap, ArrowRight, Calendar
} from 'lucide-react';
import api from '../lib/api';
import useAuthStore from '../store/authStore';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import { PRIORITY_CONFIG, STATUS_CONFIG, formatRelative, getDueDateLabel } from '../lib/utils';

const COLORS = ['#6366f1', '#3b82f6', '#8b5cf6', '#10b981'];

function StatCard({ icon: Icon, label, value, sub, color = 'indigo', trend }) {
  const colors = {
    indigo: 'from-indigo-500/20 to-indigo-600/5 border-indigo-500/20 text-indigo-400',
    blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/20 text-blue-400',
    red: 'from-red-500/20 to-red-600/5 border-red-500/20 text-red-400',
    green: 'from-green-500/20 to-green-600/5 border-green-500/20 text-green-400',
    yellow: 'from-yellow-500/20 to-yellow-600/5 border-yellow-500/20 text-yellow-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-5 card-hover`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400 mb-1">{label}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-xl bg-white/5`}>
          <Icon className={`w-5 h-5 ${colors[color].split(' ').find(c => c.startsWith('text-'))}`} />
        </div>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data: res } = await api.get('/dashboard');
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center animate-pulse">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <p className="text-slate-400 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statusChartData = data ? [
    { name: 'To Do', value: data.statusBreakdown.todo, color: '#64748b' },
    { name: 'In Progress', value: data.statusBreakdown['in-progress'], color: '#3b82f6' },
    { name: 'In Review', value: data.statusBreakdown['in-review'], color: '#8b5cf6' },
    { name: 'Done', value: data.statusBreakdown.done, color: '#10b981' },
  ] : [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-2xl font-bold text-white">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
            <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-slate-400 mt-1">Here's what's happening across your projects</p>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={FolderKanban} label="Total Projects" value={data?.stats.totalProjects || 0} color="indigo" />
        <StatCard icon={CheckSquare} label="Total Tasks" value={data?.stats.totalTasks || 0} sub={`${data?.stats.completionRate || 0}% complete`} color="blue" />
        <StatCard icon={AlertTriangle} label="Overdue" value={data?.stats.overdueTasks || 0} sub="Need attention" color="red" />
        <StatCard icon={Clock} label="Due Soon" value={data?.stats.dueSoon || 0} sub="Next 3 days" color="yellow" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Weekly completion chart */}
        <div className="lg:col-span-2 bg-[#1a1a2e] border border-white/10 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Weekly Task Completion</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data?.weeklyCompletion || []}>
              <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e2e8f0' }}
                cursor={{ fill: 'rgba(99,102,241,0.1)' }}
              />
              <Bar dataKey="completed" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status breakdown */}
        <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Tasks by Status</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={statusChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                {statusChartData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e2e8f0' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {statusChartData.map(item => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-400">{item.name}</span>
                </div>
                <span className="text-slate-300 font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue tasks */}
        <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              Overdue Tasks
            </h3>
            <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
              {data?.overdueTasks?.length || 0} tasks
            </span>
          </div>
          {data?.overdueTasks?.length === 0 ? (
            <div className="text-center py-6">
              <CheckSquare className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No overdue tasks!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data?.overdueTasks?.slice(0, 5).map(task => (
                <div
                  key={task._id}
                  onClick={() => navigate(`/projects/${task.project._id}`)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/3 hover:bg-white/5 cursor-pointer transition-colors border border-white/5"
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_CONFIG[task.priority]?.dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 truncate">{task.title}</p>
                    <p className="text-xs text-slate-500">{task.project?.name}</p>
                  </div>
                  <span className="text-xs text-red-400 flex-shrink-0">
                    {getDueDateLabel(task.dueDate)?.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Team workload */}
        <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            Team Workload
          </h3>
          {data?.tasksByUser?.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-slate-400">No assigned tasks yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data?.tasksByUser?.slice(0, 5).map(({ user: u, total, done, overdue }) => (
                <div key={u._id} className="flex items-center gap-3">
                  <Avatar user={u} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium text-slate-300 truncate">{u.name}</p>
                      <span className="text-xs text-slate-500">{done}/{total}</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                        style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  {overdue > 0 && (
                    <span className="text-xs text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded-md flex-shrink-0">
                      {overdue} late
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
