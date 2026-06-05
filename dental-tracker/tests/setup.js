const db = require('../src/db/pool');

exports.mochaGlobalTeardown = async function () {
  await db.pool.end();
};
