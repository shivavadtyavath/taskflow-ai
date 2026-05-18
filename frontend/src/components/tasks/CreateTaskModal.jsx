import { useState } from 'react';
import { Sparkles, Loader2, Wand2 } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Textarea, Select } from '../ui/Input';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function CreateTaskModal({ isOpen, onClose, projectId, members, defaultStatus, onCreated }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: defaultStatus || 'todo',
    assignedTo: '',
    dueDate: '',
    tags: '',
    estimatedHours: '',
  });
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);

  const handleAIGenerate = async () => {
    if (!form.title.trim() || form.title.length < 3) {
      toast.error('Enter a task title first (min 3 chars)');
      return;
    }
    setAiLoading(true);
    try {
      const { data } = await api.post('/ai/generate-task', { title: form.title });
      setAiSuggestion(data);
      setForm(prev => ({
        ...prev,
        description: data.description || prev.description,
        priority: data.priority || prev.priority,
        estimatedHours: data.estimatedHours?.toString() || prev.estimatedHours,
        tags: data.tags?.join(', ') || prev.tags,
      }));
      toast.success(data.aiAvailable ? '✨ AI filled in the details!' : 'Filled with smart defaults');
    } catch (err) {
      toast.error('AI generation failed');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        project: projectId,
        priority: form.priority,
        status: form.status,
        assignedTo: form.assignedTo || undefined,
        dueDate: form.dueDate || undefined,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        estimatedHours: form.estimatedHours ? parseFloat(form.estimatedHours) : undefined,
        aiGenerated: !!aiSuggestion?.aiAvailable,
      };
      const { data } = await api.post('/tasks', payload);
      toast.success('Task created!');
      onCreated(data.task);
      onClose();
      setForm({ title: '', description: '', priority: 'medium', status: defaultStatus || 'todo', assignedTo: '', dueDate: '', tags: '', estimatedHours: '' });
      setAiSuggestion(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Task" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title + AI button */}
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Task Title</label>
          <div className="flex gap-2">
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="What needs to be done?"
              required
              minLength={2}
              className="flex-1 px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
            />
            <button
              type="button"
              onClick={handleAIGenerate}
              disabled={aiLoading}
              className="px-3 py-2.5 rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-400 hover:bg-purple-600/30 transition-all flex items-center gap-1.5 text-xs font-medium disabled:opacity-50"
              title="AI: Auto-fill task details"
            >
              {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
              AI Fill
            </button>
          </div>
          {aiSuggestion && (
            <p className="text-xs text-purple-400 mt-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {aiSuggestion.aiAvailable ? 'AI-powered suggestions applied' : 'Smart defaults applied'}
            </p>
          )}
        </div>

        <Textarea
          label="Description"
          placeholder="Task details, acceptance criteria..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
        />

        <div className="grid grid-cols-2 gap-3">
          <Select label="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </Select>
          <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="in-review">In Review</option>
            <option value="done">Done</option>
          </Select>
        </div>

        <Select label="Assign To" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
          <option value="">Unassigned</option>
          {members.map(({ user }) => (
            <option key={user._id} value={user._id}>{user.name}</option>
          ))}
        </Select>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Due Date" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          <Input label="Est. Hours" type="number" min="0" step="0.5" placeholder="e.g. 4" value={form.estimatedHours} onChange={(e) => setForm({ ...form, estimatedHours: e.target.value })} />
        </div>

        <Input label="Tags (comma separated)" placeholder="frontend, bug, urgent" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />

        {aiSuggestion?.subtasks?.length > 0 && (
          <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
            <p className="text-xs font-medium text-purple-400 mb-2">AI Suggested Subtasks:</p>
            <ul className="space-y-1">
              {aiSuggestion.subtasks.map((s, i) => (
                <li key={i} className="text-xs text-slate-400 flex items-start gap-1.5">
                  <span className="text-purple-500 mt-0.5">•</span> {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button type="submit" loading={loading} className="flex-1">Create Task</Button>
        </div>
      </form>
    </Modal>
  );
}
