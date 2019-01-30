var Eris = require('eris');
Object.defineProperty(Eris.Message.prototype, "guild", {
    get: function guild() {
        return this.channel.guild;
    }
});
var config = require('./config.json');
var CAT_ID = '103347843934212096';
const fs = require('fs');
const moment = require('moment');
const path = require('path');

process.on("unhandledRejection", function (err) {
    console.error(err);
});

const r = require('rethinkdbdash')({
    host: config.db.host,
    db: config.db.database,
    password: config.db.password,
    user: config.db.user,
    port: config.db.port
});

console.log('loading jsons');
var fileArray = fs.readdirSync(path.join(__dirname, 'jsons'));
var jsons = {};
var markovs = {};
let dirty = {};

const Markovify = require('./markov.js');

var nameIdMap = {};
var rejectedIds = [];
for (var i = 0; i < fileArray.length; i++) {
    var commandFile = fileArray[i];
    var id = commandFile.match(/(\d+)/)[1];
    readFile(id).catch(id => {
        console.log(`A JSON file was malformed, deleting`, id);
        fs.unlink(path.join(__dirname, 'jsons', id + '.json'));
        rejectedIds.push(id);
    });
}

jsons['dbots'] = JSON.parse(fs.readFileSync(path.join(__dirname, 'dbots.json')));
if (!jsons.dbots.uses) {
    jsons.dbots.uses = 0;
    dirty.dbots = true;
}
markovs['dbots'] = new Markovify();
markovs['dbots'].buildChain(jsons['dbots'].lines);

const bot = new Eris.Client('Bot ' + config.token, {
    autoReconnect: true,
    disableEvents: {
        PRESENCE_DATE: true,
        VOICE_STATE_UPDATE: true,
        TYPING_START: true
    },
    getAllUsers: true,
    restMode: true,
    defaultImageFormat: 'webp'
});

const guildCache = {};

const channels = {};

async function registerChangefeed() {
    try {
        console.log('Registering a changefeed!');
        let changefeed = await r.db('catbot').table('guild').changes({
            squash: true
        }).run((err, cursor) => {
            if (err) console.error(err);
            //logger.debug(cursor);
            cursor.on('error', err => {
                console.error(err);
            });
            cursor.on('data', data => {
                // logger.debug(data);
                if (data.new_val)
                    guildCache[data.new_val.guildid] = data.new_val;
                else delete guildCache[data.old_val.guildid];
            });
        });
        changefeed.on('end', () => {
            console.log(`Reached end of changelog, will try again in 10 seconds.`);
            setTimeout(registerChangefeed, 10000);
        });
    } catch (err) {
        console.log(`Failed to register a changefeed, will try again in 10 seconds.`);
        setTimeout(registerChangefeed, 10000);
    }
}

registerChangefeed();

async function getGuild(id) {
    if (!guildCache[id]) {
        let guild = await r.db('catbot').table('guild').get(id);
        guildCache[id] = guild;
    }
    return guildCache[id];
}

async function checkMalformed() {
    if (rejectedIds.length > 0) {
        for (let i = 0; i < rejectedIds.length; i++) {
            await bot.createMessage('197529405659021322', `<@${CAT_ID}> Found and deleted a malformed JSON: ${rejectedIds.shift()}`);
        }
    }
}

bot.on('ready', () => {
    console.log('stupid cat> YO SHIT WADDUP ITS DA CAT HERE');
    checkMalformed();
});

bot.on('error', function (err, id) {
    if (err.message.indexOf('Message.guild') == -1)
        console.error(`[${id}] ${err.stack}`);
});

bot.on('messageCreate', async function (msg) {
    checkMalformed();
    if (!msg.guild) return; // Don't respond in dms

    if (!await getGuild(msg.guild.id)) {
        await r.db('catbot').table('guild').insert({
            id: msg.guild.id,
            ratelimits: {}
        });
    }


    var prefix = config.isbeta ? 'catbeta' : 'cat';
    var suffix = config.isbeta ? 'betapls' : 'pls';
    if (jsons[msg.author.id]) {
        updateJson(msg);
    }

    if (msg.content.startsWith(prefix) && !msg.content.startsWith(prefix + ' ') && msg.content.toLowerCase() != prefix + 'pls') {

        var command = msg.content.replace(prefix, '').trim().replace(/\n/g, ' ').replace(/\s+/g, ' ');
        var words = command.split(' ');
        let output;
        let commandName = words.shift().toLowerCase();
        switch (commandName) {
            case 'markov':
                bot.createMessage(msg.channel.id, `I'll explain how a markov chain works.
\`\`\`Look at the banana.
Apples are the best!\`\`\`
A markov generates chains by first breaking a sentence into words, and then comparing what words follow what words. This gives it a grasp on a person's speech patterns. For example, the previous sentences would generate these chains:
\`\`\`(beginning of sentence): look, apples
look: at
at: the
the: banana, best
banana: (end of sentence)
apples: are
are: the
best: (end of sentence)\`\`\`
So from that, a markov chain could generate
\`\`\`Apples are the banana.\`\`\`
It could also generate
\`\`\`Look at the best!\`\`\`
It doesn't look at your sentences as a whole, but the pattern of your speech.`);
                break;
            case 'ratelimit':
                if (msg.author.id == CAT_ID) {
                    let ratelimits;
                    if (words.length > 1) {
                        ratelimits = (await getGuild(msg.guild.id)).ratelimits;
                        channels[msg.channel.id] = undefined;
                        ratelimits[msg.channel.id] = {
                            time: parseInt(words[0]),
                            quantity: parseInt(words[1])
                        };
                        await r.db('catbot').table('guild').get(msg.guild.id).update({
                            ratelimits
                        });
                        bot.createMessage(msg.channel.id, `Ok! A ratelimit of ${ratelimits[msg.channel.id].quantity} messages per ${ratelimits[msg.channel.id].time}ms has been created.`);
                    } else {
                        ratelimits = (await getGuild(msg.guild.id)).ratelimits;
                        ratelimits[msg.channel.id] = undefined;

                        await r.db('catbot').table('guild').replace({
                            ratelimits
                        });
                        bot.createMessage(msg.channel.id, `Ok! The ratelimit on this channel has been removed.`);
                    }
                }
                break;
            case 'help':
                let helpMsg = `Hi! I'm stupid cat. I'm a pretty stupid cat, see?
Prefix: ${prefix}
Prefix Commands:
  - **help**
  - **markov**
  - **list**
  - **ping**
  - **purge**
  - **pls**
  - **thx**

Suffix: ${suffix}
Use the suffixes with the names in the 'list' command. Ex:
\`<name>pls\``;
                bot.createMessage(msg.channel.id, helpMsg);
                break;
            case 'nick':
                if (msg.author.id == CAT_ID) {
                    try {
                        await bot.editNickname(msg.guild.id, words.join(' '));
                        bot.createMessage(msg.channel.id, 'done and stuff');
                    } catch (err) {
                        bot.createMessage(msg.channel.id, `Can't`);
                    }
                }
                break;
            case 'add':
                if (msg.author.id == CAT_ID) {
                    if (words.length > 1) {
                        let ids = words[1].match(/([0-9]{17,23})/)[1];
                        await r.db('catbot').table('markovs').insert({
                            userid: ids,
                            id: words[0].toLowerCase()
                        });
                        await genlogs(msg, words[0].toLowerCase());
                        let userId = Array.isArray(ids) ? ids[0] : ids;
                        await readFile(userId);
                    } else {
                        bot.createMessage(msg.channel.id, 'Nope.');
                    }
                }
                break;
            case 'remove':
                if (msg.author.id == CAT_ID) {
                    if (words[0]) {
                        await r.db('catbot').table('markovs').get(words[0].toLowerCase()).delete();
                        let id = nameIdMap[words[0].toLowerCase()];
                        if (id) {
                            delete nameIdMap[jsons[id].name];
                            delete markovs[id];
                            delete jsons[id];
                            fs.unlink(path.join(__dirname, 'jsons', id + '.json'), () => { });
                        }
                        await bot.createMessage(msg.channel.id, 'Removed.');
                    } else {
                        bot.createMessage(msg.channel.id, 'Nope.');
                    }
                }
                break;
            case 'update':
                if (msg.author.id == CAT_ID) {
                    if (words[0]) {
                        if (words[0].toLowerCase() == 'all') {
                            for (let key of Object.keys(nameIdMap)) {
                                console.log(key);
                                if (key != 'cat') {
                                    let id = nameIdMap[key];
                                    if (id) {
                                        await genlogs(msg, key);
                                        readFile(id);
                                    }
                                }
                            }
                            gencat(msg);
                        } else if (words[0].toLowerCase() == 'cat') {
                            gencat(msg);
                        } else {
                            let id = nameIdMap[words[0].toLowerCase()];
                            if (id) {
                                await genlogs(msg, words[0].toLowerCase());
                                await readFile(id);
                            } else {
                                bot.createMessage(msg.channel.id, 'Nope.');
                            }
                        }
                    } else {
                        bot.createMessage(msg.channel.id, 'Nope.');
                    }
                }
                break;
            case 'list':
                await bot.sendChannelTyping(msg.channel.id);
                if (!channels[msg.channel.id])
                    channels[msg.channel.id] = {};
                if (channels[msg.channel.id] && channels[msg.channel.id].list)
                    bot.deleteMessage(msg.channel.id, channels[msg.channel.id].list);

                let page = 1;
                if (!isNaN(parseInt(words[0])))
                    page = parseInt(words[0]);
                page--;

                let nameList = [];
                let keys = Object.keys(jsons).sort((a, b) => {
                    return jsons[b].lines.length - jsons[a].lines.length;
                });
                for (let i = page * 10; i < keys.length && i < (page * 10) + 10; i++) {
                    let key = keys[i];
                    let user = await getUser(key);
                    if (user)
                        nameList.push(`**${jsons[key].name}** (${user.username}#${user.discriminator}) - ${jsons[key].lines.length} lines | ${jsons[key].uses} uses`);
                    else nameList.push(`**${jsons[key].name}** - ${jsons[key].lines.length} lines | ${jsons[key].uses} uses`);
                }
                let sentMsg = await bot.createMessage(msg.channel.id, `I've markoved the following people:
 - ${nameList.join('\n - ')}
 
Page **${page + 1}**/**${Math.floor(keys.length / 10)}**`);
                channels[msg.channel.id].list = sentMsg.id;
                break;
            case 'ping':
                bot.createMessage(msg.channel.id, 'What is that supposed to mean?');
                break;
            case 'eval':
                console.log('evaling');
                eval1(msg, words.join(' '));
                break;
            case 'eval2':
                console.log('eval2ing');
                eval2(msg, words.join(' '));
                break;
            case 'avatar':
                if (msg.author.id === CAT_ID) {
                    var request = require('request').defaults({
                        encoding: null
                    });
                    var avatarUrl = '';
                    if (msg.attachments.length > 0) {
                        avatarUrl = msg.attachments[0].url;
                    } else if (words.length > 0) {
                        avatarUrl = words[0];
                    } else {
                        bot.createMessage(msg.channel.id, 'No URL given.');
                    }
                    request.get(avatarUrl, function (error, response, body) {
                        if (!error && response.statusCode == 200) {
                            let data = 'data:' + response.headers['content-type'] + ';base64,' + new Buffer(body).toString('base64');
                            console.log(data);
                            var p1 = bot.editSelf({
                                avatar: data
                            });
                            p1.then(function () {
                                bot.createMessage(msg.channel.id, ':ok_hand: Avatar set!');
                            });
                        }
                    });
                }
                break;
            case 'thx':
                await bot.sendChannelTyping(msg.channel.id);
                output = jsons['103347843934212096'].lines[getRandomInt(0, jsons['103347843934212096'].lines.length - 1)];
                output = filterUrls(output);
                console.log(output);
                output = await filterMentions(output);
                bot.createMessage(msg.channel.id, output || 'null');
                break;
            case 'purge':
                let messageArray = await bot.getMessages(msg.channel.id, 100);
                /**
                 * Checks if we have the permissions to remove them all at once
                 */
                var i;
                if (msg.channel.permissionsOf(bot.user.id).json.manageMessages) {
                    console.log(`Purging all of my messages in one fell swoop-da-whoop!`);
                    var messageIdArray = [];
                    for (i = 0; i < messageArray.length; i++) {
                        if (messageArray[i].author.id === bot.user.id)
                            messageIdArray.push(messageArray[i].id);
                    }
                    bot.deleteMessages(msg.channel.id, messageIdArray);
                } else {
                    /**
                     * We don't, so we delete them one by one
                     */
                    console.log(`We're doing this the hard way!`);
                    for (i = 0; i < messageArray.length; i++) {
                        if (messageArray[i].author.id === bot.user.id) {
                            messageArray[i].delete();
                        }
                    }
                }
                let msg2 = await bot.createMessage(msg.channel.id, 'Purging!');
                setTimeout(function () {
                    msg2.delete();
                }, 5000);
                break;
            //      default:
            //          if (nameIdMap[commandName]) {
            //             markovPerson(msg, nameIdMap[commandName]);
            //        } else if (commandName == 'dbots') {
            //             markovPerson(msg, 'dbots', true);
            //         }
            //        break;
        }
    } else if (msg.content.toLowerCase().endsWith(suffix)) {
        let content = msg.content.toLowerCase();
        content = content.substring(0, content.length - suffix.length);
        if (content == 'dbots')
            markovPerson(msg, 'dbots', true);
        else
            for (let key of Object.keys(nameIdMap)) {
                if (content == key) {
                    let doRatelimit = await checkRatelimit(msg);
                    if (doRatelimit != false) {
                        if (!channels[msg.channel.id].sentmsg) {
                            console.log(doRatelimit, moment.duration(doRatelimit).asMilliseconds());
                            bot.createMessage(msg.channel.id, 'This channel is under cooldown. Please try again in ' + (moment.duration(doRatelimit).asMilliseconds() / 1000) + ' seconds.');
                            channels[msg.channel.id].sentmsg = true;
                        }
                        return;
                    }

                    markovPerson(msg, nameIdMap[key]);
                    break;
                }
            }
    }
});

bot.connect();

async function getUser(id) {
    try {
        return bot.users.get(id) || await bot.getRESTUser(id);
    } catch (err) {
        return null;
    };
}

async function updateNick(msg) {
    if ((msg.guild.members.get(CAT_ID).nick || bot.users.get(CAT_ID).username).substring(1) !==
        (msg.guild.members.get(bot.user.id).nick || bot.user.username)) {
        try {
            await bot.editNickname(msg.guild.id, (msg.guild.members.get(CAT_ID).nick || bot.user.username).substring(1));
        } catch (err) {
            console.log('Failed to change nickname on ' + msg.guild.name + ` (${msg.guild.id})`);
        }
    }
}

function filterUrls(input) {
    return input.replace(/https?\:\/\/.+\.[a-z]{1,20}(\/[^\s]*)?/gi, '');
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function eval2(msg, text) {
    if (msg.author.id == CAT_ID) {
        var commandToProcess = text.replace('eval2 ', '');
        console.log(commandToProcess);
        try {
            bot.createMessage(msg.channel.id, `\`\`\`js
${eval(commandToProcess + '.toString()')}
\`\`\``);
        } catch (err) {
            bot.createMessage(msg.channel.id, err.message);
        }
    } else {
        bot.createMessage(msg.channel.id, `You don't own me!`);
    }
}

function eval1(msg, text) {
    if (msg.author.id == CAT_ID) {
        console.log('fucking fuck', text);
        var commandToProcess = text.replace('eval ', '');
        if (commandToProcess.startsWith('```js') && commandToProcess.endsWith('```'))
            commandToProcess = commandToProcess.substring(6, commandToProcess.length - 3);
        else if (commandToProcess.startsWith('```') && commandToProcess.endsWith('```'))
            commandToProcess = commandToProcess.substring(4, commandToProcess.length - 3);
        try {
            bot.createMessage(msg.channel.id, `Input:
\`\`\`js
${commandToProcess}
\`\`\`
Output:
\`\`\`js
${eval(commandToProcess)}
\`\`\``);

        } catch (err) {
            bot.createMessage(msg.channel.id, `An error occured!
\`\`\`js
${err.stack}
\`\`\``);
        }
    } else {
        bot.createMessage(msg.channel.id, `You don't own me!`);
    }
}

async function filterMentions(message) {
    while (/<@!?[0-9]{17,21}>/.test(message)) {
        let id = message.match(/<@!?([0-9]{17,21})>/)[1];
        try {
            let user = await getUser(id);
            message = message.replace(new RegExp(`<@!?${id}>`), `${user.username}#${user.discriminator}`);
        } catch (err) {
            message = message.replace(new RegExp(`<@!?${id}>`), `<@\u200b${id}>`);
        }
    }
    return message;
};

async function markovPerson(msg, id, clean) {
    if (id === '103347843934212096') clean = true;
    let user = await getUser(id);
    await bot.sendChannelTyping(msg.channel.id);
    jsons[id].uses++;
    let output = markovs[id].say({
        length: 100
    });
    output = filterUrls(output);
    output = await filterMentions(output);
    console.log(output);
    if (!clean)
        bot.createMessage(msg.channel.id, {
            content: `Well, ${user.username} once said...`,
            embed: {
                author: {
                    name: `${user.username}#${user.discriminator}`,
                    icon_url: user.avatarURL,
                    url: 'https://blargbot.xyz/user/' + id
                },
                description: output
            }
        });
    else bot.createMessage(msg.channel.id, output);
}


async function gencat(msg) {
    let msg2 = await bot.createMessage(msg.channel.id, 'cat: Performing query...');
    let msgs;
    msgs = await r.db('blargdb').table('catchat');
    await msg2.edit('cat: Generating array...');
    let content = [];
    for (let message of msgs) {
        content.push(message.content);
    }
    await msg2.edit('cat: Writing file...');
    await new Promise((fulfill, reject) => {
        fs.writeFile(path.join(__dirname, 'cat.json'),
            JSON.stringify({
                name: 'cat',
                lines: content
            }, null, 2), (err) => {
                if (err) {
                    console.error(err);
                    reject(err);
                    return;
                };
                jsons[CAT_ID] = {
                    name: 'cat',
                    lines: content
                };
                nameIdMap[jsons[CAT_ID].name] = CAT_ID;
                markovs[CAT_ID] = new Markovify();
                markovs[CAT_ID].buildChain(jsons[CAT_ID].lines.join(' \uE000 '));
                msg2.edit('cat: Done.');
                fulfill();
            });
    });
}

async function genlogs(msg, name) {
    try {
        let id = (await r.table('markovs').get(name)).userid;
        let msg2 = await bot.createMessage(msg.channel.id, name + ': Performing query...');
        let msgs = [];
        await msg2.edit(name + ': Updating array...');
        let content = jsons[id];
        if (!content) content = {
            name: name,
            lines: []
        };
        let pushed = 0;
        for (let message of msgs) {
            if (!content.lines.includes(message.content)) {
                content.lines.push(message.content);
                pushed++;
            }
        }
        let userId;
        if (Array.isArray(id)) userId = id[0];
        else userId = id;
        await msg2.edit(name + ': Writing file...');
        await writeFile(userId, content, msg2, name, pushed);
    } catch (err) {
        console.error(err);
    }
}

function writeFile(userId, content, msg, name, pushed) {
    return new Promise((fulfill, reject) => {
        try {
            let contentStr = JSON.stringify(content, null, 2);
            fs.writeFile(path.join(__dirname, 'jsons', userId + '.json'), contentStr, (err) => {
                if (err) {
                    console.error(err);
                    reject(err);
                    return;
                };
                msg.edit(name + ': Done. ' + pushed + ' lines added.');
                fulfill();
            });
        } catch (err) {
            reject(err);
        }
    });
}

function readFile(id) {
    return new Promise((fulfill, reject) => {
        fs.readFile(path.join(__dirname, 'jsons', id + '.json'), (err, file) => {
            if (err) {
                console.error(err);
                reject(id);
                return;
            }
            try {
                jsons[id] = JSON.parse(file);
                if (!jsons[id].uses)
                    jsons[id].uses = 0;
                nameIdMap[jsons[id].name] = id;
                if (!markovs[id]) markovs[id] = new Markovify();
                markovs[id].buildChain(jsons[id].lines);
                fulfill();
            } catch (err) {
                console.error(err);
                reject(id);
            }
        });
    });
}


function updateJson(msg) {
    if (jsons[msg.author.id].lines.indexOf(msg.content) == -1) {
        jsons[msg.author.id].lines.push(msg.content);
        let name = jsons[msg.author.id].name;

        markovs[msg.author.id].buildChain(`\uE000 ${msg.content} \uE000`, false);

        dirty[msg.author.id] = true;
    }
}

setInterval(() => {
    for (const key in dirty) {
        if (dirty[key] === true) {
            let filepath = path.join(__dirname, 'jsons', key + '.json');
            if (key == 'dbots') {
                filepath = path.join(__dirname, key + '.json');
            }
            fs.writeFile(filepath, JSON.stringify(jsons[key], null, 2), err => {
                if (err) console.error(err);
            });
            dirty[key] = false;
        }
    }
}, 1000 * 60 * 5);

async function checkRatelimit(msg) {
    let storedGuild = await getGuild(msg.guild.id);
    let ratelimit = false;
    if (storedGuild) {
        if (storedGuild.ratelimits && storedGuild.ratelimits[msg.channel.id]) {
            if (channels[msg.channel.id]) {
                let duration = msg.timestamp - channels[msg.channel.id].lastmsg;
                if (duration < storedGuild.ratelimits[msg.channel.id].time && channels[msg.channel.id].quantity >= storedGuild.ratelimits[msg.channel.id].quantity) {
                    ratelimit = storedGuild.ratelimits[msg.channel.id].time - duration;
                } else if (duration < storedGuild.ratelimits[msg.channel.id].time) {
                    channels[msg.channel.id].quantity++;
                } else {
                    channels[msg.channel.id].quantity = 1;
                    channels[msg.channel.id].lastmsg = msg.timestamp;
                    channels[msg.channel.id].sentmsg = false;
                }
            } else {
                channels[msg.channel.id] = {
                    lastmsg: msg.timestamp,
                    quantity: 1,
                    sentmsg: false
                };
            }
        }
    }
    return ratelimit;
}
