import * as Eris from 'eris';
import { User } from 'eris';

import {
	ComponentAPI,
	SubscribeEvent,
	Variable,
	VariableDefinitionType,
} from '@ayana/bento';

import { DiscordEvent } from '../Constants';

import Loggr from '../loggr';
const console = Loggr.get('Discord');

export class Discord {
	public api: ComponentAPI;
	public name: string = 'Discord';

	public client: Eris.Client = null;

	@Variable({ type: VariableDefinitionType.OBJECT, name: '_config' })
	private config: { [key: string]: any };

	public async onLoad() {
		console.log('Initializing discord...');
		this.client = new Eris.Client(this.config.token, {
			autoreconnect: true,
			firstShardID: 0,
			maxShards: 1,
			restMode: true
		});

		this.api.forwardEvents(this.client, Object.values(DiscordEvent));

		await this.client.connect();
	}

	public async onUnload() {
		this.client.disconnect({ reconnect: false });
		this.client.removeAllListeners();
		this.client = null;
	}

	public async getUser(id: string): Promise<User> {
		let user: User = this.client.users.get(id);
		if (!user) {
			user = await this.client.getRESTUser(id);
			this.client.users.set(user.id, user);
		}
		return user;
	}

	@SubscribeEvent(Discord, DiscordEvent.SHARD_READY)
	private handleReady(id: number) {
		console.shard('Shard %d Ready!', id);
	}

	@SubscribeEvent(Discord, DiscordEvent.SHARD_RESUME)
	private handleResume(id: number) {
		console.shard('Shard %d Resumed!', id);
	}

	@SubscribeEvent(Discord, DiscordEvent.SHARD_DISCONNECT)
	private handleDisconnect(id: number) {
		console.shard('Shard %d Disconnected!', id);
	}
}
