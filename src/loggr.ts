import CatLoggr, { LoggrConfig, LogLevel } from 'cat-loggr/ts';
import chalk from 'chalk';

export default class Loggr extends CatLoggr {
	name: string = 'Loggr';

	static get(name?: string): Loggr {
		const config: LoggrConfig = DefaultLoggrConfig(name);
		return new Loggr(config);
	}
}

export function DefaultLoggrConfig(name?: string): LoggrConfig {
	return new LoggrConfig({
		level: 'debug',
		shardLength: 20,
		shardId: name || 'Generic',
		levels: [
			new LogLevel('fatal', chalk.red.bgBlack).setError(true),
			new LogLevel('error', chalk.black.bgRed).setError(true),
			new LogLevel('warn', chalk.black.bgYellow).setError(true),
			new LogLevel('trace', chalk.green.bgBlack).setTrace(true),
			new LogLevel('shard', chalk.black.bgYellow),
			new LogLevel('init', chalk.black.bgBlue),
			new LogLevel('info', chalk.black.bgGreen),
			new LogLevel('verbose', chalk.black.bgCyan),
			new LogLevel('debug', chalk.magenta.bgBlack).setAliases('log', 'dir'),
			new LogLevel('database', chalk.green.bgBlack)
		]
	});
}
