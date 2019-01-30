'use strict';
module.exports = (sequelize, Sequelize) => {
  const user_line = sequelize.define('user_line', {
    userId: {
      type: Sequelize.BIGINT,
      primaryKey: true
    },
    messageId: {
      type: Sequelize.BIGINT,
      primaryKey: true
    },
    rawMessage: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    formattedLines: {
      type: Sequelize.ARRAY(Sequelize.TEXT),
      allowNull: false,
      defaultValue: []
    }
  }, {});
  user_line.associate = function (models) {
    user_line.belongsTo(models.user, { foreignKey: 'userId', sourceKey: 'userId' });
    models.user.hasMany(user_line, { foreignKey: 'userId', targetKey: 'userId' })

    // associations can be defined here
  };
  return user_line;
};