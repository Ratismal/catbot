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
    let larsenv = fs.readFileSync(path.join(__dirname, '..', 'larsenv.txt'), {encoding: 'utf8'});

    let pages = larsenv.split('\n').map(p => JSON.parse(p));
    let userInserts = [];
    let lineInserts = [];
    userInserts.push({
      userId: '98938149316599808',
      name: 'larsenv',
      showDiscrim: true,
      loggingActive: true,
      active: true,
      createdAt: Sequelize.fn('now'),
      updatedAt: Sequelize.fn('now'),
    });
    let mid = 1;
    for (const page of pages) {
      const messages = page.messages.map(p => p.filter(m => m.hit)[0].content);
      for (const line of messages) {
        let formattedLines = sanitize(line);
        if (formattedLines.length > 0) {
          // console.log(formattedLines);
          lineInserts.push({
            userId: '98938149316599808',
            messageId: mid++,
            rawMessage: line,
            formattedLines,
            createdAt: Sequelize.fn('now'),
            updatedAt: Sequelize.fn('now')
          });
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
    await queryInterface.bulkDelete('user_lines', {
      userId: '98938149316599808'
    }, {});
    await queryInterface.bulkDelete('users', {
      userId: '98938149316599808'
    }, {});
  }
};
