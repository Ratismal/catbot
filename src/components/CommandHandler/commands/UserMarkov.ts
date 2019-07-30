import { Component, ComponentAPI } from '@ayana/bento';

import { CommandHandler } from '../CommandHandler';
import { Command, CommandExecute } from '../interfaces';

import { MarkovBuilder } from '../../MarkovBuilder';

import Loggr from '../../../loggr';
const console = Loggr.get('C: User Markov');

export class UserMarkov implements Command {
	public api: ComponentAPI;
	public name: string = 'UserMarkov';

	public parent: Component = CommandHandler;

	public command: string = '_usermarkov';

	public dependencies: string[] = ['MarkovBuilder', 'Discord', 'IconHandler'];
	public plugins: string[] = ['Database'];

	public prefix: boolean = false;

	public canExecute(arg: CommandExecute): boolean {
		return true;
	}

	public async execute({ channel, args }: CommandExecute) {
		const db: any = this.api.getPlugin('Database');
		const discord: any = this.api.getComponent('Discord');
		const iconHandler: any = this.api.getComponent('IconHandler');
		const user = await db.findUserByName(args[0]);

		if (user && user.active) {
			await channel.sendTyping();

			const duser = await discord.getUser(user.userId);
			await user.increment('uses');

			const builder = this.api.getComponent<MarkovBuilder>(MarkovBuilder);
			const markov = await builder.getOrCreateMarkov(user.userId);
			// console.log(markov);
			const keys = markov.create(3, 15);
			// const statement = markov.markov.fill(key, 20);
			// console.log(key, statement);
			if (user.userId === '103347843934212096') {
				await channel.createMessage(keys.join(' '));
			} else {
				const icon = await iconHandler.getIcon(args[0], duser);
				let name = duser.username;
				if (user.showDiscrim) name += '#' + duser.discriminator;
				let lines = [`Well, ${duser.username} once said...`];
				lines.push(`> ${icon} **${name}**`);
				lines.push(`> ${keys.join(' ')}`);
				await channel.createMessage(lines.join('\n'));
			}
		}
	}
}
