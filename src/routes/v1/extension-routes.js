// src/routes/v1/extension-routes.js
const express = require('express');

const router = express.Router();

// Temporary in-memory store just to prove the flow end-to-end.
// Later you can move this to a Sequelize model.
const extensionEvents = [];

// POST /api/v1/extension-events
router.post('/extension-events', (req, res) => {
  try {
    const { sessionId, url, steps } = req.body;

    if (!sessionId || !url) {
      return res.status(400).json({ message: 'sessionId and url are required' });
    }

    const event = {
      id: extensionEvents.length + 1,
      sessionId,
      url,
      steps: steps || [],
      createdAt: new Date().toISOString()
    };

    extensionEvents.push(event);

    return res.status(201).json({
      message: 'Extension event stored (in-memory)',
      event
    });
  } catch (err) {
    console.error('Error handling extension event:', err);
    return res.status(500).json({ message: 'Failed to handle extension event' });
  }
});

module.exports = router;
