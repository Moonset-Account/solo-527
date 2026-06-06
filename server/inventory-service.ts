import { redis, withTransaction } from "./db.js";
import type { PoolClient } from "pg";

const LOCK_PREFIX = "inventory:lock:";
const LOCK_TIMEOUT = 30000;

export async function lockInventory(
  inventoryId: string,
  quantity: number,
  orderId: string
): Promise<boolean> {
  const lockKey = `${LOCK_PREFIX}${inventoryId}`;
  const lockValue = `${orderId}:${Date.now()}`;

  const acquired = await redis.set(lockKey, lockValue, "PX", LOCK_TIMEOUT, "NX");
  
  if (!acquired) {
    return false;
  }

  try {
    await withTransaction(async (client) => {
      const result = await client.query(
        `SELECT available_quantity FROM inventory WHERE id = $1 FOR UPDATE`,
        [inventoryId]
      );

      if (result.rows.length === 0) {
        throw new Error("Inventory not found");
      }

      const available = result.rows[0].available_quantity;
      if (available < quantity) {
        throw new Error("Insufficient inventory");
      }

      await client.query(
        `UPDATE inventory 
         SET available_quantity = available_quantity - $1,
             locked_quantity = locked_quantity + $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [quantity, inventoryId]
      );
    });

    return true;
  } catch (err) {
    await redis.del(lockKey);
    throw err;
  }
}

export async function confirmInventoryOutbound(
  inventoryId: string,
  quantity: number,
  client?: PoolClient
): Promise<void> {
  const query = client ? client.query.bind(client) : (await import("./db.js")).pool.query;
  
  await query(
    `UPDATE inventory 
     SET quantity = quantity - $1,
         locked_quantity = locked_quantity - $1,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $2`,
    [quantity, inventoryId]
  );

  await redis.del(`${LOCK_PREFIX}${inventoryId}`);
}

export async function unlockInventory(
  inventoryId: string,
  quantity: number,
  client?: PoolClient
): Promise<void> {
  const query = client ? client.query.bind(client) : (await import("./db.js")).pool.query;
  
  await query(
    `UPDATE inventory 
     SET available_quantity = available_quantity + $1,
         locked_quantity = locked_quantity - $1,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $2`,
    [quantity, inventoryId]
  );

  await redis.del(`${LOCK_PREFIX}${inventoryId}`);
}

export async function returnInventory(
  inventoryId: string,
  quantity: number,
  client?: PoolClient
): Promise<void> {
  const query = client ? client.query.bind(client) : (await import("./db.js")).pool.query;
  
  await query(
    `UPDATE inventory 
     SET quantity = quantity + $1,
         available_quantity = available_quantity + $1,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $2`,
    [quantity, inventoryId]
  );
}
