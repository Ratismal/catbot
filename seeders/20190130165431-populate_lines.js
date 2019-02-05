'use strict';

const fs = require('fs');
const path = require('path');

const STRIP_MENTIONS = /<a?:.+:\d{17,23}>|<(@&?|#)\d{17,23}>|\d{17,}|(https?:\/\/)?(.+\.)?.+\..+(\/.+)\s|\{.+\}/gi;
const STRIP = /[^a-z0-9\.,';!?\n\/ ]|(https?:\/\/.+(\s|$))/gi;
const SKIP = /(^[^a-z0-9])|[{}]/gi;
const PUNCTUATION = /([\.,;!?\(\)])/g;
const TRIM_PUNCTUATION = /\s+([\.,;!?\(\)])/g;
const SENTENCE_BOUNDS = /( ?([.!?;])\s)|\n/g;
const COMMON_PREFIXES = [
	/^\W/, /^pls/, /^\w\W/
];

function sanitize(line) {
  const processing = line.replace(STRIP_MENTIONS, '');
  const components = processing.split(SENTENCE_BOUNDS).filter(p => p).map(p => p.trim());
  let lines = [];
  for (const part of components) {
    if (!SKIP.test(part) && !COMMON_PREFIXES.find(cp => cp.test(part))) {
      lines.push(part.replace(STRIP, '').replace(/\s+/g, ' ').replace(TRIM_PUNCTUATION, '$1'));
    }
  }
  lines = lines.filter(l => !!l && l.split(/\s/).length > 3).map(l => l.trim());
  return lines;
}

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
