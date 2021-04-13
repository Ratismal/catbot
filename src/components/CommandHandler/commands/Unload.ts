import {
    Component,
    ComponentAPI,
    Variable,
    VariableDefinitionType
} from '@ayana/bento';

import { CommandHandler } from '../CommandHandler';
import { Command, CommandExecute } from '../interfaces';

import Loggr from '../../../loggr';
import { MarkovBuilder } from '../../MarkovBuilder';
const console = Loggr.get('C: Toggle');

export class Unload implements Command {
    public api: ComponentAPI;
    public name: string = 'Unload';

    public desc: string = 'Unloads a markov: `<name>`';

    public parent: Component = CommandHandler;
    public plugins: string[] = ['Database', 'MarkovBuilder'];

    public command: string = 'unload';

    public prefix: boolean = true;


    public canExecute(arg: CommandExecute): boolean {
        return arg.author.id === '103347843934212096';
    }

    public async execute({ author, channel, args }: CommandExecute) {
        const db: any = this.api.getPlugin('Database');
        const builder = this.api.getComponent<MarkovBuilder>(MarkovBuilder);

        if (args.length !== 1) {
            await channel.createMessage('usage: catunload <name>');
            return;
        }

        const user = await db.findUser(args[0]);

        if (user) {
            builder.unloadMarkov(user.userId);
            await channel.createMessage(`${user.name} has been unloaded`);
        } else {
            await channel.createMessage('that user did not exist');
        }
    }
}
