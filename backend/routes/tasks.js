const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

// Helper: check project membership
const checkProjectAccess = async (projectId, userId, requireAdmin = false) => {
  const project = await Project.findById(projectId);
  if (!project) return { error: 'Project not found', status: 404 };
  if (!project.isMember(userId)) return { error: 'Access denied', status: 403 };
  if (requireAdmin && !project.isAdmin(userId)) return { error: 'Admin required', status: 403 };
  return { project };
};

// @GET /api/tasks?projectId=xxx - Get tasks for a project
router.get('/', protect, async (req, res, next) => {
  try {
    const { projectId, status, priority, assignedTo, search, sortBy, page = 1, limit = 50 } = req.query;

    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    const { error, status: errStatus, project } = await checkProjectAccess(projectId, req.user._id);
    if (error) return res.status(errStatus).json({ error });

    // Build filter
    const filter = { project: projectId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo === 'me' ? req.user._id : assignedTo;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Sort
    let sort = { position: 1, createdAt: -1 };
    if (sortBy === 'dueDate') sort = { dueDate: 1 };
    if (sortBy === 'priority') sort = { priority: -1 };
    if (sortBy === 'createdAt') sort = { createdAt: -1 };

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('comments.user', 'name avatar')
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Task.countDocuments(filter);

    res.json({
      tasks,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    next(err);
  }
});

// @POST /api/tasks - Create task
router.post('/', protect, [
  body('title').trim().isLength({ min: 2, max: 200 }).withMessage('Title must be 2-200 characters'),
  body('project').isMongoId().withMessage('Valid project ID required'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('status').optional().isIn(['todo', 'in-progress', 'in-review', 'done']),
  body('estimatedHours').optional().isNumeric()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { title, description, project: projectId, assignedTo, priority, status, dueDate, tags, estimatedHours, aiGenerated } = req.body;

    const { error, status: errStatus, project } = await checkProjectAccess(projectId, req.user._id);
    if (error) return res.status(errStatus).json({ error });

    // Validate assignedTo is a project member
    if (assignedTo && !project.isMember(assignedTo)) {
      return res.status(400).json({ error: 'Assigned user is not a member of this project.' });
    }

    // Get position (add to end)
    const lastTask = await Task.findOne({ project: projectId }).sort({ position: -1 });
    const position = lastTask ? lastTask.position + 1 : 0;

    const task = await Task.create({
      title,
      description,
      project: projectId,
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
      priority: priority || 'medium',
      status: status || 'todo',
      dueDate: dueDate || null,
      tags: tags || [],
      estimatedHours: estimatedHours || null,
      aiGenerated: aiGenerated || false,
      position
    });

    // Update project task count
    await Project.findByIdAndUpdate(projectId, { $inc: { taskCount: 1 } });

    await task.populate('assignedTo', 'name email avatar');
    await task.populate('createdBy', 'name email avatar');

    res.status(201).json({ message: 'Task created', task });
  } catch (err) {
    next(err);
  }
});

// @GET /api/tasks/:id - Get single task
router.get('/:id', protect, async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('comments.user', 'name avatar')
      .populate('project', 'name color emoji');

    if (!task) return res.status(404).json({ error: 'Task not found' });

    const { error, status } = await checkProjectAccess(task.project._id, req.user._id);
    if (error) return res.status(status).json({ error });

    res.json({ task });
  } catch (err) {
    next(err);
  }
});

// @PUT /api/tasks/:id - Update task
router.put('/:id', protect, [
  body('title').optional().trim().isLength({ min: 2, max: 200 }),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('status').optional().isIn(['todo', 'in-progress', 'in-review', 'done'])
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const { error, status: errStatus, project } = await checkProjectAccess(task.project, req.user._id);
    if (error) return res.status(errStatus).json({ error });

    // Members can only update tasks assigned to them (unless admin)
    const isAdmin = project.isAdmin(req.user._id);
    const isAssigned = task.assignedTo && task.assignedTo.toString() === req.user._id.toString();
    const isCreator = task.createdBy.toString() === req.user._id.toString();

    if (!isAdmin && !isAssigned && !isCreator) {
      return res.status(403).json({ error: 'You can only update tasks assigned to you.' });
    }

    const allowedUpdates = ['title', 'description', 'assignedTo', 'priority', 'status', 'dueDate', 'tags', 'estimatedHours', 'actualHours', 'position'];
    const updates = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    // Track status change for project stats
    const oldStatus = task.status;
    const newStatus = updates.status;

    Object.assign(task, updates);
    await task.save();

    // Update project completed count
    if (newStatus && oldStatus !== newStatus) {
      if (newStatus === 'done') {
        await Project.findByIdAndUpdate(task.project, { $inc: { completedTaskCount: 1 } });
      } else if (oldStatus === 'done') {
        await Project.findByIdAndUpdate(task.project, { $inc: { completedTaskCount: -1 } });
      }
    }

    await task.populate('assignedTo', 'name email avatar');
    await task.populate('createdBy', 'name email avatar');

    res.json({ message: 'Task updated', task });
  } catch (err) {
    next(err);
  }
});

// @DELETE /api/tasks/:id - Delete task (admin or creator)
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const { error, status: errStatus, project } = await checkProjectAccess(task.project, req.user._id);
    if (error) return res.status(errStatus).json({ error });

    const isAdmin = project.isAdmin(req.user._id);
    const isCreator = task.createdBy.toString() === req.user._id.toString();

    if (!isAdmin && !isCreator) {
      return res.status(403).json({ error: 'Only admins or task creators can delete tasks.' });
    }

    await Task.findByIdAndDelete(req.params.id);

    // Update project counts
    const updates = { $inc: { taskCount: -1 } };
    if (task.status === 'done') updates.$inc.completedTaskCount = -1;
    await Project.findByIdAndUpdate(task.project, updates);

    res.json({ message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
});

// @POST /api/tasks/:id/comments - Add comment
router.post('/:id/comments', protect, [
  body('text').trim().isLength({ min: 1, max: 1000 }).withMessage('Comment must be 1-1000 characters')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const { error, status } = await checkProjectAccess(task.project, req.user._id);
    if (error) return res.status(status).json({ error });

    task.comments.push({ user: req.user._id, text: req.body.text });
    await task.save();
    await task.populate('comments.user', 'name avatar');

    res.status(201).json({ message: 'Comment added', comments: task.comments });
  } catch (err) {
    next(err);
  }
});

// @DELETE /api/tasks/:id/comments/:commentId - Delete comment
router.delete('/:id/comments/:commentId', protect, async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const { error, status: errStatus, project } = await checkProjectAccess(task.project, req.user._id);
    if (error) return res.status(errStatus).json({ error });

    const comment = task.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    const isAdmin = project.isAdmin(req.user._id);
    const isCommentOwner = comment.user.toString() === req.user._id.toString();

    if (!isAdmin && !isCommentOwner) {
      return res.status(403).json({ error: 'Cannot delete this comment.' });
    }

    comment.deleteOne();
    await task.save();

    res.json({ message: 'Comment deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
