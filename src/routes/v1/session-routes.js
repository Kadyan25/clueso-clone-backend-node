const express = require('express');
const axios = require('axios'); // added for Python call

const sessionRepository = require('../../repositories/session-repository');
const feedbackRepository = require('../../repositories/feedback-repository');
const { requireAuth } = require('../../middlewares');

const router = express.Router();

const PYTHON_AI_URL = process.env.PYTHON_AI_URL || 'http://localhost:8001';

// POST /v1/sessions
router.post('/sessions', requireAuth, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const newSession = await sessionRepository.createSession({
      userId: req.user.id,
      name,
      status: 'PENDING',
      scriptText: null,
      audioFileName: null,
    });

    return res.status(201).json(newSession);
  } catch (err) {
    console.error('Error creating session:', err);
    return res.status(500).json({ message: 'Failed to create session' });
  }
});

// GET /v1/sessions
router.get('/sessions', requireAuth, async (req, res) => {
  try {
    const sessions = await sessionRepository.findAllSessions();
    const userSessions = sessions.filter((s) => s.userId === req.user.id);
    return res.json(userSessions);
  } catch (err) {
    console.error('Error fetching sessions:', err);
    return res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// GET /v1/sessions/:id
router.get('/sessions/:id', requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const session = await sessionRepository.findSessionById(id);

    if (!session || session.userId !== req.user.id) {
      return res.status(404).json({ message: 'Session not found' });
    }

    return res.json(session);
  } catch (err) {
    console.error('Error fetching session by id:', err);
    return res.status(500).json({ message: 'Failed to fetch session' });
  }
});

// POST /v1/sessions/:id/process
router.post('/sessions/:id/process', requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const session = await sessionRepository.findSessionById(id);

    if (!session || session.userId !== req.user.id) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // mark as processing
    await sessionRepository.updateSession(id, { status: 'PROCESSING' });

    // call Python AI stub
    const response = await axios.post(`${PYTHON_AI_URL}/simple-generate`, {
      sessionId: session.id,
      name: session.name,
    });

    const { script, processed_audio_filename } = response.data;

    const updatedSession = await sessionRepository.updateSession(id, {
      status: 'READY',
      scriptText: script,
      audioFileName: processed_audio_filename,
    });

    return res.json({
      message: 'Session processed successfully with Python AI',
      session: updatedSession,
    });
  } catch (err) {
    console.error('Error processing session:', err);
    try {
      const id = Number(req.params.id);
      await sessionRepository.updateSession(id, { status: 'FAILED' });
    } catch (_) {}
    return res
      .status(500)
      .json({ message: 'Failed to process session with AI service' });
  }
});

// POST /v1/sessions/:id/feedback
router.post('/sessions/:id/feedback', requireAuth, async (req, res) => {
  try {
    const sessionId = Number(req.params.id);
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: 'text is required' });
    }

    const session = await sessionRepository.findSessionById(sessionId);
    if (!session || session.userId !== req.user.id) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const feedback = await feedbackRepository.createFeedback(sessionId, text);
    return res.status(201).json(feedback);
  } catch (err) {
    console.error('Error creating feedback:', err);
    return res.status(500).json({ message: 'Failed to create feedback' });
  }
});

// GET /v1/sessions/:id/feedback
router.get('/sessions/:id/feedback', requireAuth, async (req, res) => {
  try {
    const sessionId = Number(req.params.id);

    const session = await sessionRepository.findSessionById(sessionId);
    if (!session || session.userId !== req.user.id) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const feedbacks = await feedbackRepository.findFeedbacksBySessionId(
      sessionId,
    );
    return res.json(feedbacks);
  } catch (err) {
    console.error('Error fetching feedbacks:', err);
    return res.status(500).json({ message: 'Failed to fetch feedbacks' });
  }
});

module.exports = router;