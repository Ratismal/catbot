import {
	Component,
	ComponentAPI,
	FSComponentLoader,
	Plugin,
	SubscribeEvent,
	Variable,
	VariableDefinitionType
} from '@ayana/bento';

import { DiscordEvent } from '../Constants';

import Loggr from '../loggr';
const console = Loggr.get('MarkovBuilder');

const markov = require('markov');

export class MarkovBuilder {
	public api: ComponentAPI;

	public name: string = 'MarkovBuilder';

	public dependencies: string[] = ['MarkovUpdater'];
	public plugins: string[] = ['Database'];

	@Variable({ type: VariableDefinitionType.ARRAY, name: 'loggedUsers' })
	private loggedUsers: string[];
	@Variable({ type: VariableDefinitionType.ARRAY, name: 'ignoredUsers' })
	private ignoredUsers: string[];

	private markovs: {[key: string]: any};

	public getMarkov(userId: string) {
		return this.markovs[userId];
	}

	public async getOrCreateMarkov(userId: string) {
		if (this.markovs[userId]) {
			return this.markovs[userId];
		}

		await this.buildMarkov(userId);
		return this.markovs[userId];
	}

	public async onLoad() {
		this.markovs = {};
		console.init('MarkovBuilder loaded.');
	}

	private seed(userId: string, line: string): Promise<void> {
		return new Promise(res => {
			if (this.markovs[userId]) {
				this.markovs[userId].markov.seed(line, res);
			}
		});
	}

	private async buildMarkov(userId: string) {
		const db: any = this.api.getPlugin('Database');

		const user = await db.findUser(userId);

		console.info('Building the markov for \'%s\'', user.name);

		if (!user) throw Error('Markov did not exist.');

		const _markov = this.markovs[userId] = { names: [user.name, ...user.aliases], markov: markov(1) };
		const lines = await db.user_line.findAll({
			where: {
				userId
			}
		});

		console.log('Found', lines.length, 'records.');

		let i: number = 0;
		for (const line of lines) {
			for (const formatted of line.formattedLines) {
				_markov.markov.seed(formatted);
				// await this.seed(userId, formatted);
				if (++i % 1000 === 0) console.log('Seeded', i, 'lines.');
			}
		}
		console.log('Finished seeding.');
	}

	private async updateMarkov(userId: string, lines: string[]) {
		if (this.markovs[userId]) {
			for (const formatted of lines) {
				this.seed(userId, formatted);
			}
		}
	}

	@SubscribeEvent('MarkovUpdater', 'newLines')
	private async handleNewLines(userId: string, lines: string[]) {
		// only seed the chain if the markov has already been loaded
		// lets save on RAM usage!
		if (this.markovs[userId]) {
			this.updateMarkov(userId, lines);
		}
	}
}
