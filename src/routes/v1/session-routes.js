// src/routes/v1/session-routes.js
const express = require('express');
const sessionRepository = require('../../repositories/session-repository');
const feedbackRepository = require('../../repositories/feedback-repository');

const router = express.Router();


// POST /v1/sessions
router.post('/sessions', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const newSession = await sessionRepository.createSession({
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
// router.get('/sessions', (req, res) => {
//   return res.json(sessions);
// });
router.get('/sessions', async (req, res) => {
  try {
    const sessions = await sessionRepository.findAllSessions();
    return res.json(sessions);
  } catch (err) {
    console.error('Error fetching sessions:', err);
    return res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});


// GET /v1/sessions/:id
router.get('/sessions/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const session = await sessionRepository.findSessionById(id);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    return res.json(session);
  } catch (err) {
    console.error('Error fetching session by id:', err);
    return res.status(500).json({ message: 'Failed to fetch session' });
  }
});



// POST /v1/sessions/:id/process
router.post('/sessions/:id/process', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const session = await sessionRepository.findSessionById(id);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // mark as processing
    await sessionRepository.updateSession(id, { status: 'PROCESSING' });

    // mock AI work
    const fakeScript = `This is a demo script for session "${session.name}".`;
    const fakeAudioFileName = `demo_audio_${session.id}.mp3`;

    const updatedSession = await sessionRepository.updateSession(id, {
      status: 'READY',
      scriptText: fakeScript,
      audioFileName: fakeAudioFileName,
    });

    return res.json({
      message: 'Session processed successfully (mock)',
      session: updatedSession,
    });
  } catch (err) {
    console.error('Error processing session:', err);
    // best-effort mark as FAILED if we can
    try {
      const id = Number(req.params.id);
      await sessionRepository.updateSession(id, { status: 'FAILED' });
    } catch (_) {}
    return res.status(500).json({ message: 'Failed to process session' });
  }
});

// POST /v1/sessions/:id/feedback
router.post('/sessions/:id/feedback', async (req, res) => {
  try {
    const sessionId = Number(req.params.id);
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: 'text is required' });
    }

    const session = await sessionRepository.findSessionById(sessionId);
    if (!session) {
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
router.get('/sessions/:id/feedback', async (req, res) => {
  try {
    const sessionId = Number(req.params.id);

    const session = await sessionRepository.findSessionById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const feedbacks = await feedbackRepository.findFeedbacksBySessionId(sessionId);
    return res.json(feedbacks);
  } catch (err) {
    console.error('Error fetching feedbacks:', err);
    return res.status(500).json({ message: 'Failed to fetch feedbacks' });
  }
});


module.exports = router;
