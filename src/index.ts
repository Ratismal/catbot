import { Bento, FSComponentLoader } from '@ayana/bento';

import Loggr from './loggr';
const console = Loggr.get('Root');

import * as plugins from './plugins';
const bento = new Bento();
const config = require('../config.json');

(async () => {
	console.init('Setting initial variables...');
	bento.setVariable('_config', config);

	bento.setVariable('loggedUsers', []);
	bento.setVariable('ignoredUsers', []);

	bento.setVariable('prefix', config.prefix || 'cat');
	bento.setVariable('suffix', config.suffix || 'pls');

	console.init('Loading CatBot...');
	const fsloader = new FSComponentLoader();
	await fsloader.addDirectory(__dirname, 'components');

	const _plugins = Object.values(plugins).map(p => new p());

	await bento.addPlugins([fsloader, ..._plugins]);
	await bento.verify();
})().catch(err => {
	console.fatal('Error encountered while initializing Bento:', err);
	process.exit(1);
});
