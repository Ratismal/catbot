'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      userId: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        allowNull: false
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
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.createTable('user_lines', {
      userId: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        allowNull: false,
        references: { model: 'users', key: 'userId' }
      },
      messageId: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        allowNull: false
      },
      rawMessage: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      formattedLines: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        allowNull: false,
        defaultValue: []
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('user_lines');
    await queryInterface.dropTable('users');
  }
};