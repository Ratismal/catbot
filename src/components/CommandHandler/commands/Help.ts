import { Component, ComponentAPI, Variable, VariableDefinitionType } from '@ayana/bento';

import { CommandHandler } from '../CommandHandler';
import { Command, CommandExecute } from '../interfaces';

import Loggr from '../../../loggr';
const console = Loggr.get('C: Help');

export class Help implements Command {
	public api: ComponentAPI;
	public name: string = 'Help';

	public parent: Component = CommandHandler;

	public command: string = 'help';

	public prefix: boolean = true;

	@Variable({ type: VariableDefinitionType.STRING, name: 'prefix' })
	private commandPrefix: string;
	@Variable({ type: VariableDefinitionType.STRING, name: 'suffix' })
	private commandSuffix: string;

	public canExecute(arg: CommandExecute): boolean {
		return true;
	}

	public async execute(arg: CommandExecute) {
		const handler: CommandHandler = this.api.getComponent(CommandHandler);
		await arg.channel.createMessage(`Hi! I'm stupid cat. I'm a pretty stupid cat, see?

**Prefix**: \`${this.commandPrefix}\`
${Array.from(handler.commands.values()).filter( c => c.prefix &&  c.canExecute(arg)).map(c => ` - **${c.command}**`).join('\n')}

**Suffix**: \`${this.commandSuffix}\`
Use the suffix with the names in the 'list' command to execute a markov. For example, \`<name>${this.commandSuffix}\``);
	}

	
}
