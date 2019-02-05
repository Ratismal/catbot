import {
	Member,
	Message,
	TextChannel,
	User,
} from 'eris';

export interface CommandExecute {
	message: Message;
	channel: TextChannel;
	author: Member | User;
	args: Array<string>;
}
