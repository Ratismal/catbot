import * as Eris from 'eris';

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

	private cli: Eris.Client = null;

	@Variable({ type: VariableDefinitionType.OBJECT, name: '_config' })
	private config: { [key: string]: any };

	public async onLoad() {
		console.log('Initializing discord...');
		this.cli = new Eris.Client(this.config.token, {
			autoreconnect: true,
			firstShardID: 0,
			maxShards: 1
		});

		this.api.forwardEvents(this.cli, Object.values(DiscordEvent));

		await this.cli.connect();
	}

	public async onUnload() {
		this.cli.disconnect({ reconnect: false });
		this.cli.removeAllListeners();
		this.cli = null;
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
