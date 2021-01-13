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
    public name: string = 'Remove';

    public desc: string = 'Remove a markov: `<name>`';

    public parent: Component = CommandHandler;
    public plugins: string[] = ['Database'];

    public command: string = 'remove';

    public prefix: boolean = true;
    public confirm: string = null;

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
        const discord: any = this.api.getComponent('Discord');

        if (args.length !== 1) {
            await channel.createMessage('usage: catremove <name>');
            return;
        }

        const user = await db.findUser(args[0]);
        if (!user) {
            return await channel.createMessage('not a user dummy');
        }
        const duser = await discord.getUser(user.userId);
        if (this.confirm !== user.userId) {
            this.confirm = user.userId;
            setTimeout(() => {
                if (this.confirm === user.userId) {
                    this.confirm = null;
                }
            }, 60 * 1000);
            return await channel.createMessage(`I hear you saying that you want me to delete ${duser.username}#${duser.discriminator} (${duser.id}).`
                + '\n\nPlease be aware that this is a destructive operation with NO UNDO.'
                + '\n\nContinuing will delete this user\'s:\n- logged messages\n- profile'
                + '\n\nIf this is what you wanna do, run the command again.');
        }


        await db.user_line.destroy({
            where: {
                userId: user.userId
            }
        });

        await db.user.destroy({
            userId: user.userId,
        });

        while (this.loggedUsers.includes(user.userId)) {
            this.loggedUsers.splice(this.ignoredUsers.indexOf(user.userId), 1);
        }

        await channel.createMessage('ok, they are gone forever');
    }
}
