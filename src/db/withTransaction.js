const pool = require('./pool');

/**
 * Runs `work(connection)` inside a transaction.
 * Commits on success, rolls back on any thrown error, always releases the connection.
 */
async function withTransaction(work) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

module.exports = { withTransaction };
