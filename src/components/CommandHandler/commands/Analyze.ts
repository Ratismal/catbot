import { Component, ComponentAPI } from '@ayana/bento';

import { CommandHandler } from '../CommandHandler';
import { Command, CommandExecute } from '../interfaces';
import { MarkovBuilder } from '../../MarkovBuilder';

import Loggr from '../../../loggr';
const console = Loggr.get('C: List');

export class Info implements Command {
	public api: ComponentAPI;
	public name: string = 'Analyze';
	public desc: string = 'Analyzes your Markov';

	public parent: Component = CommandHandler;

	public plugins: string[] = ['Database'];

	public command: string = 'analyze';

	public prefix: boolean = true;

	public lastSent: { [key: string]: { date: number, id: string } };

	public async onLoad() {
		this.lastSent = {};
	}

	public canExecute(arg: CommandExecute): boolean {
		return true;
	}

	public async execute({ channel, args, author }: CommandExecute) {
		const db: any = this.api.getPlugin('Database');
		const discord: any = this.api.getComponent('Discord');


		const user = await db.findUserById(author.id);
		if (!user) {
			await channel.createMessage('You do not have a markov.');
			return;
		}
		const duser = await discord.getUser(user.userId);
		const builder = this.api.getComponent<MarkovBuilder>(MarkovBuilder);
		const markov = await builder.getOrCreateMarkov(user.userId);

		let out = ['Hmm, let me think about your markov...\n'];

		out.push(`I've seen you say ${markov.data.size - 2} different words.`);
		const keys = Array.from(markov.data.values());
		keys.sort((a: any, b: any) => {
			return b.parents.size - a.parents.size;
		});
		const topKeys = keys.slice(0, 5).map((k: any) => `\`${k.output[0]}\` (${k.parents.size})`);
		if (topKeys.length > 1) topKeys[topKeys.length - 1] = 'and ' + topKeys[topKeys.length - 1];
		out.push(`Your most popular words are ${topKeys.join(', ')}.\n`)

		const startTerms = Array.from(markov.startKey.links.values());
		out.push(`There are ${startTerms.length} ways that I could start a sentence.`);
		startTerms.sort((a: any, b: any) => {
			return b.associations - a.associations;
		});
		const top = startTerms.slice(0, 5).map((a: any) => `\`${a.keyRef.output[0]}\` (${a.associations})`);
		if (top.length > 1) top[top.length - 1] = 'and ' + top[top.length - 1];

		out.push(`The most common ways to start a sentence are ${top.join(', ')}.\n`);

		const endTerms = keys.filter((k: any) => {
			return k.links.has(3)
		});
		out.push(`There are ${endTerms.length} ways that I could end a sentence.`);
		endTerms.sort((a: any, b: any) => {
			return b.links.get(3).associations - a.links.get(3).associations;
		});
		const topEnd = endTerms.slice(0, 5).map((a: any) => `\`${a.output[0]}\` (${a.links.get(3).associations})`);
		if (topEnd.length > 1) topEnd[topEnd.length - 1] = 'and ' + topEnd[topEnd.length - 1];
		out.push(`The most common ways to end a sentence are ${topEnd.join(', ')}.\n`);

		out.push('I hope that was insightful!');

		await channel.createMessage(out.join('\n'));
	}
}
