import { Bento, FSComponentLoader } from '@ayana/bento';

const CatLoggr = require('cat-loggr');

const loggr = new CatLoggr({
  level: 'debug',
  levels: [
    { name: 'fatal', color: CatLoggr._chalk.red.bgBlack, err: true },
    { name: 'error', color: CatLoggr._chalk.black.bgRed, err: true },
    { name: 'warn', color: CatLoggr._chalk.black.bgYellow, err: true },
    { name: 'trace', color: CatLoggr._chalk.green.bgBlack, trace: true },
    { name: 'info', color: CatLoggr._chalk.black.bgGreen },
    { name: 'verbose', color: CatLoggr._chalk.black.bgCyan },
    { name: 'debug', color: CatLoggr._chalk.magenta.bgBlack, aliases: ['log', 'dir'] },
    { name: 'database', color: CatLoggr._chalk.green.bgBlack }
  ]
}).setGlobal();

const bento = new Bento();

(async () => {
  const fsloader = new FSComponentLoader();
  await fsloader.addDirectory(__dirname, 'components');

  await bento.addPlugin(fsloader);
  await bento.verify();
})().catch(err => {
  console.error('Error encountered while initializing Bento:', err);
  process.exit(1);
});
