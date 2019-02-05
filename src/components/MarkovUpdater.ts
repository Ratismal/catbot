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
		console.init('MarkoveUpdater loaded.');
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
				const user = await db.findUser(userId);
				if (user) {
					userId = user.userId;
					this.loggedUsers.push(author.id);
					cont = true;
				}
			} catch (err) {
				console.error(err);
			}
		}

		if (cont) {
			const sanitizer: any = this.api.getPlugin('Sanitizer');
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
	}
}
