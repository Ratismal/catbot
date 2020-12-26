import { Component, ComponentAPI } from '@ayana/bento';

import { CommandHandler } from '../CommandHandler';
import { Command, CommandExecute } from '../interfaces';

import Loggr from '../../../loggr';
const console = Loggr.get('C: Icon');

export class Icon implements Command {
	public api: ComponentAPI;
	public name: string = 'Icon';
	public desc: string = 'Sets your markov\'s icon: `[url]`';

	public parent: Component = CommandHandler;

	public plugins: string[] = ['Database', 'IconHandler'];

	public command: string = 'icon';

	public prefix: boolean = true;

	public async onLoad() {
	}

	public canExecute(arg: CommandExecute): boolean {
		return true;
	}

	public async execute({ message, author, channel, args }: CommandExecute) {
		const db: any = this.api.getPlugin('Database');
		const discord: any = this.api.getComponent('Discord');
		const iconHandler: any = this.api.getComponent('IconHandler');

		const user = await db.findUserById(author.id);
		if (!user) {
			await channel.createMessage('You do not have a markov.');
			return;
		}
		const duser = await discord.getUser(user.userId);

		const name: string = user.name;

		const [oldEmote, guild]: any = iconHandler.findEmote(name);

		console.log(oldEmote);
		let url;
		if (message.attachments.length > 0) url = message.attachments[0].url;
		else url = args[0] || duser.avatarURL;

		try {
			const image = await iconHandler.createImage(url);
			const g2: any = iconHandler.getGuilds().find((g: any) => g.emojis.length < 50);
			const emote: any = await g2.createEmoji({
				name, image
			});
			await discord.client.createMessage('792242766469267496', `📩 <:emote:${emote.id}> ➡️ \`${g2.name}\``);

			let old = '\u274c';
			if (oldEmote) old = `<:old:${oldEmote.id}>`;
			const lines = [
				'I have updated your icon:', old, '\u27A1', `<:new:${emote.id}>`
			];

			await channel.createMessage(lines.join(' '));
			if (oldEmote) {
				await guild.deleteEmoji(oldEmote.id);
				await discord.client.createMessage('792242766469267496', `🪦 <:emote:${emote.id}> ➡️ \`${guild.name}\``);
			}
		} catch (err) {
			console.error(err);
			await channel.createMessage('I was unable to update your icon. Please send me a valid link to an image!');
		}
	}
}
