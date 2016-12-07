var Eris = require('eris');

var config = require('./config.json')
var CAT_ID = '103347843934212096';
const fs = require('fs');
const path = require('path');

console.log('loading jsons');
var fileArray = fs.readdirSync(path.join(__dirname, 'jsons'));
var jsons = {};
var markovs = {};
const Markovify = require('./markov.js');

var nameIdMap = {};

for (var i = 0; i < fileArray.length; i++) {
    var commandFile = fileArray[i];
    var id = commandFile.match(/(\d+)/)[1];
    jsons[id] = JSON.parse(fs.readFileSync(path.join(__dirname, 'jsons', commandFile)));
    markovs[id] = new Markovify();
    nameIdMap[jsons[id].name] = id;
}

jsons['103347843934212096'] = JSON.parse(fs.readFileSync(path.join(__dirname, 'cat.json')))
markovs['103347843934212096'] = new Markovify();


console.log('building markov')
for (var key in markovs) {
    markovs[key].buildChain(jsons[key].lines.join(' \uE000 '));
}

bot = new Eris.Client('Bot ' + config.token, {
    autoReconnect: true,
    disableEvents: {
        PRESENCE_DATE: true,
        VOICE_STATE_UPDATE: true,
        TYPING_START: true
    },
    getAllUsers: true,
    restMode: true
});

bot.on('ready', () => {
    console.log('stupid cat> YO SHIT WADDUP ITS DA CAT HERE');
    for (let guild of bot.guilds) {
        if (guild[1].members.get(CAT_ID) != undefined) {
            bot.editNickname(guild[0], guild[1].members.get(CAT_ID).nick || bot.user.username).catch(err => {
                console.log('Was unable to change nickname on guild', guild[1].name, guild[1].id);
            })
        }
    }
});

bot.on('messageCreate', async function (msg) {
    var prefix = config.isbeta ? 'catbeta' : 'cat';
    var suffix = config.isbeta ? 'betapls' : 'pls';
    
    if (msg.content.startsWith(prefix)) {
        await updateNick(msg);
        var command = msg.content.replace(prefix, '').trim().replace(/\n/g, ' ').replace(/\s+/g, ' ');
        console.log('stupid cat>', msg.author.username, msg.author.id, prefix, command);
        var words = command.split(' ');
        let output;
        let commandName = words.shift().toLowerCase()
        switch (commandName) {
            case 'list':
                let nameList = [];
                for (let key of Object.keys(nameIdMap)) {
                    let user = await getUser(nameIdMap[key]);
                    nameList.push(`**${key}** (${user.username}#${user.discriminator})`);
                }
                bot.createMessage(msg.channel.id, `I've markoved the following people:\n - ${nameList.join('\n - ')}`)
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
            case 'pls': // yay markovs
                markovPerson(msg, '103347843934212096', true);
                break;
            case 'thx':
                await bot.sendChannelTyping(msg.channel.id)
                output = jsons['103347843934212096'].lines[getRandomInt(0, jsons['103347843934212096'].lines.length - 1)];
                output = filterUrls(output);
                console.log(output);
                output = await filterMentions(output);
                bot.createMessage(msg.channel.id, output || 'null');
                break;
            default:
                if (nameIdMap[commandName]) {
                    markovPerson(msg, nameIdMap[commandName]);
                }
                break;
        }
    } else if (msg.content.toLowerCase().endsWith('pls')) {
        for (let key of Object.keys(nameIdMap)) {
            if (msg.content.toLowerCase().startsWith(key)) {
                markovPerson(msg, nameIdMap[key]);
                break;
            }
        }
    }
});

bot.connect();

async function getUser(id) {
    return bot.users.get(id) || await bot.getRESTUser(id);
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
    let user = await getUser(id);
    await bot.sendChannelTyping(msg.channel.id)
    output = markovs[id].say({
        length: 100
    });
    output = filterUrls(output);
    output = await filterMentions(output);
    console.log(output)
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