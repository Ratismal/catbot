import * as Eris from 'eris';
import * as config from '../../config.json';

import {
  ComponentAPI,
  SubscribeEvent,
  Variable,
  VariableDefinitionType,
} from '@ayana/bento';

import { DiscordEvent } from '../Constants';

export class DiscordComponent {
  public api: ComponentAPI;
  public name: string = 'DiscordComponent';

  private cli: Eris.Client = null;

  private token: string = config.token;

  public async onLoad() {
    console.log('Initializing discord...');
    this.cli = new Eris.Client(this.token, {
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

  @SubscribeEvent(DiscordComponent, DiscordEvent.SHARD_READY)
  private handleReady(id: number) {
    console.info('Shard %d Ready!', id);
  }

  @SubscribeEvent(DiscordComponent, DiscordEvent.SHARD_RESUME)
  private handleResume(id: number) {
    console.info('Shard %d Resumed!', id);
  }

  @SubscribeEvent(DiscordComponent, DiscordEvent.SHARD_DISCONNECT)
  private handleDisconnect(id: number) {
    console.info('Shard %d Disconnected!', id);
  }
}