// src/models/session.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const Session = sequelize.define('Session', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
      // NEW: owner of this session
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true, // keep nullable so old rows still work
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'PENDING',
    },
    scriptText: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    audioFileName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'Sessions',
  });

Session.associate = function (models) {
  Session.hasMany(models.Feedback, {
    foreignKey: 'sessionId',
    as: 'feedbacks',
  });

  Session.hasMany(models.ExtensionEvent, {
    foreignKey: 'sessionId',
    as: 'extensionEvents',
  });
};



  return Session;
};
