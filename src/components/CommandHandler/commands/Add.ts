import {
    Component,
    ComponentAPI,
    Variable,
    VariableDefinitionType
} from '@ayana/bento';

import { CommandHandler } from '../CommandHandler';
import { Command, CommandExecute } from '../interfaces';

import Loggr from '../../../loggr';
const console = Loggr.get('C: Toggle');

export class Add implements Command {
    public api: ComponentAPI;
    public name: string = 'Add';

    public desc: string = 'Adds a markov: `<id> <name>`';

    public parent: Component = CommandHandler;
    public plugins: string[] = ['Database'];

    public command: string = 'add';

    public prefix: boolean = true;

    @Variable({ type: VariableDefinitionType.ARRAY, name: 'loggedUsers' })
    private loggedUsers: string[];
    @Variable({ type: VariableDefinitionType.ARRAY, name: 'ignoredUsers' })
    private ignoredUsers: string[];

    public canExecute(arg: CommandExecute): boolean {
        return arg.author.id === '103347843934212096';
    }

    public async execute({ author, channel, args }: CommandExecute) {
        const db: any = this.api.getPlugin('Database');
        const client = this.api.getComponent<CommandHandler>(CommandHandler).client;

        if (args.length !== 2) {
            await channel.createMessage('usage: catadd <id> <name>');
            return;
        }
        let id = args[0];
        try {
            await client.getRESTUser(id);
        } catch (err) {
            await channel.createMessage('not a user dummy');
            return;
        }
        let name = args[1].toLowerCase();

        await db.user.create({
            userId: id,
            name: name
        });

        if (this.ignoredUsers.includes(id)) {
            this.ignoredUsers.splice(this.ignoredUsers.indexOf(id), 1);
        }

        await channel.createMessage('ok');
    }
}
