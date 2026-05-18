const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

// @GET /api/dashboard - Get dashboard stats for current user
router.get('/', protect, async (req, res, next) => {
  try {
    // Get all projects user is a member of
    const projects = await Project.find({ 'members.user': req.user._id });
    const projectIds = projects.map(p => p._id);

    // All tasks in user's projects
    const allTasks = await Task.find({ project: { $in: projectIds } })
      .populate('assignedTo', 'name email avatar')
      .populate('project', 'name color emoji');

    // Tasks assigned to current user
    const myTasks = allTasks.filter(t =>
      t.assignedTo && t.assignedTo._id.toString() === req.user._id.toString()
    );

    const now = new Date();

    // Status breakdown
    const statusBreakdown = {
      todo: allTasks.filter(t => t.status === 'todo').length,
      'in-progress': allTasks.filter(t => t.status === 'in-progress').length,
      'in-review': allTasks.filter(t => t.status === 'in-review').length,
      done: allTasks.filter(t => t.status === 'done').length
    };

    // Priority breakdown
    const priorityBreakdown = {
      critical: allTasks.filter(t => t.priority === 'critical').length,
      high: allTasks.filter(t => t.priority === 'high').length,
      medium: allTasks.filter(t => t.priority === 'medium').length,
      low: allTasks.filter(t => t.priority === 'low').length
    };

    // Overdue tasks
    const overdueTasks = allTasks.filter(t =>
      t.dueDate && t.status !== 'done' && new Date(t.dueDate) < now
    );

    // Due soon (next 3 days)
    const dueSoon = allTasks.filter(t => {
      if (!t.dueDate || t.status === 'done') return false;
      const daysUntil = (new Date(t.dueDate) - now) / (1000 * 60 * 60 * 24);
      return daysUntil >= 0 && daysUntil <= 3;
    });

    // Tasks per user (for admin view)
    const tasksByUser = {};
    allTasks.forEach(task => {
      if (task.assignedTo) {
        const userId = task.assignedTo._id.toString();
        if (!tasksByUser[userId]) {
          tasksByUser[userId] = {
            user: task.assignedTo,
            total: 0,
            done: 0,
            inProgress: 0,
            overdue: 0
          };
        }
        tasksByUser[userId].total++;
        if (task.status === 'done') tasksByUser[userId].done++;
        if (task.status === 'in-progress') tasksByUser[userId].inProgress++;
        if (task.dueDate && task.status !== 'done' && new Date(task.dueDate) < now) {
          tasksByUser[userId].overdue++;
        }
      }
    });

    // Recent activity across projects
    const recentActivity = [];
    projects.forEach(p => {
      if (p.activity) {
        p.activity.slice(0, 5).forEach(a => {
          recentActivity.push({ ...a.toObject(), projectName: p.name, projectColor: p.color });
        });
      }
    });
    recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Completion rate
    const completionRate = allTasks.length > 0
      ? Math.round((statusBreakdown.done / allTasks.length) * 100)
      : 0;

    // Weekly task completion (last 7 days)
    const weeklyCompletion = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const completed = allTasks.filter(t =>
        t.completedAt &&
        new Date(t.completedAt) >= dayStart &&
        new Date(t.completedAt) <= dayEnd
      ).length;

      weeklyCompletion.push({
        date: dayStart.toISOString().split('T')[0],
        day: dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
        completed
      });
    }

    res.json({
      stats: {
        totalProjects: projects.length,
        totalTasks: allTasks.length,
        myTasks: myTasks.length,
        completionRate,
        overdueTasks: overdueTasks.length,
        dueSoon: dueSoon.length
      },
      statusBreakdown,
      priorityBreakdown,
      tasksByUser: Object.values(tasksByUser),
      overdueTasks: overdueTasks.slice(0, 10),
      dueSoonTasks: dueSoon.slice(0, 5),
      weeklyCompletion,
      recentActivity: recentActivity.slice(0, 10),
      projects: projects.map(p => ({
        _id: p._id,
        name: p.name,
        color: p.color,
        emoji: p.emoji,
        progress: p.progress,
        taskCount: p.taskCount,
        status: p.status
      }))
    });
  } catch (err) {
    next(err);
  }
});

// @GET /api/dashboard/project/:projectId - Project-specific dashboard
router.get('/project/:projectId', protect, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .populate('members.user', 'name email avatar');

    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (!project.isMember(req.user._id)) return res.status(403).json({ error: 'Access denied' });

    const tasks = await Task.find({ project: req.params.projectId })
      .populate('assignedTo', 'name email avatar');

    const now = new Date();

    const stats = {
      total: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      inReview: tasks.filter(t => t.status === 'in-review').length,
      done: tasks.filter(t => t.status === 'done').length,
      overdue: tasks.filter(t => t.dueDate && t.status !== 'done' && new Date(t.dueDate) < now).length,
      progress: project.progress
    };

    res.json({ stats, project });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
