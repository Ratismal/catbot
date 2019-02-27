import { Component, ComponentAPI } from '@ayana/bento';

import { CommandHandler } from '../CommandHandler';
import { Command, CommandExecute } from '../interfaces';

import Loggr from '../../../loggr';
const console = Loggr.get('C: Ping');

export class Ping implements Command {
	public api: ComponentAPI;
	public name: string = 'Ping';

	public parent: Component = CommandHandler;

	public command: string = 'ping';

	public prefix: boolean = true;

	public canExecute(arg: CommandExecute): boolean {
		return true;
	}

	public async execute({ channel }: CommandExecute) {
		await channel.createMessage(`What is that supposed to mean?`);
	}
}
