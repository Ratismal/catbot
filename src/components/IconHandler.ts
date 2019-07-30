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
		return this.client.guilds.filter(g => this.storage.includes(g.id));
	}

	private findEmote(name: string): Eris.Emoji {
		const guilds = this.getGuilds();
		let emote: Eris.Emoji;
		for (const guild of guilds) {
			emote = guild.emojis.find(e => e.name.toLowerCase() === name.toLowerCase());
			if (emote) break;
		}
		return emote;
	}

	onLoad() {
		Jimp.read(join(__dirname, '..', '..', 'res', 'mask.png')).then((img: any) => {
			img.resize(128, 128);
			this.mask = img;
		})
	}

	public async getIcon(name: string, user: Eris.User): Promise<string> {
		const client = this.getClient();
		const guilds = client.guilds.filter(g => this.storage.includes(g.id));
		let emote: any = this.findEmote(name);

		if (!emote) {
			const guild = guilds.find(g => g.emojis.length < 50);

			const img = await Jimp.read({
				url: user.avatarURL
			});

			img.resize(128, 128);
			img.mask(this.mask, 0, 0);
			const b64: string = await img.getBase64Async(Jimp.MIME_PNG);

			emote = await guild.createEmoji({
				name,
				image: b64
			});
		}
		return emote ? `<:${emote.name}:${emote.id}>` : '';
	}
}
