const STRIP_MENTIONS = /<a?:.+:\d{17,23}>|<(@&?|#)\d{17,23}>|\d{17,}|(https?:\/\/)?(.+\.)?.+\..+(\/.+)\s|\{.+\}/gi;
const STRIP = /[^a-z0-9\.,';!?\n\/ ]|(https?:\/\/.+(\s|$))/gi;
const SKIP = /(^[^a-z0-9])|[{}]/gi;
const PUNCTUATION = /([\.,;!?\(\)])/g;
const TRIM_PUNCTUATION = /\s+([\.,;!?\(\)])/g;
const SENTENCE_BOUNDS = /( ?([.!?;])\s)|\n/g;
const COMMON_PREFIXES = [
  /^\W/, /^pls/, /^\w\W/
];

module.exports = function sanitize(line) {
  let processing = line.replace(STRIP_MENTIONS, '');
  let components = processing.split(SENTENCE_BOUNDS).filter(p => p).map(p => p.trim());
  let lines = [];
  for (let part of components) {
    if (!SKIP.test(part) && !COMMON_PREFIXES.find(cp => cp.test(part))) {
      lines.push(part.replace(STRIP, '').replace(/\s+/g, ' ').replace(TRIM_PUNCTUATION, '$1'));
    }
  }
  lines = lines.filter(l => !!l && l.split(/\s/).length > 3).map(l => l.trim());
  return lines;
};