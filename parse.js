const fs = require('fs');
const file = fs.readFileSync('jocey.txt', { encoding: 'utf8' });

const out = [];
for (const line of file.split('\n')) {
  try {
    const t = JSON.parse(line);
    for (const messages of t.messages) {
      out.push(messages[2].content);
    }
  } catch (err) {
    console.error(err);
  }
}
fs.writeFileSync('jocey2.json', JSON.stringify(out, null, 2));