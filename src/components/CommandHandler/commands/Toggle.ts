import {
	Component,
	ComponentAPI,
	Variable,
	VariableDefinitionType
} from '@ayana/bento';

import { CommandHandler } from '../CommandHandler';
import { Command, CommandExecute } from '../interfaces';

import Loggr from '../../../loggr';
const console = Loggr.get('C: Toggle');

export class Toggle implements Command {
	public api: ComponentAPI;
	public name: string = 'Toggle';

	public parent: Component = CommandHandler;
	public plugins: string[] = ['Database'];

	public command: string = 'toggle';

	public prefix: boolean = true;

	@Variable({ type: VariableDefinitionType.ARRAY, name: 'loggedUsers' })
	private loggedUsers: string[];
	@Variable({ type: VariableDefinitionType.ARRAY, name: 'ignoredUsers' })
	private ignoredUsers: string[];

	public canExecute(arg: CommandExecute): boolean {
		return arg.author.id === '103347843934212096';
	}

	public async execute({ author, channel, args }: CommandExecute) {
		let name = args[0];
		let logging = false;
		if (args[0].toLowerCase() === 'logging') {
			name = args[1];
			logging = true;
		}
		const db: any = this.api.getPlugin('Database');

		const user = await db.findUserByName(name.toLowerCase());
		if (!user) {
			await channel.createMessage('No markov with that name exists!');
			return;
		}
		if (logging) {
			user.set('loggingActive', !user.loggingActive);
		} else {
			user.set('active', !user.active);
		}
		if (user.active && user.loggingActive && !this.loggedUsers.find(u => u === user.userId)) {
			this.loggedUsers.push(user.userId);
			const i = this.ignoredUsers.indexOf(user.userId);
			if (i > -1) this.ignoredUsers.splice(i, 1);
		} else if ((!user.active || !user.loggingActive) && !this.ignoredUsers.find(u => u === user.userId)) {
			this.ignoredUsers.push(user.userId);
			const i = this.loggedUsers.indexOf(user.userId);
			if (i > -1) this.loggedUsers.splice(i, 1);
		}
		await user.save();
		await channel.createMessage(`Done! ${logging ? 'Logging' : name} is now ${(logging ? user.loggingActive : user.active) ? 'active' : 'inactive'}!`);
	}
}
