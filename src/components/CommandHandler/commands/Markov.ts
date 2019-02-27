import { Component, ComponentAPI } from '@ayana/bento';

import { CommandHandler } from '../CommandHandler';
import { Command, CommandExecute } from '../interfaces';

import Loggr from '../../../loggr';
const console = Loggr.get('C: MarkovDesc');

export class Markov implements Command {
	public api: ComponentAPI;
	public name: string = 'Markov';

	public parent: Component = CommandHandler;

	public command: string = 'markov';

	public prefix: boolean = true;

	public canExecute(arg: CommandExecute): boolean {
		return true;
	}

	public async execute({ channel }: CommandExecute) {
		await channel.createMessage(`I'll explain how a markov chain works.
\`\`\`Look at the banana.
Apples are the best!\`\`\`
A markov generates chains by first breaking a sentence into words, and then comparing what words follow what words. This gives it a grasp on a person's speech patterns. For example, the previous sentences would generate these chains:
\`\`\`(beginning of sentence): look, apples
look: at
at: the
the: banana, best
banana: (end of sentence)
apples: are
are: the
best: (end of sentence)\`\`\`
So from that, a markov chain could generate
\`\`\`Apples are the banana.\`\`\`
It could also generate
\`\`\`Look at the best!\`\`\`
It doesn't look at your sentences as a whole, but the pattern of your speech.`);
	}
}
