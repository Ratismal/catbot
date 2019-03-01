import { Component, ComponentAPI } from '@ayana/bento';

import { CommandHandler } from '../CommandHandler';
import { Command, CommandExecute } from '../interfaces';

import Loggr from '../../../loggr';
const console = Loggr.get('C: List');

export class Info implements Command {
	public api: ComponentAPI;
	public name: string = 'Info';

	public parent: Component = CommandHandler;

	public plugins: string[] = ['Database'];

	public command: string = 'info';

	public prefix: boolean = true;

	public lastSent: { [key: string]: { date: number, id: string } };

	public async onLoad() {
		this.lastSent = {};
	}

	public canExecute(arg: CommandExecute): boolean {
		return true;
	}

	public async execute({ channel, args }: CommandExecute) {
		const db: any = this.api.getPlugin('Database');
		const discord: any = this.api.getComponent('Discord');

        const user = await db.findUserByName(args[0]);
        const duser = await discord.getUser(user.userId);

		const res = await db.user_line.findAndCountAll({
			where: {
                userId: user.userId
			},
        });
        const count = res.count;
        const description: { [key: string]: string | number | boolean } = {};
        
        description['Markov Name'] = `\`${user.name}\``;
        if (user.aliases.length > 0)
            description['Aliases'] = (<string[]> user.aliases).map(a => `\`${a}\``).join(', ');
        if (user.idAliases.length > 0)
            description['Alternate IDs'] = user.idAliases.join(', ');
        description['Uses'] = user.uses;
        description['Lines'] = count;
        description['Discrim Shown'] = user.showDiscrim;
        description['Logging Active'] = user.loggingActive;
        description['Active'] = user.active;
        
        await channel.createMessage({
            content: `Information about '${args[0].toLowerCase()}':`,
            embed: {
                author: {
                    name: `${duser.username}#${duser.discriminator}`,
                    icon_url: duser.avatarURL
                },
                description: Object.keys(description).map((key) => `**${key}**: ${description[key]}`).join('\n')
            }
        });
	}
}
