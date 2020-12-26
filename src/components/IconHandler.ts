import * as Eris from 'eris';

import {
	Component,
	ComponentAPI,
	FSComponentLoader,
	Plugin,
	SubscribeEvent,
	Variable,
	VariableDefinitionType
} from '@ayana/bento';

import Loggr from '../loggr';
import { join } from 'path';

const console = Loggr.get('IconHandler');
const snekfetch = require('snekfetch');
const Jimp = require('jimp');

const breakdownChannel = '792246302317477909';
const messageStorageMap: { [key: string]: string } = {
	'605825397535539204': '792246560695517184',
	'605825809487364097': '792246574142980126',
	'605825849492504595': '792246582187393055',
	'605825885102276609': '792246590172692529'
}

export class IconHandler {
	public api: ComponentAPI;

	public name: string = 'IconHandler';
	public dependencies: string[] = ['Discord'];


	@Variable({ type: VariableDefinitionType.ARRAY, name: 'storage' })
	private storage: string[];
	private mask: any;
	private client: Eris.Client;

	private getClient(): Eris.Client {
		if (!this.client) {
			const discord: any = this.api.getComponent('Discord');
			this.client = discord.client;
		}
		return this.client;
	}

	public getGuilds(): Eris.Guild[] {
		return this.getClient().guilds.filter(g => this.storage.includes(g.id));
	}

	public findEmote(name: string): [Eris.Emoji, Eris.Guild] {
		const guilds: Eris.Guild[] = this.getGuilds();
		let emote: Eris.Emoji;
		for (const guild of guilds) {
			emote = guild.emojis.find(e => e.name.toLowerCase() === name.toLowerCase());
			if (emote) return [emote, guild];
		}
		return [null, null];
	}

	onLoad() {
		Jimp.read(join(__dirname, '..', '..', 'res', 'mask.png')).then((img: any) => {
			img.resize(128, 128);
			this.mask = img;
		})
	}

	public async createImage(url: string): Promise<string> {
		const img = await Jimp.read({
			url
		});

		img.resize(128, 128);
		img.mask(this.mask, 0, 0);
		const b64: string = await img.getBase64Async(Jimp.MIME_PNG);

		return b64;
	}

	public async getIcon(name: string, user: Eris.User): Promise<string> {
		const client = this.getClient();
		const guilds = this.getGuilds();
		let [emote]: any = this.findEmote(name);

		if (!emote) {
			const guild = guilds.find(g => g.emojis.length < 50);

			const b64 = await this.createImage(user.avatarURL);

			emote = await guild.createEmoji({
				name,
				image: b64
			});
			await this.client.createMessage('792242766469267496', `<:${emote.name}:${emote.id}> ➡️ \`${guild.name}\``);
			await this.breakdown();
		}
		return emote ? `<:${emote.name}:${emote.id}>` : '';
	}

	public async getOutput(user: any, duser: any, text: string) {
		if (user.userId === '103347843934212096') {
			return text;
		} else {
			const icon = await this.getIcon(user.name, duser);
			let name = duser.username;
			if (user.showDiscrim) name += '#' + duser.discriminator;
			let lines = [`Well, ${user.name} once said...`];
			lines.push(`> ${icon}  **${name}**`);
			lines.push(`> ${text}`);
			return lines.join('\n');
		}
	}

	public async breakdown() {
		const guilds = this.getGuilds();

		for (const guild of guilds) {
			const emotes: string[] = guild.emojis.map(e => `<:${e.name}:${e.id}>`);
			const chunkedEmotes: string[][] = [];

			while (emotes.length > 0) {
				chunkedEmotes.push(emotes.splice(0, 10));
			}
			const emoteString: string = chunkedEmotes.map(emotes => emotes.join(' ')).join('\n');

			const content = `**${guild.name}**: ${guild.emojis.length} emote${emotes.length === 1 ? '' : 's'}\n${emoteString}`
			await this.client.editMessage(breakdownChannel, messageStorageMap[guild.id], content);
		}
	}
}
