const db = require('../src/db/pool');

after(async () => {
  await db.pool.end();
});
