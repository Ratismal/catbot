export enum DiscordEvent {
	// Shard events
	SHARD_READY = 'shardReady',
	SHARD_RESUME = 'shardResume',
	SHARD_DISCONNECT = 'shardDisconnect',

	// Guild events
	GUILD_CREATE = 'guildCreate',
	GUILD_DELETE = 'guildDelete',
	GUILD_UPDATE = 'guildUpdate',

	// Message events
	MESSAGE_CREATE = 'messageCreate',
}
