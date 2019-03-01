import { Message, TextChannel } from 'eris';

import {
	Component,
	ComponentAPI,
	FSComponentLoader,
	Plugin,
	SubscribeEvent,
	Variable,
	VariableDefinitionType
} from '@ayana/bento';

import { DiscordEvent } from '../Constants';

import Loggr from '../loggr';
const console = Loggr.get('MarkovUpdater');

export class MarkovUpdater {
	public api: ComponentAPI;

	public name: string = 'MarkovUpdater';

	public dependencies: string[] = ['Discord'];
	public plugins: string[] = ['Sanitizer', 'Database'];

	@Variable({ type: VariableDefinitionType.ARRAY, name: 'loggedUsers' })
	private loggedUsers: string[];
	@Variable({ type: VariableDefinitionType.ARRAY, name: 'ignoredUsers' })
	private ignoredUsers: string[];

	public async onLoad() {
		console.init('MarkovUpdater loaded.');
	}

	@SubscribeEvent('Discord', DiscordEvent.MESSAGE_CREATE)
	private async handleMessageCreate(message: Message) {
		if (!(message.channel instanceof TextChannel)) return;
		if (!message.channel.guild) return;

		const author = message.author;
		if (author.bot) return;

		const db: any = this.api.getPlugin('Database');

		let userId: string = author.id;

		let cont: boolean = false;
		if (this.loggedUsers.find(u => u === author.id)) {
			cont = true;
		} else if (!this.ignoredUsers.find(u => u === author.id)) {
			try {
				const user = await db.findUserById(userId);
				if (user && user.loggingActive && user.active) {
					userId = user.userId;
					this.loggedUsers.push(author.id);
					cont = true;
				} else this.ignoredUsers.push(author.id);
			} catch (err) {
				console.error(err);
			}
		} else this.ignoredUsers.push(author.id);
		const sanitizer: any = this.api.getPlugin('Sanitizer');

		if (cont) {
			const formatted = sanitizer.sanitize(message.content);
			if (formatted.length > 0) {
				console.log('Inserting: ', author.username, '|', message.content);
				await db.user_line.create({
					userId: userId,
					messageId: message.id,
					rawMessage: message.content,
					formattedLines: formatted
				});

				this.api.emit('newLines', userId, formatted);
			}
		}

		// check #general of dbots
		await this.checkDbots(message);
	}

	private async checkDbots(message: Message) {
		if (message.channel.id === '110373943822540800') {
			const db: any = this.api.getPlugin('Database');
			const sanitizer: any = this.api.getPlugin('Sanitizer');

			const DBOTS_ID = '518070897295228959';
			let cont = false;
			let userId: string = DBOTS_ID;
			if (this.loggedUsers.find(u => u === DBOTS_ID)) {
				cont = true;
			} else if (!this.ignoredUsers.find(u => u === DBOTS_ID)) {
				try {
					const user = await db.findUserById(DBOTS_ID);
					if (user && user.loggingActive && user.active) {
						userId = user.userId;
						this.loggedUsers.push(DBOTS_ID);
						cont = true;
					} else this.ignoredUsers.push(DBOTS_ID);
				} catch (err) {
					console.error(err);
				}
			} else this.ignoredUsers.push(DBOTS_ID);

			if (cont) {
				const formatted = sanitizer.sanitize(message.content);
				if (formatted.length > 0) {
					console.log('Inserting', formatted, 'to DBOTS');
					await db.user_line.create({
						userId: DBOTS_ID,
						messageId: message.id,
						rawMessage: message.content,
						formattedLines: formatted
					});

					this.api.emit('newLines', DBOTS_ID, formatted);
				}
			}
		}
	}
}
