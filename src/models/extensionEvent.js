// src/models/extensionEvent.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const ExtensionEvent = sequelize.define('ExtensionEvent', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    sessionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    steps: {
      // Store JSON as string; keep it simple for MySQL
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '[]',
      get() {
        const raw = this.getDataValue('steps');
        try {
          return raw ? JSON.parse(raw) : [];
        } catch (e) {
          return [];
        }
      },
      set(value) {
        this.setDataValue('steps', JSON.stringify(value || []));
      },
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
    tableName: 'ExtensionEvents',
  });

  ExtensionEvent.associate = function(models) {
    ExtensionEvent.belongsTo(models.Session, {
      foreignKey: 'sessionId',
      as: 'session',
    });
  };

  return ExtensionEvent;
};
