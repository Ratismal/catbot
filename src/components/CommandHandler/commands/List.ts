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

	public lastSent: { [key: string]: string };

	public async onLoad() {
		this.lastSent = {};
	}

	public async execute({ channel, args }: CommandExecute) {
		const db: any = this.api.getPlugin('Database');
		const page = Number(args[0]) + 1;
		const limit = 10;
		const users: any[] = await db.user.findAll({
			include: [{
				model: db.user_line,
				where: { userId: db.sequelize.col('user.userId') },
				attributes: [
					[db.sequelize.fn('array_length', db.sequelize.col('formattedLines')), 'lineCount']
				]
			}],
			attributes: {
				include: [
					[db.sequelize.fn('SUM', db.sequelize.col('lineCount')), 'lineSum'],
					[db.sequelize.fn('COUNT', db.sequelize.col('user.userId')), 'totalCount']
				]
			},
			order: [
				['lineSum', 'DESC']
			],
			limit,
			offset: limit * page
		});
		console.meta({ depth: 5 }).log(users.map(u => u.dataValues));
	}
}
