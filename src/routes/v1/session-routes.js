// src/routes/v1/session-routes.js
const express = require('express');

const router = express.Router();

// temporary in-memory store
let sessions = [];
let sessionCounter = 1;

function findSessionById(id) {
  return sessions.find((s) => s.id === id);
}


// POST /v1/sessions
router.post('/sessions', (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'name is required' });
  }

  const newSession = {
    id: sessionCounter++,
    name,
    status: 'PENDING',
    scriptText: null,
    audioFileName: null,
    createdAt: new Date().toISOString(),
  };

  sessions.push(newSession);
  return res.status(201).json(newSession);
});

// GET /v1/sessions
router.get('/sessions', (req, res) => {
  return res.json(sessions);
});

// GET /v1/sessions/:id
router.get('/sessions/:id', (req, res) => {
  const id = Number(req.params.id);
  const session = sessions.find((s) => s.id === id);

  if (!session) {
    return res.status(404).json({ message: 'Session not found' });
  }

  return res.json(session);
});

// POST /v1/sessions/:id/process
router.post('/sessions/:id/process', async (req, res) => {
  const id = Number(req.params.id);
  const session = findSessionById(id);

  if (!session) {
    return res.status(404).json({ message: 'Session not found' });
  }

  // mark as processing
  session.status = 'PROCESSING';

  try {
    // TODO: later call Python AI here
    // For now, fake AI result
    const fakeScript = `This is a demo script for session "${session.name}".`;
    const fakeAudioFileName = `demo_audio_${session.id}.mp3`;

    // update session
    session.status = 'READY';
    session.scriptText = fakeScript;
    session.audioFileName = fakeAudioFileName;

    return res.json({
      message: 'Session processed successfully (mock)',
      session,
    });
  } catch (err) {
    console.error(err);
    session.status = 'FAILED';
    return res.status(500).json({ message: 'Failed to process session' });
  }
});


module.exports = router;
