import {
	Component,
	ComponentAPI,
	FSComponentLoader,
	SubscribeEvent,
	Variable,
	VariableDefinitionType
} from '@ayana/bento';

import { Client, Message, TextChannel } from 'eris';

import { DiscordEvent } from '../../Constants';
import { Discord } from '../Discord';
import { Command, CommandExecute } from './interfaces';

import Loggr from '../../loggr';
const console = Loggr.get('CommandHandler');

export class CommandHandler {
	public api: ComponentAPI;
	public name: string = 'CommandHandler';

	public dependencies: string[] = ['Discord'];

	public client: Client;

	public commands: Map<string, Command> = new Map();

	@Variable({ type: VariableDefinitionType.STRING, name: 'prefix' })
	private prefix: string;
	@Variable({ type: VariableDefinitionType.STRING, name: 'suffix' })
	private suffix: string;

	public async onLoad() {
		console.init('Loading commands...');
		await this.api.loadComponents(FSComponentLoader, __dirname, 'commands');

		const discord: Discord = this.api.getComponent('Discord');
		this.client = discord.client;
	}

	public async onChildLoad(command: Command) {
		try {
			await this.addCommand(command);
		} catch (err) {
			console.warn(err);
		}
	}

	public async onChildUnload(command: Command) {
		try {
			await this.removeCommand(command);
		} catch (err) {
			console.warn(err);
		}
	}

	public async addCommand(command: Command) {
		if (this.commands.has(command.command)) {
			throw new Error('Command already exists.');
		}

		this.commands.set(command.command, command);
		console.init('Loaded command:', command.command);
	}

	public async removeCommand(command: Command) {
		if (this.commands.has(command.command)) this.commands.delete(command.command);
	}

	@SubscribeEvent('Discord', DiscordEvent.MESSAGE_CREATE)
	public async handleMessageCreate(message: Message) {
		if (message.author.bot) return;
		if (!(message.channel instanceof TextChannel)) return;
		if (!message.channel.guild) return;

		let content: string = message.content;
		if (message.content.endsWith(this.suffix)) {
			const preContent: string = content.substring(0, content.length - this.suffix.length);
			content = preContent.toLowerCase();
			if (/\s$/.test(content)) return;

			const command = this.commands.get('_usermarkov');
			const execute: CommandExecute = {
				message, channel: message.channel,
				author: message.author, args: [content],
				argsPre: [preContent],
				client: this.client
			};
			try {
				if (await command.canExecute(execute)) {
					await command.execute(execute);
				}
			} catch (err) {
				console.error('Command Error:', err);
			}
		} else if (message.content.startsWith(this.prefix)) {
			const preContent: string = content.substring(this.suffix.length);
			content = preContent.toLowerCase();
			if (/^\s/.test(content)) return;

			const segments: string[] = content.split(/\s+/);
			const preSegments: string[] = preContent.split(/\s+/);
			const commandName: string = segments[0];
			if (this.commands.has(commandName)) {
				const command = this.commands.get(commandName);

				const execute: CommandExecute = {
					message, channel: message.channel,
					author: message.author, args: segments.slice(1),
					argsPre: preSegments.slice(1),
					client: this.client
				};
				try {
					if (await command.canExecute(execute)) {
						await command.execute(execute);
					}
				} catch (err) {
					console.error('Command Error:', err);
				}
			}
		}
	}
}
