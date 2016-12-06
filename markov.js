const PUNCTUATION = /([\.,;!?\(\)])/g;
const BOUNDED_PUNCTUATION = /^([\.,;!?\(\)])$/;
const SENTENCE_BOUNDS = / ([.!?]) /g;
// FIXME what about singles/contractions?
const QUOTES = /(["`])/g;
const TITLES = /(Mr|Mrs|Ms|Prof|Dr) \./g;

class Markovify {
    constructor() {
        this.chain = {};
    }

    merge_options(a, b) {
        // TODO better way of handling defaults
        var m = {};
        for (var attrname in a) m[attrname] = a[attrname];
        for (attrname in b) m[attrname] = b[attrname];
        return m;
    }

    tokenize(input) {
        var padded = input.replace(Markovify.PUNCTUATION, " $1 ");
        padded = padded.replace(Markovify.QUOTES, " ");
        padded = padded.replace(Markovify.TITLES, "$1.");
        // Add sentence boundaries for parsing
        padded = padded.replace(Markovify.SENTENCE_BOUNDS, " $1 `/s` `s`");
        return padded.split(/\s+/);
    }

    buildChain(input) {
        this.chain = {};
        var tokens = this.tokenize(input);
        var length = tokens.length - 1;
        for (var i = 0; i < length; i++) {
            var a = tokens[i];
            var b = tokens[i + 1];
            if (this.chain[a] !== undefined && Array.isArray(this.chain[a])) {
                this.chain[a].push(b);
            } else {
                this.chain[a] = [b];
            }
        }
        // `/s` is always followed by `s`; simplify
        this.chain["`/s`"] = ["`s`"];

        // Store a list of keys for quick random selections
        this.keys = Object.keys(this.chain);
    }

    say(opts) {
        var defaults = {
            length: 5
        };

        var options = this.merge_options(defaults, opts);

        if (this.keys.length === 0) throw "No Markov chain found"; // Fix
        var k = this.randomStart();
        var tokens = [k];
        while ((k = this.randomChoice(this.chain[k]))  !== undefined) {
            if (k === '\uE000')
                if (tokens.length <= 3) tokens[tokens.length - 1] += '.';
                else break;
            else tokens.push(k);
            if (tokens.length > options.length - 1) break;
        }
        //CODE: this.finalize(tokens)
        return tokens.join(" ");
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

    randomChoice(arr) {
        return arr && arr[arr.length * Math.random() << 0];
    }
}

module.exports = Markovify;