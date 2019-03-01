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

export class Alias implements Command {
	public api: ComponentAPI;
	public name: string = 'Alias';

	public parent: Component = CommandHandler;
	public plugins: string[] = ['Database'];

	public command: string = 'alias';

	public prefix: boolean = true;

	@Variable({ type: VariableDefinitionType.ARRAY, name: 'loggedUsers' })
	private loggedUsers: string[];
	@Variable({ type: VariableDefinitionType.ARRAY, name: 'ignoredUsers' })
	private ignoredUsers: string[];
    @Variable({ type: VariableDefinitionType.ARRAY, name: 'aliasedUsers' })
    private aliasedUsers: { [key: string]: string };
    
	public canExecute(arg: CommandExecute): boolean {
		return arg.author.id === '103347843934212096';
	}

	public async execute({ author, channel, args }: CommandExecute) {
        if (args.length !== 2) {
            await channel.createMessage('usage: alias <name> <newAlias>');
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

        let idAlias = /^\d+$/.test(newAlias);
        
        let removed = false;
        let existing: string[] = user.get(idAlias ? 'idAliases' : 'aliases');
        if ((existing).find(a => a === newAlias)) {
            existing = existing.filter(a => a !== newAlias);
            removed = true;
        } else {
            existing.push(newAlias);
        }

        if (!removed) {
            const e = await db[idAlias ? 'findUserById' : 'findUserByName'](newAlias);
            if (e) {
                await channel.createMessage(`That alias term is already being used in: '${e.name}'`);
                return;
            }
        }

        if (idAlias) {
            if (!removed) {
                this.aliasedUsers[newAlias] = user.userId;
            } else {
                delete this.aliasedUsers[newAlias];
            }
        }

        
        user.set(idAlias ? 'idAliases' : 'aliases', existing);
        await user.save();

        await channel.createMessage(`${removed ? 'Removed' : 'Added'} '${newAlias}' as an ${idAlias ? 'ID' : ''} alias for '${user.name}'.`);
	}
}
