import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, FolderKanban, Users, CheckSquare, ArrowRight, Search } from 'lucide-react';
import api from '../lib/api';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { Textarea } from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import toast from 'react-hot-toast';

const PROJECT_EMOJIS = ['🚀', '💡', '🎯', '⚡', '🔥', '🌟', '🛠️', '📊', '🎨', '🤖'];
const PROJECT_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6'];

function ProjectCard({ project, onClick }) {
  const progress = project.taskCount > 0
    ? Math.round((project.completedTaskCount / project.taskCount) * 100)
    : 0;

  const statusColors = {
    active: 'success',
    'on-hold': 'warning',
    completed: 'primary',
    archived: 'default',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      onClick={onClick}
      className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-5 cursor-pointer hover:border-white/20 transition-all group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ backgroundColor: `${project.color}20`, border: `1px solid ${project.color}30` }}
          >
            {project.emoji}
          </div>
          <div>
            <h3 className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
              {project.name}
            </h3>
            <Badge variant={statusColors[project.status] || 'default'} className="mt-0.5">
              {project.status}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <span className="font-medium text-slate-300">{project.myRole}</span>
        </div>
      </div>

      {project.description && (
        <p className="text-sm text-slate-400 mb-4 line-clamp-2">{project.description}</p>
      )}

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
          <span>Progress</span>
          <span className="font-medium text-slate-300">{progress}%</span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${project.color}, ${project.color}99)`
            }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <CheckSquare className="w-3.5 h-3.5" />
            {project.taskCount} tasks
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {project.members?.length || 0} members
          </span>
        </div>
        <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
      </div>
    </motion.div>
  );
}

function CreateProjectModal({ isOpen, onClose, onCreated }) {
  const [form, setForm] = useState({
    name: '', description: '', color: '#6366f1', emoji: '🚀'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/projects', form);
      toast.success('Project created!');
      onCreated(data.project);
      onClose();
      setForm({ name: '', description: '', color: '#6366f1', emoji: '🚀' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Project">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Emoji & Color picker */}
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-2">Project Icon</label>
          <div className="flex flex-wrap gap-2">
            {PROJECT_EMOJIS.map(emoji => (
              <button
                key={emoji}
                type="button"
                onClick={() => setForm({ ...form, emoji })}
                className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${
                  form.emoji === emoji ? 'bg-indigo-500/30 ring-2 ring-indigo-500' : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-300 block mb-2">Color</label>
          <div className="flex gap-2">
            {PROJECT_COLORS.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => setForm({ ...form, color })}
                className={`w-7 h-7 rounded-full transition-all ${
                  form.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1a1a2e] scale-110' : ''
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        <Input
          label="Project Name"
          placeholder="e.g. Website Redesign"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
          minLength={2}
        />

        <Textarea
          label="Description (optional)"
          placeholder="What is this project about?"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
        />

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            Create Project
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data } = await api.get('/projects');
      setProjects(data.projects);
    } catch (err) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-slate-400 mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" />
          New Project
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-5 animate-pulse h-48" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <FolderKanban className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-300 mb-2">
            {search ? 'No projects found' : 'No projects yet'}
          </h3>
          <p className="text-slate-500 mb-6">
            {search ? 'Try a different search term' : 'Create your first project to get started'}
          </p>
          {!search && (
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4" />
              Create Project
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(project => (
            <ProjectCard
              key={project._id}
              project={project}
              onClick={() => navigate(`/projects/${project._id}`)}
            />
          ))}
        </div>
      )}

      <CreateProjectModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(project) => setProjects(prev => [project, ...prev])}
      />
    </div>
  );
}
