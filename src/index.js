const express = require('express');
const http = require('http');
const cors = require('cors');
const db = require('./models');

const { ServerConfig, Logger } = require('./config');
const apiRoutes = require('./routes');

const app = express();
const httpServer = http.createServer(app);

// Enable CORS
app.use(cors());

// Static files (keep only if actually used)
// app.use('/uploads', express.static('uploads'));
// app.use('/recordings', express.static('recordings'));

// Body parsers
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true }));

// All API routes
app.use('/api', apiRoutes);

db.sequelize
  .sync({ alter: true })
  .then(() => {
    console.log('DB synced');

    httpServer.listen(ServerConfig.PORT, () => {
      console.log(`Successfully started server on PORT ${ServerConfig.PORT}`);
      Logger.info('Server started');
    });
  })
  .catch((err) => {
    console.error('DB sync error:', err);
  });
