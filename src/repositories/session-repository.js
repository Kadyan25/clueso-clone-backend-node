const db = require('../models');
console.log('Models available in db:', Object.keys(db));

class SessionRepository {
  async createSession(data) {
    return db.Session.create(data);
  }

  async createSessionFromExtension({ userId, url }) {
    const timestamp = new Date().toLocaleString('en-US', {
      dateStyle: 'short',
      timeStyle: 'short',
    });

    const name = `Recording – ${timestamp}`;
    const description = `Recorded from ${url}`;

    return db.Session.create({
      userId,
      name,
      description,
      status: 'PENDING',
      scriptText: null,
      audioFileName: null,
    });
  }

  async findAllSessions() {
    return db.Session.findAll({
      order: [['createdAt', 'DESC']],
    });
  }

  async findSessionById(id) {
    return db.Session.findByPk(id);
  }

  async updateSession(id, updates) {
    const session = await db.Session.findByPk(id);
    if (!session) return null;
    return session.update(updates);
  }
}

module.exports = new SessionRepository();
