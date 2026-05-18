const Project = require('../models/Project');

// Attach project to req and check membership
const requireProjectMember = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id || req.body.project;
    const project = await Project.findById(projectId).populate('members.user', 'name email avatar');

    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    if (!project.isMember(req.user._id)) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this project.' });
    }

    req.project = project;
    next();
  } catch (err) {
    next(err);
  }
};

// Check if user is admin of the project
const requireProjectAdmin = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id;
    const project = req.project || await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    if (!project.isAdmin(req.user._id)) {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    req.project = project;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { requireProjectMember, requireProjectAdmin };
