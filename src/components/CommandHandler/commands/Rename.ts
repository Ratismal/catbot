import {
  Component,
  ComponentAPI,
  Variable,
  VariableDefinitionType
} from '@ayana/bento';

import { CommandHandler } from '../CommandHandler';
import { Command, CommandExecute } from '../interfaces';

import Loggr from '../../../loggr';
const console = Loggr.get('C: Rename');

export class Alias implements Command {
  public api: ComponentAPI;
  public name: string = 'Rename';
  public desc: string = 'Renames an alias: `<name> <newName>`';

  public parent: Component = CommandHandler;
  public plugins: string[] = ['Database'];

  public command: string = 'rename';

  public prefix: boolean = true;

  public canExecute(arg: CommandExecute): boolean {
    return arg.author.id === '103347843934212096';
  }

  public async execute({ author, channel, args }: CommandExecute) {
    if (args.length !== 2) {
      await channel.createMessage('usage: rename <name> <newName>');
      return;
    }
    const db: any = this.api.getPlugin('Database');
    let name = args[0];
    let newAlias = args[1];

    let user = await db.findUser(name);

    if (!user) {
      await channel.createMessage('no markov found');
      return;
    }

    const e = await db.findUser(newAlias);
    if (e) {
      await channel.createMessage(`That name term is already being used in: '${e.name}'`);
      return;
    }

    let existing: string[] = user.get('aliases');
    if ((existing).find(a => a === newAlias)) {
      existing = existing.filter(a => a !== newAlias);
      user.set('aliases', existing);
    }

    let oldName = user.get('name');

    user.set('name', newAlias);

    await user.save();

    await channel.createMessage(`Set '${newAlias}' as the new name for '${oldName}'.`);
  }
}
