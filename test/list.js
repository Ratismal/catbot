const db = require('../models');

(async function () {
	const limit = 10;
	const page = 0;
	const users = await db.user.findAll({
		include: [
			{
				model: db.user_line,
				// attributes: ['userId', 'messageId']
			}
		],
		attributes: [
			// 'user.userId', 'name', 'aliases', 'idAliases'
			'user.*', 'user_lines.*',
			[db.sequelize.fn('COUNT', db.sequelize.col('user_lines.messageId')), 'lineSum'],
			// [db.sequelize.fn('COUNT', db.sequelize.col('user.userId')), 'totalCount']
		],
		// order: [
		// 	['lineSum', 'DESC']
		// ],
		// limit,
		// offset: limit * page,
		group: [db.sequelize.col('user.userId')]
	});
	console.dir(users.map(u => u.dataValues));
})();