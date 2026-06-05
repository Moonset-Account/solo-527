async function createNotification(client, { type, title, content, target_role_id, target_operator_id }) {
  await client.query(
    `INSERT INTO notifications (type, title, content, target_role_id, target_operator_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [type, title, content, target_role_id || null, target_operator_id || null]
  );
}

module.exports = { createNotification };
