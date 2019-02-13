'use strict';
module.exports = (sequelize, Sequelize) => {
  const user = sequelize.define('user', {
    userId: {
      type: Sequelize.BIGINT,
      primaryKey: true
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false
    },
    aliases: {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: false,
      defaultValue: []
    },
    idAliases: {
      type: Sequelize.ARRAY(Sequelize.BIGINT),
      allowNull: false,
      defaultValue: []
    },
    uses: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    showDiscrim: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    loggingActive: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    active: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {});
  user.associate = function (models) {
    // associations can be defined here
  };
  return user;
};