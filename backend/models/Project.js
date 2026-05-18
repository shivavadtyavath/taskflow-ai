const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'member'],
    default: 'member'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const activitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  action: {
    type: String,
    required: true
  },
  target: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    minlength: [2, 'Project name must be at least 2 characters'],
    maxlength: [100, 'Project name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: ''
  },
  color: {
    type: String,
    default: '#6366f1'
  },
  emoji: {
    type: String,
    default: '🚀'
  },
  status: {
    type: String,
    enum: ['active', 'on-hold', 'completed', 'archived'],
    default: 'active'
  },
  members: [memberSchema],
  activity: [activitySchema],
  taskCount: {
    type: Number,
    default: 0
  },
  completedTaskCount: {
    type: Number,
    default: 0
  },
  dueDate: {
    type: Date
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Virtual for progress percentage
projectSchema.virtual('progress').get(function () {
  if (this.taskCount === 0) return 0;
  return Math.round((this.completedTaskCount / this.taskCount) * 100);
});

// Get admin members
projectSchema.methods.getAdmins = function () {
  return this.members.filter(m => m.role === 'admin').map(m => m.user);
};

// Check if user is member
projectSchema.methods.isMember = function (userId) {
  return this.members.some(m => {
    const memberId = m.user._id ? m.user._id.toString() : m.user.toString();
    return memberId === userId.toString();
  });
};

// Check if user is admin
projectSchema.methods.isAdmin = function (userId) {
  return this.members.some(m => {
    const memberId = m.user._id ? m.user._id.toString() : m.user.toString();
    return memberId === userId.toString() && m.role === 'admin';
  });
};

// Add activity log
projectSchema.methods.addActivity = function (userId, action, target) {
  this.activity.unshift({ user: userId, action, target });
  // Keep only last 50 activities
  if (this.activity.length > 50) {
    this.activity = this.activity.slice(0, 50);
  }
};

projectSchema.set('toJSON', { virtuals: true });
projectSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Project', projectSchema);
