import {
  Component,
  ComponentAPI,
  Variable,
  VariableDefinitionType
} from '@ayana/bento';

import { CommandHandler } from '../CommandHandler';
import { Command, CommandExecute } from '../interfaces';

export class Toggle implements Command {
  public api: ComponentAPI;
  public name: string = 'Storage';
  public desc: string = 'Gives an invite to my emote storage guilds!';

  public parent: Component = CommandHandler;

  public command: string = 'storage';

  public prefix: boolean = true;

  public canExecute(arg: CommandExecute): boolean {
    return true;
  }

  public async execute({ author, channel, args }: CommandExecute) {
    await channel.createMessage('You want access to my emote storage guild? Well, alright... but it\'s run by a real grumpy pants! https://discord.gg/r4KuX2GUha')
  }
}
