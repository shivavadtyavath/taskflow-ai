import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Edit3, Save } from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../lib/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Textarea } from '../components/ui/Input';
import Avatar from '../components/ui/Avatar';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', bio: user?.bio || '' });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data } = await api.put('/auth/profile', form);
      updateUser(data.user);
      setEditing(false);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-8">Profile</h1>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6"
      >
        <div className="flex items-center gap-5 mb-6">
          <Avatar user={user} size="xl" />
          <div>
            <h2 className="text-xl font-semibold text-white">{user?.name}</h2>
            <p className="text-slate-400 text-sm">{user?.email}</p>
            {user?.bio && <p className="text-slate-500 text-sm mt-1">{user.bio}</p>}
          </div>
        </div>

        {editing ? (
          <div className="space-y-4">
            <Input
              label="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              minLength={2}
            />
            <Textarea
              label="Bio"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Tell your team about yourself..."
              rows={3}
              maxLength={200}
            />
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setEditing(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleSave} loading={loading} className="flex-1">
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="secondary" onClick={() => setEditing(true)}>
            <Edit3 className="w-4 h-4" />
            Edit Profile
          </Button>
        )}
      </motion.div>

      <div className="mt-4 bg-[#1a1a2e] border border-white/10 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Account Info</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-3 text-slate-400">
            <Mail className="w-4 h-4" />
            <span>{user?.email}</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <User className="w-4 h-4" />
            <span>Member since {new Date(user?.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
