/**
 * Seed script - creates demo user and sample data
 * Run: node scripts/seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Create demo user
  let demoUser = await User.findOne({ email: 'demo@taskflow.ai' });
  if (!demoUser) {
    demoUser = await User.create({
      name: 'Demo User',
      email: 'demo@taskflow.ai',
      password: 'demo123',
      bio: 'Demo account for TaskFlow AI'
    });
    console.log('✅ Demo user created: demo@taskflow.ai / demo123');
  } else {
    console.log('ℹ️  Demo user already exists');
  }

  // Create sample project
  let project = await Project.findOne({ name: 'Website Redesign', 'members.user': demoUser._id });
  if (!project) {
    project = await Project.create({
      name: 'Website Redesign',
      description: 'Complete overhaul of the company website with modern design',
      color: '#6366f1',
      emoji: '🎨',
      members: [{ user: demoUser._id, role: 'admin' }],
      taskCount: 0,
      completedTaskCount: 0
    });

    // Create sample tasks
    const tasks = [
      { title: 'Design new homepage mockup', description: 'Create Figma mockups for the new homepage', priority: 'high', status: 'done', dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      { title: 'Implement responsive navigation', description: 'Build mobile-first navigation component', priority: 'high', status: 'in-progress', dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) },
      { title: 'Set up CI/CD pipeline', description: 'Configure GitHub Actions for automated deployment', priority: 'medium', status: 'todo', dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) },
      { title: 'Write unit tests for API', description: 'Achieve 80% test coverage on backend routes', priority: 'medium', status: 'todo' },
      { title: 'Performance optimization', description: 'Improve Lighthouse score to 90+', priority: 'low', status: 'todo', dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
    ];

    let completedCount = 0;
    for (let i = 0; i < tasks.length; i++) {
      await Task.create({
        ...tasks[i],
        project: project._id,
        assignedTo: demoUser._id,
        createdBy: demoUser._id,
        position: i,
        tags: ['web', 'frontend'],
      });
      if (tasks[i].status === 'done') completedCount++;
    }

    await Project.findByIdAndUpdate(project._id, {
      taskCount: tasks.length,
      completedTaskCount: completedCount
    });

    console.log(`✅ Sample project created with ${tasks.length} tasks`);
  }

  console.log('\n🚀 Seed complete!');
  console.log('Login with: demo@taskflow.ai / demo123');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
