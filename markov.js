const STRIP_MENTIONS = /<a?:.+:\d{17,23}>|<(@&?|#)\d{17,23}>|\d{17,}|(https?:\/\/)?(.+\.)?.+\..+(\/.+)\s|\{.+\}/gi;
const STRIP = /[^a-z0-9\.,;!?\n\/ ]/gi;
const PUNCTUATION = /([\.,;!?\(\)])/g;
const BOUNDED_PUNCTUATION = /^([\.,;!?\(\)])$/;
const SENTENCE_BOUNDS = / ?([.!?])\s|\n/g;
// FIXME what about singles/contractions?
const QUOTES = /(["`'])/g;

const commonPrefixes = [
    /^\W/, /^pls/, /^\w\W/
];

class Markovify {
    constructor() {
        this.chain = {};
        this.seeded = {};
    }

    merge_options(a, b) {
        // TODO better way of handling defaults
        var m = {};
        for (var attrname in a) m[attrname] = a[attrname];
        for (attrname in b) m[attrname] = b[attrname];
        return m;
    }

    tokenize(input) {
        input = input.replace(STRIP_MENTIONS, '').replace(STRIP, '');

        var padded = input.replace(PUNCTUATION, "$1 ");
        padded = padded.replace(QUOTES, " ");
        // Add sentence boundaries for parsing
        padded = padded.replace(SENTENCE_BOUNDS, " \uE000 ");
        return padded.split(/\s+/);
    }

    buildChains(input, reset) {
        for (const l of input) this.buildChain(l, reset, false);

        // this.buildWeights(Object.keys(this.chain));
    }

    buildChain(input, reset) {
        if (reset || this.chain == undefined)
            this.chain = {};
        let toSeed = {};

        if (typeof input === 'string')
            input = [input];

        for (let l of input) {
            let cont = true;
            for (const p of commonPrefixes) {
                if (p.test(l)) cont = false;
            }
            if (!cont) continue;
            l = `\uE000 ${l} \uE000`;
            var tokens = this.tokenize(l);
            if (tokens.length <= 5) continue;
            var length = tokens.length - 1;

            for (var i = 0; i < length; i++) {
                var a = tokens[i];
                var b = tokens[i + 1];
                if (a == '' || b == '') continue;

                if (a === 'please' && b === 'No') console.log(l);
                toSeed[a] = true;
                try {
                    if (this.chain[a] === undefined) {
                        this.chain[a] = {
                            [b]: { weight: 1 }
                        };
                    } else if (typeof this.chain[a][b] !== 'object') {
                        this.chain[a][b] = {
                            weight: 1
                        };
                    } else {
                        this.chain[a][b].weight++;

                    }
                } catch (err) {
                    // may be memes like [constructor][name]
                    console.error(err, this.chain[a][b], typeof this.chain[a][b], a, b);
                }
            }
        }

        this.buildWeights(Object.keys(toSeed));

        // Store a list of keys for quick random selections
        this.keys = Object.keys(this.chain);
    }

    buildWeights(keys) {
        for (const key of keys) {
            let seeded = { __max: 0 };
            let obj = this.chain[key];
            let accu = 0;
            for (const key in obj) {
                seeded[key] = { key, min: accu, max: 0 };
                accu += obj[key].weight;
                seeded[key].max = accu - 1;
            }
            this.seeded[key] = seeded;
            seeded.__max = accu;
        }
    }

    say(opts) {
        var defaults = {
            length: 5
        };

        var options = this.merge_options(defaults, opts);

        if (this.keys.length === 0) throw "No Markov chain found"; // Fix
        var k = '\uE000';
        console.log('first:', k);
        var tokens = [k];
        while ((k = this.getNext(k, tokens.length)) !== null) {
            if (k === '\uE000')
                if (tokens.length <= 3) {
                    console.log(`Remaking chain '${tokens.join(' ')}' due to insufficient length.`);
                    tokens = [];
                    k = '\uE000';
                } else break;
            else if (k === undefined) {
                tokens = [];
                k = '\uE000';

            }
            else if (k == '') continue;
            else tokens.push(k);
            if (tokens.length > options.length - 1) break;
        }
        console.log('last:', k);

        //CODE: this.finalize(tokens)
        return tokens.join(" ").replace(/\uE000/g, '');
        //return this.finalize(tokens);
    }

    finalize(tokens) {
        var final = "";
        for (var i = 0; i < tokens.length; i++) {
            if (tokens[i] === "`s`" || tokens[i] === "`/s`") {
                continue;
            } else if (tokens[i].match(Markovify.BOUNDED_PUNCTUATION)) {
                final += tokens[i];
            } else {
                final += ` ${tokens[i]}`;
            }
        }
        return final;
    }

    randomStart() {
        return this.chain['\uE000'][this.chain['\uE000'].length * Math.random() << 0];
    }

    getRandom(max) {
        return Math.floor(Math.random() * max);
    }

    getNext(key, length = 0) {
        let seeded = this.seeded[key];
        if (!seeded) {
            console.log('seed for', key, 'was undefined?');
            return undefined;
        }
        let seed = this.getRandom(seeded.__max);
        if (length >= 6 && seeded['\uE000']) {
            if (this.getRandom(20) <= length)
                return '\uE000';
        }
        let res = Object.values(seeded).filter(v => {
            return seed >= v.min && seed <= v.max;
        });
        if (!res.length === 0) return null;
        console.log('result:', key, key.length, '|', res[0].key);
        return res[0].key;
    }

    randomChoice(obj) {

        return obj && obj[obj.length * Math.random() << 0];
    }
}

module.exports = Markovify;