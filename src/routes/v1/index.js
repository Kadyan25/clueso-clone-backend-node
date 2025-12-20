const express = require('express');

const sessionRoutes = require('./session-routes');
const extensionRoutes = require('./extension-routes');
const authRoutes = require('./auth-routes');

const router = express.Router();

// Sessions directly under /v1
router.use('/', sessionRoutes);

// Extension events
router.use('/', extensionRoutes);

// Auth – keep as it is wired today
router.use('/', authRoutes);

module.exports = router;
