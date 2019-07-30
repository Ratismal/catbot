import { Bento, FSComponentLoader } from '@ayana/bento';

import Loggr from './loggr';
const console = Loggr.get('Root');

import * as plugins from './plugins';
const bento = new Bento();
const config = require('../config.json');

(async () => {
	console.init('Setting initial variables...');
	bento.setVariable('_config', config);

	bento.setVariable('storage', config.storage || []);
	bento.setVariable('loggedUsers', []);

	bento.setVariable('ignoredUsers', []);
	bento.setVariable('aliasedUsers', []);

	bento.setVariable('prefix', config.prefix || 'cat');
	bento.setVariable('suffix', config.suffix || 'pls');

	console.init('Loading CatBot...');

	console.init('Loading component loader...');
	const fsloader = new FSComponentLoader();
	await fsloader.addDirectory(__dirname, 'components');

	console.init('Loading plugins...');
	const _plugins = Object.values(plugins).map(p => new p());

	console.init('Adding plugins...');
	await bento.addPlugins([fsloader, ..._plugins]);
	console.init('Verifying...');
	await bento.verify();
	console.init('Done!');
})().catch(err => {
	console.init('Initialization failed.');
	console.fatal('Error encountered while initializing Bento:', err);
	process.exit(1);
});
