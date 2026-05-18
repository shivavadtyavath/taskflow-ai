import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Settings, Users, LayoutGrid, List, Trash2,
  UserPlus, Crown, ArrowLeft, Sparkles, AlertCircle
} from 'lucide-react';
import api from '../lib/api';
import useAuthStore from '../store/authStore';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { Textarea, Select } from '../components/ui/Input';
import TaskCard from '../components/tasks/TaskCard';
import CreateTaskModal from '../components/tasks/CreateTaskModal';
import toast from 'react-hot-toast';
import { STATUS_CONFIG, PRIORITY_CONFIG } from '../lib/utils';

const COLUMNS = [
  { id: 'todo', label: 'To Do', color: '#64748b' },
  { id: 'in-progress', label: 'In Progress', color: '#3b82f6' },
  { id: 'in-review', label: 'In Review', color: '#8b5cf6' },
  { id: 'done', label: 'Done', color: '#10b981' },
];

function KanbanColumn({ column, tasks, onTaskClick, onAddTask, isAdmin }) {
  const config = STATUS_CONFIG[column.id];
  return (
    <div className="flex-1 min-w-[260px] max-w-[320px]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: column.color }} />
          <span className="text-sm font-medium text-slate-300">{column.label}</span>
          <span className="text-xs text-slate-500 bg-white/5 px-1.5 py-0.5 rounded-md">{tasks.length}</span>
        </div>
        <button
          onClick={() => onAddTask(column.id)}
          className="p-1 rounded-lg hover:bg-white/10 text-slate-500 hover:text-slate-300 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="space-y-2 min-h-[100px]">
        <AnimatePresence>
          {tasks.map(task => (
            <TaskCard key={task._id} task={task} onClick={() => onTaskClick(task)} />
          ))}
        </AnimatePresence>
        {tasks.length === 0 && (
          <div
            onClick={() => onAddTask(column.id)}
            className="border-2 border-dashed border-white/5 rounded-xl p-4 text-center cursor-pointer hover:border-white/10 transition-colors"
          >
            <p className="text-xs text-slate-600">Drop tasks here</p>
          </div>
        )}
      </div>
    </div>
  );
}

function MembersModal({ isOpen, onClose, project, isAdmin, onUpdate }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post(`/projects/${project._id}/members`, { email });
      toast.success('Member added!');
      onUpdate(data.project);
      setEmail('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (userId) => {
    if (!confirm('Remove this member?')) return;
    try {
      const { data } = await api.delete(`/projects/${project._id}/members/${userId}`);
      toast.success('Member removed');
      onUpdate(data.project);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to remove member');
    }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      const { data } = await api.put(`/projects/${project._id}/members/${userId}/role`, { role });
      toast.success('Role updated');
      onUpdate(data.project);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update role');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Team Members" size="md">
      {isAdmin && (
        <form onSubmit={handleAdd} className="flex gap-2 mb-5">
          <Input
            placeholder="Add by email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1"
          />
          <Button type="submit" loading={loading} size="md">
            <UserPlus className="w-4 h-4" />
          </Button>
        </form>
      )}
      <div className="space-y-2">
        {project?.members?.map(({ user, role }) => (
          <div key={user._id} className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5">
            <Avatar user={user} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
            {isAdmin ? (
              <select
                value={role}
                onChange={(e) => handleRoleChange(user._id, e.target.value)}
                className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-slate-300 focus:outline-none"
              >
                <option value="admin">Admin</option>
                <option value="member">Member</option>
              </select>
            ) : (
              <Badge variant={role === 'admin' ? 'primary' : 'default'}>{role}</Badge>
            )}
            {isAdmin && (
              <button onClick={() => handleRemove(user._id)} className="p-1 text-slate-600 hover:text-red-400 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('kanban');
  const [showMembers, setShowMembers] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState('todo');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);

  const isAdmin = project?.isAdmin?.(user?._id) ||
    project?.members?.some(m => m.user._id === user?._id && m.role === 'admin');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [projectRes, tasksRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks?projectId=${id}`)
      ]);
      setProject(projectRes.data.project);
      setTasks(tasksRes.data.tasks);
    } catch (err) {
      toast.error('Failed to load project');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskCreated = (task) => {
    setTasks(prev => [task, ...prev]);
  };

  const handleTaskUpdated = (updatedTask) => {
    setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
  };

  const handleTaskDeleted = (taskId) => {
    setTasks(prev => prev.filter(t => t._id !== taskId));
    setShowTaskDetail(false);
  };

  const handleAddTask = (status) => {
    setDefaultStatus(status);
    setShowCreateTask(true);
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const { data } = await api.put(`/tasks/${taskId}`, { status: newStatus });
      handleTaskUpdated(data.task);
    } catch (err) {
      toast.error('Failed to update task');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tasksByStatus = COLUMNS.reduce((acc, col) => {
    acc[col.id] = tasks.filter(t => t.status === col.id);
    return acc;
  }, {});

  const progress = project?.taskCount > 0
    ? Math.round((project.completedTaskCount / project.taskCount) * 100)
    : 0;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5 bg-[#0f0f1a] flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/projects')} className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
                style={{ backgroundColor: `${project?.color}20`, border: `1px solid ${project?.color}30` }}>
                {project?.emoji}
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">{project?.name}</h1>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>{tasks.length} tasks</span>
                  <span>•</span>
                  <span>{project?.members?.length} members</span>
                  <span>•</span>
                  <span>{progress}% complete</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white/5 rounded-lg p-1">
              <button onClick={() => setView('kanban')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${view === 'kanban' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setView('list')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${view === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setShowMembers(true)}>
              <Users className="w-3.5 h-3.5" />
              Team
            </Button>
            <Button size="sm" onClick={() => handleAddTask('todo')}>
              <Plus className="w-3.5 h-3.5" />
              Add Task
            </Button>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-1 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${project?.color}, ${project?.color}99)` }} />
        </div>
      </div>

      {/* Kanban Board */}
      {view === 'kanban' && (
        <div className="flex-1 overflow-x-auto overflow-y-auto p-6">
          <div className="flex gap-4 min-w-max h-full">
            {COLUMNS.map(col => (
              <KanbanColumn
                key={col.id}
                column={col}
                tasks={tasksByStatus[col.id] || []}
                onTaskClick={(task) => { setSelectedTask(task); setShowTaskDetail(true); }}
                onAddTask={handleAddTask}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-2">
            {tasks.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-slate-400">No tasks yet. Create your first task!</p>
              </div>
            ) : (
              tasks.map(task => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onClick={() => { setSelectedTask(task); setShowTaskDetail(true); }}
                  listView
                />
              ))
            )}
          </div>
        </div>
      )}

      <CreateTaskModal
        isOpen={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        projectId={id}
        members={project?.members || []}
        defaultStatus={defaultStatus}
        onCreated={handleTaskCreated}
      />

      <MembersModal
        isOpen={showMembers}
        onClose={() => setShowMembers(false)}
        project={project}
        isAdmin={isAdmin}
        onUpdate={setProject}
      />

      {showTaskDetail && selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setShowTaskDetail(false)}
          onUpdated={handleTaskUpdated}
          onDeleted={handleTaskDeleted}
          members={project?.members || []}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}

function TaskDetailModal({ task: initialTask, onClose, onUpdated, onDeleted, members, isAdmin }) {
  const [task, setTask] = useState(initialTask);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ status: task.status, priority: task.priority, assignedTo: task.assignedTo?._id || '' });
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const { data } = await api.put(`/tasks/${task._id}`, form);
      setTask(data.task);
      onUpdated(data.task);
      setEditing(false);
      toast.success('Task updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${task._id}`);
      onDeleted(task._id);
      toast.success('Task deleted');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      const { data } = await api.post(`/tasks/${task._id}/comments`, { text: comment });
      setTask(prev => ({ ...prev, comments: data.comments }));
      setComment('');
    } catch (err) {
      toast.error('Failed to add comment');
    }
  };

  const statusConfig = STATUS_CONFIG[task.status];
  const priorityConfig = PRIORITY_CONFIG[task.priority];

  return (
    <Modal isOpen={true} onClose={onClose} size="lg">
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold text-white leading-tight">{task.title}</h2>
          <div className="flex items-center gap-2 flex-shrink-0">
            {(isAdmin || task.createdBy?._id === user?._id) && (
              <button onClick={handleDelete} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {task.description && (
          <p className="text-sm text-slate-400 leading-relaxed">{task.description}</p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">Status</label>
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                <option key={val} value={val}>{cfg.label}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">Priority</label>
            <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              {Object.entries(PRIORITY_CONFIG).map(([val, cfg]) => (
                <option key={val} value={val}>{cfg.label}</option>
              ))}
            </Select>
          </div>
          <div className="col-span-2">
            <label className="text-xs text-slate-500 mb-1.5 block">Assigned To</label>
            <Select value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
              <option value="">Unassigned</option>
              {members.map(({ user: u }) => (
                <option key={u._id} value={u._id}>{u.name}</option>
              ))}
            </Select>
          </div>
        </div>

        <Button onClick={handleUpdate} loading={loading} className="w-full">
          Save Changes
        </Button>

        {/* Comments */}
        <div className="border-t border-white/10 pt-4">
          <h4 className="text-sm font-medium text-slate-300 mb-3">Comments ({task.comments?.length || 0})</h4>
          <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
            {task.comments?.map(c => (
              <div key={c._id} className="flex gap-2">
                <Avatar user={c.user} size="xs" />
                <div className="flex-1 bg-white/3 rounded-lg px-3 py-2">
                  <p className="text-xs font-medium text-slate-300">{c.user?.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{c.text}</p>
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleComment} className="flex gap-2">
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
            <Button type="submit" size="sm" disabled={!comment.trim()}>Post</Button>
          </form>
        </div>
      </div>
    </Modal>
  );
}
