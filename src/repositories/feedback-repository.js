const db = require('../models');

class FeedbackRepository {
  async createFeedback(sessionId, text) {
    return db.Feedback.create({ sessionId, text });
  }

  async findFeedbacksBySessionId(sessionId) {
    return db.Feedback.findAll({
      where: { sessionId },
      order: [['createdAt', 'DESC']],
    });
  }
}

module.exports = new FeedbackRepository();
