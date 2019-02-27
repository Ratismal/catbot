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

export class Eval implements Command {
	public api: ComponentAPI;
	public name: string = 'Eval';

	public parent: Component = CommandHandler;
	public plugins: string[] = [];

	public command: string = 'eval';

	public prefix: boolean = true;

	public canExecute(arg: CommandExecute): boolean {
		return arg.author.id === '103347843934212096';
	}

    public async execute(arg: CommandExecute) {
        const bot = this.api.getComponent<CommandHandler>(CommandHandler).client;
        const db: any = this.api.getPlugin('Database');
        const client = bot;
        const msg = arg.message;
        let text = msg.content.split(' ').slice(1).join(' ');
		let resultString, result;
        let commandToProcess = text;
        if (commandToProcess.startsWith('```js') && commandToProcess.endsWith('```'))
            commandToProcess = commandToProcess.substring(6, commandToProcess.length - 3);
        else if (commandToProcess.startsWith('```') && commandToProcess.endsWith('```'))
            commandToProcess = commandToProcess.substring(4, commandToProcess.length - 3);
        try {
            let func;
            if (commandToProcess.split('\n').length === 1) {
                func = eval(`async () => ${commandToProcess}`);
            } else {
                func = eval(`async () => { ${commandToProcess} }`);
            }
            func.bind(this);
            let res = await func();
            result = res;
            resultString = `Input:
\`\`\`js
${commandToProcess}
\`\`\`
Output:
\`\`\`js
${res}
\`\`\``;
        } catch (err) {
            result = err;
            resultString = `An error occured!
\`\`\`js
${err.stack}
\`\`\``;
        }
        await arg.channel.createMessage(resultString);
	}
}
