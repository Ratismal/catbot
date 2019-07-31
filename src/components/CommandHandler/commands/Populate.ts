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
	public desc: string = 'Populates a markov from a file: `<name> <url>`';

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

	private async populate(user: string, lines: string[]) { }

	public async execute({ author, channel, args, argsPre }: CommandExecute) {
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
		console.log('"%s"', argsPre[1]);

		try {
			const res = await snekfetch.get(argsPre[1]);
			let lines = res.body;
			if (lines instanceof Buffer) {
				lines = lines.toString('utf8');
				try {
					lines = JSON.parse(lines);
				} catch (err) {
					lines = lines.split('\n');
				}
			}
			if (typeof lines === 'string') lines = lines.split('\n');
			else if (!Array.isArray(lines)) {
				await channel.createMessage('Please provide a json array or a newline-delimited text file');
				return;
			}

			const logs: string[] = [];
			logs.push(`Found ${lines.length} lines from \`${argsPre[1]}\`.`);
			logs.push(`Formatting...`);

			const m = await channel.createMessage(logs.join('\n'));

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

			logs.push(`Created ${inserts.length} lines to insert.`, 'Inserting...');
			await m.edit(logs.join('\n'));

			await db.user_line.bulkCreate(inserts);

			logs.push('Seeding...');
			await m.edit(logs.join('\n'));

			const markov = MarkovBuilder.getMarkov(user.userId);
			if (markov)
				markov.seed(flines);

			logs.push('Done!');
			await m.edit(logs.join('\n'));
		} catch (err) {
			console.error(err, err.body ? err.body.toString() : null);
			await channel.createMessage(err.message);
		}
	}
}
