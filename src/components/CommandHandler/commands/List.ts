import { Component, ComponentAPI } from '@ayana/bento';

import { CommandHandler } from '../CommandHandler';
import { Command, CommandExecute } from '../interfaces';

import Loggr from '../../../loggr';
const console = Loggr.get('C: List');

export class List implements Command {
	public api: ComponentAPI;
	public name: string = 'List';

	public parent: Component = CommandHandler;

	public plugins: string[] = ['Database'];

	public command: string = 'list';

	public prefix: boolean = true;

	public lastSent: { [key: string]: { date: number, id: string } };

	public async onLoad() {
		this.lastSent = {};
	}

	public async execute({ channel, args }: CommandExecute) {
		const db: any = this.api.getPlugin('Database');
		const discord: any = this.api.getComponent('Discord');

		const page = args[0] ? Number(args[0]) - 1 : 0;
		const limit = 10;
		const res = await db.user.findAndCountAll({
			attributes: {
				include: [
					[db.Sequelize.fn('COUNT', db.Sequelize.col('user.userId')), 'lineCount']
				],
			},
			include: [{
				model: db.user_line, attributes: []
			}],
			group: ['user.userId'],
			order: [
				[db.Sequelize.col('lineCount'), 'DESC']
			],
			limit,
			offset: limit * page,
			subQuery: false
		});
		const total: number = res.count.length;
		const users: any[] = res.rows;
		const pages: number = Math.ceil(total / limit);
		let output: string[] = [];
		let lengths = {
			name: 0,
			lines: 0,
			uses: 0
		}
		let userNames: {[key: string]: string} = {};
		for (const user of users) {
			const duser = await discord.getUser(user.userId);
			if (duser) {
				userNames[user.userId] = `${user.name} (${duser.username}#${duser.discriminator})`;
			} else {
				userNames[user.userId] = `${user.name} (unknown#0000)`;
			}

			if (userNames[user.userId].length > lengths.name) {
				lengths.name = userNames[user.userId].length;
			}
			if (user.uses.toString().length > lengths.uses) {
				lengths.uses = user.uses.toString().length;
			}
			if (user.dataValues.lineCount.length > lengths.lines) {
				lengths.lines = user.dataValues.lineCount.length;
			}
		}
		output.push(`I've markoved the following people:`, '```');
		for (const user of users) {
			output.push(`${userNames[user.userId].padEnd(lengths.name, ' ')} | ${user.dataValues.lineCount.padStart(lengths.lines, ' ')} lines | ${user.uses.toString().padStart(lengths.uses, ' ')} uses`);
		}
		output.push('```', `Page **${page + 1}**/**${pages}**`);

		let key = `${channel.guild.id}.${channel.id}`;
		if (this.lastSent[key]) {
			if (Date.now() - this.lastSent[key].date <= 60000) {
				await channel.deleteMessage(this.lastSent[key].id);
			}
		} 
		const msg = await channel.createMessage(output.join('\n'));
		this.lastSent[key] = {date: Date.now(), id: msg.id};
		// console.meta({ depth: 5 }).log(users.map(u => u.dataValues));
	}
}
