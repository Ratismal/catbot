import {
  Component,
  ComponentAPI,
  Variable,
  VariableDefinitionType
} from '@ayana/bento';

import { CommandHandler } from '../CommandHandler';
import { Command, CommandExecute } from '../interfaces';

const Catflake = require('catflake');
const catflake = new Catflake();

import Loggr from '../../../loggr';
const console = Loggr.get('C: Export');

const snekfetch = require('snekfetch');

export class Export implements Command {
  public api: ComponentAPI;
  public name: string = 'Export';
  public desc: string = 'Exports a person\'s lines: `<name>`';

  public parent: Component = CommandHandler;
  public plugins: string[] = ['Database', 'Sanitizer'];
  public dependencies: string[] = ['MarkovBuilder'];

  public command: string = 'export';

  public prefix: boolean = true;

  @Variable({ type: VariableDefinitionType.ARRAY, name: 'loggedUsers' })
  private loggedUsers: string[];
  @Variable({ type: VariableDefinitionType.ARRAY, name: 'ignoredUsers' })
  private ignoredUsers: string[];

  public canExecute(arg: CommandExecute): boolean {
    return arg.author.id === '103347843934212096';
  }

  private async populate(user: string, lines: string[]) { }

  public async execute({ author, channel, args, argsPre }: CommandExecute) {
    const db: any = this.api.getPlugin('Database');
    const client = this.api.getComponent<CommandHandler>(CommandHandler).client;

    if (args.length !== 1) {
      await channel.createMessage('usage: export <name>');
      return;
    }

    const user = await db.findUserByName(args[0]);
    if (!user) {
      await channel.createMessage('no markov found');
      return;
    }

    try {
      const lines = await db.user_line.findAll({
        where: {
          userId: user.userId
        }
      });

      const file = lines.map((l: any) => ({ content: l.rawMessage }));

      const m = await channel.createMessage('Exported', {
        name: 'export.txt',
        file: Buffer.from(JSON.stringify(file), 'utf8')
      });
    } catch (err) {
      console.error(err, err.body ? err.body.toString() : null);
      await channel.createMessage(err.message);
    }
  }
}
