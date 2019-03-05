import {
    Component,
    ComponentAPI,
    Variable,
    VariableDefinitionType
} from '@ayana/bento';

import { CommandHandler } from '../CommandHandler';
import { Command, CommandExecute } from '../interfaces';

const Catflake = require('catflake');
const catflake = new Catflake();

import Loggr from '../../../loggr';
const console = Loggr.get('C: Populate');

const snekfetch = require('snekfetch');

export class Populate implements Command {
    public api: ComponentAPI;
    public name: string = 'Populate';

    public parent: Component = CommandHandler;
    public plugins: string[] = ['Database', 'Sanitizer'];
    public dependencies: string[] = ['MarkovBuilder'];

    public command: string = 'populate';

    public prefix: boolean = true;

    @Variable({ type: VariableDefinitionType.ARRAY, name: 'loggedUsers' })
    private loggedUsers: string[];
    @Variable({ type: VariableDefinitionType.ARRAY, name: 'ignoredUsers' })
    private ignoredUsers: string[];

    public canExecute(arg: CommandExecute): boolean {
        return arg.author.id === '103347843934212096';
    }

    private async populate(user: string, lines: string[]) {

    }

    public async execute({ author, channel, args }: CommandExecute) {
        const db: any = this.api.getPlugin('Database');
        const sanitizer: any = this.api.getPlugin('Sanitizer');
        const MarkovBuilder: any = this.api.getComponent('MarkovBuilder');
        const client = this.api.getComponent<CommandHandler>(CommandHandler).client;

        if (args.length !== 2) {
            await channel.createMessage('usage: populate <name> <url>');
            return;
        }

        const user = await db.findUserByName(args[0]);
        if (!user) {
            await channel.createMessage('no markov found');
            return;
        }

        try {
            const res = await snekfetch.get(args[1]);
            let lines = res.body;
            if (lines instanceof Buffer) {
                lines = lines.toString('utf8').split('\n');
            } else if (typeof lines === 'string') lines = lines.split('\n');
            else if (!Array.isArray(lines)) {
                await channel.createMessage('Please provide a json array or a newline-delimited text file');
                return;
            }

            console.log('Found', lines.length, 'lines.');
            const inserts: any[] = [];
            const flines: string[] = [];

            for (const line of lines) {
                let content: string;
                if (typeof line === 'string') content = line;
                else if (typeof line === 'object' && line.content) content = line.content;
                const formattedLines = sanitizer.sanitize(content);
                if (formattedLines.length > 0) {
                    inserts.push({
                        userId: user.userId,
                        messageId: catflake.generate(),
                        rawMessage: content,
                        formattedLines
                    });
                    flines.push(...formattedLines);
                }
            }

            await db.user_line.bulkCreate(inserts);

            const markov = MarkovBuilder.getMarkov(user.userId);
            if (markov)
                markov.seed(flines);

            await channel.createMessage('ok');
        } catch (err) {
            console.error(err, err.body ? err.body.toString() : null);
            await channel.createMessage(err.message);
        }
    }
}
