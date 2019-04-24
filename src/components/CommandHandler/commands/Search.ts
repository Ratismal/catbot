import { Component, ComponentAPI } from '@ayana/bento';

import { CommandHandler } from '../CommandHandler';
import { Command, CommandExecute } from '../interfaces';
import { MarkovBuilder } from '../../MarkovBuilder';

import Loggr from '../../../loggr';
const console = Loggr.get('C: Search');

export class Search implements Command {
	public api: ComponentAPI;
	public name: string = 'Search';

	public parent: Component = CommandHandler;

	public dependencies: string[] = ['MarkovBuilder', 'Discord'];
	public plugins: string[] = ['Database', 'Sanitizer'];

	public command: string = 'search';

	public prefix: boolean = true;

	public canExecute(arg: CommandExecute): boolean {
		return true;
	}

	public async execute({ args, channel }: CommandExecute) {
		const db: any = this.api.getPlugin('Database');
		const discord: any = this.api.getComponent('Discord');

		if (!args[0]) {
			await channel.createMessage('You must provide a name!');
			return;
		}
		if (!args[1]) {
			await channel.createMessage('You must a key to search for!');
			return;
		}

		const user = await db.findUserByName(args[0]);

		if (user && user.active) {
			await channel.sendTyping();

			const duser = await discord.getUser(user.userId);
			await user.increment('uses');

			const sanitizer: any = this.api.getPlugin('Sanitizer');

			const builder = this.api.getComponent<MarkovBuilder>(MarkovBuilder);
			const markov = await builder.getOrCreateMarkov(user.userId);

			// let start = sanitizer.sanitize(args[1]);
			// console.log(start, args);
			let startKey: any;
			try {
				startKey = markov.getKey(args[1]);
			} catch (err) {
				await channel.createMessage('They\'ve never said that, sorry...');
				return;
			}

			// console.log(markov);
			const keys = markov.fill(startKey, 15);

			let name = duser.username;
			if (user.showDiscrim) name += '#' + duser.discriminator;
			if (user.userId === '103347843934212096') {
				await channel.createMessage(keys.join(' '));
			} else {
				await channel.createMessage({
					content: `Well, ${duser.username} once said...`,
					embed: {
						author: {
							name: `${name}`,
							icon_url: duser.avatarURL
						},
						description: keys.join(' ')
					}
				});
			}
		} else {
			await channel.createMessage('Sorry, I don\'t know that person...');
		}
	}
}
