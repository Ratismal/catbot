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

	private getGuilds(): Eris.Guild[] {
		return this.getClient().guilds.filter(g => this.storage.includes(g.id));
	}

	public findEmote(name: string): [Eris.Emoji, Eris.Guild] {
		const guilds = this.getGuilds();
		let emote: Eris.Emoji;
		for (const guild of guilds) {
			emote = guild.emojis.find(e => e.name.toLowerCase() === name.toLowerCase());
			if (emote) return [emote, guild];
		}
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
		const guilds = client.guilds.filter(g => this.storage.includes(g.id));
		let [emote]: any = this.findEmote(name);

		if (!emote) {
			const guild = guilds.find(g => g.emojis.length < 50);

			const b64 = await this.createImage(user.avatarURL);

			emote = await guild.createEmoji({
				name,
				image: b64
			});
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
}
