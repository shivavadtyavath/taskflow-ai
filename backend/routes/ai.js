const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const Groq = require('groq-sdk');

// Initialize Groq client
const getGroqClient = () => {
  const key = process.env.GROQ_API_KEY;
  if (!key || key === 'gsk_paste_your_groq_key_here') return null;
  return new Groq({ apiKey: key });
};

// @POST /api/ai/generate-task - AI generates task description
router.post('/generate-task', protect, [
  body('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('projectContext').optional().isString()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { title, projectContext } = req.body;
    const groq = getGroqClient();

    if (!groq) {
      // Fallback: generate a basic description without AI
      return res.json({
        description: `Complete the task: "${title}". Define acceptance criteria, identify dependencies, and estimate effort required.`,
        tags: ['task'],
        estimatedHours: 2,
        priority: 'medium',
        aiAvailable: false
      });
    }

    const prompt = `You are a project management assistant. Generate a concise, actionable task description for a software team.

Task Title: "${title}"
${projectContext ? `Project Context: ${projectContext}` : ''}

Respond with a JSON object containing:
- description: A clear 2-3 sentence task description with acceptance criteria
- tags: Array of 2-4 relevant tags (lowercase, no spaces)
- estimatedHours: Realistic hour estimate (number)
- priority: Suggested priority (low/medium/high/critical)
- subtasks: Array of 3-5 subtask strings

Keep it practical and concise.`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-8b-8192',
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: 'json_object' }
    });

    const content = completion.choices[0]?.message?.content;
    let parsed;

    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {
        description: content,
        tags: [],
        estimatedHours: 2,
        priority: 'medium',
        subtasks: []
      };
    }

    res.json({ ...parsed, aiAvailable: true });
  } catch (err) {
    // Graceful fallback if AI fails
    console.error('AI generation error:', err.message, err.status || '');
    res.json({
      description: `Complete the task: "${req.body.title}". Define clear acceptance criteria and identify any blockers.`,
      tags: ['task'],
      estimatedHours: 2,
      priority: 'medium',
      subtasks: [],
      aiAvailable: false,
      error: 'AI temporarily unavailable'
    });
  }
});

// @POST /api/ai/risk-analysis - Analyze task risk
router.post('/risk-analysis', protect, [
  body('tasks').isArray().withMessage('Tasks array required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { tasks } = req.body;
    const groq = getGroqClient();

    if (!groq || tasks.length === 0) {
      // Fallback: calculate risk based on simple heuristics
      const analyzed = tasks.map(task => {
        let riskScore = 0;
        const now = new Date();

        if (task.dueDate) {
          const daysUntil = (new Date(task.dueDate) - now) / (1000 * 60 * 60 * 24);
          if (daysUntil < 0) riskScore += 40;
          else if (daysUntil < 1) riskScore += 30;
          else if (daysUntil < 3) riskScore += 20;
        }

        if (task.priority === 'critical') riskScore += 30;
        else if (task.priority === 'high') riskScore += 20;

        if (!task.assignedTo) riskScore += 20;
        if (task.status === 'todo' && task.dueDate) riskScore += 10;

        return { taskId: task._id, riskScore: Math.min(riskScore, 100) };
      });

      return res.json({ analysis: analyzed, aiAvailable: false });
    }

    const taskSummary = tasks.slice(0, 10).map(t => ({
      id: t._id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
      hasAssignee: !!t.assignedTo,
      daysUntilDue: t.dueDate ? Math.ceil((new Date(t.dueDate) - new Date()) / (1000 * 60 * 60 * 24)) : null
    }));

    const prompt = `Analyze these tasks and provide a risk score (0-100) for each. Higher score = higher risk.

Tasks: ${JSON.stringify(taskSummary)}

Consider: overdue status, priority, missing assignee, tight deadlines.

Respond with JSON: { "analysis": [{ "taskId": "id", "riskScore": number, "reason": "brief reason" }] }`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-8b-8192',
      temperature: 0.3,
      max_tokens: 600,
      response_format: { type: 'json_object' }
    });

    const content = completion.choices[0]?.message?.content;
    const parsed = JSON.parse(content);

    res.json({ ...parsed, aiAvailable: true });
  } catch (err) {
    console.error('Risk analysis error:', err.message);
    res.json({ analysis: [], aiAvailable: false, error: 'AI temporarily unavailable' });
  }
});

// @POST /api/ai/project-summary - Generate project summary
router.post('/project-summary', protect, [
  body('projectName').trim().isLength({ min: 1 }),
  body('stats').isObject()
], async (req, res, next) => {
  try {
    const { projectName, stats } = req.body;
    const groq = getGroqClient();

    if (!groq) {
      return res.json({
        summary: `Project "${projectName}" has ${stats.total || 0} tasks with ${stats.done || 0} completed (${stats.progress || 0}% progress). ${stats.overdue || 0} tasks are overdue.`,
        aiAvailable: false
      });
    }

    const prompt = `Generate a brief, insightful 2-3 sentence project health summary for a project manager.

Project: "${projectName}"
Stats: ${JSON.stringify(stats)}

Be direct, highlight risks, and suggest one actionable recommendation. Keep it under 100 words.`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-8b-8192',
      temperature: 0.6,
      max_tokens: 200
    });

    const summary = completion.choices[0]?.message?.content?.trim();
    res.json({ summary, aiAvailable: true });
  } catch (err) {
    console.error('Summary error:', err.message);
    res.json({
      summary: `Project has ${req.body.stats?.total || 0} tasks with ${req.body.stats?.progress || 0}% completion rate.`,
      aiAvailable: false
    });
  }
});

module.exports = router;
