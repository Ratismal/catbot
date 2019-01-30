'use strict';

const fs = require('fs');
const path = require('path');
const sanitize = require('../src/utils/sanitize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const files = fs.readdirSync(path.join(__dirname, '..', 'jsons'));
    let userInserts = [];
    let lineInserts = [];
    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = require('../jsons/' + file);
        let idM = file.match(/(\d+).json/);
        if (!idM || !idM[1]) continue;
        let id = idM[1];
        userInserts.push({
          userId: id,
          name: content.name,
          createdAt: Sequelize.fn('now'),
          updatedAt: Sequelize.fn('now')
        });
        let mid = 1;
        for (const line of content.lines) {
          let formattedLines = sanitize(line);
          if (formattedLines.length > 0) {
            // console.log(formattedLines);
            lineInserts.push({
              userId: id,
              messageId: mid++,
              rawMessage: line,
              formattedLines,
              createdAt: Sequelize.fn('now'),
              updatedAt: Sequelize.fn('now')
            });
          }
        }
      }
    }

    // try {
    await queryInterface.bulkInsert('users', userInserts);
    await queryInterface.bulkInsert('user_lines', lineInserts);
    // } catch (err) {
    //   console.error(err, err.errors);
    //   throw err;
    // }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('user_lines', null, {});
    await queryInterface.bulkDelete('users', null, {});
  }
};
