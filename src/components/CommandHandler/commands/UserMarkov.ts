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

	public dependencies: string[] = ['MarkovBuilder'];
	public plugins: string[] = ['Database'];

	public prefix: boolean = false;

	public async execute({ channel, args }: CommandExecute) {
		const db: any = this.api.getPlugin('Database');
		const user = await db.findUserByName(args[0]);

		if (user) {
			const builder = this.api.getComponent<MarkovBuilder>(MarkovBuilder);
			const markov = await builder.getOrCreateMarkov(user.userId);
			console.log(markov);
			const key = markov.markov.pick();
			const statement = markov.markov.fill(key, 20);
			console.log(key, statement);

			await channel.createMessage(statement.join(' '));
		}
	}
}
