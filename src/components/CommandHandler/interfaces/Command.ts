import { Component } from '@ayana/bento';
import { CommandExecute } from './CommandExecute';

export interface Command extends Component {
	command: string;
	execute(arg?: CommandExecute): Promise<void>;
	prefix: boolean;
	canExecute(arg?: CommandExecute): boolean;
}
