const db = require('../models');

(async function () {
	const limit = 1;
	const page = 0;
	const users = await db.user.findAndCountAll({
		attributes: {
			include: [
				[db.Sequelize.fn('COUNT', db.Sequelize.col('user.userId')), 'lineCount']
			],
		},
		include: [{
			model: db.user_line, attributes: []
		}],
		group: ['user.userId'],
		order: [
			[db.Sequelize.col('lineCount'), 'DESC']
		],
		limit,
		offset: limit * page,
		subQuery: false
	});
	console.dir(users.count);
	console.dir(users.rows.map(u => u.dataValues));
})().catch(err => {
	console.error(err.message,'\n', err.sql);	
});