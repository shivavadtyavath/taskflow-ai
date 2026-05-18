const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { requireProjectMember, requireProjectAdmin } = require('../middleware/projectAccess');

// @GET /api/projects - Get all projects for current user
router.get('/', protect, async (req, res, next) => {
  try {
    const projects = await Project.find({
      'members.user': req.user._id
    })
      .populate('members.user', 'name email avatar')
      .sort({ updatedAt: -1 });

    // Add user's role to each project
    const projectsWithRole = projects.map(p => {
      const pObj = p.toObject();
      const member = p.members.find(m => m.user._id.toString() === req.user._id.toString());
      pObj.myRole = member ? member.role : 'member';
      return pObj;
    });

    res.json({ projects: projectsWithRole });
  } catch (err) {
    next(err);
  }
});

// @POST /api/projects - Create a new project
router.post('/', protect, [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Project name must be 2-100 characters'),
  body('description').optional().trim().isLength({ max: 500 }),
  body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid color format'),
  body('emoji').optional().isString()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { name, description, color, emoji, dueDate, tags } = req.body;

    const project = await Project.create({
      name,
      description,
      color: color || '#6366f1',
      emoji: emoji || '🚀',
      dueDate,
      tags,
      members: [{ user: req.user._id, role: 'admin' }]
    });

    project.addActivity(req.user._id, 'created project', name);
    await project.save();

    await project.populate('members.user', 'name email avatar');

    res.status(201).json({
      message: 'Project created successfully',
      project: { ...project.toObject(), myRole: 'admin' }
    });
  } catch (err) {
    next(err);
  }
});

// @GET /api/projects/:id - Get single project
router.get('/:id', protect, requireProjectMember, async (req, res, next) => {
  try {
    const project = req.project;
    await project.populate('activity.user', 'name avatar');

    const pObj = project.toObject();
    const member = project.members.find(m => m.user._id.toString() === req.user._id.toString());
    pObj.myRole = member ? member.role : 'member';

    res.json({ project: pObj });
  } catch (err) {
    next(err);
  }
});

// @PUT /api/projects/:id - Update project (admin only)
router.put('/:id', protect, requireProjectMember, requireProjectAdmin, [
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('status').optional().isIn(['active', 'on-hold', 'completed', 'archived'])
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { name, description, color, emoji, status, dueDate, tags } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (color !== undefined) updates.color = color;
    if (emoji !== undefined) updates.emoji = emoji;
    if (status !== undefined) updates.status = status;
    if (dueDate !== undefined) updates.dueDate = dueDate;
    if (tags !== undefined) updates.tags = tags;

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('members.user', 'name email avatar');

    res.json({ message: 'Project updated', project });
  } catch (err) {
    next(err);
  }
});

// @DELETE /api/projects/:id - Delete project (admin only)
router.delete('/:id', protect, requireProjectMember, requireProjectAdmin, async (req, res, next) => {
  try {
    await Task.deleteMany({ project: req.params.id });
    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// @POST /api/projects/:id/members - Add member (admin only)
router.post('/:id/members', protect, requireProjectMember, requireProjectAdmin, [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('role').optional().isIn(['admin', 'member'])
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { email, role } = req.body;
    const userToAdd = await User.findOne({ email });

    if (!userToAdd) {
      return res.status(404).json({ error: 'No user found with that email address.' });
    }

    const project = req.project;

    if (project.isMember(userToAdd._id)) {
      return res.status(409).json({ error: 'User is already a member of this project.' });
    }

    project.members.push({ user: userToAdd._id, role: role || 'member' });
    project.addActivity(req.user._id, 'added member', userToAdd.name);
    await project.save();
    await project.populate('members.user', 'name email avatar');

    res.json({ message: `${userToAdd.name} added to project`, project });
  } catch (err) {
    next(err);
  }
});

// @DELETE /api/projects/:id/members/:userId - Remove member (admin only)
router.delete('/:id/members/:userId', protect, requireProjectMember, requireProjectAdmin, async (req, res, next) => {
  try {
    const project = req.project;
    const { userId } = req.params;

    // Cannot remove yourself if you're the only admin
    const admins = project.members.filter(m => m.role === 'admin');
    const isTargetAdmin = project.members.find(m => m.user._id.toString() === userId && m.role === 'admin');

    if (isTargetAdmin && admins.length === 1) {
      return res.status(400).json({ error: 'Cannot remove the only admin from the project.' });
    }

    project.members = project.members.filter(m => m.user._id.toString() !== userId);
    project.addActivity(req.user._id, 'removed member', userId);
    await project.save();
    await project.populate('members.user', 'name email avatar');

    // Unassign tasks from removed user
    await Task.updateMany(
      { project: project._id, assignedTo: userId },
      { $set: { assignedTo: null } }
    );

    res.json({ message: 'Member removed', project });
  } catch (err) {
    next(err);
  }
});

// @PUT /api/projects/:id/members/:userId/role - Change member role (admin only)
router.put('/:id/members/:userId/role', protect, requireProjectMember, requireProjectAdmin, [
  body('role').isIn(['admin', 'member']).withMessage('Role must be admin or member')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const project = req.project;
    const { userId } = req.params;
    const { role } = req.body;

    const memberIndex = project.members.findIndex(m => m.user._id.toString() === userId);
    if (memberIndex === -1) {
      return res.status(404).json({ error: 'Member not found in project.' });
    }

    project.members[memberIndex].role = role;
    project.addActivity(req.user._id, `changed role to ${role}`, userId);
    await project.save();
    await project.populate('members.user', 'name email avatar');

    res.json({ message: 'Member role updated', project });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
