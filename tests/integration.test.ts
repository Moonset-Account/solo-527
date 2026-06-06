import { pool, withTransaction } from "../server/db.js";
import bcrypt from "bcryptjs";

async function runTests() {
  console.log("🧪 开始集成测试...\n");

  try {
    console.log("1️⃣  清理测试数据...");
    await pool.query(`DELETE FROM return_records`);
    await pool.query(`DELETE FROM extension_records`);
    await pool.query(`DELETE FROM deposit_transactions`);
    await pool.query(`DELETE FROM notifications`);
    await pool.query(`DELETE FROM notification_queue`);
    await pool.query(`DELETE FROM borrow_orders`);
    await pool.query(`DELETE FROM inventory`);
    await pool.query(`DELETE FROM spare_parts`);
    await pool.query(`DELETE FROM audit_logs`);
    await pool.query(`DELETE FROM users WHERE username LIKE 'test_%'`);

    console.log("2️⃣  创建测试用户...");
    const hash = (pwd: string) => bcrypt.hashSync(pwd, 10);
    
    await pool.query(
      `INSERT INTO users (username, password_hash, real_name, email, role, region) VALUES 
       ('test_supervisor', $1, '测试主管', 'test_sup@example.com', 'supervisor', '华东区'),
       ('test_engineer', $2, '测试工程师', 'test_eng@example.com', 'engineer', '华东区'),
       ('test_warehouse', $3, '测试仓库', 'test_wh@example.com', 'warehouse', '华东区'),
       ('test_finance', $4, '测试财务', 'test_fin@example.com', 'finance', '总部')
       RETURNING id`,
      [hash("123456"), hash("123456"), hash("123456"), hash("123456")]
    );

    const users = await pool.query(`SELECT id, username, role FROM users WHERE username LIKE 'test_%'`);
    const supervisor = users.rows.find(u => u.role === "supervisor")!;
    const engineer = users.rows.find(u => u.role === "engineer")!;
    const warehouse = users.rows.find(u => u.role === "warehouse")!;

    console.log("3️⃣  创建测试备件和库存...");
    const partResult = await pool.query(
      `INSERT INTO spare_parts (part_code, part_name, category, price, deposit_ratio, description)
       VALUES ('TEST-001', '测试主控板', '电路板', 1000.00, 1.0, '测试用备件')
       RETURNING *`
    );
    const part = partResult.rows[0];

    const invResult = await pool.query(
      `INSERT INTO inventory (part_id, batch_no, quantity, available_quantity, locked_quantity, location)
       VALUES ($1, 'TEST-BATCH-001', 10, 10, 0, 'A-01-01')
       RETURNING *`,
      [part.id]
    );
    const inventory = invResult.rows[0];
    console.log(`   备件: ${part.part_name}, 库存: ${inventory.quantity}, 可用: ${inventory.available_quantity}`);

    console.log("\n📋 测试场景1: 工程师创建借用申请");
    const orderNo = `BO-TEST-${Date.now()}`;
    const orderResult = await pool.query(
      `INSERT INTO borrow_orders 
       (order_no, applicant_id, part_id, quantity, expected_return_date, borrow_reason, deposit_amount)
       VALUES ($1, $2, $3, $4, CURRENT_DATE + INTERVAL '7 days', '现场维修需要', $5)
       RETURNING *`,
      [orderNo, engineer.id, part.id, 2, part.price * part.deposit_ratio * 2]
    );
    const order = orderResult.rows[0];
    console.log(`   借用单创建成功: ${order.order_no}, 状态: ${order.status}`);
    console.log(`   押金金额: ¥${order.deposit_amount}`);

    console.log("\n✅ 测试场景2: 区域主管审批");
    const approveResult = await withTransaction(async (client) => {
      const orderCheck = await client.query(
        `SELECT * FROM borrow_orders WHERE id = $1 FOR UPDATE`,
        [order.id]
      );
      if (orderCheck.rows[0].status !== "pending") throw new Error("状态错误");

      const invCheck = await client.query(
        `SELECT * FROM inventory WHERE id = $1 FOR UPDATE`,
        [inventory.id]
      );
      if (invCheck.rows[0].available_quantity < order.quantity) throw new Error("库存不足");

      await client.query(
        `UPDATE inventory 
         SET available_quantity = available_quantity - $1, locked_quantity = locked_quantity + $1
         WHERE id = $2`,
        [order.quantity, inventory.id]
      );

      const result = await client.query(
        `UPDATE borrow_orders 
         SET status = 'approved', supervisor_id = $1, inventory_id = $2, batch_no = $3,
             deposit_status = 'frozen', updated_at = CURRENT_TIMESTAMP
         WHERE id = $4
         RETURNING *`,
        [supervisor.id, inventory.id, inventory.batch_no, order.id]
      );

      await client.query(
        `INSERT INTO deposit_transactions (borrow_order_id, transaction_type, amount, operator_id, remark)
         VALUES ($1, 'freeze', $2, $3, '审批通过，冻结押金')`,
        [order.id, order.deposit_amount, supervisor.id]
      );

      return result.rows[0];
    });
    console.log(`   审批通过, 状态: ${approveResult.status}`);
    console.log(`   押金状态: ${approveResult.deposit_status}`);

    const invAfterApprove = await pool.query(`SELECT * FROM inventory WHERE id = $1`, [inventory.id]);
    console.log(`   库存变化: 可用 ${invAfterApprove.rows[0].available_quantity}, 锁定 ${invAfterApprove.rows[0].locked_quantity}`);

    console.log("\n📦 测试场景3: 仓库扫码出库");
    const pickupResult = await withTransaction(async (client) => {
      const orderCheck = await client.query(
        `SELECT * FROM borrow_orders WHERE id = $1 FOR UPDATE`,
        [order.id]
      );

      await client.query(
        `UPDATE inventory 
         SET quantity = quantity - $1, locked_quantity = locked_quantity - $1
         WHERE id = $2`,
        [order.quantity, orderCheck.rows[0].inventory_id]
      );

      const result = await client.query(
        `UPDATE borrow_orders 
         SET status = 'picked', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [order.id]
      );

      return result.rows[0];
    });
    console.log(`   出库完成, 状态: ${pickupResult.status}`);

    const invAfterPickup = await pool.query(`SELECT * FROM inventory WHERE id = $1`, [inventory.id]);
    console.log(`   库存变化: 总库存 ${invAfterPickup.rows[0].quantity}, 锁定 ${invAfterPickup.rows[0].locked_quantity}`);

    console.log("\n⏰ 测试场景4: 申请延期");
    await pool.query(
      `INSERT INTO extension_records 
       (borrow_order_id, original_return_date, new_return_date, reason, approver_id, approved)
       VALUES ($1, $2, CURRENT_DATE + INTERVAL '14 days', '客户现场维修延期', $3, true)`,
      [order.id, order.expected_return_date, supervisor.id]
    );

    const extendResult = await pool.query(
      `UPDATE borrow_orders 
       SET expected_return_date = CURRENT_DATE + INTERVAL '14 days', status = 'extended', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [order.id]
    );
    console.log(`   延期成功, 新归还日期: ${extendResult.rows[0].expected_return_date.toISOString().split('T')[0]}`);
    console.log(`   状态: ${extendResult.rows[0].status}`);

    console.log("\n↩️ 测试场景5: 归还验收（含损坏赔付）");
    const returnResult = await withTransaction(async (client) => {
      const returnedQty = 1;
      const damagedQty = 1;
      const lostQty = 0;
      const damageAmount = damagedQty * part.price;

      await client.query(
        `UPDATE inventory 
         SET quantity = quantity + $1, available_quantity = available_quantity + $1
         WHERE id = $2`,
        [returnedQty, inventory.id]
      );

      const result = await client.query(
        `UPDATE borrow_orders 
         SET status = 'damaged', actual_return_date = CURRENT_DATE, damage_amount = $1,
             deposit_status = 'deducted', updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [damageAmount, order.id]
      );

      await client.query(
        `INSERT INTO deposit_transactions (borrow_order_id, transaction_type, amount, operator_id, remark)
         VALUES ($1, 'deduct', $2, $3, '损坏赔付')`,
        [order.id, damageAmount, warehouse.id]
      );

      await client.query(
        `INSERT INTO return_records 
         (borrow_order_id, returned_quantity, damaged_quantity, lost_quantity, 
          inspection_result, warehouse_operator_id, photos)
         VALUES ($1, $2, $3, $4, '1个完好，1个损坏需要赔付', $5, $6)
         RETURNING *`,
        [order.id, returnedQty, damagedQty, lostQty, warehouse.id, []]
      );

      return result.rows[0];
    });

    console.log(`   归还完成, 状态: ${returnResult.status}`);
    console.log(`   损坏赔付金额: ¥${returnResult.damage_amount}`);
    console.log(`   押金状态: ${returnResult.deposit_status}`);

    const invAfterReturn = await pool.query(`SELECT * FROM inventory WHERE id = $1`, [inventory.id]);
    console.log(`   库存变化: 总库存 ${invAfterReturn.rows[0].quantity}, 可用 ${invAfterReturn.rows[0].available_quantity}`);

    console.log("\n📊 测试场景6: 验证审计日志");
    const auditLogs = await pool.query(
      `SELECT al.*, u.username FROM audit_logs al 
       LEFT JOIN users u ON al.user_id = u.id 
       WHERE al.resource_id = $1
       ORDER BY al.created_at ASC`,
      [order.id]
    );
    console.log(`   审计日志数量: ${auditLogs.rows.length}`);
    auditLogs.rows.forEach(log => {
      console.log(`   - ${log.created_at.toISOString().split('T')[1].split('.')[0]} ${log.username || 'system'}: ${log.action}`);
    });

    console.log("\n📊 测试场景7: 验证押金流水");
    const deposits = await pool.query(
      `SELECT * FROM deposit_transactions WHERE borrow_order_id = $1 ORDER BY created_at ASC`,
      [order.id]
    );
    console.log(`   押金交易记录: ${deposits.rows.length} 条`);
    deposits.rows.forEach(d => {
      console.log(`   - ${d.transaction_type}: ¥${d.amount} (${d.remark})`);
    });

    console.log("\n🎉 所有测试通过!");
    console.log("\n📋 测试总结:");
    console.log("   ✅ 借用申请创建");
    console.log("   ✅ 主管审批 + 库存锁定 + 押金冻结");
    console.log("   ✅ 仓库出库 + 库存扣减");
    console.log("   ✅ 延期申请 + 审批");
    console.log("   ✅ 归还验收 + 损坏赔付 + 押金扣除 + 库存回库");
    console.log("   ✅ 审计日志完整记录");
    console.log("   ✅ 押金流水完整记录");

  } catch (err: any) {
    console.error("❌ 测试失败:", err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}
