// src/routes/v1/extension-routes.js
const express = require('express');
const router = express.Router();
const db = require('../../models');


// POST /api/v1/extension-events
router.post('/extension-events', async (req, res) => {
  try {
    const { sessionId, url, steps } = req.body;

    if (!sessionId || !url) {
      return res.status(400).json({ message: 'sessionId and url are required' });
    }

    // Ensure session exists
    const session = await db.Session.findByPk(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const event = await db.ExtensionEvent.create({
      sessionId,
      url,
      steps: steps || [],
    });

    return res.status(201).json({
      message: 'Extension event stored (db)',
      event,
    });
  } catch (err) {
    console.error('Error handling extension event:', err);
    return res.status(500).json({ message: 'Failed to handle extension event' });
  }
});

// GET /api/v1/sessions/:id/extension-events
router.get('/sessions/:id/extension-events', async (req, res) => {
  try {
    const sessionId = Number(req.params.id);

    const session = await db.Session.findByPk(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const events = await db.ExtensionEvent.findAll({
      where: { sessionId },
      order: [['createdAt', 'DESC']],
    });

    return res.json(events);
  } catch (err) {
    console.error('Error fetching extension events:', err);
    return res.status(500).json({ message: 'Failed to fetch extension events' });
  }
});

module.exports = router;
